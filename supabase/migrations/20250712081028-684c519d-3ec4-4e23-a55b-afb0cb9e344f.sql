-- إنشاء سياسات RLS محدودة لمنع admin@admin.com من الوصول إلى بيانات المؤسسات

-- إنشاء وظيفة للتحقق من SaaS admin
CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.email() = 'admin@admin.com';
$$;

-- تحديث سياسة جدول tenants
DROP POLICY IF EXISTS "Users can view tenants in their organization" ON public.tenants;
CREATE POLICY "Users can view tenants in their organization" ON public.tenants
FOR SELECT USING (
  NOT is_saas_admin() AND (
    id = get_current_tenant_id()
    OR has_any_tenant_role(ARRAY['super_admin'::text])
  )
);

-- سياسة للسماح لـ admin@admin.com بإدارة الإعدادات العامة فقط
CREATE POLICY "SaaS admin system access" ON public.profiles
FOR ALL USING (
  user_id = auth.uid()
);

-- رسالة تأكيد
SELECT 'تم تحديث سياسات RLS - admin@admin.com محدود إلى إدارة النظام العام' as result;