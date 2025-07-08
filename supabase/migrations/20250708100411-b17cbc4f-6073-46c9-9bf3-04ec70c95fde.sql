-- إصلاح مشكلة القيود المحاسبية المعلقة والأرصدة الخاطئة

-- 1. إصلاح دالة safe_delete_contract لحذف القيود المحاسبية المرتبطة
CREATE OR REPLACE FUNCTION public.safe_delete_contract(
    contract_id_param UUID,
    delete_related BOOLEAN DEFAULT true
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contract_record RECORD;
    deleted_records JSONB := '{}';
    contract_number_val TEXT;
BEGIN
    -- الحصول على تفاصيل العقد
    SELECT contract_number INTO contract_number_val
    FROM public.contracts 
    WHERE id = contract_id_param;
    
    IF contract_number_val IS NULL THEN
        RAISE EXCEPTION 'Contract not found';
    END IF;
    
    IF delete_related THEN
        -- حذف القيود المحاسبية المرتبطة بالعقد
        DELETE FROM public.journal_entry_lines 
        WHERE journal_entry_id IN (
            SELECT id FROM public.journal_entries 
            WHERE reference_type = 'contract' AND reference_id = contract_id_param
        );
        
        DELETE FROM public.journal_entries 
        WHERE reference_type = 'contract' AND reference_id = contract_id_param;
        
        -- حذف القيود المحاسبية المرتبطة بالفواتير
        DELETE FROM public.journal_entry_lines 
        WHERE journal_entry_id IN (
            SELECT je.id FROM public.journal_entries je
            JOIN public.invoices i ON je.reference_id = i.id
            WHERE je.reference_type = 'invoice' AND i.contract_id = contract_id_param
        );
        
        DELETE FROM public.journal_entries 
        WHERE id IN (
            SELECT je.id FROM public.journal_entries je
            JOIN public.invoices i ON je.reference_id = i.id
            WHERE je.reference_type = 'invoice' AND i.contract_id = contract_id_param
        );
        
        -- حذف القيود المحاسبية المرتبطة بالمدفوعات
        DELETE FROM public.journal_entry_lines 
        WHERE journal_entry_id IN (
            SELECT je.id FROM public.journal_entries je
            JOIN public.payments p ON je.reference_id = p.id
            JOIN public.invoices i ON p.invoice_id = i.id
            WHERE je.reference_type = 'payment' AND i.contract_id = contract_id_param
        );
        
        DELETE FROM public.journal_entries 
        WHERE id IN (
            SELECT je.id FROM public.journal_entries je
            JOIN public.payments p ON je.reference_id = p.id
            JOIN public.invoices i ON p.invoice_id = i.id
            WHERE je.reference_type = 'payment' AND i.contract_id = contract_id_param
        );
        
        -- حذف الرسوم الإضافية
        WITH deleted_charges AS (
            DELETE FROM public.additional_charges 
            WHERE contract_id = contract_id_param 
            RETURNING id
        )
        SELECT COUNT(*) INTO deleted_records FROM deleted_charges;
        
        -- حذف الحوادث
        DELETE FROM public.contract_incidents WHERE contract_id = contract_id_param;
        
        -- حذف التمديدات
        DELETE FROM public.contract_extensions WHERE contract_id = contract_id_param;
        
        -- حذف التقييمات
        DELETE FROM public.customer_evaluations WHERE contract_id = contract_id_param;
        
        -- حذف المدفوعات والفواتير
        DELETE FROM public.payments 
        WHERE invoice_id IN (
            SELECT id FROM public.invoices WHERE contract_id = contract_id_param
        );
        
        DELETE FROM public.invoices WHERE contract_id = contract_id_param;
    END IF;
    
    -- حذف العقد نفسه
    DELETE FROM public.contracts WHERE id = contract_id_param;
    
    -- تسجيل عملية الحذف
    INSERT INTO public.contract_deletion_log (
        contract_id, contract_number, deleted_by, deletion_type, 
        deletion_reason, related_records_deleted
    ) VALUES (
        contract_id_param, contract_number_val, auth.uid(), 'cascade',
        'تنظيف شامل للعقد والقيود المحاسبية المرتبطة', deleted_records
    );
    
    RETURN jsonb_build_object(
        'contract_number', contract_number_val,
        'deleted_related_records', delete_related,
        'action', 'deleted'
    );
END;
$$;

-- 2. دالة تنظيف القيود المحاسبية المعلقة
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_journal_entries()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphaned_count INTEGER := 0;
    cleanup_results JSONB := '[]';
    orphaned_entry RECORD;
BEGIN
    -- البحث عن القيود المعلقة (بدون مرجع صحيح)
    FOR orphaned_entry IN (
        SELECT je.id, je.entry_number, je.reference_type, je.reference_id, je.total_debit
        FROM public.journal_entries je
        WHERE je.status = 'posted'
        AND (
            (je.reference_type = 'invoice' AND NOT EXISTS (
                SELECT 1 FROM public.invoices WHERE id = je.reference_id
            ))
            OR
            (je.reference_type = 'payment' AND NOT EXISTS (
                SELECT 1 FROM public.payments WHERE id = je.reference_id
            ))
            OR
            (je.reference_type = 'contract' AND NOT EXISTS (
                SELECT 1 FROM public.contracts WHERE id = je.reference_id
            ))
        )
    ) LOOP
        -- حذف سطور القيد أولاً
        DELETE FROM public.journal_entry_lines 
        WHERE journal_entry_id = orphaned_entry.id;
        
        -- حذف القيد نفسه
        DELETE FROM public.journal_entries 
        WHERE id = orphaned_entry.id;
        
        orphaned_count := orphaned_count + 1;
        
        -- إضافة للتقرير
        cleanup_results := cleanup_results || jsonb_build_object(
            'entry_number', orphaned_entry.entry_number,
            'reference_type', orphaned_entry.reference_type,
            'amount', orphaned_entry.total_debit,
            'status', 'deleted'
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'total_cleaned', orphaned_count,
        'details', cleanup_results,
        'cleaned_at', now()
    );
END;
$$;

-- 3. دالة تصحيح رصيد حساب معين
CREATE OR REPLACE FUNCTION public.correct_account_balance(
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
    AND je.status = 'posted';
    
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
        'old_balance', old_balance,
        'new_balance', new_balance,
        'correction_amount', new_balance - old_balance,
        'total_debits', total_debits,
        'total_credits', total_credits,
        'corrected_at', now()
    );
END;
$$;

-- 4. دالة منع تكرار أرقام الفواتير
CREATE OR REPLACE FUNCTION public.prevent_duplicate_invoice_numbers()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- التحقق من عدم وجود رقم فاتورة مكرر
    IF EXISTS (
        SELECT 1 FROM public.invoices 
        WHERE invoice_number = NEW.invoice_number 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'رقم الفاتورة % موجود مسبقاً', NEW.invoice_number;
    END IF;
    
    RETURN NEW;
END;
$$;

-- إنشاء المثير لمنع تكرار أرقام الفواتير
DROP TRIGGER IF EXISTS prevent_duplicate_invoice_numbers_trigger ON public.invoices;
CREATE TRIGGER prevent_duplicate_invoice_numbers_trigger
    BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_duplicate_invoice_numbers();

-- 5. دالة تقرير التدقيق للقيود المعلقة
CREATE OR REPLACE FUNCTION public.audit_orphaned_entries()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    audit_results JSONB := '[]';
    entry_record RECORD;
    total_amount NUMERIC := 0;
BEGIN
    -- البحث عن القيود المعلقة وإنشاء تقرير
    FOR entry_record IN (
        SELECT 
            je.id,
            je.entry_number,
            je.reference_type,
            je.reference_id,
            je.total_debit,
            je.description,
            je.entry_date,
            CASE 
                WHEN je.reference_type = 'invoice' THEN 
                    CASE WHEN EXISTS(SELECT 1 FROM public.invoices WHERE id = je.reference_id) 
                         THEN 'valid' ELSE 'orphaned' END
                WHEN je.reference_type = 'payment' THEN 
                    CASE WHEN EXISTS(SELECT 1 FROM public.payments WHERE id = je.reference_id) 
                         THEN 'valid' ELSE 'orphaned' END
                WHEN je.reference_type = 'contract' THEN 
                    CASE WHEN EXISTS(SELECT 1 FROM public.contracts WHERE id = je.reference_id) 
                         THEN 'valid' ELSE 'orphaned' END
                ELSE 'unknown'
            END as status
        FROM public.journal_entries je
        WHERE je.status = 'posted'
        ORDER BY je.entry_date DESC
    ) LOOP
        IF entry_record.status = 'orphaned' THEN
            total_amount := total_amount + entry_record.total_debit;
        END IF;
        
        audit_results := audit_results || jsonb_build_object(
            'entry_number', entry_record.entry_number,
            'reference_type', entry_record.reference_type,
            'reference_id', entry_record.reference_id,
            'amount', entry_record.total_debit,
            'description', entry_record.description,
            'entry_date', entry_record.entry_date,
            'status', entry_record.status
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'total_orphaned_amount', total_amount,
        'audit_date', now(),
        'entries', audit_results
    );
END;
$$;

-- 6. دالة الصيانة الدورية
CREATE OR REPLACE FUNCTION public.periodic_accounting_maintenance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    maintenance_results JSONB := '{}';
    cleanup_result JSONB;
    balance_update_result JSONB;
BEGIN
    -- 1. تنظيف القيود المعلقة
    SELECT public.cleanup_orphaned_journal_entries() INTO cleanup_result;
    
    -- 2. تحديث أرصدة الحسابات
    SELECT public.update_account_balances() INTO balance_update_result;
    
    -- 3. تصحيح رصيد حساب العملاء المدينون
    DECLARE
        account_1130_result JSONB;
    BEGIN
        SELECT public.correct_account_balance('1130') INTO account_1130_result;
        maintenance_results := maintenance_results || jsonb_build_object(
            'account_1130_correction', account_1130_result
        );
    EXCEPTION WHEN OTHERS THEN
        maintenance_results := maintenance_results || jsonb_build_object(
            'account_1130_correction', jsonb_build_object('error', SQLERRM)
        );
    END;
    
    -- تجميع النتائج
    maintenance_results := maintenance_results || jsonb_build_object(
        'orphaned_cleanup', cleanup_result,
        'balance_updates', balance_update_result,
        'maintenance_date', now()
    );
    
    RETURN maintenance_results;
END;
$$;