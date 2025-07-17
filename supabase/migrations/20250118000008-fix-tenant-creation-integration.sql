-- تحديث دالة إنشاء المؤسسات للتكامل مع نظام SaaS الموحد
-- تاريخ الإنشاء: 2025-01-18

-- إضافة دالة مساعدة للحصول على تفاصيل خطة الاشتراك
CREATE OR REPLACE FUNCTION get_subscription_plan_limits(plan_code text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  CASE plan_code
    WHEN 'basic' THEN
      RETURN jsonb_build_object(
        'max_users', 5,
        'max_vehicles', 20,
        'max_contracts', 50,
        'monthly_price', 29.999,
        'yearly_price', 299.99
      );
    WHEN 'standard' THEN
      RETURN jsonb_build_object(
        'max_users', 15,
        'max_vehicles', 50,
        'max_contracts', 200,
        'monthly_price', 49.999,
        'yearly_price', 499.99
      );
    WHEN 'premium' THEN
      RETURN jsonb_build_object(
        'max_users', 50,
        'max_vehicles', 200,
        'max_contracts', 1000,
        'monthly_price', 79.999,
        'yearly_price', 799.99
      );
    WHEN 'enterprise' THEN
      RETURN jsonb_build_object(
        'max_users', 200,
        'max_vehicles', 1000,
        'max_contracts', 5000,
        'monthly_price', 149.999,
        'yearly_price', 1499.99
      );
    ELSE
      -- Default to standard plan
      RETURN jsonb_build_object(
        'max_users', 15,
        'max_vehicles', 50,
        'max_contracts', 200,
        'monthly_price', 49.999,
        'yearly_price', 499.99
      );
  END CASE;
END;
$$;

-- دالة محدثة لإنشاء مؤسسة مع مدير وتكامل SaaS
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin_user_v2(
  tenant_data jsonb,
  admin_email text,
  admin_password text,
  admin_full_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  new_user_id UUID;
  new_subscription_id UUID;
  auth_response jsonb;
  plan_code text;
  plan_limits jsonb;
  plan_record record;
BEGIN
  -- التحقق من البيانات المطلوبة
  IF NOT (tenant_data ? 'name') OR (tenant_data->>'name') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'اسم المؤسسة مطلوب');
  END IF;
  
  IF NOT (tenant_data ? 'slug') OR (tenant_data->>'slug') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'المعرف الفريد مطلوب');
  END IF;

  -- التحقق من عدم وجود slug مكرر
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = tenant_data->>'slug') THEN
    RETURN jsonb_build_object('success', false, 'error', 'هذا المعرف مستخدم بالفعل');
  END IF;

  -- الحصول على خطة الاشتراك والحدود
  plan_code := COALESCE(tenant_data->>'subscription_plan', 'standard');
  plan_limits := get_subscription_plan_limits(plan_code);

  -- البحث عن خطة الاشتراك في الجدول
  SELECT * INTO plan_record FROM subscription_plans WHERE code = plan_code;
  
  IF plan_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'خطة الاشتراك غير موجودة');
  END IF;

  -- إنشاء المؤسسة مع الحدود الصحيحة
  INSERT INTO tenants (
    name,
    slug,
    contact_email,
    contact_phone,
    address,
    city,
    country,
    timezone,
    currency,
    subscription_plan,
    status,
    max_users,
    max_vehicles,
    max_contracts,
    trial_ends_at
  ) VALUES (
    tenant_data->>'name',
    tenant_data->>'slug',
    tenant_data->>'contact_email',
    tenant_data->>'contact_phone',
    tenant_data->>'address',
    tenant_data->>'city',
    COALESCE(tenant_data->>'country', 'Kuwait'),
    COALESCE(tenant_data->>'timezone', 'Asia/Kuwait'),
    COALESCE(tenant_data->>'currency', 'KWD'),
    plan_code,
    'trial',
    (plan_limits->>'max_users')::integer,
    (plan_limits->>'max_vehicles')::integer,
    (plan_limits->>'max_contracts')::integer,
    CURRENT_DATE + INTERVAL '14 days' -- فترة تجريبية 14 يوم
  ) RETURNING id INTO new_tenant_id;

  -- إنشاء اشتراك SaaS
  INSERT INTO saas_subscriptions (
    tenant_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    trial_ends_at,
    next_billing_date
  ) VALUES (
    new_tenant_id,
    plan_record.id,
    'trialing',
    'monthly',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month',
    CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '14 days'
  ) RETURNING id INTO new_subscription_id;

  -- إنشاء المستخدم المدير
  SELECT INTO auth_response auth.signup(admin_email, admin_password, jsonb_build_object(
    'full_name', admin_full_name,
    'tenant_id', new_tenant_id::text,
    'role', 'tenant_admin'
  ));

  -- استخراج معرف المستخدم من استجابة التسجيل
  new_user_id := (auth_response->>'user_id')::uuid;
  
  IF new_user_id IS NULL THEN
    -- في حالة فشل إنشاء المستخدم، نحذف المؤسسة والاشتراك
    DELETE FROM saas_subscriptions WHERE id = new_subscription_id;
    DELETE FROM tenants WHERE id = new_tenant_id;
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'فشل في إنشاء حساب المدير',
      'auth_response', auth_response
    );
  END IF;

  -- ربط المستخدم بالمؤسسة كمدير
  INSERT INTO tenant_users (
    tenant_id,
    user_id,
    role,
    status,
    joined_at
  ) VALUES (
    new_tenant_id,
    new_user_id,
    'tenant_admin',
    'active',
    now()
  );

  -- تحديث معلومات المستخدم في profiles
  INSERT INTO profiles (id, full_name, email, role, tenant_id)
  VALUES (new_user_id, admin_full_name, admin_email, 'tenant_admin', new_tenant_id)
  ON CONFLICT (id) 
  DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    tenant_id = EXCLUDED.tenant_id;

  -- إنشاء سجل في tenant_usage
  INSERT INTO tenant_usage (
    tenant_id,
    billing_period_start,
    billing_period_end,
    users_count,
    vehicles_count,
    contracts_count,
    additional_charges
  ) VALUES (
    new_tenant_id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month',
    1, -- المدير
    0,
    0,
    0.00
  );

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', new_tenant_id,
    'user_id', new_user_id,
    'subscription_id', new_subscription_id,
    'plan_code', plan_code,
    'limits', plan_limits,
    'trial_ends_at', CURRENT_DATE + INTERVAL '14 days',
    'message', 'تم إنشاء المؤسسة والمدير والاشتراك بنجاح'
  );

EXCEPTION WHEN OTHERS THEN
  -- في حالة حدوث خطأ، نحذف كل ما تم إنشاؤه
  IF new_subscription_id IS NOT NULL THEN
    DELETE FROM saas_subscriptions WHERE id = new_subscription_id;
  END IF;
  IF new_tenant_id IS NOT NULL THEN
    DELETE FROM tenants WHERE id = new_tenant_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'details', jsonb_build_object(
      'tenant_data', tenant_data,
      'admin_email', admin_email,
      'plan_code', plan_code
    )
  );
END;
$$;

-- دالة مساعدة لتحديث حدود المؤسسة عند تغيير الخطة
CREATE OR REPLACE FUNCTION update_tenant_limits_from_plan(tenant_id_param UUID, new_plan_code text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  plan_limits jsonb;
BEGIN
  -- الحصول على حدود الخطة الجديدة
  plan_limits := get_subscription_plan_limits(new_plan_code);

  -- تحديث حدود المؤسسة
  UPDATE tenants 
  SET 
    subscription_plan = new_plan_code,
    max_users = (plan_limits->>'max_users')::integer,
    max_vehicles = (plan_limits->>'max_vehicles')::integer,
    max_contracts = (plan_limits->>'max_contracts')::integer,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = tenant_id_param;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', tenant_id_param,
    'new_plan', new_plan_code,
    'new_limits', plan_limits
  );
END;
$$;

-- إضافة تعليقات للدوال
COMMENT ON FUNCTION get_subscription_plan_limits(text) IS 'يحصل على حدود خطة الاشتراك المحددة';
COMMENT ON FUNCTION create_tenant_with_admin_user_v2(jsonb, text, text, text) IS 'إنشاء مؤسسة جديدة مع مدير وتكامل SaaS كامل';
COMMENT ON FUNCTION update_tenant_limits_from_plan(UUID, text) IS 'تحديث حدود المؤسسة عند تغيير خطة الاشتراك'; 