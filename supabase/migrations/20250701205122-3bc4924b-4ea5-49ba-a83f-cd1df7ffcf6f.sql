-- Create invoicing system tables

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Amounts
  subtotal DECIMAL(10,3) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  outstanding_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  
  -- Status and type
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),
  invoice_type TEXT NOT NULL DEFAULT 'rental' CHECK (invoice_type IN ('rental', 'additional', 'penalty', 'extension')),
  
  -- Payment terms
  payment_terms TEXT DEFAULT 'استحقاق خلال 30 يوم',
  payment_method TEXT,
  
  -- Additional info
  notes TEXT,
  terms_and_conditions TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create invoice items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Item details
  description TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'rental' CHECK (item_type IN ('rental', 'fuel', 'cleaning', 'damage', 'extension', 'penalty', 'insurance', 'other')),
  
  -- Pricing
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,3) NOT NULL,
  total_price DECIMAL(10,3) NOT NULL,
  
  -- Rental specific
  start_date DATE,
  end_date DATE,
  daily_rate DECIMAL(10,3),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  contract_id UUID NOT NULL REFERENCES public.contracts(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  
  -- Payment details
  amount DECIMAL(10,3) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check', 'online')),
  
  -- Transaction details
  transaction_reference TEXT,
  bank_name TEXT,
  check_number TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  
  -- Additional info
  notes TEXT,
  receipt_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create additional charges table
CREATE TABLE public.additional_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  
  -- Charge details
  charge_type TEXT NOT NULL CHECK (charge_type IN ('fuel', 'cleaning', 'damage', 'penalty', 'extension', 'insurance', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(10,3) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  invoice_id UUID REFERENCES public.invoices(id),
  
  -- Evidence
  photos TEXT[],
  documents TEXT[],
  
  -- Metadata
  charge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_charges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية الفواتير"
ON public.invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة الفواتير"
ON public.invoices FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));

-- Create RLS policies for invoice items
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية بنود الفواتير"
ON public.invoice_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة بنود الفواتير"
ON public.invoice_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));

-- Create RLS policies for payments
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية المدفوعات"
ON public.payments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة المدفوعات"
ON public.payments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));

-- Create RLS policies for additional charges
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية الرسوم الإضافية"
ON public.additional_charges FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة الرسوم الإضافية"
ON public.additional_charges FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^INV[0-9]+$';
  
  invoice_number := 'INV' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_number;
END;
$$;

-- Create function to generate payment numbers
CREATE OR REPLACE FUNCTION public.generate_payment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  payment_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.payments
  WHERE payment_number ~ '^PAY[0-9]+$';
  
  payment_number := 'PAY' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN payment_number;
END;
$$;

-- Create trigger to update invoice amounts when items change
CREATE OR REPLACE FUNCTION public.update_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.invoices 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM public.invoice_items 
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update total amount (subtotal + tax - discount)
  UPDATE public.invoices 
  SET 
    total_amount = subtotal + tax_amount - discount_amount,
    outstanding_amount = (subtotal + tax_amount - discount_amount) - paid_amount,
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for invoice items
CREATE TRIGGER update_invoice_totals_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_totals();

-- Create trigger to update invoice paid amounts when payments change
CREATE OR REPLACE FUNCTION public.update_invoice_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.invoices 
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments 
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      AND status = 'completed'
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update outstanding amount and status
  UPDATE public.invoices 
  SET 
    outstanding_amount = total_amount - paid_amount,
    status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partially_paid'
      WHEN due_date < CURRENT_DATE AND paid_amount = 0 THEN 'overdue'
      ELSE status
    END,
    paid_at = CASE 
      WHEN paid_amount >= total_amount AND paid_at IS NULL THEN now()
      ELSE paid_at
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for payments
CREATE TRIGGER update_invoice_payments_on_payment_change
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_payments();

-- Create trigger for updated_at columns
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_additional_charges_updated_at
  BEFORE UPDATE ON public.additional_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();