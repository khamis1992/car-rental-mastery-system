-- المرحلة الثانية: إصلاح الدوال الأمنية المتبقية
-- إصلاح جميع الدوال بدون search_path آمن

-- 1. إصلاح دوال إدارة المستخدمين والأدوار
CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_param user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = user_id_param 
        AND tur.role = role_param
        AND tur.is_active = true
        AND tur.tenant_id = public.get_secure_tenant_id()
    );
END;
$$;

-- 2. إصلاح دالة التحقق من صحة المؤسسة
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

-- 3. إصلاح دالة ضمان tenant_id في الإدراج
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
        current_tenant_id := public.get_secure_tenant_id();
        
        IF current_tenant_id IS NULL THEN
            RAISE EXCEPTION 'لا يمكن تحديد هوية المؤسسة الحالية';
        END IF;
        
        NEW.tenant_id := current_tenant_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. إصلاح دالة التحقق من صلاحيات الـ SaaS
CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN auth.email() = 'admin@admin.com';
END;
$$;

-- 5. إصلاح دوال المحاسبة الآمنة
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

-- 6. دالة محدثة للتحقق من أدوار المؤسسة
CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_secure_tenant_id();
    
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

-- 7. دالة جديدة لإدارة أمان الأصول
CREATE OR REPLACE FUNCTION public.secure_asset_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']);
END;
$$;

-- 8. دالة جديدة لإدارة أمان البيانات المالية
CREATE OR REPLACE FUNCTION public.secure_financial_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']);
END;
$$;

-- 9. دالة جديدة لإدارة أمان الموظفين
CREATE OR REPLACE FUNCTION public.secure_employee_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'receptionist']);
END;
$$;

-- 10. دالة آمنة للحصول على الدور الحالي
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
    
    current_tenant_id := public.get_secure_tenant_id();
    
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

-- 11. تحديث دالة مراجعة الأمان
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
BEGIN
    -- عد الجداول بدون RLS
    SELECT COUNT(*) INTO tables_without_rls
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND NOT c.relrowsecurity;
    
    -- عد الدوال بدون search_path آمن
    SELECT COUNT(*) INTO functions_without_search_path
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
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
    AND u.email != 'admin@admin.com';
    
    -- عد السياسات الضعيفة (تحتوي على true بدون شروط)
    SELECT COUNT(*) INTO weak_policies
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true');
    
    result := jsonb_build_object(
        'timestamp', now(),
        'tables_without_rls', tables_without_rls,
        'functions_without_search_path', functions_without_search_path,
        'users_without_roles', users_without_roles,
        'weak_policies', weak_policies,
        'total_issues', tables_without_rls + functions_without_search_path + users_without_roles + weak_policies,
        'security_level', CASE 
            WHEN (tables_without_rls + functions_without_search_path + weak_policies) = 0 
                 AND users_without_roles < 5 THEN 'ممتاز'
            WHEN (tables_without_rls + functions_without_search_path) = 0 
                 AND weak_policies <= 2 AND users_without_roles < 10 THEN 'جيد'
            WHEN tables_without_rls <= 2 AND functions_without_search_path <= 5 
                 AND weak_policies <= 5 AND users_without_roles < 20 THEN 'متوسط'
            ELSE 'يحتاج تحسين'
        END,
        'recommendations', ARRAY[
            CASE WHEN tables_without_rls > 0 THEN 'تفعيل RLS على الجداول' ELSE NULL END,
            CASE WHEN functions_without_search_path > 0 THEN 'إضافة search_path آمن للدوال' ELSE NULL END,
            CASE WHEN users_without_roles > 5 THEN 'تعيين أدوار للمستخدمين' ELSE NULL END,
            CASE WHEN weak_policies > 0 THEN 'تقوية سياسات RLS' ELSE NULL END
        ]
    );
    
    RETURN result;
END;
$$;