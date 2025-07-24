-- ===============================================
-- Master Migration 003: Comprehensive Accounting Functions
-- تم دمج جميع الدوال المحاسبية والمالية
-- ===============================================

-- دالة log_transaction المدمجة والشاملة
CREATE OR REPLACE FUNCTION public.log_transaction(
    transaction_data JSONB
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_id UUID;
    current_tenant_id UUID;
    debit_account_id UUID;
    credit_account_id UUID;
    journal_entry_id UUID;
    entry_number TEXT;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية';
    END IF;
    
    -- توليد رقم القيد
    entry_number := public.generate_journal_entry_number();
    
    -- الحصول على معرفات الحسابات
    SELECT id INTO debit_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id 
    AND account_code = (transaction_data->>'debit_account_code');
    
    SELECT id INTO credit_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id 
    AND account_code = (transaction_data->>'credit_account_code');
    
    IF debit_account_id IS NULL OR credit_account_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن العثور على الحسابات المحاسبية المطلوبة';
    END IF;
    
    -- إنشاء القيد المحاسبي
    INSERT INTO public.journal_entries (
        tenant_id,
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
        current_tenant_id,
        entry_number,
        COALESCE((transaction_data->>'transaction_date')::DATE, CURRENT_DATE),
        transaction_data->>'description',
        transaction_data->>'reference_type',
        (transaction_data->>'reference_id')::UUID,
        (transaction_data->>'amount')::NUMERIC,
        (transaction_data->>'amount')::NUMERIC,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد
    INSERT INTO public.journal_entry_lines (
        tenant_id,
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount,
        line_number
    ) VALUES 
    (current_tenant_id, journal_entry_id, debit_account_id, transaction_data->>'description', (transaction_data->>'amount')::NUMERIC, 0, 1),
    (current_tenant_id, journal_entry_id, credit_account_id, transaction_data->>'description', 0, (transaction_data->>'amount')::NUMERIC, 2);
    
    -- تحديث أرصدة الحسابات
    PERFORM public.update_account_balances(journal_entry_id);
    
    RETURN journal_entry_id;
END;
$$;

-- دالة توليد أرقام القيود
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    next_number INTEGER;
    entry_number TEXT;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرقم التالي
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id
    AND entry_number ~ '^JE-[0-9]+$';
    
    entry_number := 'JE-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN entry_number;
END;
$$;

-- دالة قيود العقود
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(
    contract_data JSONB
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    journal_entry_id UUID;
    transaction_data JSONB;
BEGIN
    transaction_data := jsonb_build_object(
        'description', 'قيد عقد تأجير رقم: ' || (contract_data->>'contract_number'),
        'amount', contract_data->>'total_amount',
        'debit_account_code', '1121', -- ذمم العملاء
        'credit_account_code', '411', -- إيرادات التأجير
        'reference_type', 'contract',
        'reference_id', contract_data->>'contract_id',
        'transaction_date', contract_data->>'start_date'
    );
    
    SELECT public.log_transaction(transaction_data) INTO journal_entry_id;
    
    RETURN journal_entry_id;
END;
$$;

-- دالة قيود المدفوعات
CREATE OR REPLACE FUNCTION public.create_payment_accounting_entry(
    payment_data JSONB
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    journal_entry_id UUID;
    transaction_data JSONB;
BEGIN
    transaction_data := jsonb_build_object(
        'description', 'دفعة من العميل: ' || (payment_data->>'customer_name'),
        'amount', payment_data->>'amount',
        'debit_account_code', CASE 
            WHEN payment_data->>'payment_method' = 'cash' THEN '1111' -- الصندوق
            WHEN payment_data->>'payment_method' = 'bank' THEN '11121' -- البنك
            ELSE '1111'
        END,
        'credit_account_code', '1121', -- ذمم العملاء
        'reference_type', 'payment',
        'reference_id', payment_data->>'payment_id',
        'transaction_date', payment_data->>'payment_date'
    );
    
    SELECT public.log_transaction(transaction_data) INTO journal_entry_id;
    
    RETURN journal_entry_id;
END;
$$;

-- دالة قيود الحضور والانصراف
CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(
    attendance_data JSONB
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    journal_entry_id UUID;
    transaction_data JSONB;
    total_cost NUMERIC;
    employee_name TEXT;
BEGIN
    total_cost := (attendance_data->>'total_hours')::NUMERIC * (attendance_data->>'hourly_rate')::NUMERIC;
    employee_name := attendance_data->>'employee_name';
    
    transaction_data := jsonb_build_object(
        'description', 'تكلفة عمالة يومية - ' || employee_name || ' - ' || (attendance_data->>'date'),
        'amount', total_cost,
        'debit_account_code', '5111', -- رواتب الموظفين
        'credit_account_code', '212', -- المصروفات المستحقة
        'reference_type', 'attendance',
        'reference_id', attendance_data->>'attendance_id',
        'transaction_date', attendance_data->>'date'
    );
    
    SELECT public.log_transaction(transaction_data) INTO journal_entry_id;
    
    RETURN journal_entry_id;
END;
$$;

-- دالة تحديث أرصدة الحسابات
CREATE OR REPLACE FUNCTION public.update_account_balances(
    journal_entry_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    line_record RECORD;
    account_info RECORD;
BEGIN
    -- تحديث أرصدة الحسابات لكل سطر في القيد
    FOR line_record IN (
        SELECT account_id, debit_amount, credit_amount
        FROM public.journal_entry_lines
        WHERE journal_entry_id = journal_entry_id_param
    ) LOOP
        
        -- الحصول على معلومات الحساب
        SELECT account_type INTO account_info
        FROM public.chart_of_accounts
        WHERE id = line_record.account_id;
        
        -- تحديث الرصيد حسب نوع الحساب
        IF account_info.account_type IN ('asset', 'expense') THEN
            -- الأصول والمصروفات: المدين يزيد والدائن ينقص
            UPDATE public.chart_of_accounts
            SET current_balance = current_balance + line_record.debit_amount - line_record.credit_amount,
                updated_at = now()
            WHERE id = line_record.account_id;
        ELSE
            -- الخصوم وحقوق الملكية والإيرادات: الدائن يزيد والمدين ينقص
            UPDATE public.chart_of_accounts
            SET current_balance = current_balance + line_record.credit_amount - line_record.debit_amount,
                updated_at = now()
            WHERE id = line_record.account_id;
        END IF;
    END LOOP;
END;
$$;

-- دالة إعداد دليل الحسابات الشامل
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(
    tenant_id_param UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- استدعاء دالة إنشاء دليل الحسابات الصحيح
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    RETURN inserted_count;
END;
$$;

-- دالة إكمال الخصوم وحقوق الملكية والإيرادات والمصروفات
CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(
    tenant_id_param UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    additional_count INTEGER := 0;
BEGIN
    -- إضافة حسابات متخصصة لتأجير السيارات
    SELECT public.add_specialized_rental_accounts(tenant_id_param) INTO additional_count;
    
    RETURN additional_count;
END;
$$;

-- دالة إعداد البيانات المحاسبية الافتراضية للمؤسسة
CREATE OR REPLACE FUNCTION public.setup_tenant_default_accounting_data(
    tenant_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    accounts_count INTEGER;
    cost_centers_count INTEGER;
    branding_count INTEGER;
BEGIN
    -- نسخ دليل الحسابات
    SELECT public.copy_default_chart_of_accounts(tenant_id_param) INTO accounts_count;
    
    -- نسخ مراكز التكلفة
    SELECT public.copy_default_cost_centers(tenant_id_param) INTO cost_centers_count;
    
    -- نسخ العلامة التجارية
    SELECT public.copy_default_company_branding(tenant_id_param) INTO branding_count;
    
    RAISE NOTICE 'تم إعداد البيانات المحاسبية: % حساب، % مركز تكلفة، % علامة تجارية', 
                 accounts_count, cost_centers_count, branding_count;
END;
$$;

-- دالة فحص حالة الفترة المالية
CREATE OR REPLACE FUNCTION public.check_period_status(
    check_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    period_info RECORD;
    result JSONB;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المالية
    SELECT * INTO period_info
    FROM public.accounting_periods
    WHERE tenant_id = current_tenant_id
    AND start_date <= check_date
    AND end_date >= check_date
    ORDER BY start_date DESC
    LIMIT 1;
    
    IF period_info.id IS NULL THEN
        result := jsonb_build_object(
            'can_modify', false,
            'message', 'لا توجد فترة مالية محددة لهذا التاريخ',
            'period_id', null
        );
    ELSIF period_info.status = 'closed' THEN
        result := jsonb_build_object(
            'can_modify', false,
            'message', 'الفترة المالية مقفلة',
            'period_id', period_info.id
        );
    ELSE
        result := jsonb_build_object(
            'can_modify', true,
            'message', 'الفترة المالية مفتوحة ومتاحة للتعديل',
            'period_id', period_info.id
        );
    END IF;
    
    RETURN result;
END;
$$;

-- تعليق على اكتمال الدوال المحاسبية
COMMENT ON FUNCTION public.log_transaction(JSONB) IS 'دالة شاملة لتسجيل المعاملات المحاسبية';
COMMENT ON FUNCTION public.generate_journal_entry_number() IS 'دالة توليد أرقام القيود المحاسبية';
COMMENT ON FUNCTION public.create_contract_accounting_entry(JSONB) IS 'دالة إنشاء قيود العقود';
COMMENT ON FUNCTION public.create_payment_accounting_entry(JSONB) IS 'دالة إنشاء قيود المدفوعات';