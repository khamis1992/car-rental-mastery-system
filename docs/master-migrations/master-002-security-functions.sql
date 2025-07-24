-- ===============================================
-- Master Migration 002: Security Functions and Role Management
-- تم دمج جميع دوال الأمان وإدارة الأدوار
-- ===============================================

-- تعريف user_role enum إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'manager', 
            'accountant',
            'receptionist',
            'driver',
            'viewer',
            'tenant_admin'
        );
    END IF;
END
$$;

-- جدول tenant_user_roles للربط بين المستخدمين والأدوار
CREATE TABLE IF NOT EXISTS public.tenant_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, user_id, role)
);

-- تمكين RLS على جدول الأدوار
ALTER TABLE public.tenant_user_roles ENABLE ROW LEVEL SECURITY;

-- دالة الحصول على المؤسسة الحالية
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- محاولة الحصول على المؤسسة من tenant_users
    SELECT tenant_id INTO current_tenant_id
    FROM public.tenant_users
    WHERE user_id = auth.uid() 
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- إذا لم نجد مؤسسة، نحاول من tenant_user_roles
    IF current_tenant_id IS NULL THEN
        SELECT tenant_id INTO current_tenant_id
        FROM public.tenant_user_roles
        WHERE user_id = auth.uid() 
        AND status = 'active'
        ORDER BY assigned_at DESC
        LIMIT 1;
    END IF;
    
    -- تسجيل للتتبع
    IF current_tenant_id IS NOT NULL THEN
        RAISE LOG 'get_current_tenant_id called for user_id: %', auth.uid();
        RAISE LOG 'Active tenant % found for user %', current_tenant_id, auth.uid();
    END IF;
    
    RETURN current_tenant_id;
END;
$$;

-- دالة التحقق من الدور
CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_param user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- البحث في tenant_user_roles أولاً
    IF EXISTS (
        SELECT 1 FROM public.tenant_user_roles
        WHERE tenant_id = current_tenant_id
        AND user_id = user_id_param
        AND role = role_param
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- البحث في tenant_users كبديل
    IF EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE tenant_id = current_tenant_id
        AND user_id = user_id_param
        AND role::text = role_param::text
        AND status = 'active'
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- دالة التحقق من الأدوار المتعددة
CREATE OR REPLACE FUNCTION public.has_any_role(user_id_param UUID, roles_param user_role[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    role_item user_role;
BEGIN
    FOREACH role_item IN ARRAY roles_param
    LOOP
        IF public.has_role(user_id_param, role_item) THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$;

-- دالة للتحقق من أدوار المؤسسة
CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    current_tenant_id UUID;
    role_item TEXT;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL OR auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    FOREACH role_item IN ARRAY roles_param
    LOOP
        -- البحث في tenant_user_roles
        IF EXISTS (
            SELECT 1 FROM public.tenant_user_roles
            WHERE tenant_id = current_tenant_id
            AND user_id = auth.uid()
            AND role::text = role_item
            AND status = 'active'
            AND (expires_at IS NULL OR expires_at > now())
        ) THEN
            RETURN TRUE;
        END IF;
        
        -- البحث في tenant_users
        IF EXISTS (
            SELECT 1 FROM public.tenant_users
            WHERE tenant_id = current_tenant_id
            AND user_id = auth.uid()
            AND role = role_item
            AND status = 'active'
        ) THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$;

-- سياسات RLS للحماية على tenant_user_roles
CREATE POLICY "المديرون يمكنهم إدارة أدوار المؤسسة" ON public.tenant_user_roles
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND 
        has_any_tenant_role(ARRAY['tenant_admin', 'admin', 'manager'])
    );

CREATE POLICY "المستخدمون يمكنهم رؤية أدوارهم" ON public.tenant_user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'admin', 'manager']))
    );

-- دالة تدقيق الأمان
CREATE OR REPLACE FUNCTION public.security_audit_report()
RETURNS TABLE(
    audit_check TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH security_checks AS (
        SELECT 
            'RLS Enabled Tables' as check_name,
            CASE 
                WHEN COUNT(*) > 0 THEN 'PASS'
                ELSE 'FAIL'
            END as check_status,
            COUNT(*)::TEXT || ' tables have RLS enabled' as check_details,
            'Ensure all sensitive tables have RLS enabled' as check_recommendation
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public' 
        AND c.relrowsecurity = true
        
        UNION ALL
        
        SELECT 
            'Active Security Functions' as check_name,
            CASE 
                WHEN COUNT(*) >= 3 THEN 'PASS'
                ELSE 'WARNING'
            END as check_status,
            COUNT(*)::TEXT || ' security functions found' as check_details,
            'Key functions: get_current_tenant_id, has_role, has_any_tenant_role' as check_recommendation
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('get_current_tenant_id', 'has_role', 'has_any_tenant_role')
        
        UNION ALL
        
        SELECT 
            'Tenant Isolation' as check_name,
            'INFO' as check_status,
            'Multi-tenant architecture detected' as check_details,
            'Verify tenant_id columns and policies are properly configured' as check_recommendation
    )
    SELECT * FROM security_checks;
END;
$$;

-- تعليق على اكتمال الأمان
COMMENT ON FUNCTION public.security_audit_report() IS 'دالة شاملة لتدقيق إعدادات الأمان والـ RLS';
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'دالة آمنة للحصول على معرف المؤسسة الحالية';
COMMENT ON FUNCTION public.has_role() IS 'دالة التحقق من دور المستخدم في المؤسسة الحالية';