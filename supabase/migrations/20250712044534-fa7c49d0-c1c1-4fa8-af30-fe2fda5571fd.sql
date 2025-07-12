-- تحديث سياسة RLS للمؤسسات لتكون أكثر مرونة مع التشخيص المحسن
-- إزالة السياسة الحالية
DROP POLICY IF EXISTS "Allow first super admin to create tenants" ON public.tenants;

-- إنشاء دالة تشخيصية لفحص حالة المستخدم
CREATE OR REPLACE FUNCTION public.debug_user_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    current_user_id uuid;
    super_admin_exists boolean;
    user_tenant_role text;
BEGIN
    current_user_id := auth.uid();
    
    -- فحص وجود super admin
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE role = 'super_admin' AND status = 'active'
    ) INTO super_admin_exists;
    
    -- فحص دور المستخدم الحالي
    SELECT role INTO user_tenant_role
    FROM public.tenant_users 
    WHERE user_id = current_user_id 
    AND status = 'active'
    LIMIT 1;
    
    result := jsonb_build_object(
        'auth_uid', current_user_id,
        'super_admin_exists', super_admin_exists,
        'user_role', COALESCE(user_tenant_role, 'none'),
        'timestamp', now()
    );
    
    -- تسجيل النتيجة في logs
    RAISE LOG 'User context debug: %', result;
    
    RETURN result;
END;
$$;

-- إنشاء سياسة جديدة أكثر مرونة للمؤسسات
CREATE POLICY "Enhanced tenant creation policy" ON public.tenants
FOR INSERT WITH CHECK (
  -- السماح إذا كان المستخدم super_admin موجود
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND status = 'active'
  )
  OR
  -- السماح إذا كان هذا أول مستخدم في النظام (لا يوجد super_admin)
  NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE role = 'super_admin' 
    AND status = 'active'
  )
  OR
  -- السماح للمستخدم المحدد مسبقاً
  auth.uid() = '8fc12ff9-a4e6-4c7d-b9c5-fce03450e091'::uuid
);

-- إنشاء دالة آمنة لإنشاء المؤسسات مع التشخيص
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  tenant_data jsonb,
  admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tenant_id uuid;
    target_user_id uuid;
    debug_info jsonb;
    result jsonb;
BEGIN
    -- تحديد المستخدم المستهدف
    target_user_id := COALESCE(admin_user_id, auth.uid());
    
    -- الحصول على معلومات التشخيص
    debug_info := public.debug_user_context();
    
    -- تسجيل محاولة الإنشاء
    RAISE LOG 'Attempting to create tenant with user: % Debug: %', target_user_id, debug_info;
    
    -- التحقق من صحة البيانات
    IF tenant_data->>'name' IS NULL OR trim(tenant_data->>'name') = '' THEN
        RAISE EXCEPTION 'اسم المؤسسة مطلوب';
    END IF;
    
    -- إنشاء المؤسسة
    INSERT INTO public.tenants (
        name,
        slug,
        description,
        phone,
        email,
        address,
        status,
        subscription_plan,
        subscription_status,
        created_by
    ) VALUES (
        tenant_data->>'name',
        tenant_data->>'slug',
        tenant_data->>'description',
        tenant_data->>'phone',
        tenant_data->>'email',
        tenant_data->>'address',
        COALESCE(tenant_data->>'status', 'active'),
        COALESCE(tenant_data->>'subscription_plan', 'basic'),
        COALESCE(tenant_data->>'subscription_status', 'active'),
        target_user_id
    ) RETURNING id INTO new_tenant_id;
    
    -- إضافة المستخدم كـ super_admin للمؤسسة الجديدة
    INSERT INTO public.tenant_users (
        tenant_id,
        user_id,
        role,
        status,
        joined_at
    ) VALUES (
        new_tenant_id,
        target_user_id,
        'super_admin',
        'active',
        now()
    );
    
    -- إنشاء النتيجة
    result := jsonb_build_object(
        'success', true,
        'tenant_id', new_tenant_id,
        'user_id', target_user_id,
        'debug_info', debug_info
    );
    
    RAISE LOG 'Tenant created successfully: %', result;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating tenant: % SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE,
        'debug_info', debug_info
    );
END;
$$;

-- التأكد من وجود المستخدم الأساسي كـ super_admin
DO $$
DECLARE
    admin_user_exists boolean;
BEGIN
    -- فحص وجود المستخدم الأساسي
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE user_id = '8fc12ff9-a4e6-4c7d-b9c5-fce03450e091'::uuid
        AND role = 'super_admin' 
        AND status = 'active'
    ) INTO admin_user_exists;
    
    -- إضافة المستخدم إذا لم يكن موجوداً
    IF NOT admin_user_exists THEN
        INSERT INTO public.tenant_users (
            user_id, 
            tenant_id, 
            role, 
            status, 
            joined_at
        ) 
        SELECT 
            '8fc12ff9-a4e6-4c7d-b9c5-fce03450e091'::uuid,
            '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid,
            'super_admin',
            'active',
            now()
        WHERE EXISTS (
            SELECT 1 FROM public.tenants 
            WHERE id = '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid
        );
        
        RAISE LOG 'Added super_admin role to base user';
    END IF;
END $$;