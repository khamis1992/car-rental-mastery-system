
-- تحديث دالة إنشاء المؤسسة مع المدير لتشمل إضافته كموظف تلقائياً
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin_user(
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
  new_employee_id UUID;
  auth_response jsonb;
  employee_number text;
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

  -- إنشاء المؤسسة أولاً
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
    max_contracts
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
    COALESCE(tenant_data->>'subscription_plan', 'standard'),
    COALESCE(tenant_data->>'status', 'trial'),
    COALESCE((tenant_data->>'max_users')::integer, 25),
    COALESCE((tenant_data->>'max_vehicles')::integer, 100),
    COALESCE((tenant_data->>'max_contracts')::integer, 250)
  ) RETURNING id INTO new_tenant_id;

  -- إنشاء المستخدم المدير
  SELECT INTO auth_response auth.signup(admin_email, admin_password, jsonb_build_object(
    'full_name', admin_full_name,
    'tenant_id', new_tenant_id::text,
    'role', 'tenant_admin'
  ));

  -- استخراج معرف المستخدم من استجابة التسجيل
  new_user_id := (auth_response->>'user_id')::uuid;
  
  IF new_user_id IS NULL THEN
    -- في حالة فشل إنشاء المستخدم، نحذف المؤسسة
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

  -- إنشاء رقم الموظف التلقائي
  SELECT 'EMP-' || LPAD(
    (COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 5) AS INTEGER)), 0) + 1)::TEXT,
    4, '0'
  ) INTO employee_number
  FROM employees 
  WHERE tenant_id = new_tenant_id;

  -- إضافة المدير كموظف في جدول الموظفين
  INSERT INTO employees (
    tenant_id,
    user_id,
    employee_number,
    first_name,
    last_name,
    full_name,
    email,
    position,
    department,
    hire_date,
    employment_type,
    status,
    salary,
    work_location_id,
    manager_id,
    emergency_contact_name,
    emergency_contact_phone,
    created_at,
    updated_at
  ) VALUES (
    new_tenant_id,
    new_user_id,
    employee_number,
    SPLIT_PART(admin_full_name, ' ', 1), -- الاسم الأول
    CASE 
      WHEN ARRAY_LENGTH(STRING_TO_ARRAY(admin_full_name, ' '), 1) > 1 
      THEN SUBSTRING(admin_full_name FROM LENGTH(SPLIT_PART(admin_full_name, ' ', 1)) + 2)
      ELSE ''
    END, -- باقي الاسم
    admin_full_name,
    admin_email,
    'مدير عام', -- المنصب
    'الإدارة العليا', -- القسم
    CURRENT_DATE, -- تاريخ التوظيف
    'دوام كامل', -- نوع التوظيف
    'active', -- الحالة
    0, -- الراتب (سيتم تحديده لاحقاً)
    NULL, -- موقع العمل (سيتم تحديده لاحقاً)
    NULL, -- لا يوجد مدير للمدير العام
    '', -- اسم جهة الاتصال للطوارئ
    '', -- رقم جهة الاتصال للطوارئ
    now(),
    now()
  ) RETURNING id INTO new_employee_id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', new_tenant_id,
    'user_id', new_user_id,
    'employee_id', new_employee_id,
    'message', 'تم إنشاء المؤسسة والمدير والموظف بنجاح'
  );

EXCEPTION WHEN OTHERS THEN
  -- في حالة حدوث خطأ، نحذف المؤسسة إذا تم إنشاؤها
  IF new_tenant_id IS NOT NULL THEN
    DELETE FROM tenants WHERE id = new_tenant_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'details', jsonb_build_object(
      'tenant_data', tenant_data,
      'admin_email', admin_email
    )
  );
END;
$$;
