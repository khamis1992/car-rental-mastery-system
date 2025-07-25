-- Enhanced diagnostic and security functions for better tenant identification

-- Enhanced get_current_tenant_id function with better error handling
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    tenant_id uuid;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    -- Return null if no authenticated user (instead of raising exception)
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Try to get tenant_id from tenant_users table first
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    ORDER BY tu.joined_at DESC  -- Get most recent active tenant
    LIMIT 1;
    
    -- If not found in tenant_users, try tenant_user_roles table
    IF tenant_id IS NULL THEN
        SELECT tur.tenant_id INTO tenant_id
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = current_user_id 
        AND tur.is_active = true
        ORDER BY tur.created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$$;

-- Enhanced get_user_tenant_context function with comprehensive context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    tenant_id uuid;
    user_role text;
    tenant_info record;
    user_info record;
    context jsonb;
    permissions jsonb;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    -- Return limited context if no authenticated user
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'error', 'User not authenticated'
        );
    END IF;
    
    -- Get tenant and role from tenant_users
    SELECT tu.tenant_id, tu.role INTO tenant_id, user_role
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    ORDER BY tu.joined_at DESC
    LIMIT 1;
    
    -- If not found, try tenant_user_roles
    IF tenant_id IS NULL THEN
        SELECT tur.tenant_id, tur.role::text INTO tenant_id, user_role
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = current_user_id 
        AND tur.is_active = true
        ORDER BY tur.created_at DESC
        LIMIT 1;
    END IF;
    
    -- Get tenant information if available
    IF tenant_id IS NOT NULL THEN
        SELECT t.name, t.status, t.subscription_plan 
        INTO tenant_info
        FROM public.tenants t
        WHERE t.id = tenant_id;
    END IF;
    
    -- Get user profile information
    SELECT p.full_name, p.is_active
    INTO user_info
    FROM public.profiles p
    WHERE p.user_id = current_user_id;
    
    -- Build permissions based on role
    permissions := jsonb_build_object(
        'can_manage_users', user_role IN ('super_admin', 'tenant_admin', 'manager'),
        'can_manage_accounting', user_role IN ('super_admin', 'tenant_admin', 'accountant'),
        'can_manage_vehicles', user_role IN ('super_admin', 'tenant_admin', 'manager'),
        'can_view_reports', user_role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
        'can_manage_contracts', user_role IN ('super_admin', 'tenant_admin', 'manager')
    );
    
    -- Build complete context
    context := jsonb_build_object(
        'authenticated', true,
        'user_id', current_user_id,
        'tenant_id', tenant_id,
        'role', user_role,
        'user_name', COALESCE(user_info.full_name, 'Unknown'),
        'user_active', COALESCE(user_info.is_active, false),
        'tenant_name', COALESCE(tenant_info.name, 'Unknown'),
        'tenant_status', COALESCE(tenant_info.status, 'unknown'),
        'tenant_plan', COALESCE(tenant_info.subscription_plan, 'unknown'),
        'permissions', permissions,
        'has_tenant', tenant_id IS NOT NULL,
        'session_valid', true,
        'timestamp', extract(epoch from now())
    );
    
    RETURN context;
END;
$$;

-- New diagnostic function for troubleshooting
CREATE OR REPLACE FUNCTION public.diagnose_user_tenant_issues()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    diagnostics jsonb;
    tenant_count int;
    active_tenant_count int;
    profile_exists boolean;
    tenant_users_count int;
    tenant_user_roles_count int;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'issue', 'no_authenticated_user',
            'message', 'No authenticated user found',
            'recommendations', jsonb_build_array('Please log in again', 'Check session validity')
        );
    END IF;
    
    -- Check profile existence
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = current_user_id) INTO profile_exists;
    
    -- Count tenant associations
    SELECT COUNT(*) INTO tenant_users_count
    FROM public.tenant_users
    WHERE user_id = current_user_id;
    
    SELECT COUNT(*) INTO active_tenant_count
    FROM public.tenant_users
    WHERE user_id = current_user_id AND status = 'active';
    
    SELECT COUNT(*) INTO tenant_user_roles_count
    FROM public.tenant_user_roles
    WHERE user_id = current_user_id;
    
    -- Count available tenants
    SELECT COUNT(DISTINCT t.id) INTO tenant_count
    FROM public.tenants t
    WHERE t.status = 'active';
    
    diagnostics := jsonb_build_object(
        'user_id', current_user_id,
        'profile_exists', profile_exists,
        'tenant_users_count', tenant_users_count,
        'active_tenant_count', active_tenant_count,
        'tenant_user_roles_count', tenant_user_roles_count,
        'total_active_tenants', tenant_count,
        'current_tenant_id', public.get_current_tenant_id(),
        'user_context', public.get_user_tenant_context(),
        'recommendations', CASE
            WHEN NOT profile_exists THEN jsonb_build_array('Create user profile')
            WHEN active_tenant_count = 0 THEN jsonb_build_array('User needs to be assigned to a tenant', 'Contact administrator')
            WHEN active_tenant_count > 1 THEN jsonb_build_array('Multiple active tenants found', 'Consider implementing tenant switching')
            ELSE jsonb_build_array('User setup appears correct')
        END
    );
    
    RETURN diagnostics;
END;
$$;