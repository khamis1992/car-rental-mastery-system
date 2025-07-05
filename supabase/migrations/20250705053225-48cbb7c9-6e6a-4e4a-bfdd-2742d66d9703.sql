-- Step 1: Fix the payment number generation function (column name conflict)
CREATE OR REPLACE FUNCTION public.generate_violation_payment_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
  payment_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(vp.payment_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.violation_payments vp
  WHERE vp.payment_number ~ '^VPY[0-9]+$';
  
  payment_number := 'VPY' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN payment_number;
END;
$function$;

-- Step 2: Add default value to payment_number column to prevent null constraint violations
ALTER TABLE public.violation_payments 
ALTER COLUMN payment_number SET DEFAULT public.generate_violation_payment_number();

-- Step 3: Create table to link violation payments to accounting entries
CREATE TABLE IF NOT EXISTS public.violation_accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_payment_id UUID NOT NULL REFERENCES public.violation_payments(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(violation_payment_id, journal_entry_id)
);

-- Enable RLS on the new table
ALTER TABLE public.violation_accounting_entries ENABLE ROW LEVEL SECURITY;

-- RLS policy for violation accounting entries
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة قيود المخالفات"
ON public.violation_accounting_entries
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- Step 4: Create accounting accounts for violations if they don't exist
INSERT INTO public.chart_of_accounts (account_code, account_name, account_name_en, account_type, account_category, level)
VALUES 
  ('1140', 'المخالفات المرورية المدينة', 'Traffic Violations Receivable', 'asset', 'current_asset', 2),
  ('4150', 'إيرادات المخالفات المرورية', 'Traffic Violations Revenue', 'revenue', 'operating_revenue', 2)
ON CONFLICT (account_code) DO NOTHING;

-- Step 5: Create function to automatically create accounting entries for violation payments
CREATE OR REPLACE FUNCTION public.create_violation_accounting_entry(
  payment_id UUID,
  payment_amount NUMERIC,
  payment_date DATE,
  violation_number TEXT,
  customer_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  receivable_account_id UUID;
  revenue_account_id UUID;
  cash_account_id UUID;
  journal_entry_id UUID;
  entry_number TEXT;
BEGIN
  -- Get account IDs
  SELECT id INTO receivable_account_id FROM public.chart_of_accounts WHERE account_code = '1140';
  SELECT id INTO revenue_account_id FROM public.chart_of_accounts WHERE account_code = '4150';
  SELECT id INTO cash_account_id FROM public.chart_of_accounts WHERE account_code = '1110'; -- Cash account
  
  -- Generate journal entry number
  entry_number := public.generate_journal_entry_number();
  
  -- Create journal entry
  INSERT INTO public.journal_entries (
    entry_number,
    entry_date,
    description,
    reference_type,
    reference_id,
    total_debit,
    total_credit,
    status,
    created_by
  ) VALUES (
    entry_number,
    payment_date,
    'دفعة مخالفة مرورية - ' || violation_number || ' - ' || customer_name,
    'violation_payment',
    payment_id,
    payment_amount,
    payment_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- Create journal entry lines
  INSERT INTO public.journal_entry_lines (
    journal_entry_id,
    account_id,
    description,
    debit_amount,
    credit_amount,
    line_number
  ) VALUES 
  (journal_entry_id, cash_account_id, 'نقدية من دفعة مخالفة - ' || violation_number, payment_amount, 0, 1),
  (journal_entry_id, receivable_account_id, 'تخفيض مديونية مخالفة - ' || violation_number, 0, payment_amount, 2);
  
  -- Link the payment to the journal entry
  INSERT INTO public.violation_accounting_entries (
    violation_payment_id,
    journal_entry_id,
    created_by
  ) VALUES (
    payment_id,
    journal_entry_id,
    auth.uid()
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- Step 6: Create function to create initial receivable entry when violation is created
CREATE OR REPLACE FUNCTION public.create_violation_receivable_entry(
  violation_id UUID,
  violation_amount NUMERIC,
  violation_date DATE,
  violation_number TEXT,
  customer_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  receivable_account_id UUID;
  revenue_account_id UUID;
  journal_entry_id UUID;
  entry_number TEXT;
BEGIN
  -- Get account IDs
  SELECT id INTO receivable_account_id FROM public.chart_of_accounts WHERE account_code = '1140';
  SELECT id INTO revenue_account_id FROM public.chart_of_accounts WHERE account_code = '4150';
  
  -- Generate journal entry number
  entry_number := public.generate_journal_entry_number();
  
  -- Create journal entry
  INSERT INTO public.journal_entries (
    entry_number,
    entry_date,
    description,
    reference_type,
    reference_id,
    total_debit,
    total_credit,
    status,
    created_by
  ) VALUES (
    entry_number,
    violation_date,
    'مخالفة مرورية - ' || violation_number || ' - ' || customer_name,
    'violation',
    violation_id,
    violation_amount,
    violation_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- Create journal entry lines
  INSERT INTO public.journal_entry_lines (
    journal_entry_id,
    account_id,
    description,
    debit_amount,
    credit_amount,
    line_number
  ) VALUES 
  (journal_entry_id, receivable_account_id, 'مديونية مخالفة مرورية - ' || violation_number, violation_amount, 0, 1),
  (journal_entry_id, revenue_account_id, 'إيراد مخالفة مرورية - ' || violation_number, 0, violation_amount, 2);
  
  RETURN journal_entry_id;
END;
$function$;

-- Step 7: Update the violation payment trigger to create accounting entries
CREATE OR REPLACE FUNCTION public.update_violation_payment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  violation_record RECORD;
  customer_record RECORD;
BEGIN
  -- Update paid amount in violation
  UPDATE public.traffic_violations 
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.violation_payments 
      WHERE violation_id = COALESCE(NEW.violation_id, OLD.violation_id)
      AND status = 'completed'
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.violation_id, OLD.violation_id);
  
  -- Update payment status
  UPDATE public.traffic_violations 
  SET 
    payment_status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      ELSE status
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.violation_id, OLD.violation_id);
  
  -- Create accounting entry for new completed payments
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    -- Get violation and customer details
    SELECT tv.*, c.name as customer_name
    INTO violation_record
    FROM public.traffic_violations tv
    JOIN public.customers c ON tv.customer_id = c.id
    WHERE tv.id = NEW.violation_id;
    
    -- Create accounting entry
    PERFORM public.create_violation_accounting_entry(
      NEW.id,
      NEW.amount,
      NEW.payment_date::DATE,
      violation_record.violation_number,
      violation_record.customer_name
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;