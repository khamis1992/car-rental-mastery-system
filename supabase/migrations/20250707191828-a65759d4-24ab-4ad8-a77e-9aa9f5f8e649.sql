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
                'old_balance', COALESCE((
                    SELECT current_balance 
                    FROM chart_of_accounts 
                    WHERE id = account_record.id
                ), 0),
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

-- إنشاء دالة لإنشاء القيود المحاسبية للمدفوعات المفقودة
CREATE OR REPLACE FUNCTION public.create_payment_accounting_entry(
    payment_id UUID,
    payment_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    customer_name TEXT;
    invoice_number TEXT;
    payment_amount NUMERIC;
    payment_method TEXT;
    payment_date TEXT;
    
    -- معرفات الحسابات
    cash_account UUID;
    revenue_account UUID;
    receivable_account UUID;
BEGIN
    -- استخراج البيانات
    customer_name := payment_data->>'customer_name';
    invoice_number := payment_data->>'invoice_number';
    payment_amount := (payment_data->>'payment_amount')::NUMERIC;
    payment_method := payment_data->>'payment_method';
    payment_date := payment_data->>'payment_date';
    
    -- الحصول على معرفات الحسابات
    SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130';
    SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '4110';
    
    -- اختيار حساب النقدية المناسب حسب طريقة الدفع
    IF payment_method = 'bank_transfer' THEN
        SELECT id INTO cash_account 
        FROM public.chart_of_accounts 
        WHERE account_code LIKE '1120%' 
        AND is_active = true 
        ORDER BY account_code 
        LIMIT 1;
    ELSE
        SELECT id INTO cash_account FROM public.chart_of_accounts WHERE account_code = '1110';
    END IF;
    
    -- التحقق من وجود الحسابات المطلوبة
    IF receivable_account IS NULL THEN
        RAISE EXCEPTION 'حساب العملاء المدينون (1130) غير موجود';
    END IF;
    
    IF revenue_account IS NULL THEN
        RAISE EXCEPTION 'حساب إيرادات التأجير (4110) غير موجود';
    END IF;
    
    IF cash_account IS NULL THEN
        RAISE EXCEPTION 'لا يوجد حساب نقدية متاح';
    END IF;
    
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
        payment_date::DATE,
        'تحصيل دفعة - ' || invoice_number || ' - ' || customer_name,
        'payment',
        payment_id,
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
        journal_entry_id, cash_account, 'تحصيل نقدي - ' || invoice_number, payment_amount, 0, 1
    );
    
    -- الإيراد (دائن)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, revenue_account, 'إيراد تأجير - ' || invoice_number, 0, payment_amount, 2
    );
    
    -- تحديث جدول المدفوعات بمعرف القيد
    UPDATE public.payments 
    SET journal_entry_id = journal_entry_id 
    WHERE id = payment_id;
    
    RETURN journal_entry_id;
END;
$$;

-- إنشاء ترايجر لتحديث الأرصدة تلقائياً
CREATE OR REPLACE FUNCTION public.update_account_balance_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    account_record RECORD;
    new_balance NUMERIC;
BEGIN
    -- إذا كان هناك تغيير في سطور القيود
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        -- الحصول على معرفات الحسابات المتأثرة
        DECLARE
            affected_accounts UUID[];
        BEGIN
            IF TG_OP = 'DELETE' THEN
                affected_accounts := ARRAY[OLD.account_id];
            ELSIF TG_OP = 'INSERT' THEN
                affected_accounts := ARRAY[NEW.account_id];
            ELSE -- UPDATE
                affected_accounts := ARRAY[NEW.account_id, OLD.account_id];
            END IF;
            
            -- تحديث كل حساب متأثر
            FOR account_record IN (
                SELECT DISTINCT
                    coa.id,
                    coa.account_type,
                    coa.opening_balance,
                    COALESCE(SUM(jel.debit_amount), 0) as total_debits,
                    COALESCE(SUM(jel.credit_amount), 0) as total_credits
                FROM public.chart_of_accounts coa
                LEFT JOIN public.journal_entry_lines jel ON coa.id = jel.account_id
                LEFT JOIN public.journal_entries je ON jel.journal_entry_id = je.id
                WHERE coa.id = ANY(affected_accounts)
                AND (je.status = 'posted' OR je.status IS NULL)
                GROUP BY coa.id, coa.account_type, coa.opening_balance
            ) LOOP
                -- حساب الرصيد الجديد
                CASE account_record.account_type
                    WHEN 'asset', 'expense' THEN
                        new_balance := account_record.opening_balance + account_record.total_debits - account_record.total_credits;
                    WHEN 'liability', 'equity', 'revenue' THEN
                        new_balance := account_record.opening_balance + account_record.total_credits - account_record.total_debits;
                    ELSE
                        new_balance := account_record.opening_balance;
                END CASE;
                
                -- تحديث الرصيد
                UPDATE public.chart_of_accounts 
                SET 
                    current_balance = new_balance,
                    updated_at = now()
                WHERE id = account_record.id;
            END LOOP;
        END;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء الترايجر
DROP TRIGGER IF EXISTS trigger_update_account_balances ON public.journal_entry_lines;
CREATE TRIGGER trigger_update_account_balances
    AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION public.update_account_balance_trigger();