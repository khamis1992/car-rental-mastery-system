-- Create a function to ensure user has tenant association
CREATE OR REPLACE FUNCTION ensure_user_tenant_association()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  first_tenant_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user
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

-- Call the function
SELECT ensure_user_tenant_association();