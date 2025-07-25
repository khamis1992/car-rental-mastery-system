-- إصلاح باقي الدوال للتعامل مع مرجع user_id الغامض

-- إصلاح دالة has_role
CREATE OR REPLACE FUNCTION public.has_role(user_id_param uuid, role_param user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    user_has_role boolean := false;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check in tenant_user_roles first with explicit table aliases
    SELECT EXISTS(
        SELECT 1 FROM public.tenant_user_roles tur
        WHERE tur.user_id = user_id_param 
        AND tur.tenant_id = current_tenant_id
        AND tur.role = role_param
        AND tur.status = 'active'
    ) INTO user_has_role;
    
    -- If not found, check legacy tenant_users table with explicit table aliases
    IF NOT user_has_role THEN
        SELECT EXISTS(
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.user_id = user_id_param 
            AND tu.tenant_id = current_tenant_id
            AND tu.role::text = role_param::text
            AND tu.status = 'active'
        ) INTO user_has_role;
    END IF;
    
    RETURN user_has_role;
END;
$function$;

-- إصلاح دالة has_any_tenant_role
CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
    role_item text;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_user_id IS NULL OR current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    FOREACH role_item IN ARRAY roles_param LOOP
        -- Check tenant_user_roles first with explicit table aliases
        IF EXISTS(
            SELECT 1 FROM public.tenant_user_roles tur
            WHERE tur.user_id = current_user_id 
            AND tur.tenant_id = current_tenant_id
            AND tur.role::text = role_item
            AND tur.status = 'active'
        ) THEN
            RETURN true;
        END IF;
        
        -- Check legacy tenant_users table with explicit table aliases
        IF EXISTS(
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.user_id = current_user_id 
            AND tu.tenant_id = current_tenant_id
            AND tu.role::text = role_item
            AND tu.status = 'active'
        ) THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$function$;

-- إنشاء دالة get_user_tenant_context الآمنة
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
    user_email text;
    user_role text;
    tenant_name text;
    tenant_status text;
    is_super_admin boolean := false;
    permissions jsonb;
    result jsonb;
BEGIN
    -- الحصول على معرف المستخدم الحالي
    current_user_id := auth.uid();
    
    -- إذا لم يكن المستخدم مسجل الدخول
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', null,
            'email', null,
            'role', null,
            'tenant_id', null,
            'tenant_name', null,
            'tenant_status', null,
            'is_super_admin', false,
            'permissions', jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false
            )
        );
    END IF;
    
    -- الحصول على بريد المستخدم
    SELECT email INTO user_email
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- التحقق من مدير النظام العام
    IF user_email = 'admin@admin.com' THEN
        is_super_admin := true;
    END IF;
    
    -- الحصول على معرف المؤسسة الحالية
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على معلومات المؤسسة والدور
    IF current_tenant_id IS NOT NULL THEN
        -- الحصول على اسم المؤسسة وحالتها
        SELECT t.name, t.status INTO tenant_name, tenant_status
        FROM public.tenants t
        WHERE t.id = current_tenant_id;
        
        -- البحث عن الدور في tenant_user_roles أولاً
        SELECT tur.role::text INTO user_role
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = current_user_id 
        AND tur.tenant_id = current_tenant_id
        AND tur.status = 'active'
        ORDER BY tur.created_at DESC
        LIMIT 1;
        
        -- إذا لم يوجد، البحث في tenant_users
        IF user_role IS NULL THEN
            SELECT tu.role::text INTO user_role
            FROM public.tenant_users tu
            WHERE tu.user_id = current_user_id 
            AND tu.tenant_id = current_tenant_id
            AND tu.status = 'active'
            ORDER BY tu.joined_at DESC
            LIMIT 1;
        END IF;
    END IF;
    
    -- إعداد الصلاحيات بناءً على الدور
    CASE user_role
        WHEN 'super_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        WHEN 'tenant_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        WHEN 'manager' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        WHEN 'accountant' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', false,
                'can_view_reports', true,
                'can_manage_contracts', false
            );
        WHEN 'receptionist' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', true
            );
        ELSE
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false
            );
    END CASE;
    
    -- إضافة صلاحيات مدير النظام العام
    IF is_super_admin THEN
        permissions := jsonb_build_object(
            'can_manage_users', true,
            'can_manage_accounting', true,
            'can_manage_vehicles', true,
            'can_view_reports', true,
            'can_manage_contracts', true
        );
        user_role := 'super_admin';
    END IF;
    
    -- بناء النتيجة النهائية
    result := jsonb_build_object(
        'user_id', current_user_id,
        'email', user_email,
        'role', user_role,
        'tenant_id', current_tenant_id,
        'tenant_name', tenant_name,
        'tenant_status', COALESCE(tenant_status, 'unknown'),
        'is_super_admin', is_super_admin,
        'permissions', permissions
    );
    
    RETURN result;
END;
$function$;