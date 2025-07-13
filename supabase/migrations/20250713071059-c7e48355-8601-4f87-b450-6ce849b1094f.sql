-- Check if tenant_users table exists and fix any remaining issues
-- First, let's see the current structure and fix the policies

-- Drop all existing policies on tenant_users
DROP POLICY IF EXISTS "Allow authenticated users to view tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Allow authenticated users to manage tenant users" ON public.tenant_users;

-- Temporarily disable RLS to check if table exists
ALTER TABLE public.tenant_users DISABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users access
-- This is for the demo/testing phase
CREATE POLICY "Allow all authenticated users full access to tenant_users"
  ON public.tenant_users
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Re-enable RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;