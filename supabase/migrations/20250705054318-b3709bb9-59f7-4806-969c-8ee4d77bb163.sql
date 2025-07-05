-- Fix the create_violation_accounting_entry function (rename conflicting variable)
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
  journal_entry_number TEXT;  -- Renamed from entry_number to avoid ambiguity
BEGIN
  -- Get account IDs
  SELECT id INTO receivable_account_id FROM public.chart_of_accounts WHERE account_code = '1140';
  SELECT id INTO revenue_account_id FROM public.chart_of_accounts WHERE account_code = '4150';
  SELECT id INTO cash_account_id FROM public.chart_of_accounts WHERE account_code = '1110'; -- Cash account
  
  -- Generate journal entry number
  journal_entry_number := public.generate_journal_entry_number();
  
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
    journal_entry_number,  -- Use the renamed variable
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

-- Fix the create_violation_receivable_entry function (rename conflicting variable)
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
  journal_entry_number TEXT;  -- Renamed from entry_number to avoid ambiguity
BEGIN
  -- Get account IDs
  SELECT id INTO receivable_account_id FROM public.chart_of_accounts WHERE account_code = '1140';
  SELECT id INTO revenue_account_id FROM public.chart_of_accounts WHERE account_code = '4150';
  
  -- Generate journal entry number
  journal_entry_number := public.generate_journal_entry_number();
  
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
    journal_entry_number,  -- Use the renamed variable
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