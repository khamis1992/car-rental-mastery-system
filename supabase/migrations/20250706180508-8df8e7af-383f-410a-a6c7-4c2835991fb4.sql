-- إصلاح البيانات الموجودة - تحويل القيود القديمة إلى نظام الإيرادات المؤجلة
CREATE OR REPLACE FUNCTION public.fix_existing_contract_accounting()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    contract_entry RECORD;
    revenue_account UUID;
    deferred_revenue_account UUID;
    fixed_count INTEGER := 0;
    error_count INTEGER := 0;
    results JSONB := '[]'::jsonb;
    result_item JSONB;
BEGIN
    -- الحصول على معرفات الحسابات
    SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '4110';
    SELECT id INTO deferred_revenue_account FROM public.chart_of_accounts WHERE account_code = '2131';
    
    -- التحقق من وجود الحسابات المطلوبة
    IF revenue_account IS NULL THEN
        RAISE EXCEPTION 'حساب إيرادات التأجير (4110) غير موجود';
    END IF;
    
    IF deferred_revenue_account IS NULL THEN
        RAISE EXCEPTION 'حساب الإيرادات المؤجلة (2131) غير موجود';
    END IF;
    
    -- البحث عن العقود التي لديها قيود بإيراد مباشر بدلاً من إيراد مؤجل
    FOR contract_entry IN (
        SELECT DISTINCT
            c.id as contract_id,
            c.contract_number,
            je.id as journal_entry_id,
            jel.credit_amount as revenue_amount
        FROM public.contracts c
        JOIN public.journal_entries je ON c.journal_entry_id = je.id
        JOIN public.journal_entry_lines jel ON je.id = jel.journal_entry_id
        WHERE je.reference_type = 'contract'
        AND jel.account_id = revenue_account  -- القيود التي تستخدم حساب الإيراد المباشر
        AND jel.credit_amount > 0
        AND je.status = 'posted'
        -- التأكد من عدم وجود قيد للإيرادات المؤجلة بالفعل
        AND NOT EXISTS (
            SELECT 1 FROM public.journal_entry_lines jel2 
            WHERE jel2.journal_entry_id = je.id 
            AND jel2.account_id = deferred_revenue_account
        )
    ) LOOP
        BEGIN
            -- تحديث سطر القيد من الإيراد المباشر إلى الإيراد المؤجل
            UPDATE public.journal_entry_lines 
            SET account_id = deferred_revenue_account,
                description = REPLACE(description, 'إيراد تأجير', 'إيراد مؤجل')
            WHERE journal_entry_id = contract_entry.journal_entry_id
            AND account_id = revenue_account
            AND credit_amount > 0;
            
            -- تحديث وصف القيد الرئيسي
            UPDATE public.journal_entries
            SET description = REPLACE(description, 'قيد عقد إيجار', 'قيد عقد إيجار - إيرادات مؤجلة')
            WHERE id = contract_entry.journal_entry_id;
            
            -- تحديث نوع القيد في جدول الروابط
            UPDATE public.contract_accounting_entries
            SET entry_type = 'deferred_revenue'
            WHERE contract_id = contract_entry.contract_id
            AND journal_entry_id = contract_entry.journal_entry_id;
            
            fixed_count := fixed_count + 1;
            
            result_item := jsonb_build_object(
                'contract_id', contract_entry.contract_id,
                'contract_number', contract_entry.contract_number,
                'journal_entry_id', contract_entry.journal_entry_id,
                'revenue_amount', contract_entry.revenue_amount,
                'status', 'fixed'
            );
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            
            result_item := jsonb_build_object(
                'contract_id', contract_entry.contract_id,
                'contract_number', contract_entry.contract_number,
                'journal_entry_id', contract_entry.journal_entry_id,
                'status', 'error',
                'error_message', SQLERRM
            );
        END;
        
        results := results || result_item;
    END LOOP;
    
    RETURN jsonb_build_object(
        'fixed_count', fixed_count,
        'error_count', error_count,
        'total_processed', fixed_count + error_count,
        'results', results
    );
END;
$$;