-- التحقق من وجود جدول tenants وإنشاؤه إذا لم يكن موجوداً
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

-- التحقق من وجود جدول tenant_users وإنشاؤه إذا لم يكن موجوداً
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

-- إضافة مؤسسة افتراضية إذا لم تكن موجودة
INSERT INTO public.tenants (name, slug, status)
SELECT 'المؤسسة الافتراضية', 'default-tenant', 'active'
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