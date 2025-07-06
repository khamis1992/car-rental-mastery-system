-- إنشاء دالة لإنشاء قيد مديونية الفاتورة (بدون إيراد)
CREATE OR REPLACE FUNCTION public.create_invoice_receivable_entry(
    invoice_id UUID,
    invoice_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    customer_name TEXT;
    invoice_number TEXT;
    total_amount NUMERIC;
    tax_amount NUMERIC;
    
    -- معرفات الحسابات
    receivable_account UUID;
    tax_payable_account UUID;
BEGIN
    -- استخراج البيانات
    customer_name := invoice_data->>'customer_name';
    invoice_number := invoice_data->>'invoice_number';
    total_amount := (invoice_data->>'total_amount')::NUMERIC;
    tax_amount := COALESCE((invoice_data->>'tax_amount')::NUMERIC, 0);
    
    -- الحصول على معرفات الحسابات
    SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130';
    SELECT id INTO tax_payable_account FROM public.chart_of_accounts WHERE account_code = '2140';
    
    -- التحقق من وجود الحسابات المطلوبة
    IF receivable_account IS NULL THEN
        RAISE EXCEPTION 'حساب العملاء المدينون (1130) غير موجود';
    END IF;
    
    -- توليد رقم القيد
    journal_entry_number := public.generate_journal_entry_number();
    
    -- إنشاء القيد المحاسبي (مديونية فقط)
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
        'مديونية فاتورة - ' || invoice_number || ' - ' || customer_name,
        'invoice',
        invoice_id,
        total_amount,
        total_amount,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد
    -- العملاء المدينون (مدين)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, receivable_account, 'مديونية فاتورة - ' || invoice_number || ' - ' || customer_name, total_amount - tax_amount, 0, 1
    );
    
    -- الضرائب المستحقة (دائن) - إذا كانت موجودة
    IF tax_amount > 0 AND tax_payable_account IS NOT NULL THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, tax_payable_account, 'ضرائب مستحقة - فاتورة ' || invoice_number, 0, tax_amount, 2
        );
    END IF;
    
    RETURN journal_entry_id;
END;
$$;

-- إنشاء دالة لإنشاء قيد إيراد الدفعة (تسجيل الإيراد عند الدفع)
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
    
    -- إنشاء القيد المحاسبي (تسجيل الإيراد عند الدفع)
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
        'إيراد من دفعة - ' || invoice_number || ' - ' || customer_name,
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
        journal_entry_id, cash_account, 'تحصيل نقدي - ' || invoice_number || ' - ' || customer_name, payment_amount, 0, 1
    );
    
    -- تقليل المديونية (دائن)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, receivable_account, 'تخفيض مديونية - ' || invoice_number || ' - ' || customer_name, 0, payment_amount, 2
    );
    
    -- لا نسجل الإيراد هنا لأن الهدف هو تسجيل الإيراد فقط عند الدفع النهائي
    -- سنضيف الإيراد في تحديث منفصل
    
    RETURN journal_entry_id;
END;
$$;