-- حذف الترايجر أولاً
DROP TRIGGER IF EXISTS update_account_balances_trigger ON public.journal_entry_lines;

-- حذف الدالة الموجودة
DROP FUNCTION IF EXISTS public.update_account_balances() CASCADE;

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

-- إنشاء دالة لحساب المؤشرات المالية من القيود
CREATE OR REPLACE FUNCTION public.calculate_financial_metrics(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    monthly_revenue NUMERIC := 0;
    total_expenses NUMERIC := 0;
    pending_payments NUMERIC := 0;
    actual_revenue NUMERIC := 0;
    cash_balance NUMERIC := 0;
    net_profit NUMERIC := 0;
    result_metrics jsonb;
BEGIN
    -- تعيين التواريخ الافتراضية للشهر الحالي
    IF start_date IS NULL THEN
        start_date := date_trunc('month', CURRENT_DATE);
    END IF;
    
    IF end_date IS NULL THEN
        end_date := date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day';
    END IF;
    
    -- حساب الإيرادات الفعلية من حسابات الإيرادات
    SELECT COALESCE(SUM(current_balance), 0) INTO monthly_revenue
    FROM public.chart_of_accounts
    WHERE account_type = 'revenue' 
    AND is_active = true;
    
    -- حساب إجمالي المصروفات
    SELECT COALESCE(SUM(current_balance), 0) INTO total_expenses
    FROM public.chart_of_accounts
    WHERE account_type = 'expense' 
    AND is_active = true;
    
    -- حساب المدفوعات المعلقة من الفواتير
    SELECT COALESCE(SUM(outstanding_amount), 0) INTO pending_payments
    FROM public.invoices
    WHERE status IN ('sent', 'overdue');
    
    -- حساب رصيد النقدية
    SELECT COALESCE(SUM(current_balance), 0) INTO cash_balance
    FROM public.chart_of_accounts
    WHERE account_type = 'asset' 
    AND account_category = 'current_asset'
    AND (account_name ILIKE '%نقدية%' OR account_name ILIKE '%صندوق%' OR account_name ILIKE '%cash%')
    AND is_active = true;
    
    -- حساب الإيرادات الفعلية من المدفوعات المكتملة في الفترة
    SELECT COALESCE(SUM(p.amount), 0) INTO actual_revenue
    FROM public.payments p
    WHERE p.status = 'completed'
    AND p.payment_date BETWEEN start_date AND end_date;
    
    -- حساب صافي الربح
    net_profit := monthly_revenue - total_expenses;
    
    result_metrics := jsonb_build_object(
        'monthly_revenue', monthly_revenue,
        'actual_revenue', actual_revenue,
        'total_expenses', total_expenses,
        'pending_payments', pending_payments,
        'cash_balance', cash_balance,
        'net_profit', net_profit,
        'calculation_period', jsonb_build_object(
            'start_date', start_date,
            'end_date', end_date
        ),
        'calculated_at', now()
    );
    
    RETURN result_metrics;
END;
$$;