-- إضافة مستخدم افتراضي للمؤسسة الافتراضية
INSERT INTO public.tenant_users (tenant_id, user_id, role, status)
SELECT 
  t.id,
  '5c91def7-016a-40e1-901c-6b5c6b0bbfee'::uuid, -- ID المستخدم من الـ network logs
  'super_admin',
  'active'
FROM public.tenants t
WHERE t.slug = 'default-tenant'
ON CONFLICT (tenant_id, user_id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  updated_at = now();