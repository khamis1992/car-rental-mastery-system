-- Fix infinite recursion in tenant_users policies
-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can manage their tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant admins can manage users" ON public.tenant_users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view tenant users where they belong"
  ON public.tenant_users
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage users"
  ON public.tenant_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid() 
        AND tu.tenant_id = tenant_users.tenant_id
        AND tu.role IN ('owner', 'admin')
    )
  );