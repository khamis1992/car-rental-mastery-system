-- إنشاء دالة العقد للإيرادات المؤجلة بدلاً من الإيراد المباشر
CREATE OR REPLACE FUNCTION public.create_contract_deferred_revenue_entry(
    contract_id UUID,
    contract_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    customer_name TEXT;
    vehicle_info TEXT;
    
    -- معرفات الحسابات
    receivable_account UUID;
    deferred_revenue_account UUID;
    deposit_account UUID;
    tax_account UUID;
    insurance_account UUID;
    discount_account UUID;
    
    -- المبالغ
    total_amount NUMERIC;
    security_deposit NUMERIC;
    insurance_amount NUMERIC;
    tax_amount NUMERIC;
    discount_amount NUMERIC;
    net_revenue NUMERIC;
BEGIN
    -- استخراج البيانات
    total_amount := (contract_data->>'total_amount')::NUMERIC;
    security_deposit := COALESCE((contract_data->>'security_deposit')::NUMERIC, 0);
    insurance_amount := COALESCE((contract_data->>'insurance_amount')::NUMERIC, 0);
    tax_amount := COALESCE((contract_data->>'tax_amount')::NUMERIC, 0);
    discount_amount := COALESCE((contract_data->>'discount_amount')::NUMERIC, 0);
    customer_name := contract_data->>'customer_name';
    vehicle_info := contract_data->>'vehicle_info';
    
    -- حساب صافي الإيراد
    net_revenue := total_amount - discount_amount;
    
    -- الحصول على معرفات الحسابات
    SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130';
    SELECT id INTO deferred_revenue_account FROM public.chart_of_accounts WHERE account_code = '2131';
    SELECT id INTO deposit_account FROM public.chart_of_accounts WHERE account_code = '2130';
    SELECT id INTO tax_account FROM public.chart_of_accounts WHERE account_code = '2140';
    SELECT id INTO insurance_account FROM public.chart_of_accounts WHERE account_code = '4111';
    SELECT id INTO discount_account FROM public.chart_of_accounts WHERE account_code = '4113';
    
    -- التحقق من وجود الحسابات المطلوبة
    IF receivable_account IS NULL THEN
        RAISE EXCEPTION 'حساب العملاء المدينون (1130) غير موجود';
    END IF;
    
    IF deferred_revenue_account IS NULL THEN
        RAISE EXCEPTION 'حساب الإيرادات المؤجلة (2131) غير موجود';
    END IF;
    
    -- توليد رقم القيد
    journal_entry_number := public.generate_journal_entry_number();
    
    -- إنشاء القيد المحاسبي (مديونية + إيرادات مؤجلة)
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
        'قيد عقد إيجار - إيرادات مؤجلة - ' || customer_name || ' - ' || vehicle_info,
        'contract',
        contract_id,
        net_revenue + security_deposit,
        net_revenue + security_deposit,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد
    -- المدينون (إجمالي المبلغ المستحق)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, receivable_account, 'مديونية عقد إيجار - ' || customer_name, net_revenue, 0, 1
    );
    
    -- الإيرادات المؤجلة (دائن) - بدلاً من الإيراد المباشر
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, deferred_revenue_account, 'إيراد مؤجل - ' || customer_name || ' - ' || vehicle_info, 0, total_amount - tax_amount - insurance_amount, 2
    );
    
    -- العربون (مدين للنقدية إذا تم الاستلام، دائن كالتزام)
    IF security_deposit > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, deposit_account, 'عربون مستلم - ' || customer_name, security_deposit, 0, 3
        );
    END IF;
    
    -- التأمين (دائن)
    IF insurance_amount > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, insurance_account, 'إيراد تأمين - ' || customer_name, 0, insurance_amount, 4
        );
    END IF;
    
    -- الضرائب (دائن)
    IF tax_amount > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, tax_account, 'ضرائب مستحقة - عقد ' || customer_name, 0, tax_amount, 5
        );
    END IF;
    
    -- الخصومات (مدين لتقليل الإيراد)
    IF discount_amount > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, discount_account, 'خصم عقد - ' || customer_name, discount_amount, 0, 6
        );
    END IF;
    
    -- ربط القيد بالعقد
    INSERT INTO public.contract_accounting_entries (
        contract_id, journal_entry_id, entry_type, amount, created_by
    ) VALUES 
        (contract_id, journal_entry_id, 'deferred_revenue', net_revenue, auth.uid());
    
    -- تحديث جدول العقود بمعرف القيد
    UPDATE public.contracts 
    SET journal_entry_id = journal_entry_id 
    WHERE id = contract_id;
    
    RETURN journal_entry_id;
END;
$$;

-- استبدال الدالة القديمة بالجديدة
DROP FUNCTION IF EXISTS public.create_contract_accounting_entry(UUID, JSONB);

-- إعادة تسمية الدالة الجديدة
ALTER FUNCTION public.create_contract_deferred_revenue_entry(UUID, JSONB) 
RENAME TO create_contract_accounting_entry;