-- تصحيح سياسات RLS لـ admin@admin.com

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

SELECT 'تم إنشاء سياسات RLS للحد من وصول admin@admin.com' as result;