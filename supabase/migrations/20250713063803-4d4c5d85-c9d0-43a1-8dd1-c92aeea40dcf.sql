-- تفعيل Row Level Security للجداول
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- سياسات أمان للمؤسسات
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
CREATE POLICY "Super admins can manage all tenants" ON public.tenants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Tenant users can view their tenant" ON public.tenants;
CREATE POLICY "Tenant users can view their tenant" ON public.tenants
FOR SELECT USING (
  id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- سياسات أمان لمستخدمي المؤسسات
DROP POLICY IF EXISTS "Super admins can manage all tenant users" ON public.tenant_users;
CREATE POLICY "Super admins can manage all tenant users" ON public.tenant_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Tenant admins can manage users in their tenant" ON public.tenant_users;
CREATE POLICY "Tenant admins can manage users in their tenant" ON public.tenant_users
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Users can view their tenant memberships" ON public.tenant_users;
CREATE POLICY "Users can view their tenant memberships" ON public.tenant_users
FOR SELECT USING (user_id = auth.uid());