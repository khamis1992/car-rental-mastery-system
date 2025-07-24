CREATE OR REPLACE FUNCTION public.log_transaction(transaction_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  transaction_amount NUMERIC;
  transaction_description TEXT;
  debit_account_id UUID;
  credit_account_id UUID;
BEGIN
  -- استخراج البيانات
  transaction_amount := (transaction_data->>'amount')::NUMERIC;
  transaction_description := transaction_data->>'description';
  debit_account_id := (transaction_data->>'debit_account_id')::UUID;
  credit_account_id := (transaction_data->>'credit_account_id')::UUID;
  
  -- توليد رقم القيد
  journal_entry_number := public.generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
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
    journal_entry_number,
    CURRENT_DATE,
    transaction_description,
    COALESCE(transaction_data->>'reference_type', 'manual'),
    (transaction_data->>'reference_id')::UUID,
    transaction_amount,
    transaction_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- السطر المدين
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, debit_account_id, transaction_description, transaction_amount, 0, 1
  );
  
  -- السطر الدائن
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, credit_account_id, transaction_description, 0, transaction_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$