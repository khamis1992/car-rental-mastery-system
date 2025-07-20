
-- إنشاء جدول العملاء
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  national_id TEXT,
  customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'company')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إنشاء جدول تاريخ العملاء
CREATE TABLE IF NOT EXISTS public.customer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'status_changed')),
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إنشاء جدول العقود
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  contract_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  vehicle_id UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate NUMERIC(10,3) NOT NULL,
  total_amount NUMERIC(10,3) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  pickup_location TEXT,
  return_location TEXT,
  special_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customer_history_customer_id ON public.customer_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON public.contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON public.contracts(tenant_id);

-- سياسات RLS للعملاء
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_customers" ON public.customers
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "authenticated_users_customers" ON public.customers
  FOR ALL USING (auth.role() = 'authenticated');

-- سياسات RLS لتاريخ العملاء
ALTER TABLE public.customer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_history_access" ON public.customer_history
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE tenant_id = get_current_tenant_id()
    )
  );

-- سياسات RLS للعقود
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_contracts" ON public.contracts
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "authenticated_users_contracts" ON public.contracts
  FOR ALL USING (auth.role() = 'authenticated');

-- إدراج بيانات تجريبية للعملاء
INSERT INTO public.customers (name, email, phone, city, customer_type, status) VALUES
('أحمد محمد السالم', 'ahmed.salem@email.com', '+965 9999 8888', 'الكويت', 'individual', 'active'),
('فاطمة علي الرشيد', 'fatima.rashid@email.com', '+965 9999 7777', 'الأحمدي', 'company', 'active'),
('خالد عبدالله الكندي', 'khalid.kindi@email.com', '+965 9999 6666', 'الفروانية', 'individual', 'suspended')
ON CONFLICT DO NOTHING;
