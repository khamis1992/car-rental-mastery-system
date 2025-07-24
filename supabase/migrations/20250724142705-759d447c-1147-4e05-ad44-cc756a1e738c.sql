-- إصلاح دوال أخرى بدون تعديل المعاملات
-- إضافة SET search_path TO 'public' لدوال أخرى

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
  contract_amount := (contract_data->>'total_amount')::NUMERIC;
  contract_reference := contract_data->>'contract_number';
  customer_name := contract_data->>'customer_name';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO receivables_account FROM public.chart_of_accounts WHERE account_code = '1121';
  SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '411';
  
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
    'عقد - ' || customer_name || ' - ' || contract_reference,
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

CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(new_tenant_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف أي حسابات موجودة للمؤسسة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = new_tenant_id;
    
    -- إنشاء دليل الحسابات الشامل
    SELECT public.create_correct_chart_of_accounts(new_tenant_id) INTO inserted_count;
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(new_tenant_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- إكمال حسابات الالتزامات وحقوق الملكية والإيرادات والمصروفات
    
    -- المستوى الثالث - الالتزامات طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = new_tenant_id AND account_code = '22';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (new_tenant_id, '221', 'قروض طويلة الأجل', 'Long-term Loans', 'liability', 'long_term_liability', parent_id, 3, true, true, 0, 0),
    (new_tenant_id, '222', 'التزامات الإيجار', 'Lease Obligations', 'liability', 'long_term_liability', parent_id, 3, true, true, 0, 0);
    
    -- المستوى الثالث - الأرباح المحتجزة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = new_tenant_id AND account_code = '32';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (new_tenant_id, '321', 'أرباح السنة الحالية', 'Current Year Earnings', 'equity', 'capital', parent_id, 3, true, true, 0, 0),
    (new_tenant_id, '322', 'أرباح السنوات السابقة', 'Retained Earnings - Previous Years', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
    
    inserted_count := 4;
    
    RETURN inserted_count;
END;
$function$;