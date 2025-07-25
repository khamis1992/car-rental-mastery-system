-- إصلاح الدوال - الدفعة السابعة

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
    results jsonb[] := ARRAY[]::jsonb[];
    payment_record record;
    journal_entry_id uuid;
    result_item jsonb;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'لا يمكن تحديد المؤسسة الحالية'
        );
    END IF;
    
    -- البحث عن المدفوعات التي لا تحتوي على قيود محاسبية
    FOR payment_record IN 
        SELECT p.id, p.payment_number, p.amount, p.payment_date, 
               p.payment_method, i.invoice_number, c.customer_name
        FROM public.payments p
        LEFT JOIN public.invoices i ON p.invoice_id = i.id
        LEFT JOIN public.customers c ON i.customer_id = c.id
        LEFT JOIN public.journal_entries je ON je.reference_type = 'payment' AND je.reference_id = p.id
        WHERE p.tenant_id = current_tenant_id
        AND p.status = 'completed'
        AND je.id IS NULL
    LOOP
        BEGIN
            -- إنشاء القيد المحاسبي للدفعة
            SELECT public.create_payment_accounting_entry(
                jsonb_build_object(
                    'payment_id', payment_record.id,
                    'amount', payment_record.amount,
                    'customer_name', payment_record.customer_name,
                    'payment_reference', payment_record.payment_number
                )
            ) INTO journal_entry_id;
            
            processed_count := processed_count + 1;
            result_item := jsonb_build_object(
                'payment_id', payment_record.id,
                'payment_number', payment_record.payment_number,
                'journal_entry_id', journal_entry_id,
                'status', 'success'
            );
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            result_item := jsonb_build_object(
                'payment_id', payment_record.id,
                'payment_number', payment_record.payment_number,
                'status', 'error',
                'error_message', SQLERRM
            );
        END;
        
        results := results || result_item;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', processed_count,
        'error_count', error_count,
        'total_count', processed_count + error_count,
        'results', results
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_accounting_integrity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    integrity_result jsonb;
    contracts_without_entries integer := 0;
    payments_without_entries integer := 0;
    unbalanced_entries integer := 0;
    orphaned_lines integer := 0;
    missing_accounts integer := 0;
    status text := 'healthy';
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'لا يمكن تحديد المؤسسة الحالية'
        );
    END IF;
    
    -- فحص العقود بدون قيود محاسبية
    SELECT COUNT(*) INTO contracts_without_entries
    FROM public.contracts c
    LEFT JOIN public.journal_entries je ON je.reference_type = 'contract' AND je.reference_id = c.id
    WHERE c.tenant_id = current_tenant_id
    AND c.status = 'active'
    AND je.id IS NULL;
    
    -- فحص المدفوعات بدون قيود محاسبية
    SELECT COUNT(*) INTO payments_without_entries
    FROM public.payments p
    LEFT JOIN public.journal_entries je ON je.reference_type = 'payment' AND je.reference_id = p.id
    WHERE p.tenant_id = current_tenant_id
    AND p.status = 'completed'
    AND je.id IS NULL;
    
    -- فحص القيود غير المتوازنة
    SELECT COUNT(*) INTO unbalanced_entries
    FROM public.journal_entries je
    WHERE je.tenant_id = current_tenant_id
    AND je.total_debit != je.total_credit;
    
    -- فحص سطور القيود المعلقة
    SELECT COUNT(*) INTO orphaned_lines
    FROM public.journal_entry_lines jel
    LEFT JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.tenant_id = current_tenant_id
    AND je.id IS NULL;
    
    -- فحص الحسابات المفقودة
    SELECT COUNT(*) INTO missing_accounts
    FROM public.journal_entry_lines jel
    LEFT JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
    WHERE jel.tenant_id = current_tenant_id
    AND coa.id IS NULL;
    
    -- تحديد حالة التكامل العامة
    IF contracts_without_entries > 0 OR payments_without_entries > 0 OR 
       unbalanced_entries > 0 OR orphaned_lines > 0 OR missing_accounts > 0 THEN
        status := 'issues_detected';
    END IF;
    
    integrity_result := jsonb_build_object(
        'success', true,
        'status', status,
        'tenant_id', current_tenant_id,
        'checks', jsonb_build_object(
            'contracts_without_entries', contracts_without_entries,
            'payments_without_entries', payments_without_entries,
            'unbalanced_entries', unbalanced_entries,
            'orphaned_lines', orphaned_lines,
            'missing_accounts', missing_accounts
        ),
        'total_issues', contracts_without_entries + payments_without_entries + 
                       unbalanced_entries + orphaned_lines + missing_accounts,
        'checked_at', NOW()
    );
    
    RETURN integrity_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reprocess_single_payment(payment_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    payment_record record;
    journal_entry_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية';
    END IF;
    
    -- جلب بيانات الدفعة
    SELECT p.id, p.payment_number, p.amount, p.payment_date, 
           p.payment_method, i.invoice_number, c.customer_name
    INTO payment_record
    FROM public.payments p
    LEFT JOIN public.invoices i ON p.invoice_id = i.id
    LEFT JOIN public.customers c ON i.customer_id = c.id
    WHERE p.id = payment_id_param
    AND p.tenant_id = current_tenant_id
    AND p.status = 'completed';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'لا يمكن العثور على الدفعة أو أنها غير مكتملة';
    END IF;
    
    -- التحقق من عدم وجود قيد محاسبي مسبقاً
    IF EXISTS (
        SELECT 1 FROM public.journal_entries je 
        WHERE je.reference_type = 'payment' 
        AND je.reference_id = payment_id_param
        AND je.tenant_id = current_tenant_id
    ) THEN
        RAISE EXCEPTION 'يوجد قيد محاسبي مسبق لهذه الدفعة';
    END IF;
    
    -- إنشاء القيد المحاسبي
    SELECT public.create_payment_accounting_entry(
        jsonb_build_object(
            'payment_id', payment_record.id,
            'amount', payment_record.amount,
            'customer_name', payment_record.customer_name,
            'payment_reference', payment_record.payment_number
        )
    ) INTO journal_entry_id;
    
    RETURN journal_entry_id IS NOT NULL;
END;
$function$;