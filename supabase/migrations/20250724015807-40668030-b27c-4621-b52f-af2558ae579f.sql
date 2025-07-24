-- إنشاء دالة محسنة للحصول على معلومات المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS JSONB AS $$
DECLARE
    current_user_id UUID;
    current_tenant_id UUID;
    user_tenant_data RECORD;
    result JSONB;
BEGIN
    -- الحصول على معرف المستخدم الحالي
    current_user_id := auth.uid();
    
    -- إذا لم يكن هناك مستخدم مسجل دخول
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_authenticated', false,
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'status', null,
            'error', 'No authenticated user'
        );
    END IF;
    
    -- البحث عن بيانات المستخدم في المؤسسة
    SELECT tu.tenant_id, tu.role, tu.status, t.name as tenant_name
    INTO user_tenant_data
    FROM public.tenant_users tu
    INNER JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = current_user_id
    AND tu.status = 'active'
    AND t.status = 'active'
    ORDER BY 
        CASE WHEN tu.role = 'super_admin' THEN 1
             WHEN tu.role = 'tenant_admin' THEN 2
             WHEN tu.role = 'manager' THEN 3
             ELSE 4 
        END,
        tu.created_at DESC
    LIMIT 1;
    
    -- إنشاء النتيجة
    IF user_tenant_data.tenant_id IS NOT NULL THEN
        result := jsonb_build_object(
            'is_authenticated', true,
            'user_id', current_user_id,
            'tenant_id', user_tenant_data.tenant_id,
            'role', user_tenant_data.role,
            'status', user_tenant_data.status,
            'tenant_name', user_tenant_data.tenant_name
        );
    ELSE
        result := jsonb_build_object(
            'is_authenticated', true,
            'user_id', current_user_id,
            'tenant_id', null,
            'role', null,
            'status', null,
            'error', 'User not assigned to any active tenant'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات للدالة
GRANT EXECUTE ON FUNCTION public.get_current_user_info() TO authenticated;

-- إنشاء دالة محسنة للحصول على معرف المؤسسة الحالي
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    current_user_id UUID;
    tenant_id_result UUID;
BEGIN
    -- الحصول على معرف المستخدم الحالي
    current_user_id := auth.uid();
    
    -- إذا لم يكن هناك مستخدم مسجل دخول
    IF current_user_id IS NULL THEN
        RAISE LOG 'get_current_tenant_id: No authenticated user found';
        RETURN NULL;
    END IF;
    
    -- البحث عن معرف المؤسسة للمستخدم الحالي
    SELECT tu.tenant_id
    INTO tenant_id_result
    FROM public.tenant_users tu
    INNER JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = current_user_id
    AND tu.status = 'active'
    AND t.status = 'active'
    ORDER BY 
        CASE WHEN tu.role = 'super_admin' THEN 1
             WHEN tu.role = 'tenant_admin' THEN 2
             WHEN tu.role = 'manager' THEN 3
             ELSE 4 
        END,
        tu.created_at DESC
    LIMIT 1;
    
    -- تسجيل النتيجة للمراقبة
    IF tenant_id_result IS NULL THEN
        RAISE LOG 'get_current_tenant_id: No valid tenant found for user %', current_user_id;
    ELSE
        RAISE LOG 'get_current_tenant_id: Found tenant % for user %', tenant_id_result, current_user_id;
    END IF;
    
    RETURN tenant_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات للدالة
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;

-- إنشاء دالة لإنشاء مستخدم افتراضي للاختبار (للتطوير فقط)
CREATE OR REPLACE FUNCTION public.create_default_test_user()
RETURNS JSONB AS $$
DECLARE
    default_tenant_id UUID;
    test_user_id UUID := '8fc12ff9-a4e6-4c7d-b9c5-fce03450e091'; -- المستخدم الموجود
    result JSONB;
BEGIN
    -- الحصول على المؤسسة الافتراضية
    SELECT id INTO default_tenant_id
    FROM public.tenants 
    WHERE status = 'active'
    ORDER BY created_at
    LIMIT 1;
    
    IF default_tenant_id IS NULL THEN
        RETURN jsonb_build_object('error', 'No active tenant found');
    END IF;
    
    -- التحقق من وجود المستخدم في المؤسسة
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE user_id = test_user_id 
        AND tenant_id = default_tenant_id
        AND status = 'active'
    ) THEN
        -- إنشاء علاقة المستخدم بالمؤسسة
        INSERT INTO public.tenant_users (
            user_id, tenant_id, role, status
        ) VALUES (
            test_user_id, default_tenant_id, 'tenant_admin', 'active'
        ) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
            status = 'active',
            role = 'tenant_admin',
            updated_at = now();
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', test_user_id,
        'tenant_id', default_tenant_id,
        'message', 'Test user created/updated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات للدالة
GRANT EXECUTE ON FUNCTION public.create_default_test_user() TO authenticated;