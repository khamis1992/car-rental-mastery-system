-- Fix ambiguous column reference errors in security functions
-- This migration resolves the "column reference 'user_id' is ambiguous" errors

-- 1. Fix get_current_tenant_id function
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    tenant_id uuid;
BEGIN
    -- Get the current authenticated user
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- First check tenant_user_roles table with explicit alias
    SELECT tur.tenant_id INTO tenant_id
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = auth.uid()
    AND tur.status = 'active'
    LIMIT 1;
    
    -- If not found, check legacy tenant_users table with explicit alias
    IF tenant_id IS NULL THEN
        SELECT tu.tenant_id INTO tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$function$;

-- 2. Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id_param uuid, role_param user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check tenant_user_roles first with explicit aliases
    IF EXISTS(
        SELECT 1 FROM public.tenant_user_roles tur
        WHERE tur.user_id = user_id_param 
        AND tur.tenant_id = current_tenant_id
        AND tur.role = role_param
        AND tur.status = 'active'
    ) THEN
        RETURN true;
    END IF;
    
    -- Check legacy tenant_users table with explicit aliases
    IF EXISTS(
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.user_id = user_id_param 
        AND tu.tenant_id = current_tenant_id
        AND tu.role::user_role = role_param
        AND tu.status = 'active'
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$function$;

-- 3. Fix has_any_tenant_role function
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

-- 4. Create get_user_tenant_context function (if it doesn't exist or needs fixing)
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    user_context jsonb := '{}'::jsonb;
    user_email text;
    user_role text;
    tenant_id uuid;
    tenant_name text;
    tenant_status text;
    is_super_admin boolean := false;
    permissions jsonb := '{}'::jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'المستخدم غير مصادق عليه',
            'authenticated', false
        );
    END IF;
    
    -- Get user email from auth.users
    SELECT au.email INTO user_email
    FROM auth.users au
    WHERE au.id = current_user_id;
    
    -- Get tenant information with explicit aliases
    SELECT 
        tur.tenant_id,
        tur.role::text,
        t.name,
        t.status
    INTO tenant_id, user_role, tenant_name, tenant_status
    FROM public.tenant_user_roles tur
    INNER JOIN public.tenants t ON t.id = tur.tenant_id
    WHERE tur.user_id = current_user_id
    AND tur.status = 'active'
    LIMIT 1;
    
    -- If not found in tenant_user_roles, check legacy tenant_users
    IF tenant_id IS NULL THEN
        SELECT 
            tu.tenant_id,
            tu.role::text,
            t.name,
            t.status
        INTO tenant_id, user_role, tenant_name, tenant_status
        FROM public.tenant_users tu
        INNER JOIN public.tenants t ON t.id = tu.tenant_id
        WHERE tu.user_id = current_user_id
        AND tu.status = 'active'
        LIMIT 1;
    END IF;
    
    -- Check if super admin
    is_super_admin := (user_role = 'super_admin');
    
    -- Build permissions object based on role
    permissions := jsonb_build_object(
        'can_manage_users', user_role IN ('super_admin', 'tenant_admin', 'manager'),
        'can_manage_accounting', user_role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
        'can_manage_vehicles', user_role IN ('super_admin', 'tenant_admin', 'manager'),
        'can_view_reports', user_role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
        'can_manage_contracts', user_role IN ('super_admin', 'tenant_admin', 'manager', 'receptionist')
    );
    
    -- Build final context
    user_context := jsonb_build_object(
        'user_id', current_user_id,
        'email', COALESCE(user_email, ''),
        'role', COALESCE(user_role, 'user'),
        'tenant_id', tenant_id,
        'tenant_name', COALESCE(tenant_name, ''),
        'tenant_status', COALESCE(tenant_status, 'unknown'),
        'is_super_admin', is_super_admin,
        'permissions', permissions,
        'authenticated', true
    );
    
    RETURN user_context;
END;
$function$;

-- 5. Update any other functions that might have similar issues
-- Fix secure_tenant_operation function if it exists
CREATE OR REPLACE FUNCTION public.secure_tenant_operation(operation_type text, table_name text, required_role text DEFAULT 'user'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    user_role text;
    tenant_id uuid;
BEGIN
    -- Get secure context
    user_context := get_user_tenant_context();
    user_role := user_context->>'role';
    tenant_id := (user_context->>'tenant_id')::uuid;
    
    -- Check tenant exists
    IF tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن الوصول بدون مؤسسة صالحة';
    END IF;
    
    -- Check permissions
    CASE required_role
        WHEN 'super_admin' THEN
            IF user_role != 'super_admin' THEN
                RAISE EXCEPTION 'تتطلب هذه العملية صلاحية مدير النظام';
            END IF;
        WHEN 'tenant_admin' THEN
            IF user_role NOT IN ('super_admin', 'tenant_admin') THEN
                RAISE EXCEPTION 'تتطلب هذه العملية صلاحية مدير المؤسسة';
            END IF;
        WHEN 'manager' THEN
            IF user_role NOT IN ('super_admin', 'tenant_admin', 'manager') THEN
                RAISE EXCEPTION 'تتطلب هذه العملية صلاحية إدارية';
            END IF;
    END CASE;
    
    RETURN true;
END;
$function$;

-- 6. Create a simple test function to verify everything works
CREATE OR REPLACE FUNCTION public.test_security_functions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    current_tenant uuid;
    user_context jsonb;
BEGIN
    current_tenant := public.get_current_tenant_id();
    user_context := public.get_user_tenant_context();
    
    result := jsonb_build_object(
        'current_tenant_id', current_tenant,
        'user_context', user_context,
        'has_admin_role', public.has_any_tenant_role(ARRAY['super_admin', 'tenant_admin']),
        'test_timestamp', now()
    );
    
    RETURN result;
END;
$function$;