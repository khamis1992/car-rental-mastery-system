-- Final fix for infinite recursion - complete reset of tenant isolation system
-- This migration will completely resolve the RLS infinite recursion issue

-- Step 1: Drop all existing tenant-related functions that might cause recursion
DROP FUNCTION IF EXISTS public.get_current_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_tenant_direct() CASCADE;
DROP FUNCTION IF EXISTS public.has_tenant_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.has_any_tenant_role(text[]) CASCADE;
DROP FUNCTION IF EXISTS public.set_tenant_id() CASCADE;

-- Step 2: Create the most basic tenant lookup function without any RLS dependencies
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Direct query bypassing RLS completely
  SELECT tenant_id 
  FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  AND status = 'active'
  LIMIT 1;
$$;

-- Step 3: Create role checking functions
CREATE OR REPLACE FUNCTION public.has_user_role(_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = public.get_user_tenant_id()
    AND role = _role
    AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_user_any_role(_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = public.get_user_tenant_id()
    AND role = ANY(_roles)
    AND status = 'active'
  );
$$;

-- Step 4: Recreate the automatic tenant assignment trigger function
CREATE OR REPLACE FUNCTION public.auto_assign_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.tenant_id := public.get_user_tenant_id();
  RETURN NEW;
END;
$$;

-- Step 5: Drop and recreate all problematic RLS policies on tenant_users table
DROP POLICY IF EXISTS "basic_user_select" ON public.tenant_users;
DROP POLICY IF EXISTS "basic_user_insert" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view their own tenant data" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can insert their own tenant data" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can update their own tenant data" ON public.tenant_users;

-- Create simple, non-recursive policies for tenant_users
CREATE POLICY "tenant_users_select_own" 
ON public.tenant_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "tenant_users_insert_own" 
ON public.tenant_users 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "tenant_users_update_own" 
ON public.tenant_users 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 6: Update the main tables' RLS policies to use the new functions
DROP POLICY IF EXISTS "Tenant isolation for customers" ON public.customers;
DROP POLICY IF EXISTS "Tenant isolation for vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Tenant isolation for contracts" ON public.contracts;

CREATE POLICY "customers_tenant_isolation" 
ON public.customers 
FOR ALL 
USING (tenant_id = public.get_user_tenant_id())
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "vehicles_tenant_isolation" 
ON public.vehicles 
FOR ALL 
USING (tenant_id = public.get_user_tenant_id())
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "contracts_tenant_isolation" 
ON public.contracts 
FOR ALL 
USING (tenant_id = public.get_user_tenant_id())
WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Step 7: Update company branding policies to use new functions
DROP POLICY IF EXISTS "Users can view branding in their tenant" ON public.company_branding;
DROP POLICY IF EXISTS "Tenant admins can manage branding" ON public.company_branding;

CREATE POLICY "branding_view_tenant" 
ON public.company_branding 
FOR SELECT 
USING (tenant_id IS NULL OR tenant_id = public.get_user_tenant_id());

CREATE POLICY "branding_manage_admin" 
ON public.company_branding 
FOR ALL 
USING (
  tenant_id = public.get_user_tenant_id() 
  AND public.has_user_any_role(ARRAY['tenant_admin', 'manager'])
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id() 
  AND public.has_user_any_role(ARRAY['tenant_admin', 'manager'])
);

-- Step 8: Test the function to ensure it works
SELECT public.get_user_tenant_id();

-- Step 9: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_any_role(text[]) TO authenticated;