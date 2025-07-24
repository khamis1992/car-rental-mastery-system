-- إصلاح تحذيرات Function Search Path Mutable - الدفعة الثامنة
-- إضافة SET search_path TO 'public' للمزيد من الدوال

-- إصلاح دالة create_contract_accounting_entry
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
  SELECT id INTO receivables_account FROM chart_of_accounts WHERE account_code = '1121';
  SELECT id INTO revenue_account FROM chart_of_accounts WHERE account_code = '411';
  
  -- توليد رقم القيد
  journal_entry_number := generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
  INSERT INTO journal_entries (
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
  INSERT INTO journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivables_account, 'ذمم عميل - ' || customer_name, contract_amount, 0, 1
  );
  
  -- إيرادات الإيجار (دائن)
  INSERT INTO journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, revenue_account, 'إيرادات إيجار - ' || customer_name, 0, contract_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- إصلاح دالة setup_comprehensive_chart_of_accounts
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(target_tenant_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إنشاء دليل حسابات شامل للمؤسسة
    SELECT create_correct_chart_of_accounts(target_tenant_id) INTO inserted_count;
    
    RETURN inserted_count;
END;
$function$;

-- إصلاح دالة complete_liabilities_equity_revenue_expenses
CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(target_tenant_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إضافة حسابات متخصصة إضافية
    SELECT add_specialized_rental_accounts(target_tenant_id) INTO inserted_count;
    
    RETURN inserted_count;
END;
$function$;

-- إصلاح دالة reprocess_missing_payment_entries
CREATE OR REPLACE FUNCTION public.reprocess_missing_payment_entries()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    missing_payment record;
    processed_count integer := 0;
    error_count integer := 0;
    total_count integer := 0;
    results jsonb[] := '{}';
    result_entry jsonb;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- جلب المدفوعات المفقودة
    FOR missing_payment IN 
        SELECT 
            p.id,
            p.payment_number,
            p.amount,
            p.payment_date,
            p.payment_method,
            i.invoice_number,
            c.name as customer_name
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN customers c ON i.customer_id = c.id
        WHERE p.journal_entry_id IS NULL
        AND p.status = 'completed'
        AND p.tenant_id = current_tenant_id
        ORDER BY p.created_at DESC
        LIMIT 100
    LOOP
        total_count := total_count + 1;
        
        BEGIN
            -- إنشاء القيد المحاسبي للمدفوعة
            PERFORM create_payment_accounting_entry(jsonb_build_object(
                'payment_id', missing_payment.id,
                'customer_name', missing_payment.customer_name,
                'invoice_number', missing_payment.invoice_number,
                'payment_amount', missing_payment.amount,
                'payment_method', missing_payment.payment_method,
                'payment_date', missing_payment.payment_date
            ));
            
            processed_count := processed_count + 1;
            result_entry := jsonb_build_object(
                'payment_id', missing_payment.id,
                'invoice_number', missing_payment.invoice_number,
                'amount', missing_payment.amount,
                'status', 'success'
            );
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            result_entry := jsonb_build_object(
                'payment_id', missing_payment.id,
                'invoice_number', missing_payment.invoice_number,
                'amount', missing_payment.amount,
                'status', 'error',
                'error_message', SQLERRM
            );
        END;
        
        results := results || result_entry;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed_count', processed_count,
        'error_count', error_count,
        'total_processed', total_count,
        'results', results
    );
END;
$function$;

-- إصلاح دالة validate_accounting_integrity
CREATE OR REPLACE FUNCTION public.validate_accounting_integrity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    payments_without_entries integer := 0;
    invoices_without_entries integer := 0;
    unbalanced_entries integer := 0;
    missing_required_accounts integer := 0;
    overall_status text := 'healthy';
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- فحص المدفوعات بدون قيود محاسبية
    SELECT COUNT(*) INTO payments_without_entries
    FROM payments
    WHERE journal_entry_id IS NULL
    AND status = 'completed'
    AND tenant_id = current_tenant_id;
    
    -- فحص الفواتير بدون قيود محاسبية
    SELECT COUNT(*) INTO invoices_without_entries
    FROM invoices
    WHERE journal_entry_id IS NULL
    AND status IN ('sent', 'paid')
    AND tenant_id = current_tenant_id;
    
    -- فحص القيود غير المتوازنة
    SELECT COUNT(*) INTO unbalanced_entries
    FROM journal_entries
    WHERE tenant_id = current_tenant_id
    AND total_debit != total_credit;
    
    -- فحص الحسابات المطلوبة المفقودة
    SELECT CASE 
        WHEN COUNT(*) < 10 THEN 1 
        ELSE 0 
    END INTO missing_required_accounts
    FROM chart_of_accounts
    WHERE tenant_id = current_tenant_id
    AND account_code IN ('1111', '1121', '411', '511', '2111');
    
    -- تحديد الحالة العامة
    IF payments_without_entries > 0 OR invoices_without_entries > 0 OR 
       unbalanced_entries > 0 OR missing_required_accounts > 0 THEN
        overall_status := 'needs_attention';
    END IF;
    
    RETURN jsonb_build_object(
        'payments_without_entries', payments_without_entries,
        'invoices_without_entries', invoices_without_entries,
        'unbalanced_entries', unbalanced_entries,
        'missing_required_accounts', missing_required_accounts,
        'overall_status', overall_status,
        'checked_at', now()
    );
END;
$function$;

-- إصلاح دالة create_attendance_accounting_entry
CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(attendance_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  total_cost NUMERIC;
  employee_name TEXT;
  entry_date DATE;
  
  -- معرفات الحسابات
  salaries_account UUID;
  cash_account UUID;
BEGIN
  -- استخراج البيانات
  employee_name := attendance_data->>'employee_name';
  entry_date := (attendance_data->>'date')::DATE;
  
  -- حساب التكلفة الإجمالية
  total_cost := (attendance_data->>'regular_hours')::NUMERIC * (attendance_data->>'hourly_rate')::NUMERIC +
                (attendance_data->>'overtime_hours')::NUMERIC * (attendance_data->>'overtime_rate')::NUMERIC;
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO salaries_account FROM chart_of_accounts WHERE account_code = '5111';
  SELECT id INTO cash_account FROM chart_of_accounts WHERE account_code = '1111';
  
  -- توليد رقم القيد
  journal_entry_number := generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
  INSERT INTO journal_entries (
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
    entry_date,
    'تكلفة العمالة - ' || employee_name || ' - ' || entry_date,
    'attendance',
    gen_random_uuid(),
    total_cost,
    total_cost,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- الرواتب والأجور (مدين)
  INSERT INTO journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, salaries_account, 'تكلفة عمالة - ' || employee_name, total_cost, 0, 1
  );
  
  -- النقدية (دائن)
  INSERT INTO journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, cash_account, 'دفع أجور - ' || employee_name, 0, total_cost, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;