-- إضافة سياسات الأمان الناقصة لجدول chart_of_accounts
-- هذه هي المشكلة الأساسية: الجدول يحتوي على RLS لكن بدون سياسات

-- سياسة عرض الحسابات - المحاسبون والمديرون يمكنهم رؤية حسابات مؤسستهم
CREATE POLICY "chart_accounts_tenant_view" ON public.chart_of_accounts
FOR SELECT
USING (
  tenant_id = get_current_tenant_id() 
  AND (
    has_role(auth.uid(), 'admin'::user_role) 
    OR has_role(auth.uid(), 'manager'::user_role) 
    OR has_role(auth.uid(), 'accountant'::user_role)
  )
);

-- سياسة إدراج الحسابات - المحاسبون والمديرون يمكنهم إضافة حسابات لمؤسستهم
CREATE POLICY "chart_accounts_tenant_insert" ON public.chart_of_accounts
FOR INSERT
WITH CHECK (
  tenant_id = get_current_tenant_id() 
  AND (
    has_role(auth.uid(), 'admin'::user_role) 
    OR has_role(auth.uid(), 'manager'::user_role) 
    OR has_role(auth.uid(), 'accountant'::user_role)
  )
);

-- سياسة تحديث الحسابات - المحاسبون والمديرون يمكنهم تحديث حسابات مؤسستهم
CREATE POLICY "chart_accounts_tenant_update" ON public.chart_of_accounts
FOR UPDATE
USING (
  tenant_id = get_current_tenant_id() 
  AND (
    has_role(auth.uid(), 'admin'::user_role) 
    OR has_role(auth.uid(), 'manager'::user_role) 
    OR has_role(auth.uid(), 'accountant'::user_role)
  )
);

-- سياسة حذف الحسابات - المديرون فقط يمكنهم حذف الحسابات
CREATE POLICY "chart_accounts_tenant_delete" ON public.chart_of_accounts
FOR DELETE
USING (
  tenant_id = get_current_tenant_id() 
  AND (
    has_role(auth.uid(), 'admin'::user_role) 
    OR has_role(auth.uid(), 'manager'::user_role)
  )
);

-- التأكد من وجود دالة للتحقق من المصادقة
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- دالة للحصول على معلومات المستخدم الحالي للتشخيص
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'user_id', auth.uid(),
    'tenant_id', get_current_tenant_id(),
    'is_authenticated', auth.uid() IS NOT NULL,
    'session_exists', auth.jwt() IS NOT NULL
  );
$$;