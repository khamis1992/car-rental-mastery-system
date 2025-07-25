-- Fix security functions to use correct column names
-- Update get_current_tenant_id function
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    tenant_id uuid;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- First try to get from tenant_user_roles table (new system)
    SELECT tur.tenant_id INTO tenant_id
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = auth.uid() 
    AND tur.is_active = true  -- Use is_active instead of status
    LIMIT 1;
    
    -- If not found, try legacy tenant_users table
    IF tenant_id IS NULL THEN
        SELECT tu.tenant_id INTO tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid() 
        AND tu.status = 'active'  -- Use status for tenant_users
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$function$;

-- Update has_role function
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
    
    -- Check tenant_user_roles first
    IF EXISTS(
        SELECT 1 FROM public.tenant_user_roles tur
        WHERE tur.user_id = user_id_param 
        AND tur.tenant_id = current_tenant_id
        AND tur.role = role_param
        AND tur.is_active = true  -- Use is_active instead of status
    ) THEN
        RETURN true;
    END IF;
    
    -- Check legacy tenant_users table
    IF EXISTS(
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.user_id = user_id_param 
        AND tu.tenant_id = current_tenant_id
        AND tu.role = role_param::text
        AND tu.status = 'active'  -- Use status for tenant_users
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$function$;

-- Update has_any_tenant_role function
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
            AND tur.is_active = true  -- Use is_active instead of status
        ) THEN
            RETURN true;
        END IF;
        
        -- Check legacy tenant_users table with explicit table aliases
        IF EXISTS(
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.user_id = current_user_id 
            AND tu.tenant_id = current_tenant_id
            AND tu.role::text = role_item
            AND tu.status = 'active'  -- Use status for tenant_users
        ) THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$function$;

-- Update get_user_tenant_context function
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    current_user_id uuid;
    user_email text;
    user_role text;
    user_tenant_id uuid;
    tenant_name text;
    tenant_status text;
    is_super_admin boolean := false;
    user_permissions jsonb;
BEGIN
    current_user_id := auth.uid();
    
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
    
    -- Get user email from auth.users
    SELECT au.email INTO user_email
    FROM auth.users au
    WHERE au.id = current_user_id;
    
    -- Try to get user role and tenant from tenant_user_roles first
    SELECT tur.role::text, tur.tenant_id, t.name, t.status
    INTO user_role, user_tenant_id, tenant_name, tenant_status
    FROM public.tenant_user_roles tur
    JOIN public.tenants t ON t.id = tur.tenant_id
    WHERE tur.user_id = current_user_id 
    AND tur.is_active = true  -- Use is_active instead of status
    LIMIT 1;
    
    -- If not found, try legacy tenant_users table
    IF user_role IS NULL THEN
        SELECT tu.role::text, tu.tenant_id, t.name, t.status
        INTO user_role, user_tenant_id, tenant_name, tenant_status
        FROM public.tenant_users tu
        JOIN public.tenants t ON t.id = tu.tenant_id
        WHERE tu.user_id = current_user_id 
        AND tu.status = 'active'  -- Use status for tenant_users
        LIMIT 1;
    END IF;
    
    -- Check if super admin
    is_super_admin := (user_role = 'super_admin');
    
    -- Set permissions based on role
    user_permissions := jsonb_build_object(
        'can_manage_users', user_role IN ('super_admin', 'tenant_admin', 'manager'),
        'can_manage_accounting', user_role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
        'can_manage_vehicles', user_role IN ('super_admin', 'tenant_admin', 'manager'),
        'can_view_reports', user_role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
        'can_manage_contracts', user_role IN ('super_admin', 'tenant_admin', 'manager', 'receptionist')
    );
    
    result := jsonb_build_object(
        'user_id', current_user_id,
        'email', user_email,
        'role', user_role,
        'tenant_id', user_tenant_id,
        'tenant_name', tenant_name,
        'tenant_status', tenant_status,
        'is_super_admin', is_super_admin,
        'permissions', user_permissions
    );
    
    RETURN result;
END;
$function$;