-- إصلاحات الأمان الشاملة - الأولوية العالية
-- 1. توحيد نظام الأدوار

-- إنشاء enum موحد للأدوار
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'tenant_admin', 
        'manager',
        'accountant',
        'receptionist',
        'user'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إنشاء جدول أدوار المؤسسات الموحد
CREATE TABLE IF NOT EXISTS public.tenant_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, tenant_id, role)
);

-- تفعيل RLS على جدول الأدوار
ALTER TABLE public.tenant_user_roles ENABLE ROW LEVEL SECURITY;

-- 2. إنشاء دوال أمان محسنة مع search_path آمن

-- دالة للحصول على معرف المؤسسة الحالية
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
        (auth.jwt()->>'tenant_id')::UUID,
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

-- دالة للتحقق من صحة المؤسسة
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

-- دالة للتحقق من دور المستخدم
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
        AND tur.tenant_id = public.get_current_tenant_id()
    );
END;
$$;

-- دالة للتحقق من أي دور في المؤسسة
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

-- دالة للتحقق من المدير العام للنظام
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

-- دالة تلقائية لإضافة tenant_id عند الإدراج
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

-- 3. إنشاء سياسات RLS محسنة لجدول الأدوار

-- سياسة لقراءة الأدوار - مديري المؤسسة والنظام فقط
CREATE POLICY "tenant_admins_can_view_roles" ON public.tenant_user_roles
FOR SELECT 
USING (
    public.is_saas_admin() 
    OR (
        tenant_id = public.get_current_tenant_id() 
        AND public.has_any_tenant_role(ARRAY['super_admin', 'tenant_admin', 'manager'])
    )
);

-- سياسة لإضافة الأدوار - مديري المؤسسة فقط
CREATE POLICY "tenant_admins_can_assign_roles" ON public.tenant_user_roles
FOR INSERT 
WITH CHECK (
    public.is_saas_admin()
    OR (
        tenant_id = public.get_current_tenant_id() 
        AND public.has_any_tenant_role(ARRAY['super_admin', 'tenant_admin'])
    )
);

-- سياسة لتحديث الأدوار - مديري المؤسسة فقط
CREATE POLICY "tenant_admins_can_update_roles" ON public.tenant_user_roles
FOR UPDATE 
USING (
    public.is_saas_admin()
    OR (
        tenant_id = public.get_current_tenant_id() 
        AND public.has_any_tenant_role(ARRAY['super_admin', 'tenant_admin'])
    )
);

-- سياسة لحذف الأدوار - مديري النظام فقط
CREATE POLICY "super_admins_can_delete_roles" ON public.tenant_user_roles
FOR DELETE 
USING (
    public.is_saas_admin()
    OR public.has_any_tenant_role(ARRAY['super_admin'])
);

-- 4. إضافة مؤشرات للأداء
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_user_tenant ON public.tenant_user_roles(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_tenant_role ON public.tenant_user_roles(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_active ON public.tenant_user_roles(is_active) WHERE is_active = true;

-- 5. إنشاء دالة لمراجعة الأمان
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
BEGIN
    -- عد الجداول بدون RLS
    SELECT COUNT(*) INTO tables_without_rls
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND NOT c.relrowsecurity;
    
    -- عد المستخدمين بدون أدوار
    SELECT COUNT(*) INTO users_without_roles
    FROM auth.users u
    LEFT JOIN public.tenant_user_roles tur ON u.id = tur.user_id
    WHERE tur.user_id IS NULL;
    
    result := jsonb_build_object(
        'timestamp', now(),
        'tables_without_rls', tables_without_rls,
        'users_without_roles', users_without_roles,
        'security_level', CASE 
            WHEN tables_without_rls = 0 AND users_without_roles < 5 THEN 'جيد'
            WHEN tables_without_rls <= 2 AND users_without_roles < 10 THEN 'متوسط'
            ELSE 'يحتاج تحسين'
        END
    );
    
    RETURN result;
END;
$$;

-- 6. إنشاء جدول سجل الأمان
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID,
    tenant_id UUID,
    event_details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS على جدول الأحداث الأمنية
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- سياسة لقراءة الأحداث الأمنية - المديرين فقط
CREATE POLICY "admins_can_view_security_events" ON public.security_events
FOR SELECT 
USING (
    public.is_saas_admin() 
    OR public.has_any_tenant_role(ARRAY['super_admin', 'tenant_admin', 'manager'])
);

-- سياسة لإضافة الأحداث الأمنية - النظام
CREATE POLICY "system_can_log_security_events" ON public.security_events
FOR INSERT 
WITH CHECK (true);

-- 7. إنشاء دالة لتسجيل الأحداث الأمنية
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type_param TEXT,
    event_details_param JSONB DEFAULT '{}',
    severity_param TEXT DEFAULT 'info'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.security_events (
        event_type,
        user_id,
        tenant_id,
        event_details,
        severity
    ) VALUES (
        event_type_param,
        auth.uid(),
        public.get_current_tenant_id(),
        event_details_param,
        severity_param
    );
END;
$$;

-- تسجيل حدث تنفيذ الإصلاحات الأمنية
SELECT public.log_security_event(
    'security_fixes_applied',
    jsonb_build_object(
        'migration', 'comprehensive_security_fixes',
        'timestamp', now(),
        'fixes', jsonb_build_array(
            'unified_role_system',
            'secure_functions',
            'enhanced_rls_policies',
            'security_monitoring'
        )
    ),
    'info'
);