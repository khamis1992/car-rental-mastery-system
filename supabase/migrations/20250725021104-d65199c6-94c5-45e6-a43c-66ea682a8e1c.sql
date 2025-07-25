-- إصلاح الدوال - الدفعة الخامسة

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
    reference_type TEXT;
    reference_id UUID;
BEGIN
    -- استخراج البيانات
    transaction_amount := (transaction_data->>'amount')::NUMERIC;
    transaction_description := transaction_data->>'description';
    debit_account_id := (transaction_data->>'debit_account_id')::UUID;
    credit_account_id := (transaction_data->>'credit_account_id')::UUID;
    reference_type := COALESCE(transaction_data->>'reference_type', 'general');
    reference_id := (transaction_data->>'reference_id')::UUID;
    
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
        reference_type,
        reference_id,
        transaction_amount,
        transaction_amount,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطر المدين
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, debit_account_id, transaction_description, transaction_amount, 0, 1
    );
    
    -- إنشاء سطر الدائن
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, credit_account_id, transaction_description, 0, transaction_amount, 2
    );
    
    RETURN journal_entry_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(contract_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  contract_amount NUMERIC;
  contract_reference TEXT;
  customer_name TEXT;
  
  -- معرفات الحسابات
  receivables_account UUID;
  revenue_account UUID;
BEGIN
  -- استخراج البيانات
  contract_amount := (contract_data->>'daily_rate')::NUMERIC * (contract_data->>'total_days')::NUMERIC;
  contract_reference := contract_data->>'contract_number';
  customer_name := contract_data->>'customer_name';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO receivables_account FROM public.chart_of_accounts WHERE account_code = '1121' AND tenant_id = public.get_current_tenant_id();
  SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '411' AND tenant_id = public.get_current_tenant_id();
  
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
    'عقد إيجار - ' || customer_name || ' - ' || contract_reference,
    'contract',
    (contract_data->>'contract_id')::UUID,
    contract_amount,
    contract_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- الذمم المدينة (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivables_account, 'ذمم عميل - ' || customer_name, contract_amount, 0, 1
  );
  
  -- إيرادات الإيجار (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, revenue_account, 'إيرادات إيجار - ' || customer_name, 0, contract_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_info jsonb;
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المالية المناسبة
    SELECT jsonb_build_object(
        'period_id', fp.id,
        'period_name', fp.period_name,
        'start_date', fp.start_date,
        'end_date', fp.end_date,
        'status', fp.status,
        'is_closed', fp.is_closed,
        'can_modify', CASE 
            WHEN fp.is_closed = true THEN false
            WHEN fp.status = 'closed' THEN false
            ELSE true
        END,
        'message', CASE 
            WHEN fp.is_closed = true THEN 'الفترة المالية مقفلة نهائياً'
            WHEN fp.status = 'closed' THEN 'الفترة المالية مقفلة'
            ELSE 'الفترة المالية مفتوحة'
        END
    ) INTO period_info
    FROM public.financial_periods fp
    WHERE fp.tenant_id = current_tenant_id
    AND check_date BETWEEN fp.start_date AND fp.end_date
    LIMIT 1;
    
    -- إذا لم نجد فترة، إرجاع معلومات افتراضية
    IF period_info IS NULL THEN
        period_info := jsonb_build_object(
            'period_id', null,
            'period_name', 'فترة غير محددة',
            'start_date', null,
            'end_date', null,
            'status', 'unknown',
            'is_closed', false,
            'can_modify', false,
            'message', 'لا توجد فترة مالية محددة لهذا التاريخ'
        );
    END IF;
    
    RETURN period_info;
END;
$function$;