-- حل المشاكل الأمنية الحرجة - الجداول الموجودة بدون RLS
-- تأمين الجداول الثلاثة المكتشفة في التقرير

-- 1. تأمين جدول asset_disposal_reasons
ALTER TABLE public.asset_disposal_reasons ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات RLS للأصول
CREATE POLICY "Users can access asset disposal reasons for their tenant" 
ON public.asset_disposal_reasons 
FOR ALL 
USING (tenant_id = public.get_current_tenant_id());

-- 2. تأمين جدول maintenance_categories
ALTER TABLE public.maintenance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access maintenance categories for their tenant" 
ON public.maintenance_categories 
FOR ALL 
USING (tenant_id = public.get_current_tenant_id());

-- 3. تأمين جدول tenant_access_log
ALTER TABLE public.tenant_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own tenant logs" 
ON public.tenant_access_log 
FOR ALL 
USING (tenant_id = public.get_current_tenant_id());

-- 4. إصلاح الدوال الأساسية بإضافة search_path
-- تحديث دالة get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$
DECLARE
    current_user_id uuid;
    tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    ORDER BY tu.created_at DESC
    LIMIT 1;
    
    RETURN tenant_id;
END;
$function$;

-- تحديث دالة has_any_tenant_role
CREATE OR REPLACE FUNCTION public.has_any_tenant_role(allowed_roles text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
    user_role text;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_user_id IS NULL OR current_tenant_id IS NULL THEN
        RETURN false;
    END IF;
    
    SELECT tu.role INTO user_role
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.tenant_id = current_tenant_id
    AND tu.status = 'active';
    
    RETURN user_role = ANY(allowed_roles);
END;
$function$;