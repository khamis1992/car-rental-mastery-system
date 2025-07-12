-- Fix RLS policies for tenants table to allow super_admin to view all tenants
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;

-- Create new policy that allows super_admin to view all tenants and regular users to view their tenant
CREATE POLICY "Enhanced tenant viewing policy" ON public.tenants
FOR SELECT USING (
  -- Super admins can see all tenants
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND status = 'active'
  )
  OR
  -- Regular users can see their current tenant
  id = get_current_tenant_id()
);