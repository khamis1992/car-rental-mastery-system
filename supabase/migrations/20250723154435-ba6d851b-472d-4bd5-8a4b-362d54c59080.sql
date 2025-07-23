-- إزالة الدوال المتعارضة أولاً
DROP FUNCTION IF EXISTS public.has_role(uuid, user_role);
DROP FUNCTION IF EXISTS public.get_current_tenant_id();
DROP FUNCTION IF EXISTS public.is_tenant_valid(uuid);
DROP FUNCTION IF EXISTS public.has_any_tenant_role(text[]);
DROP FUNCTION IF EXISTS public.ensure_tenant_id_on_insert();
DROP FUNCTION IF EXISTS public.is_saas_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_invitation(text, text);
DROP FUNCTION IF EXISTS public.log_user_activity(text, text, text, text);
DROP FUNCTION IF EXISTS public.get_account_balance_optimized(uuid, date);
DROP FUNCTION IF EXISTS public.update_invoice_payment_status();
DROP FUNCTION IF EXISTS public.get_customer_current_balance(uuid);

-- إعادة إنشاء الدوال مع أسماء معاملات صحيحة
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO current_tenant_id
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND status = 'active'
    LIMIT 1;

    IF current_tenant_id IS NULL THEN
        SELECT id INTO current_tenant_id
        FROM public.tenants
        WHERE status = 'active'
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    RETURN current_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_valid(tenant_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tenants
        WHERE id = tenant_id_param
        AND status = 'active'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_param user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = user_id_param
        AND role = role_param
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param text[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tenant_users
        WHERE user_id = auth.uid()
        AND tenant_id = public.get_current_tenant_id()
        AND role = ANY(roles_param)
        AND status = 'active'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
    SELECT auth.email() = 'admin@admin.com';
$$;

-- دالة لضمان تعيين معرف المؤسسة تلقائياً
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := public.get_current_tenant_id();
        
        IF NEW.tenant_id IS NULL THEN
            RAISE EXCEPTION 'لا يمكن تحديد معرف المؤسسة للمستخدم الحالي';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

SELECT 'تم إعداد الدوال الأساسية بنجاح' as result;