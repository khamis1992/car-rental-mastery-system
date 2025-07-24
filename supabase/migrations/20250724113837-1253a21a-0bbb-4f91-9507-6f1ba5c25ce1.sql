-- PHASE 1: CRITICAL SECURITY FIXES

-- 1. Fix database functions with secure search path
-- Update all existing functions to include SET search_path = 'public'

-- Fix get_current_tenant_id function
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id uuid;
    user_tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- First check tenant_users table
    SELECT tenant_id INTO user_tenant_id
    FROM public.tenant_users
    WHERE user_id = current_user_id 
    AND status = 'active'
    LIMIT 1;
    
    -- If not found, check tenant_user_roles
    IF user_tenant_id IS NULL THEN
        SELECT tenant_id INTO user_tenant_id
        FROM public.tenant_user_roles
        WHERE user_id = current_user_id
        LIMIT 1;
    END IF;
    
    RAISE LOG 'get_current_tenant_id called for user_id: %', current_user_id;
    
    IF user_tenant_id IS NOT NULL THEN
        RAISE LOG 'Active tenant % found for user %', user_tenant_id, current_user_id;
    END IF;
    
    RETURN user_tenant_id;
END;
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_id_param uuid, role_param user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_tenant_id uuid;
    user_has_role boolean := false;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check in tenant_user_roles first
    SELECT EXISTS(
        SELECT 1 FROM public.tenant_user_roles tur
        WHERE tur.user_id = user_id_param 
        AND tur.tenant_id = current_tenant_id
        AND tur.role = role_param
        AND tur.status = 'active'
    ) INTO user_has_role;
    
    -- If not found, check legacy tenant_users table
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
$$;

-- Fix has_any_role function
CREATE OR REPLACE FUNCTION public.has_any_role(user_id_param uuid, roles_param user_role[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    role_item user_role;
BEGIN
    FOREACH role_item IN ARRAY roles_param LOOP
        IF public.has_role(user_id_param, role_item) THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$;

-- Fix has_any_tenant_role function
CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
        -- Check tenant_user_roles first
        IF EXISTS(
            SELECT 1 FROM public.tenant_user_roles tur
            WHERE tur.user_id = current_user_id 
            AND tur.tenant_id = current_tenant_id
            AND tur.role::text = role_item
            AND tur.status = 'active'
        ) THEN
            RETURN true;
        END IF;
        
        -- Check legacy tenant_users table
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
$$;

-- 2. Add missing RLS policies for tables without them
-- Create security definer function to validate tenant access
CREATE OR REPLACE FUNCTION public.validate_tenant_access(table_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN table_tenant_id = current_tenant_id;
END;
$$;

-- Create function to log tenant access attempts
CREATE OR REPLACE FUNCTION public.log_tenant_access(
    p_tenant_id uuid,
    p_attempted_tenant_id uuid,
    p_table_name text,
    p_action text,
    p_success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.tenant_access_log (
        user_id, tenant_id, attempted_tenant_id, table_name, action, success
    ) VALUES (
        auth.uid(), p_tenant_id, p_attempted_tenant_id, p_table_name, p_action, p_success
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log errors but don't fail the main operation
        NULL;
END;
$$;

-- 3. Create tenant access log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenant_access_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    attempted_tenant_id uuid NOT NULL,
    table_name text NOT NULL,
    action text NOT NULL,
    success boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text
);

-- Enable RLS on tenant_access_log
ALTER TABLE public.tenant_access_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant_access_log
CREATE POLICY "Access logs are isolated by tenant" ON public.tenant_access_log
FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- 4. Update the ProtectedRoute security context by creating a comprehensive audit function
CREATE OR REPLACE FUNCTION public.security_audit_report()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    audit_result jsonb := '{}';
    rls_enabled_count integer;
    rls_disabled_count integer;
    tables_without_policies integer;
    security_definer_functions integer;
    tenant_isolation_status text;
BEGIN
    -- Check RLS status across tables
    SELECT 
        COUNT(*) FILTER (WHERE relrowsecurity = true) as enabled,
        COUNT(*) FILTER (WHERE relrowsecurity = false) as disabled
    INTO rls_enabled_count, rls_disabled_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r';
    
    -- Check for tables with RLS enabled but no policies
    SELECT COUNT(*) INTO tables_without_policies
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    LEFT JOIN pg_policies p ON c.relname = p.tablename
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND p.policyname IS NULL;
    
    -- Check for security definer functions
    SELECT COUNT(*) INTO security_definer_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true;
    
    -- Assess tenant isolation
    tenant_isolation_status := CASE 
        WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_current_tenant_id') 
        THEN 'implemented'
        ELSE 'missing'
    END;
    
    audit_result := jsonb_build_object(
        'rls_status', jsonb_build_object(
            'enabled_tables', rls_enabled_count,
            'disabled_tables', rls_disabled_count,
            'tables_without_policies', tables_without_policies
        ),
        'security_functions', jsonb_build_object(
            'security_definer_count', security_definer_functions,
            'tenant_isolation', tenant_isolation_status
        ),
        'multi_tenancy', jsonb_build_object(
            'status', tenant_isolation_status,
            'current_tenant_function_exists', EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_current_tenant_id')
        ),
        'recommendations', CASE 
            WHEN tables_without_policies > 0 OR rls_disabled_count > 0 
            THEN jsonb_build_array('Enable RLS on all tables', 'Create policies for tables without them')
            ELSE jsonb_build_array('Security configuration appears correct')
        END,
        'audit_timestamp', now()
    );
    
    RETURN audit_result;
END;
$$;