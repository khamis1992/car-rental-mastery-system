-- حل المشاكل الأمنية الحرجة للنظام المالي
-- الأولوية الأولى: تأمين الجداول وإصلاح الدوال

-- 1. تأمين جدول performance_benchmarks
ALTER TABLE public.performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات RLS
CREATE POLICY "Users can access benchmarks for their tenant" 
ON public.performance_benchmarks 
FOR ALL 
USING (tenant_id = public.get_current_tenant_id());

-- 2. تأمين جدول kpi_targets  
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access KPI targets for their tenant" 
ON public.kpi_targets 
FOR ALL 
USING (tenant_id = public.get_current_tenant_id());

-- 3. تأمين جدول advanced_kpis
ALTER TABLE public.advanced_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access advanced KPIs for their tenant" 
ON public.advanced_kpis 
FOR ALL 
USING (tenant_id = public.get_current_tenant_id());

-- 4. إصلاح مشكلة Function Search Path للدوال الحرجة
-- تحديث دالة get_current_tenant_id لتثبيت search_path
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

-- تحديث دالة has_any_tenant_role لتثبيت search_path  
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

-- تحديث دالة is_tenant_valid لتثبيت search_path
CREATE OR REPLACE FUNCTION public.is_tenant_valid(tenant_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    tenant_status text;
BEGIN
    SELECT status INTO tenant_status 
    FROM public.tenants 
    WHERE id = tenant_id_param;
    
    RETURN tenant_status = 'active';
END;
$function$;

-- تحديث دالة ensure_tenant_id_on_insert لتثبيت search_path
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    current_tenant_id uuid;
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
$function$;