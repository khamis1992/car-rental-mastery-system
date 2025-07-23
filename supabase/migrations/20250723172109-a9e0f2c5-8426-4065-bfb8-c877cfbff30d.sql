-- المرحلة الأولى: إنشاء نظام الأدوار الجديد مع دوال جديدة
-- 1. إنشاء enum للأدوار إذا لم يكن موجوداً
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

-- 2. إنشاء جدول أدوار المؤسسات الموحد
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

-- 3. إنشاء دوال أمان جديدة مع أسماء مختلفة

-- دالة جديدة للحصول على معرف المؤسسة الحالية
CREATE OR REPLACE FUNCTION public.get_secure_tenant_id()
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

-- دالة جديدة للتحقق من دور المستخدم
CREATE OR REPLACE FUNCTION public.check_user_role(user_id_param UUID, role_param user_role)
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

-- دالة جديدة للتحقق من أي دور في المؤسسة
CREATE OR REPLACE FUNCTION public.check_tenant_roles(roles_param TEXT[])
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

-- 4. إنشاء سياسات RLS لجدول الأدوار الجديد

-- سياسة لقراءة الأدوار - مديري المؤسسة والنظام فقط
CREATE POLICY "secure_view_tenant_roles" ON public.tenant_user_roles
FOR SELECT 
USING (
    auth.email() = 'admin@admin.com'
    OR (
        tenant_id = public.get_secure_tenant_id() 
        AND public.check_tenant_roles(ARRAY['super_admin', 'tenant_admin', 'manager'])
    )
);

-- سياسة لإضافة الأدوار - مديري المؤسسة فقط
CREATE POLICY "secure_assign_tenant_roles" ON public.tenant_user_roles
FOR INSERT 
WITH CHECK (
    auth.email() = 'admin@admin.com'
    OR (
        tenant_id = public.get_secure_tenant_id() 
        AND public.check_tenant_roles(ARRAY['super_admin', 'tenant_admin'])
    )
);

-- سياسة لتحديث الأدوار - مديري المؤسسة فقط
CREATE POLICY "secure_update_tenant_roles" ON public.tenant_user_roles
FOR UPDATE 
USING (
    auth.email() = 'admin@admin.com'
    OR (
        tenant_id = public.get_secure_tenant_id() 
        AND public.check_tenant_roles(ARRAY['super_admin', 'tenant_admin'])
    )
);

-- 5. إضافة مؤشرات للأداء
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_user_tenant ON public.tenant_user_roles(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_tenant_role ON public.tenant_user_roles(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_active ON public.tenant_user_roles(is_active) WHERE is_active = true;

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
CREATE POLICY "secure_view_security_events" ON public.security_events
FOR SELECT 
USING (
    auth.email() = 'admin@admin.com'
    OR public.check_tenant_roles(ARRAY['super_admin', 'tenant_admin', 'manager'])
);

-- سياسة لإضافة الأحداث الأمنية - النظام
CREATE POLICY "secure_log_security_events" ON public.security_events
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
        public.get_secure_tenant_id(),
        event_details_param,
        severity_param
    );
END;
$$;

-- تسجيل حدث تنفيذ الإصلاحات الأمنية
SELECT public.log_security_event(
    'security_improvements_phase1',
    jsonb_build_object(
        'phase', 'role_system_enhancement',
        'timestamp', now(),
        'changes', jsonb_build_array(
            'created_unified_role_enum',
            'created_tenant_user_roles_table',
            'added_secure_permission_functions',
            'implemented_security_logging'
        )
    ),
    'info'
);