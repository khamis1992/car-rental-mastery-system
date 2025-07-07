-- حذف الدالة الموجودة أولاً
DROP FUNCTION IF EXISTS public.update_account_balances();

-- إنشاء دالة لحساب الأرصدة من القيود المحاسبية
CREATE OR REPLACE FUNCTION public.update_account_balances()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    account_record RECORD;
    updated_count INTEGER := 0;
    result_summary jsonb := '[]'::jsonb;
BEGIN
    -- تحديث أرصدة جميع الحسابات
    FOR account_record IN (
        SELECT 
            coa.id,
            coa.account_code,
            coa.account_name,
            coa.account_type,
            coa.opening_balance,
            COALESCE(SUM(jel.debit_amount), 0) as total_debits,
            COALESCE(SUM(jel.credit_amount), 0) as total_credits
        FROM public.chart_of_accounts coa
        LEFT JOIN public.journal_entry_lines jel ON coa.id = jel.account_id
        LEFT JOIN public.journal_entries je ON jel.journal_entry_id = je.id
        WHERE je.status = 'posted' OR je.status IS NULL
        GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.opening_balance
    ) LOOP
        
        DECLARE
            new_balance NUMERIC;
        BEGIN
            -- حساب الرصيد الجديد حسب نوع الحساب
            CASE account_record.account_type
                WHEN 'asset', 'expense' THEN
                    -- الأصول والمصروفات: المدين موجب والدائن سالب
                    new_balance := account_record.opening_balance + account_record.total_debits - account_record.total_credits;
                WHEN 'liability', 'equity', 'revenue' THEN
                    -- الخصوم وحقوق الملكية والإيرادات: الدائن موجب والمدين سالب
                    new_balance := account_record.opening_balance + account_record.total_credits - account_record.total_debits;
                ELSE
                    new_balance := account_record.opening_balance;
            END CASE;
            
            -- تحديث الرصيد في الجدول
            UPDATE public.chart_of_accounts 
            SET 
                current_balance = new_balance,
                updated_at = now()
            WHERE id = account_record.id;
            
            updated_count := updated_count + 1;
            
            -- إضافة معلومات التحديث للتقرير
            result_summary := result_summary || jsonb_build_object(
                'account_code', account_record.account_code,
                'account_name', account_record.account_name,
                'old_balance', 0,
                'new_balance', new_balance,
                'total_debits', account_record.total_debits,
                'total_credits', account_record.total_credits
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'updated_accounts', updated_count,
        'updated_at', now(),
        'details', result_summary
    );
END;
$$;