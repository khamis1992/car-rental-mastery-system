
-- تحسين أدوات الصيانة المحاسبية لمعالجة جميع الحسابات المتأثرة

-- 1. تحسين دالة تصحيح رصيد حساب معين لتشمل معلومات أكثر تفصيلاً
CREATE OR REPLACE FUNCTION public.correct_account_balance_enhanced(
    account_code_param TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    account_record RECORD;
    old_balance NUMERIC;
    new_balance NUMERIC;
    total_debits NUMERIC := 0;
    total_credits NUMERIC := 0;
    orphaned_debits NUMERIC := 0;
    orphaned_credits NUMERIC := 0;
BEGIN
    -- الحصول على تفاصيل الحساب
    SELECT id, account_name, account_type, current_balance, opening_balance
    INTO account_record
    FROM public.chart_of_accounts 
    WHERE account_code = account_code_param;
    
    IF account_record.id IS NULL THEN
        RAISE EXCEPTION 'Account with code % not found', account_code_param;
    END IF;
    
    old_balance := account_record.current_balance;
    
    -- حساب إجمالي المدين والدائن من القيود المحاسبية الصحيحة
    SELECT 
        COALESCE(SUM(jel.debit_amount), 0),
        COALESCE(SUM(jel.credit_amount), 0)
    INTO total_debits, total_credits
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = account_record.id
    AND je.status = 'posted'
    AND (
        (je.reference_type = 'invoice' AND EXISTS (SELECT 1 FROM public.invoices WHERE id = je.reference_id))
        OR (je.reference_type = 'payment' AND EXISTS (SELECT 1 FROM public.payments WHERE id = je.reference_id))
        OR (je.reference_type = 'contract' AND EXISTS (SELECT 1 FROM public.contracts WHERE id = je.reference_id))
        OR (je.reference_type = 'violation' AND EXISTS (SELECT 1 FROM public.traffic_violations WHERE id = je.reference_id))
        OR (je.reference_type = 'violation_payment' AND EXISTS (SELECT 1 FROM public.violation_payments WHERE id = je.reference_id))
        OR (je.reference_type NOT IN ('invoice', 'payment', 'contract', 'violation', 'violation_payment'))
    );
    
    -- حساب القيود المعلقة لهذا الحساب
    SELECT 
        COALESCE(SUM(jel.debit_amount), 0),
        COALESCE(SUM(jel.credit_amount), 0)
    INTO orphaned_debits, orphaned_credits
    FROM public.journal_entry_lines jel
    JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = account_record.id
    AND je.status = 'posted'
    AND (
        (je.reference_type = 'invoice' AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE id = je.reference_id))
        OR (je.reference_type = 'payment' AND NOT EXISTS (SELECT 1 FROM public.payments WHERE id = je.reference_id))
        OR (je.reference_type = 'contract' AND NOT EXISTS (SELECT 1 FROM public.contracts WHERE id = je.reference_id))
        OR (je.reference_type = 'violation' AND NOT EXISTS (SELECT 1 FROM public.traffic_violations WHERE id = je.reference_id))
        OR (je.reference_type = 'violation_payment' AND NOT EXISTS (SELECT 1 FROM public.violation_payments WHERE id = je.reference_id))
    );
    
    -- حساب الرصيد الصحيح حسب نوع الحساب
    CASE account_record.account_type
        WHEN 'asset', 'expense' THEN
            new_balance := account_record.opening_balance + total_debits - total_credits;
        WHEN 'liability', 'equity', 'revenue' THEN
            new_balance := account_record.opening_balance + total_credits - total_debits;
        ELSE
            new_balance := account_record.opening_balance;
    END CASE;
    
    -- تحديث الرصيد
    UPDATE public.chart_of_accounts 
    SET 
        current_balance = new_balance,
        updated_at = now()
    WHERE id = account_record.id;
    
    RETURN jsonb_build_object(
        'account_code', account_code_param,
        'account_name', account_record.account_name,
        'account_type', account_record.account_type,
        'old_balance', old_balance,
        'new_balance', new_balance,
        'correction_amount', new_balance - old_balance,
        'total_debits', total_debits,
        'total_credits', total_credits,
        'orphaned_debits', orphaned_debits,
        'orphaned_credits', orphaned_credits,
        'orphaned_impact', orphaned_credits - orphaned_debits,
        'corrected_at', now()
    );
END;
$$;

-- 2. دالة تقرير شامل للحسابات المتأثرة بالقيود المعلقة
CREATE OR REPLACE FUNCTION public.generate_orphaned_entries_impact_report()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_accounts JSONB := '[]'::jsonb;
    account_record RECORD;
    total_orphaned_amount NUMERIC := 0;
BEGIN
    -- تحليل تأثير القيود المعلقة على كل حساب
    FOR account_record IN (
        SELECT DISTINCT
            coa.id,
            coa.account_code,
            coa.account_name,
            coa.account_type,
            coa.current_balance,
            COALESCE(SUM(CASE WHEN orphaned.entry_type = 'orphaned' THEN jel.debit_amount ELSE 0 END), 0) as orphaned_debits,
            COALESCE(SUM(CASE WHEN orphaned.entry_type = 'orphaned' THEN jel.credit_amount ELSE 0 END), 0) as orphaned_credits
        FROM public.chart_of_accounts coa
        LEFT JOIN public.journal_entry_lines jel ON coa.id = jel.account_id
        LEFT JOIN public.journal_entries je ON jel.journal_entry_id = je.id
        LEFT JOIN (
            SELECT 
                je.id,
                CASE 
                    WHEN (je.reference_type = 'invoice' AND NOT EXISTS(SELECT 1 FROM public.invoices WHERE id = je.reference_id))
                      OR (je.reference_type = 'payment' AND NOT EXISTS(SELECT 1 FROM public.payments WHERE id = je.reference_id))
                      OR (je.reference_type = 'contract' AND NOT EXISTS(SELECT 1 FROM public.contracts WHERE id = je.reference_id))
                    THEN 'orphaned'
                    ELSE 'valid'
                END as entry_type
            FROM public.journal_entries je
            WHERE je.status = 'posted'
        ) orphaned ON je.id = orphaned.id
        WHERE je.status = 'posted' OR je.status IS NULL
        GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.current_balance
        HAVING COALESCE(SUM(CASE WHEN orphaned.entry_type = 'orphaned' THEN jel.debit_amount ELSE 0 END), 0) > 0
            OR COALESCE(SUM(CASE WHEN orphaned.entry_type = 'orphaned' THEN jel.credit_amount ELSE 0 END), 0) > 0
        ORDER BY coa.account_code
    ) LOOP
        
        DECLARE
            impact_amount NUMERIC;
        BEGIN
            -- حساب التأثير حسب نوع الحساب
            CASE account_record.account_type
                WHEN 'asset', 'expense' THEN
                    impact_amount := account_record.orphaned_debits - account_record.orphaned_credits;
                WHEN 'liability', 'equity', 'revenue' THEN
                    impact_amount := account_record.orphaned_credits - account_record.orphaned_debits;
                ELSE
                    impact_amount := 0;
            END CASE;
            
            total_orphaned_amount := total_orphaned_amount + ABS(impact_amount);
            
            affected_accounts := affected_accounts || jsonb_build_object(
                'account_code', account_record.account_code,
                'account_name', account_record.account_name,
                'account_type', account_record.account_type,
                'current_balance', account_record.current_balance,
                'orphaned_debits', account_record.orphaned_debits,
                'orphaned_credits', account_record.orphaned_credits,
                'impact_amount', impact_amount,
                'impact_direction', CASE 
                    WHEN impact_amount > 0 THEN 'overstated'
                    WHEN impact_amount < 0 THEN 'understated'
                    ELSE 'neutral'
                END
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'total_affected_accounts', jsonb_array_length(affected_accounts),
        'total_orphaned_impact', total_orphaned_amount,
        'affected_accounts', affected_accounts,
        'report_generated_at', now()
    );
END;
$$;

-- 3. تحسين دالة الصيانة الدورية
CREATE OR REPLACE FUNCTION public.periodic_accounting_maintenance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    maintenance_results JSONB := '{}';
    cleanup_result JSONB;
    balance_update_result JSONB;
    impact_report JSONB;
    critical_accounts TEXT[] := ARRAY['1130', '2131', '4110', '1120'];
    account_code TEXT;
    account_correction JSONB;
BEGIN
    -- 1. تقرير التأثير قبل التنظيف
    SELECT public.generate_orphaned_entries_impact_report() INTO impact_report;
    
    -- 2. تنظيف القيود المعلقة
    SELECT public.cleanup_orphaned_journal_entries() INTO cleanup_result;
    
    -- 3. تحديث أرصدة الحسابات
    SELECT public.update_account_balances() INTO balance_update_result;
    
    -- 4. تصحيح الحسابات الحرجة
    DECLARE
        critical_corrections JSONB := '[]'::jsonb;
    BEGIN
        FOREACH account_code IN ARRAY critical_accounts
        LOOP
            BEGIN
                SELECT public.correct_account_balance_enhanced(account_code) INTO account_correction;
                critical_corrections := critical_corrections || account_correction;
            EXCEPTION WHEN OTHERS THEN
                critical_corrections := critical_corrections || jsonb_build_object(
                    'account_code', account_code,
                    'error', SQLERRM
                );
            END;
        END LOOP;
        
        maintenance_results := maintenance_results || jsonb_build_object(
            'critical_account_corrections', critical_corrections
        );
    END;
    
    -- تجميع النتائج
    maintenance_results := maintenance_results || jsonb_build_object(
        'pre_cleanup_impact', impact_report,
        'orphaned_cleanup', cleanup_result,
        'balance_updates', balance_update_result,
        'maintenance_date', now(),
        'summary', jsonb_build_object(
            'orphaned_entries_cleaned', cleanup_result->>'total_cleaned',
            'accounts_updated', balance_update_result->>'updated_accounts',
            'critical_accounts_processed', array_length(critical_accounts, 1)
        )
    );
    
    RETURN maintenance_results;
END;
$$;

-- 4. دالة تحليل حساب الإيرادات المؤجلة بشكل خاص
CREATE OR REPLACE FUNCTION public.analyze_deferred_revenue_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deferred_account RECORD;
    contract_analysis JSONB;
    invoice_analysis JSONB;
    payment_analysis JSONB;
    recommendation TEXT;
BEGIN
    -- الحصول على تفاصيل حساب الإيرادات المؤجلة
    SELECT id, account_code, account_name, current_balance, opening_balance
    INTO deferred_account
    FROM public.chart_of_accounts 
    WHERE account_code = '2131';
    
    IF deferred_account.id IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'حساب الإيرادات المؤجلة (2131) غير موجود',
            'recommendation', 'يجب إنشاء حساب الإيرادات المؤجلة في دليل الحسابات'
        );
    END IF;
    
    -- تحليل العقود النشطة
    SELECT jsonb_build_object(
        'active_contracts_count', COUNT(*),
        'total_contract_value', COALESCE(SUM(total_amount), 0),
        'average_contract_value', COALESCE(AVG(total_amount), 0)
    ) INTO contract_analysis
    FROM public.contracts
    WHERE status IN ('active', 'pending');
    
    -- تحليل الفواتير المرسلة غير المدفوعة
    SELECT jsonb_build_object(
        'unpaid_invoices_count', COUNT(*),
        'total_unpaid_amount', COALESCE(SUM(outstanding_amount), 0)
    ) INTO invoice_analysis
    FROM public.invoices
    WHERE status IN ('sent', 'overdue');
    
    -- تحليل المدفوعات المستقبلية المتوقعة
    SELECT jsonb_build_object(
        'expected_payments', COALESCE(SUM(outstanding_amount), 0)
    ) INTO payment_analysis
    FROM public.invoices
    WHERE status = 'sent' AND due_date > CURRENT_DATE;
    
    -- تحديد التوصية
    IF deferred_account.current_balance < 0 THEN
        recommendation := 'الرصيد سالب - قد يشير إلى خطأ في القيود المحاسبية';
    ELSIF deferred_account.current_balance = 0 THEN
        recommendation := 'الرصيد صفر - تحقق من وجود عقود نشطة تتطلب إيرادات مؤجلة';
    ELSE
        recommendation := 'الرصيد موجب - تحقق من تطابق الرصيد مع العقود النشطة';
    END IF;
    
    RETURN jsonb_build_object(
        'account_details', jsonb_build_object(
            'account_code', deferred_account.account_code,
            'account_name', deferred_account.account_name,
            'current_balance', deferred_account.current_balance,
            'opening_balance', deferred_account.opening_balance
        ),
        'contract_analysis', contract_analysis,
        'invoice_analysis', invoice_analysis,
        'payment_analysis', payment_analysis,
        'recommendation', recommendation,
        'analysis_date', now()
    );
END;
$$;
