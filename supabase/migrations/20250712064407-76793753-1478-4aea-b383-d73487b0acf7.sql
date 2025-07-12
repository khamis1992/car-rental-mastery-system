-- Clean up admin@admin.com tenant associations
-- Remove association with "البشائر الخليجية"
DELETE FROM public.tenant_users 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@admin.com'
)
AND tenant_id = (
  SELECT id FROM public.tenants WHERE name = 'البشائر الخليجية'
);

-- Remove duplicate associations with "شركة النجوم" (keep only one as super_admin)
WITH duplicate_associations AS (
  SELECT tu.id
  FROM public.tenant_users tu
  JOIN auth.users au ON tu.user_id = au.id
  JOIN public.tenants t ON tu.tenant_id = t.id
  WHERE au.email = 'admin@admin.com'
  AND t.name = 'شركة النجوم'
  AND tu.role != 'super_admin'
)
DELETE FROM public.tenant_users 
WHERE id IN (SELECT id FROM duplicate_associations);

-- Ensure admin@admin.com has super_admin role with "شركة النجوم" if exists
UPDATE public.tenant_users 
SET role = 'super_admin', status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@admin.com'
)
AND tenant_id = (
  SELECT id FROM public.tenants WHERE name = 'شركة النجوم'
);

-- Ensure admin@admin.com has super_admin role with default tenant
INSERT INTO public.tenant_users (user_id, tenant_id, role, status, joined_at)
SELECT 
  au.id,
  '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid,
  'super_admin',
  'active',
  now()
FROM auth.users au
WHERE au.email = 'admin@admin.com'
AND NOT EXISTS (
  SELECT 1 FROM public.tenant_users tu 
  WHERE tu.user_id = au.id 
  AND tu.tenant_id = '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid
  AND tu.role = 'super_admin'
  AND tu.status = 'active'
);