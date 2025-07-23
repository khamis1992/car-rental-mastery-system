-- Master Migration 002: Security Functions and Role Management
-- This consolidates all security-related functions into one file
-- Replaces multiple separate security function migrations

-- ============================================
-- USER ROLE ENUM AND TABLES
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'tenant_admin', 
        'manager',
        'accountant',
        'receptionist',
        'driver',
        'maintenance',
        'viewer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tenant user roles table if not exists
CREATE TABLE IF NOT EXISTS public.tenant_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, tenant_id, role)
);

-- Enable RLS on tenant_user_roles
ALTER TABLE public.tenant_user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CORE SECURITY FUNCTIONS
-- ============================================

-- Get current tenant ID securely
CREATE OR REPLACE FUNCTION public.get_secure_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    tenant_id UUID;
BEGIN
    -- First try to get from JWT metadata
    tenant_id := (auth.jwt() ->> 'tenant_id')::UUID;
    
    IF tenant_id IS NOT NULL THEN
        RETURN tenant_id;
    END IF;
    
    -- Fallback to user's active tenant
    SELECT tur.tenant_id INTO tenant_id
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = auth.uid()
    AND tur.is_active = true
    ORDER BY tur.assigned_at DESC
    LIMIT 1;
    
    RETURN tenant_id;
END;
$$;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.check_user_role(user_id_param UUID, role_param user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_secure_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.tenant_user_roles
        WHERE user_id = user_id_param
        AND tenant_id = current_tenant_id
        AND role = role_param
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$;

-- Check if user has any of specified roles
CREATE OR REPLACE FUNCTION public.check_tenant_roles(roles_param TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_tenant_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_secure_tenant_id();
    
    IF current_user_id IS NULL OR current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.tenant_user_roles
        WHERE user_id = current_user_id
        AND tenant_id = current_tenant_id
        AND role::text = ANY(roles_param)
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$;

-- Check if user is SaaS admin
CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    RETURN user_email = 'admin@admin.com';
END;
$$;

-- ============================================
-- RLS POLICIES FOR TENANT_USER_ROLES
-- ============================================

-- View roles policy
CREATE POLICY "secure_view_tenant_roles"
ON public.tenant_user_roles FOR SELECT
USING (
    public.is_saas_admin() OR
    public.check_tenant_roles(ARRAY['tenant_admin', 'manager']) OR
    user_id = auth.uid()
);

-- Assign roles policy
CREATE POLICY "secure_assign_tenant_roles"
ON public.tenant_user_roles FOR INSERT
WITH CHECK (
    public.is_saas_admin() OR
    public.check_tenant_roles(ARRAY['tenant_admin'])
);

-- Update roles policy
CREATE POLICY "secure_update_tenant_roles"
ON public.tenant_user_roles FOR UPDATE
USING (
    public.is_saas_admin() OR
    public.check_tenant_roles(ARRAY['tenant_admin'])
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_user_tenant 
ON public.tenant_user_roles(user_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_tenant_role 
ON public.tenant_user_roles(tenant_id, role);

-- ============================================
-- SECURITY AUDIT FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.security_audit_report()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    tables_without_rls INTEGER;
    users_without_roles INTEGER;
    security_level TEXT;
BEGIN
    -- Count tables without RLS
    SELECT COUNT(*) INTO tables_without_rls
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT c.relrowsecurity;
    
    -- Count users without roles
    SELECT COUNT(*) INTO users_without_roles
    FROM auth.users u
    LEFT JOIN public.tenant_user_roles tur ON tur.user_id = u.id
    WHERE tur.id IS NULL;
    
    -- Determine security level
    IF tables_without_rls = 0 AND users_without_roles = 0 THEN
        security_level := 'excellent';
    ELSIF tables_without_rls <= 2 AND users_without_roles <= 5 THEN
        security_level := 'good';
    ELSIF tables_without_rls <= 5 AND users_without_roles <= 10 THEN
        security_level := 'moderate';
    ELSE
        security_level := 'needs_attention';
    END IF;
    
    RETURN jsonb_build_object(
        'security_level', security_level,
        'tables_without_rls', tables_without_rls,
        'users_without_roles', users_without_roles,
        'audit_date', now()
    );
END;
$$;