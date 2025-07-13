-- Step 3: Recreate essential RLS policies using new non-recursive approach

-- Create simplified RLS policies for tenant_users
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

-- Recreate the most critical tenant isolation policies for core tables
CREATE POLICY "Tenant isolation for customers" 
ON public.customers 
FOR ALL 
USING (tenant_id = public.get_user_tenant_direct())
WITH CHECK (tenant_id = public.get_user_tenant_direct());

CREATE POLICY "Tenant isolation for vehicles" 
ON public.vehicles 
FOR ALL 
USING (tenant_id = public.get_user_tenant_direct())
WITH CHECK (tenant_id = public.get_user_tenant_direct());

CREATE POLICY "Tenant isolation for contracts" 
ON public.contracts 
FOR ALL 
USING (tenant_id = public.get_user_tenant_direct())
WITH CHECK (tenant_id = public.get_user_tenant_direct());

-- Company branding policies
CREATE POLICY "Users can view branding in their tenant" 
ON public.company_branding 
FOR SELECT 
USING (tenant_id IS NULL OR tenant_id = public.get_user_tenant_direct());

CREATE POLICY "Tenant admins can manage branding" 
ON public.company_branding 
FOR ALL 
USING (tenant_id = public.get_user_tenant_direct() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']))
WITH CHECK (tenant_id = public.get_user_tenant_direct() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

-- Clean up duplicate tenant_users data
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