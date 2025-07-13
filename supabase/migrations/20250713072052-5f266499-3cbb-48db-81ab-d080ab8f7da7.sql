-- Fix infinite recursion in RLS policies by redesigning security functions
-- Step 1: Drop existing problematic functions and policies

-- Drop the problematic get_current_tenant_id function
DROP FUNCTION IF EXISTS public.get_current_tenant_id();

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view tenant associations" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can insert their tenant association" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can update their tenant association" ON public.tenant_users;

-- Step 2: Create a simple, non-recursive security function
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

-- Step 3: Create simplified RLS policies for tenant_users
CREATE POLICY "Users can view their own tenant data" 
ON public.tenant_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tenant data" 
ON public.tenant_users 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tenant data" 
ON public.tenant_users 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 4: Update other functions to use the new approach
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

-- Step 5: Update the set_tenant_id trigger function
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

-- Step 6: Clean up duplicate tenant_users data
WITH duplicates AS (
  SELECT 
    user_id, 
    tenant_id,
    ROW_NUMBER() OVER (PARTITION BY user_id, tenant_id ORDER BY joined_at DESC) as rn
  FROM public.tenant_users
)
DELETE FROM public.tenant_users 
WHERE (user_id, tenant_id) IN (
  SELECT user_id, tenant_id 
  FROM duplicates 
  WHERE rn > 1
);

-- Step 7: Ensure all existing users have at least one tenant association
DO $$
DECLARE
  user_record RECORD;
  first_tenant_id UUID;
BEGIN
  -- Get the first active tenant
  SELECT id INTO first_tenant_id 
  FROM public.tenants 
  WHERE status = 'active' 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- If we have a tenant, associate users without tenant
  IF first_tenant_id IS NOT NULL THEN
    FOR user_record IN 
      SELECT DISTINCT u.id as user_id
      FROM auth.users u
      LEFT JOIN public.tenant_users tu ON u.id = tu.user_id
      WHERE tu.user_id IS NULL
    LOOP
      INSERT INTO public.tenant_users (
        tenant_id,
        user_id,
        role,
        status,
        joined_at
      ) VALUES (
        first_tenant_id,
        user_record.user_id,
        'user',
        'active',
        now()
      );
    END LOOP;
  END IF;
END $$;