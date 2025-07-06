-- إنشاء دالة لتنظيف الإيرادات المزدوجة وتحويل النظام للنهج الجديد
CREATE OR REPLACE FUNCTION public.migrate_to_deferred_revenue_system()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invoice_record RECORD;
    processed_count INTEGER := 0;
    migrated_count INTEGER := 0;
    error_count INTEGER := 0;
    results JSONB := '[]'::jsonb;
    result_item JSONB;
    deferred_revenue_account UUID;
    revenue_account UUID;
BEGIN
    -- الحصول على معرفات الحسابات
    SELECT id INTO deferred_revenue_account FROM public.chart_of_accounts WHERE account_code = '2131';
    SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '4110';
    
    -- التحقق من وجود الحسابات المطلوبة
    IF deferred_revenue_account IS NULL THEN
        RAISE EXCEPTION 'حساب الإيرادات المؤجلة (2131) غير موجود - يجب إنشاؤه أولاً';
    END IF;
    
    -- معالجة الفواتير التي لها قيود محاسبية بإيرادات مباشرة
    FOR invoice_record IN (
        SELECT 
            i.id as invoice_id,
            i.invoice_number,
            i.total_amount,
            je.id as journal_entry_id
        FROM public.invoices i
        JOIN public.journal_entries je ON je.reference_id = i.id AND je.reference_type = 'invoice'
        WHERE je.status = 'posted'
        AND EXISTS (
            SELECT 1 FROM public.journal_entry_lines jel
            JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
            WHERE jel.journal_entry_id = je.id 
            AND coa.account_code = '4110' -- إيرادات التأجير
            AND jel.credit_amount > 0
        )
    ) LOOP
        BEGIN
            processed_count := processed_count + 1;
            
            -- تحديث سطر الإيراد ليصبح إيراد مؤجل بدلاً من إيراد مباشر
            UPDATE public.journal_entry_lines 
            SET 
                account_id = deferred_revenue_account,
                description = REPLACE(description, 'إيراد', 'إيراد مؤجل')
            WHERE journal_entry_id = invoice_record.journal_entry_id
            AND account_id = revenue_account
            AND credit_amount > 0;
            
            -- تحديث وصف القيد المحاسبي
            UPDATE public.journal_entries
            SET description = REPLACE(description, 'إيراد', 'إيراد مؤجل')
            WHERE id = invoice_record.journal_entry_id;
            
            migrated_count := migrated_count + 1;
            
            result_item := jsonb_build_object(
                'invoice_id', invoice_record.invoice_id,
                'invoice_number', invoice_record.invoice_number,
                'amount', invoice_record.total_amount,
                'status', 'migrated_to_deferred'
            );
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            
            result_item := jsonb_build_object(
                'invoice_id', invoice_record.invoice_id,
                'invoice_number', invoice_record.invoice_number,
                'amount', invoice_record.total_amount,
                'status', 'error',
                'error_message', SQLERRM
            );
        END;
        
        results := results || result_item;
    END LOOP;
    
    -- إضافة تعليق في السجل
    INSERT INTO public.journal_entries (
        entry_number,
        entry_date,
        description,
        reference_type,
        total_debit,
        total_credit,
        status,
        created_by
    ) VALUES (
        'MIGRATION-' || TO_CHAR(now(), 'YYYYMMDD'),
        CURRENT_DATE,
        'تحويل النظام المحاسبي إلى نهج الإيرادات المؤجلة - تم تحويل ' || migrated_count || ' فاتورة',
        'system_migration',
        0,
        0,
        'posted',
        auth.uid()
    );
    
    RETURN jsonb_build_object(
        'processed_count', processed_count,
        'migrated_count', migrated_count,
        'error_count', error_count,
        'results', results,
        'migration_date', now()
    );
END;
$$;