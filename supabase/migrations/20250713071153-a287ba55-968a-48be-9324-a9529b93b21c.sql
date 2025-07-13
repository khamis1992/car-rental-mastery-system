-- Insert a default tenant if none exists (with correct columns)
INSERT INTO public.tenants (
  id,
  name,
  status,
  max_users,
  max_vehicles,
  max_contracts,
  created_at
) 
SELECT 
  gen_random_uuid(),
  'الشركة الافتراضية',
  'active',
  100,
  50,
  1000,
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.tenants LIMIT 1);