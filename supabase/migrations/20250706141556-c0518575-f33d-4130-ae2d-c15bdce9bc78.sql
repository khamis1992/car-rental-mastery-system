-- تبسيط دالة إيراد الدفعة - قيد واحد متوازن
CREATE OR REPLACE FUNCTION public.create_payment_revenue_entry(
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
    
    -- إنشاء القيد المحاسبي (تحصيل + إيراد)
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
        'تحصيل وإيراد - ' || invoice_number || ' - ' || customer_name,
        'payment',
        payment_id,
        payment_amount,
        payment_amount,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد
    -- 1. النقدية (مدين) - زيادة النقدية
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, cash_account, 'تحصيل نقدي - ' || invoice_number, payment_amount, 0, 1
    );
    
    -- 2. تقليل المديونية (دائن) - نصف المبلغ
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, receivable_account, 'تخفيض مديونية - ' || invoice_number, 0, payment_amount / 2, 2
    );
    
    -- 3. الإيراد (دائن) - نصف المبلغ
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, revenue_account, 'إيراد محقق - ' || invoice_number, 0, payment_amount / 2, 3
    );
    
    RETURN journal_entry_id;
END;
$$;