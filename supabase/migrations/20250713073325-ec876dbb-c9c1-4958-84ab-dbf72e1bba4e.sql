-- Additional fix for infinite recursion - ensure all remaining problematic policies are removed
-- and create a completely isolated approach

-- Check and drop any remaining problematic policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on tenant_users that might cause recursion
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'tenant_users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.tenant_users';
    END LOOP;
END $$;

-- Create the most basic possible policies for tenant_users
CREATE POLICY "basic_user_select" 
ON public.tenant_users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "basic_user_insert" 
ON public.tenant_users 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure the get_user_tenant_direct function works without any RLS interference
CREATE OR REPLACE FUNCTION public.get_user_tenant_direct()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_tenant_id uuid;
BEGIN
    -- Disable RLS for this query to prevent recursion
    SET row_security = off;
    
    SELECT tenant_id INTO result_tenant_id
    FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
    LIMIT 1;
    
    -- Re-enable RLS
    SET row_security = on;
    
    RETURN result_tenant_id;
END;
$$;

-- Test the function to make sure it works
SELECT public.get_user_tenant_direct();