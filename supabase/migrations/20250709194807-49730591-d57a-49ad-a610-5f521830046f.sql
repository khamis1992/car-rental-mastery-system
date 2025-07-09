
-- Create tenant/organization table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  domain text UNIQUE,
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  city text,
  country text DEFAULT 'Kuwait',
  timezone text DEFAULT 'Asia/Kuwait',
  currency text DEFAULT 'KWD',
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  subscription_plan text DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'standard', 'premium', 'enterprise')),
  subscription_status text DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
  trial_ends_at timestamp with time zone DEFAULT (now() + interval '14 days'),
  subscription_starts_at timestamp with time zone,
  subscription_ends_at timestamp with time zone,
  max_users integer DEFAULT 5,
  max_vehicles integer DEFAULT 10,
  max_contracts integer DEFAULT 100,
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Create tenant users junction table for multi-tenant user access
CREATE TABLE public.tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('super_admin', 'tenant_admin', 'manager', 'accountant', 'receptionist', 'user')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by uuid,
  invited_at timestamp with time zone,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Create subscription history table
CREATE TABLE public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL,
  status text NOT NULL,
  amount numeric,
  currency text DEFAULT 'KWD',
  billing_period text CHECK (billing_period IN ('monthly', 'yearly')),
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Add tenant_id to existing tables
ALTER TABLE public.customers ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.vehicles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.contracts ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.quotations ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.additional_charges ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.employees ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.departments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.traffic_violations ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.violation_payments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.branches ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.chart_of_accounts ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.journal_entries ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.cost_centers ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id 
  FROM public.tenant_users 
  WHERE user_id = auth.uid() 
  AND status = 'active'
  LIMIT 1;
$$;

-- Create function to check if user has role in current tenant
CREATE OR REPLACE FUNCTION public.has_tenant_role(_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = public.get_current_tenant_id()
    AND role = _role
    AND status = 'active'
  );
$$;

-- Create function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_tenant_role(_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = public.get_current_tenant_id()
    AND role = ANY(_roles)
    AND status = 'active'
  );
$$;

-- Enable RLS on new tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenants table
CREATE POLICY "Users can view their tenant" ON public.tenants
FOR SELECT USING (
  id = public.get_current_tenant_id()
);

CREATE POLICY "Tenant admins can update their tenant" ON public.tenants
FOR UPDATE USING (
  id = public.get_current_tenant_id() 
  AND public.has_any_tenant_role(ARRAY['tenant_admin', 'super_admin'])
);

-- RLS policies for tenant_users table
CREATE POLICY "Users can view tenant members" ON public.tenant_users
FOR SELECT USING (
  tenant_id = public.get_current_tenant_id()
);

CREATE POLICY "Tenant admins can manage users" ON public.tenant_users
FOR ALL USING (
  tenant_id = public.get_current_tenant_id()
  AND public.has_any_tenant_role(ARRAY['tenant_admin', 'super_admin'])
);

-- RLS policies for subscription_history table
CREATE POLICY "Tenant admins can view subscription history" ON public.subscription_history
FOR SELECT USING (
  tenant_id = public.get_current_tenant_id()
  AND public.has_any_tenant_role(ARRAY['tenant_admin', 'super_admin'])
);

-- Update existing RLS policies to include tenant isolation
-- Customers
DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم ر" ON public.customers;
DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة العملاء" ON public.customers;

CREATE POLICY "Users can view customers in their tenant" ON public.customers
FOR SELECT USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Staff can manage customers in their tenant" ON public.customers
FOR ALL USING (
  tenant_id = public.get_current_tenant_id()
  AND public.has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'receptionist'])
);

-- Vehicles
DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم ر" ON public.vehicles;
DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة المركبات" ON public.vehicles;

CREATE POLICY "Users can view vehicles in their tenant" ON public.vehicles
FOR SELECT USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Staff can manage vehicles in their tenant" ON public.vehicles
FOR ALL USING (
  tenant_id = public.get_current_tenant_id()
  AND public.has_any_tenant_role(ARRAY['tenant_admin', 'manager'])
);

-- Contracts
DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم ر" ON public.contracts;
DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة العقود" ON public.contracts;

CREATE POLICY "Users can view contracts in their tenant" ON public.contracts
FOR SELECT USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Staff can manage contracts in their tenant" ON public.contracts
FOR ALL USING (
  tenant_id = public.get_current_tenant_id()
  AND public.has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'receptionist'])
);

-- Create trigger to automatically set tenant_id on insert
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.tenant_id := public.get_current_tenant_id();
  RETURN NEW;
END;
$$;

-- Add triggers to automatically set tenant_id
CREATE TRIGGER set_tenant_id_customers
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

CREATE TRIGGER set_tenant_id_vehicles
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

CREATE TRIGGER set_tenant_id_contracts
  BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

-- Create default tenant for existing data
INSERT INTO public.tenants (
  name, 
  slug, 
  contact_email, 
  status, 
  subscription_plan,
  subscription_status,
  max_users,
  max_vehicles,
  max_contracts
) VALUES (
  'Default Organization',
  'default-org',
  'admin@company.com',
  'active',
  'enterprise',
  'active',
  999,
  999,
  9999
);

-- Get the default tenant ID for data migration
DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default-org';
  
  -- Update existing data with default tenant_id
  UPDATE public.customers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicles SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.contracts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.quotations SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.invoices SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.payments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.additional_charges SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.employees SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.departments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.branches SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.chart_of_accounts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.journal_entries SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.cost_centers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
END $$;

-- Make tenant_id NOT NULL after data migration
ALTER TABLE public.customers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.contracts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.quotations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.additional_charges ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.employees ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.departments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.branches ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.chart_of_accounts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.journal_entries ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.cost_centers ALTER COLUMN tenant_id SET NOT NULL;
