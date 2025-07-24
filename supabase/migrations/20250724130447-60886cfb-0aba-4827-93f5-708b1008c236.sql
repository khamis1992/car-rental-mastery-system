-- حذف الدالة المشكلة وإعادة إنشائها
DROP FUNCTION public.setup_tenant_default_accounting_data(uuid);

-- إعادة إنشاء دالة setup_tenant_default_accounting_data مع SET search_path
CREATE OR REPLACE FUNCTION public.setup_tenant_default_accounting_data(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ دليل الحسابات الافتراضي
    SELECT public.copy_default_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    -- نسخ مراكز التكلفة الافتراضية
    PERFORM public.copy_default_cost_centers(tenant_id_param);
    
    -- نسخ العلامة التجارية الافتراضية
    PERFORM public.copy_default_company_branding(tenant_id_param);
    
    RETURN inserted_count;
END;
$function$;

-- الآن سنكمل إصلاح المجموعة التالية من الدوال

-- إصلاح دالة create_invoice_accounting_entry
CREATE OR REPLACE FUNCTION public.create_invoice_accounting_entry(invoice_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  invoice_amount NUMERIC;
  invoice_reference TEXT;
  customer_name TEXT;
  
  -- معرفات الحسابات
  receivables_account UUID;
  revenue_account UUID;
BEGIN
  -- استخراج البيانات
  invoice_amount := (invoice_data->>'total_amount')::NUMERIC;
  invoice_reference := invoice_data->>'invoice_number';
  customer_name := invoice_data->>'customer_name';
  
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
    'فاتورة - ' || customer_name || ' - ' || invoice_reference,
    'invoice',
    (invoice_data->>'invoice_id')::UUID,
    invoice_amount,
    invoice_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- الذمم المدينة (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivables_account, 'ذمم عميل - ' || customer_name, invoice_amount, 0, 1
  );
  
  -- إيرادات الإيجار (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, revenue_account, 'إيرادات إيجار - ' || customer_name, 0, invoice_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- إصلاح دالة create_payment_accounting_entry
CREATE OR REPLACE FUNCTION public.create_payment_accounting_entry(payment_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  payment_amount NUMERIC;
  payment_reference TEXT;
  customer_name TEXT;
  payment_method TEXT;
  
  -- معرفات الحسابات
  cash_account UUID;
  receivables_account UUID;
BEGIN
  -- استخراج البيانات
  payment_amount := (payment_data->>'amount')::NUMERIC;
  payment_reference := payment_data->>'payment_reference';
  customer_name := payment_data->>'customer_name';
  payment_method := payment_data->>'payment_method';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO cash_account FROM public.chart_of_accounts WHERE account_code = '1111';
  SELECT id INTO receivables_account FROM public.chart_of_accounts WHERE account_code = '1121';
  
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
    'سداد - ' || customer_name || ' - ' || payment_reference,
    'payment',
    (payment_data->>'payment_id')::UUID,
    payment_amount,
    payment_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- النقدية (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, cash_account, 'استلام نقدي - ' || customer_name, payment_amount, 0, 1
  );
  
  -- الذمم المدينة (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivables_account, 'سداد ذمم - ' || customer_name, 0, payment_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- إصلاح دالة get_financial_summary
CREATE OR REPLACE FUNCTION public.get_financial_summary(tenant_id_param uuid, start_date_param date DEFAULT NULL, end_date_param date DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    total_assets numeric := 0;
    total_liabilities numeric := 0;
    total_equity numeric := 0;
    total_revenue numeric := 0;
    total_expenses numeric := 0;
BEGIN
    -- حساب إجمالي الأصول
    SELECT COALESCE(SUM(current_balance), 0) INTO total_assets
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'asset'
    AND is_active = true;
    
    -- حساب إجمالي الالتزامات
    SELECT COALESCE(SUM(current_balance), 0) INTO total_liabilities
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'liability'
    AND is_active = true;
    
    -- حساب إجمالي حقوق الملكية
    SELECT COALESCE(SUM(current_balance), 0) INTO total_equity
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'equity'
    AND is_active = true;
    
    -- حساب إجمالي الإيرادات
    SELECT COALESCE(SUM(current_balance), 0) INTO total_revenue
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'revenue'
    AND is_active = true;
    
    -- حساب إجمالي المصروفات
    SELECT COALESCE(SUM(current_balance), 0) INTO total_expenses
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'expense'
    AND is_active = true;
    
    result := jsonb_build_object(
        'total_assets', total_assets,
        'total_liabilities', total_liabilities,
        'total_equity', total_equity,
        'total_revenue', total_revenue,
        'total_expenses', total_expenses,
        'net_income', total_revenue - total_expenses,
        'equity_ratio', CASE WHEN total_assets > 0 THEN total_equity / total_assets ELSE 0 END,
        'debt_ratio', CASE WHEN total_assets > 0 THEN total_liabilities / total_assets ELSE 0 END
    );
    
    RETURN result;
END;
$function$;

-- إصلاح دالة get_trial_balance
CREATE OR REPLACE FUNCTION public.get_trial_balance(tenant_id_param uuid, as_of_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(account_code text, account_name text, account_type text, debit_balance numeric, credit_balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        coa.account_code,
        coa.account_name,
        coa.account_type,
        CASE 
            WHEN coa.current_balance > 0 AND coa.account_type IN ('asset', 'expense') THEN coa.current_balance
            WHEN coa.current_balance < 0 AND coa.account_type IN ('liability', 'equity', 'revenue') THEN ABS(coa.current_balance)
            ELSE 0
        END as debit_balance,
        CASE 
            WHEN coa.current_balance > 0 AND coa.account_type IN ('liability', 'equity', 'revenue') THEN coa.current_balance
            WHEN coa.current_balance < 0 AND coa.account_type IN ('asset', 'expense') THEN ABS(coa.current_balance)
            ELSE 0
        END as credit_balance
    FROM public.chart_of_accounts coa
    WHERE coa.tenant_id = tenant_id_param
    AND coa.is_active = true
    AND coa.allow_posting = true
    ORDER BY coa.account_code;
END;
$function$;