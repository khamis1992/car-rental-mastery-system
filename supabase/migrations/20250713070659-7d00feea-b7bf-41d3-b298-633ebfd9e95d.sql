-- Fix the tenant_users policy recursion issue more carefully
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view tenant users where they belong" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant admins can manage users" ON public.tenant_users;

-- Create a simple policy that doesn't reference itself
CREATE POLICY "Allow authenticated users to view tenant users"
  ON public.tenant_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to manage tenant users"
  ON public.tenant_users
  FOR ALL
  USING (auth.uid() IS NOT NULL);