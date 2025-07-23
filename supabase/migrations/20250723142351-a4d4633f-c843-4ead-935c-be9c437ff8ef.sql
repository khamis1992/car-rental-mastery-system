-- حل المشاكل الأمنية للجداول بدون RLS
-- تأمين الجداول الثلاثة بناءً على تركيبها الفعلي

-- 1. تأمين جدول asset_disposal_reasons (جدول عام بدون tenant_id)
ALTER TABLE public.asset_disposal_reasons ENABLE ROW LEVEL SECURITY;

-- سياسة عامة للقراءة (جدول مشترك للقراءة العامة)
CREATE POLICY "Anyone can view asset disposal reasons" 
ON public.asset_disposal_reasons 
FOR SELECT 
USING (is_active = true);

-- المديرون فقط يمكنهم التعديل
CREATE POLICY "Admins can manage asset disposal reasons" 
ON public.asset_disposal_reasons 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- 2. تأمين جدول maintenance_categories (جدول عام بدون tenant_id)
ALTER TABLE public.maintenance_categories ENABLE ROW LEVEL SECURITY;

-- سياسة عامة للقراءة
CREATE POLICY "Anyone can view maintenance categories" 
ON public.maintenance_categories 
FOR SELECT 
USING (is_active = true);

-- المديرون فقط يمكنهم التعديل
CREATE POLICY "Admins can manage maintenance categories" 
ON public.maintenance_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- 3. تأمين جدول tenant_access_log (جدول مراقبة الوصول)
ALTER TABLE public.tenant_access_log ENABLE ROW LEVEL SECURITY;

-- المديرون يمكنهم رؤية السجلات
CREATE POLICY "Admins can view access logs" 
ON public.tenant_access_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- النظام يمكنه إدراج السجلات
CREATE POLICY "System can insert access logs" 
ON public.tenant_access_log 
FOR INSERT 
WITH CHECK (true);

-- 4. إصلاح دوال تثبيت search_path الإضافية
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