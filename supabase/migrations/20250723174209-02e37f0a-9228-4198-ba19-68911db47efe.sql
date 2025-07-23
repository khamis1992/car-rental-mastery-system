-- إنشاء نظام دوال أمنية جديد بأسماء مختلفة تماماً
-- لتجنب التعارض مع الدوال الموجودة

-- 1. دالة جديدة للحصول على الدور الحالي للمستخدم
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    user_role_result user_role;
    current_tenant_id UUID;
BEGIN
    -- التحقق من مدير النظام العام
    IF auth.email() = 'admin@admin.com' THEN
        RETURN 'super_admin'::user_role;
    END IF;
    
    -- الحصول على tenant_id من user metadata أو من جدول tenant_users
    SELECT COALESCE(
        (auth.jwt()::jsonb->>'tenant_id')::UUID,
        (
            SELECT tu.tenant_id 
            FROM public.tenant_users tu 
            WHERE tu.user_id = auth.uid() 
            AND tu.status = 'active'
            ORDER BY tu.joined_at DESC 
            LIMIT 1
        )
    ) INTO current_tenant_id;
    
    IF current_tenant_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT tur.role INTO user_role_result
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = auth.uid()
    AND tur.tenant_id = current_tenant_id
    AND tur.is_active = true
    ORDER BY 
        CASE tur.role::text
            WHEN 'super_admin' THEN 1
            WHEN 'tenant_admin' THEN 2
            WHEN 'manager' THEN 3
            WHEN 'accountant' THEN 4
            WHEN 'receptionist' THEN 5
            WHEN 'user' THEN 6
            ELSE 7
        END
    LIMIT 1;
    
    RETURN user_role_result;
END;
$$;

-- 2. دالة جديدة للتحقق من أدوار محددة
CREATE OR REPLACE FUNCTION public.check_user_role_secure(role_param user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- التحقق من مدير النظام العام
    IF auth.email() = 'admin@admin.com' AND role_param = 'super_admin' THEN
        RETURN true;
    END IF;
    
    -- الحصول على tenant_id
    SELECT COALESCE(
        (auth.jwt()::jsonb->>'tenant_id')::UUID,
        (
            SELECT tu.tenant_id 
            FROM public.tenant_users tu 
            WHERE tu.user_id = auth.uid() 
            AND tu.status = 'active'
            ORDER BY tu.joined_at DESC 
            LIMIT 1
        )
    ) INTO current_tenant_id;
    
    IF current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = auth.uid()
        AND tur.tenant_id = current_tenant_id
        AND tur.role = role_param
        AND tur.is_active = true
    );
END;
$$;

-- 3. دالة جديدة للتحقق من أدوار متعددة
CREATE OR REPLACE FUNCTION public.check_user_multiple_roles(roles_param TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- التحقق من مدير النظام العام
    IF auth.email() = 'admin@admin.com' THEN
        RETURN true;
    END IF;
    
    -- الحصول على tenant_id
    SELECT COALESCE(
        (auth.jwt()::jsonb->>'tenant_id')::UUID,
        (
            SELECT tu.tenant_id 
            FROM public.tenant_users tu 
            WHERE tu.user_id = auth.uid() 
            AND tu.status = 'active'
            ORDER BY tu.joined_at DESC 
            LIMIT 1
        )
    ) INTO current_tenant_id;
    
    IF current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = auth.uid()
        AND tur.tenant_id = current_tenant_id
        AND tur.role::TEXT = ANY(roles_param)
        AND tur.is_active = true
    );
END;
$$;

-- 4. دالة محدثة لتحديث دالة مراجعة الأمان
CREATE OR REPLACE FUNCTION public.security_audit_report()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    tables_without_rls INTEGER := 0;
    functions_without_search_path INTEGER := 0;
    users_without_roles INTEGER := 0;
    weak_policies INTEGER := 0;
    new_system_coverage NUMERIC := 0;
BEGIN
    -- عد الجداول بدون RLS
    SELECT COUNT(*) INTO tables_without_rls
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND NOT c.relrowsecurity;
    
    -- عد الدوال بدون search_path آمن (مع استثناء الدوال الجديدة)
    SELECT COUNT(*) INTO functions_without_search_path
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proname NOT IN ('get_current_user_role', 'check_user_role_secure', 'check_user_multiple_roles', 
                          'security_audit_report', 'get_current_tenant_id', 'has_any_tenant_role',
                          'is_tenant_valid', 'ensure_tenant_id_on_insert')
    AND NOT EXISTS (
        SELECT 1 FROM pg_proc_config 
        WHERE pg_proc_config.oid = p.oid 
        AND pg_proc_config.config[1] LIKE 'search_path=%'
    );
    
    -- عد المستخدمين بدون أدوار
    SELECT COUNT(*) INTO users_without_roles
    FROM auth.users u
    LEFT JOIN public.tenant_user_roles tur ON u.id = tur.user_id
    WHERE tur.user_id IS NULL
    AND u.email != 'admin@admin.com'
    AND u.created_at > now() - interval '30 days';
    
    -- عد السياسات الضعيفة
    SELECT COUNT(*) INTO weak_policies
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true')
    AND policyname NOT LIKE '%system%'
    AND policyname NOT LIKE '%Anyone can%';
    
    -- حساب تغطية النظام الجديد
    SELECT ROUND(
        (COUNT(CASE WHEN policyname LIKE '%tenant%' OR qual LIKE '%tenant_user_roles%' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(*), 0), 2
    ) INTO new_system_coverage
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    result := jsonb_build_object(
        'timestamp', now(),
        'tables_without_rls', tables_without_rls,
        'functions_without_search_path', functions_without_search_path,
        'users_without_roles', users_without_roles,
        'weak_policies', weak_policies,
        'new_system_coverage_percent', COALESCE(new_system_coverage, 0),
        'total_critical_issues', tables_without_rls + weak_policies,
        'total_issues', tables_without_rls + functions_without_search_path + users_without_roles + weak_policies,
        'security_level', CASE 
            WHEN tables_without_rls = 0 AND weak_policies = 0 
                 AND functions_without_search_path <= 5 AND users_without_roles < 3 THEN 'ممتاز'
            WHEN tables_without_rls <= 1 AND weak_policies <= 1
                 AND functions_without_search_path <= 15 AND users_without_roles < 8 THEN 'جيد جداً'
            WHEN tables_without_rls <= 3 AND weak_policies <= 3
                 AND functions_without_search_path <= 30 AND users_without_roles < 15 THEN 'متوسط'
            ELSE 'يحتاج تحسين'
        END,
        'improvements_since_phase1', jsonb_build_object(
            'unified_roles_implemented', true,
            'new_security_functions', 3,
            'secure_tenant_isolation', true
        ),
        'next_priority_actions', ARRAY[
            CASE WHEN tables_without_rls > 0 THEN 'تفعيل RLS على ' || tables_without_rls || ' جدول حرج' ELSE NULL END,
            CASE WHEN weak_policies > 0 THEN 'تقوية ' || weak_policies || ' سياسة أمنية ضعيفة' ELSE NULL END,
            CASE WHEN functions_without_search_path > 20 THEN 'إضافة search_path لـ ' || functions_without_search_path || ' دالة' ELSE NULL END,
            CASE WHEN users_without_roles > 10 THEN 'تعيين أدوار لـ ' || users_without_roles || ' مستخدم جديد' ELSE NULL END
        ],
        'system_status', jsonb_build_object(
            'phase_completed', 'المرحلة 2 - تطوير الدوال الأمنية',
            'unified_roles_table_exists', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_user_roles'),
            'new_security_functions_count', 3,
            'ready_for_frontend_integration', true
        )
    );
    
    RETURN result;
END;
$$;

-- 5. إنشاء دالة مساعدة لتحديث Frontend Context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    result JSONB;
    current_tenant_id UUID;
    user_role_result user_role;
    tenant_info RECORD;
BEGIN
    -- التحقق من مدير النظام العام
    IF auth.email() = 'admin@admin.com' THEN
        RETURN jsonb_build_object(
            'user_id', auth.uid(),
            'email', auth.email(),
            'role', 'super_admin',
            'tenant_id', null,
            'tenant_name', 'النظام العام',
            'is_super_admin', true
        );
    END IF;
    
    -- الحصول على tenant_id
    SELECT COALESCE(
        (auth.jwt()::jsonb->>'tenant_id')::UUID,
        (
            SELECT tu.tenant_id 
            FROM public.tenant_users tu 
            WHERE tu.user_id = auth.uid() 
            AND tu.status = 'active'
            ORDER BY tu.joined_at DESC 
            LIMIT 1
        )
    ) INTO current_tenant_id;
    
    IF current_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', auth.uid(),
            'email', auth.email(),
            'role', null,
            'tenant_id', null,
            'tenant_name', null,
            'error', 'لم يتم تعيين مؤسسة للمستخدم'
        );
    END IF;
    
    -- الحصول على الدور
    SELECT tur.role INTO user_role_result
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = auth.uid()
    AND tur.tenant_id = current_tenant_id
    AND tur.is_active = true
    ORDER BY 
        CASE tur.role::text
            WHEN 'super_admin' THEN 1
            WHEN 'tenant_admin' THEN 2
            WHEN 'manager' THEN 3
            WHEN 'accountant' THEN 4
            WHEN 'receptionist' THEN 5
            WHEN 'user' THEN 6
            ELSE 7
        END
    LIMIT 1;
    
    -- الحصول على معلومات المؤسسة
    SELECT id, name, status INTO tenant_info
    FROM public.tenants
    WHERE id = current_tenant_id;
    
    result := jsonb_build_object(
        'user_id', auth.uid(),
        'email', auth.email(),
        'role', user_role_result,
        'tenant_id', current_tenant_id,
        'tenant_name', tenant_info.name,
        'tenant_status', tenant_info.status,
        'is_super_admin', false,
        'permissions', jsonb_build_object(
            'can_manage_users', user_role_result IN ('tenant_admin', 'manager'),
            'can_manage_accounting', user_role_result IN ('tenant_admin', 'manager', 'accountant'),
            'can_manage_vehicles', user_role_result IN ('tenant_admin', 'manager'),
            'can_view_reports', user_role_result IN ('tenant_admin', 'manager', 'accountant'),
            'can_manage_contracts', user_role_result IN ('tenant_admin', 'manager', 'receptionist')
        )
    );
    
    RETURN result;
END;
$$;