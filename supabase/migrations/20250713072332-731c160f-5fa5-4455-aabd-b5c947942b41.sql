-- Step 2: Drop the problematic function and recreate with new approach
DROP FUNCTION IF EXISTS public.get_current_tenant_id();

-- Create new non-recursive security function
CREATE OR REPLACE FUNCTION public.get_user_tenant_direct()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Direct query without RLS to avoid recursion
  SELECT tenant_id 
  FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  AND status = 'active'
  LIMIT 1;
$$;

-- Update other functions to use the new approach
CREATE OR REPLACE FUNCTION public.has_tenant_role(_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = public.get_user_tenant_direct()
    AND role = _role
    AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_tenant_role(_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = public.get_user_tenant_direct()
    AND role = ANY(_roles)
    AND status = 'active'
  );
$$;

-- Update the set_tenant_id trigger function
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.tenant_id := public.get_user_tenant_direct();
  RETURN NEW;
END;
$$;