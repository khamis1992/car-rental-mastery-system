-- إنشاء جدول المؤسسات (tenants)
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,
  country text DEFAULT 'الكويت',
  timezone text DEFAULT 'Asia/Kuwait',
  currency text DEFAULT 'KWD',
  settings jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  subscription_plan text DEFAULT 'basic',
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  owner_id uuid,
  domain text,
  cancelled_at timestamp with time zone
);

-- إنشاء جدول مستخدمي المؤسسات (tenant_users)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('tenant_admin', 'manager', 'accountant', 'receptionist', 'user', 'super_admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- إضافة سياسات الأمان للمؤسسات
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all tenants" ON public.tenants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant users can view their tenant" ON public.tenants
FOR SELECT USING (
  id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- إضافة سياسات الأمان لمستخدمي المؤسسات
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all tenant users" ON public.tenant_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Tenant admins can manage users in their tenant" ON public.tenant_users
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
  )
);

CREATE POLICY "Users can view their tenant memberships" ON public.tenant_users
FOR SELECT USING (user_id = auth.uid());

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON public.tenant_users(role);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- إضافة مؤسسة افتراضية إذا لم تكن موجودة
INSERT INTO public.tenants (name, slug, status, owner_id)
SELECT 'المؤسسة الافتراضية', 'default-tenant', 'active', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'default-tenant');

-- ربط المستخدم الحالي بالمؤسسة الافتراضية كمدير عام
INSERT INTO public.tenant_users (tenant_id, user_id, role, status)
SELECT 
  (SELECT id FROM public.tenants WHERE slug = 'default-tenant'),
  auth.uid(),
  'super_admin',
  'active'
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  AND tenant_id = (SELECT id FROM public.tenants WHERE slug = 'default-tenant')
);