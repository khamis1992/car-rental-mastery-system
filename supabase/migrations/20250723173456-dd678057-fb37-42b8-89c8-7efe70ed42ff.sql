-- إصلاح الخطأ: حذف الدوال الموجودة وإعادة إنشاؤها
-- حذف الدوال المتضاربة أولاً

DROP FUNCTION IF EXISTS public.has_role(uuid, user_role);
DROP FUNCTION IF EXISTS public.is_tenant_valid(uuid);
DROP FUNCTION IF EXISTS public.ensure_tenant_id_on_insert();
DROP FUNCTION IF EXISTS public.is_saas_admin();
DROP FUNCTION IF EXISTS public.get_current_tenant_id();
DROP FUNCTION IF EXISTS public.has_any_tenant_role(text[]);

-- إعادة إنشاء الدوال الأمنية المحدثة

-- 1. دالة التحقق من الأدوار
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

-- 2. دالة التحقق من صحة المؤسسة
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

-- 3. دالة ضمان tenant_id في الإدراج
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

-- 4. دالة التحقق من صلاحيات الـ SaaS
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

-- 5. دالة الحصول على معرف المؤسسة الحالية
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

-- 6. دالة التحقق من أدوار المؤسسة
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