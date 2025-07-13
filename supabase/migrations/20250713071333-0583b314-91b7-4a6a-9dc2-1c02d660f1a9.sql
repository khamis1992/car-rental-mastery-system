-- Insert a default tenant with basic columns only
INSERT INTO public.tenants (
  name,
  status
) 
SELECT 
  'الشركة الافتراضية',
  'active'
WHERE NOT EXISTS (SELECT 1 FROM public.tenants LIMIT 1);