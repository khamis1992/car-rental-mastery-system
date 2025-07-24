-- إصلاح الدفعة العاشرة من الدوال بإضافة SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    total_accounts INTEGER := 0;
BEGIN
    -- إنشاء دليل الحسابات الأساسي
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    total_accounts := inserted_count;
    
    -- إضافة حسابات متخصصة لتأجير السيارات
    SELECT public.add_specialized_rental_accounts(tenant_id_param) INTO inserted_count;
    total_accounts := total_accounts + inserted_count;
    
    RETURN total_accounts;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- إضافة المزيد من حسابات الالتزامات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '213', 'الضرائب المستحقة', 'Accrued Taxes', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '214', 'التأمينات الاجتماعية', 'Social Insurance', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- إضافة المزيد من حسابات الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات استثمارية', 'Investment Income', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- إضافة المزيد من حسابات المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '53', 'مصروفات مالية', 'Financial Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0);
    
    inserted_count := 6;
    
    RETURN inserted_count;
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

CREATE OR REPLACE FUNCTION public.get_accounting_periods()
 RETURNS TABLE(id uuid, period_name text, start_date date, end_date date, status text, year integer, is_current boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    RETURN QUERY
    SELECT 
        ap.id,
        ap.period_name,
        ap.start_date,
        ap.end_date,
        ap.status,
        ap.year,
        (CURRENT_DATE BETWEEN ap.start_date AND ap.end_date) AS is_current
    FROM public.accounting_periods ap
    WHERE ap.tenant_id = current_tenant_id
    ORDER BY ap.start_date DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_invoice_stats()
 RETURNS TABLE(total_invoices bigint, total_amount numeric, paid_amount numeric, pending_amount numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_invoices,
        COALESCE(SUM(i.total_amount), 0) as total_amount,
        COALESCE(SUM(i.paid_amount), 0) as paid_amount,
        COALESCE(SUM(i.outstanding_amount), 0) as pending_amount
    FROM public.invoices i
    WHERE i.tenant_id = current_tenant_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_payment_stats()
 RETURNS TABLE(total_payments bigint, total_amount numeric, completed_amount numeric, pending_amount numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_payments,
        COALESCE(SUM(p.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as completed_amount,
        COALESCE(SUM(CASE WHEN p.status != 'completed' THEN p.amount ELSE 0 END), 0) as pending_amount
    FROM public.payments p
    WHERE p.tenant_id = current_tenant_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reprocess_missing_invoice_entries()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    processed_count integer := 0;
    error_count integer := 0;
    invoice_record record;
    journal_entry_id uuid;
    error_details jsonb[] := array[]::jsonb[];
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- العثور على الفواتير التي ليس لها قيود محاسبية
    FOR invoice_record IN 
        SELECT i.id, i.invoice_number, i.total_amount, c.customer_name
        FROM public.invoices i
        LEFT JOIN public.customers c ON i.customer_id = c.id
        WHERE i.tenant_id = current_tenant_id
        AND NOT EXISTS (
            SELECT 1 FROM public.journal_entries je 
            WHERE je.reference_type = 'invoice' 
            AND je.reference_id = i.id
        )
    LOOP
        BEGIN
            -- إنشاء القيد المحاسبي للفاتورة
            SELECT public.create_invoice_accounting_entry(
                jsonb_build_object(
                    'invoice_id', invoice_record.id,
                    'invoice_number', invoice_record.invoice_number,
                    'total_amount', invoice_record.total_amount,
                    'customer_name', COALESCE(invoice_record.customer_name, 'عميل غير محدد')
                )
            ) INTO journal_entry_id;
            
            processed_count := processed_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_details := error_details || jsonb_build_object(
                'invoice_id', invoice_record.id,
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed', processed_count,
        'errors', error_count,
        'details', error_details
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.reprocess_missing_payment_entries()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    processed_count integer := 0;
    error_count integer := 0;
    payment_record record;
    journal_entry_id uuid;
    error_details jsonb[] := array[]::json[];
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- العثور على المدفوعات التي ليس لها قيود محاسبية
    FOR payment_record IN 
        SELECT p.id, p.payment_reference, p.amount, c.customer_name, p.payment_method
        FROM public.payments p
        LEFT JOIN public.invoices i ON p.invoice_id = i.id
        LEFT JOIN public.customers c ON i.customer_id = c.id
        WHERE p.tenant_id = current_tenant_id
        AND p.status = 'completed'
        AND NOT EXISTS (
            SELECT 1 FROM public.journal_entries je 
            WHERE je.reference_type = 'payment' 
            AND je.reference_id = p.id
        )
    LOOP
        BEGIN
            -- إنشاء القيد المحاسبي للدفعة
            SELECT public.create_payment_accounting_entry(
                jsonb_build_object(
                    'payment_id', payment_record.id,
                    'payment_reference', payment_record.payment_reference,
                    'amount', payment_record.amount,
                    'customer_name', COALESCE(payment_record.customer_name, 'عميل غير محدد'),
                    'payment_method', payment_record.payment_method
                )
            ) INTO journal_entry_id;
            
            processed_count := processed_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_details := error_details || jsonb_build_object(
                'payment_id', payment_record.id,
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed', processed_count,
        'errors', error_count,
        'details', error_details
    );
END;
$function$;