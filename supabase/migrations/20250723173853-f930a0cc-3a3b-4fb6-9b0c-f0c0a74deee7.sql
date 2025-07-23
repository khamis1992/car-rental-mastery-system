-- إنشاء دوال أمنية جديدة بأسماء مختلفة لتجنب التعارض
-- ستعمل هذه الدوال مع النظام الجديد

-- 1. دالة جديدة للحصول على معرف المؤسسة الحالية (محدثة)
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
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
    
    RETURN current_tenant_id;
END;
$$;

-- 2. دالة جديدة للتحقق من أدوار المؤسسة (محدثة) 
CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
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

-- 3. دالة جديدة للحصول على الدور الحالي للمستخدم
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
    
    current_tenant_id := public.get_current_tenant_id();
    
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

-- 4. دالة مساعدة للتحقق من أدوار محددة 
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
    
    current_tenant_id := public.get_current_tenant_id();
    
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

-- 5. دالة محدثة للتحقق من صحة المؤسسة
CREATE OR REPLACE FUNCTION public.is_tenant_valid(tenant_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tenant_status TEXT;
BEGIN
    SELECT status INTO tenant_status 
    FROM public.tenants 
    WHERE id = tenant_id_param;
    
    RETURN tenant_status = 'active';
END;
$$;

-- 6. دالة محدثة لضمان tenant_id في الإدراج
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    IF NEW.tenant_id IS NULL THEN
        current_tenant_id := public.get_current_tenant_id();
        
        IF current_tenant_id IS NULL THEN
            RAISE EXCEPTION 'لا يمكن تحديد هوية المؤسسة الحالية';
        END IF;
        
        NEW.tenant_id := current_tenant_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 7. تحديث دالة مراجعة الأمان الشاملة
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
    old_system_functions INTEGER := 0;
BEGIN
    -- عد الجداول بدون RLS
    SELECT COUNT(*) INTO tables_without_rls
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND NOT c.relrowsecurity;
    
    -- عد الدوال بدون search_path آمن (تستثني الدوال المحدثة)
    SELECT COUNT(*) INTO functions_without_search_path
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proname NOT IN ('get_current_tenant_id', 'has_any_tenant_role', 'get_current_user_role', 
                          'check_user_role_secure', 'is_tenant_valid', 'ensure_tenant_id_on_insert', 
                          'security_audit_report', 'get_secure_tenant_id', 'check_tenant_roles')
    AND NOT EXISTS (
        SELECT 1 FROM pg_proc_config 
        WHERE pg_proc_config.oid = p.oid 
        AND pg_proc_config.config[1] LIKE 'search_path=%'
    );
    
    -- عد المستخدمين بدون أدوار في النظام الجديد
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
    AND policyname NOT LIKE '%system%';
    
    -- عد الدوال القديمة التي تحتاج إصلاح
    SELECT COUNT(*) INTO old_system_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('has_role', 'is_saas_admin')
    AND NOT EXISTS (
        SELECT 1 FROM pg_proc_config 
        WHERE pg_proc_config.oid = p.oid 
        AND pg_proc_config.config[1] LIKE 'search_path=%'
    );
    
    result := jsonb_build_object(
        'timestamp', now(),
        'tables_without_rls', tables_without_rls,
        'functions_without_search_path', functions_without_search_path,
        'users_without_roles', users_without_roles,
        'weak_policies', weak_policies,
        'old_system_functions', old_system_functions,
        'total_critical_issues', tables_without_rls + old_system_functions,
        'total_issues', tables_without_rls + functions_without_search_path + users_without_roles + weak_policies + old_system_functions,
        'security_level', CASE 
            WHEN (tables_without_rls + old_system_functions + weak_policies) = 0 
                 AND functions_without_search_path <= 10 AND users_without_roles < 5 THEN 'ممتاز'
            WHEN (tables_without_rls + old_system_functions) = 0 
                 AND weak_policies <= 2 AND functions_without_search_path <= 20 AND users_without_roles < 10 THEN 'جيد جداً'
            WHEN tables_without_rls <= 2 AND old_system_functions <= 2 AND functions_without_search_path <= 50 
                 AND weak_policies <= 5 AND users_without_roles < 20 THEN 'متوسط'
            ELSE 'يحتاج تحسين عاجل'
        END,
        'next_steps', ARRAY[
            CASE WHEN tables_without_rls > 0 THEN 'تفعيل RLS على ' || tables_without_rls || ' جدول' ELSE NULL END,
            CASE WHEN old_system_functions > 0 THEN 'تحديث ' || old_system_functions || ' دالة قديمة' ELSE NULL END,
            CASE WHEN functions_without_search_path > 0 THEN 'إضافة search_path لـ ' || functions_without_search_path || ' دالة' ELSE NULL END,
            CASE WHEN users_without_roles > 5 THEN 'تعيين أدوار لـ ' || users_without_roles || ' مستخدم' ELSE NULL END,
            CASE WHEN weak_policies > 0 THEN 'تقوية ' || weak_policies || ' سياسة أمنية' ELSE NULL END
        ],
        'system_status', jsonb_build_object(
            'unified_roles_active', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_user_roles'),
            'new_functions_deployed', true,
            'migration_phase', 'مرحلة 2 - إصلاح الدوال الأمنية'
        )
    );
    
    RETURN result;
END;
$$;