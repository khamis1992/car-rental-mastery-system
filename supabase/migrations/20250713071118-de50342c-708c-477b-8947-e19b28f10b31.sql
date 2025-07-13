-- Insert a default tenant if none exists
INSERT INTO public.tenants (
  id,
  name,
  status,
  subscription_status,
  max_users,
  max_vehicles,
  max_contracts,
  created_at
) 
SELECT 
  gen_random_uuid(),
  'الشركة الافتراضية',
  'active',
  'active',
  100,
  50,
  1000,
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.tenants LIMIT 1);

-- Ensure the current user has a tenant association
-- Get the first tenant ID
DO $$
DECLARE
  first_tenant_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user from auth context
  current_user_id := auth.uid();
  
  -- Get first available tenant
  SELECT id INTO first_tenant_id FROM public.tenants WHERE status = 'active' LIMIT 1;
  
  -- Only proceed if we have both user and tenant
  IF current_user_id IS NOT NULL AND first_tenant_id IS NOT NULL THEN
    -- Insert tenant user association if it doesn't exist
    INSERT INTO public.tenant_users (
      tenant_id,
      user_id,
      role,
      status,
      joined_at
    ) 
    SELECT 
      first_tenant_id,
      current_user_id,
      'admin',
      'active',
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE user_id = current_user_id AND tenant_id = first_tenant_id
    );
  END IF;
END
$$;