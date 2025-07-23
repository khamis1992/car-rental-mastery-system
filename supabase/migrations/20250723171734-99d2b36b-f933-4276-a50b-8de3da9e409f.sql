-- إصلاح خطأ الدوال الموجودة مسبقاً
-- 1. حذف الدوال الموجودة لإعادة إنشائها

DROP FUNCTION IF EXISTS public.has_role(uuid, user_role);
DROP FUNCTION IF EXISTS public.has_any_tenant_role(text[]);
DROP FUNCTION IF EXISTS public.get_current_tenant_id();
DROP FUNCTION IF EXISTS public.is_tenant_valid(uuid);
DROP FUNCTION IF EXISTS public.ensure_tenant_id_on_insert();

-- 2. إنشاء enum للأدوار إذا لم يكن موجوداً
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

-- 3. إنشاء جدول أدوار المؤسسات الموحد
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

-- 4. إعادة إنشاء الدوال الأمنية مع search_path آمن

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

-- 5. إضافة مؤشرات للأداء
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_user_tenant ON public.tenant_user_roles(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_tenant_role ON public.tenant_user_roles(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_active ON public.tenant_user_roles(is_active) WHERE is_active = true;