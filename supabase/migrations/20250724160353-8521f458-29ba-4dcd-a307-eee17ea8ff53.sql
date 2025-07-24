-- إصلاح الدوال التالية بإضافة SET search_path TO 'public'

-- إصلاح دالة log_transaction
CREATE OR REPLACE FUNCTION public.log_transaction(transaction_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    debit_account_id UUID;
    credit_account_id UUID;
    amount NUMERIC;
    description TEXT;
    reference_type TEXT;
    reference_id UUID;
    tenant_id UUID;
BEGIN
    -- استخراج البيانات من JSONB
    amount := (transaction_data->>'amount')::NUMERIC;
    description := transaction_data->>'description';
    reference_type := transaction_data->>'reference_type';
    reference_id := (transaction_data->>'reference_id')::UUID;
    
    -- الحصول على معرف المؤسسة
    tenant_id := get_current_tenant_id();
    
    -- الحصول على معرفات الحسابات
    debit_account_id := (transaction_data->>'debit_account_id')::UUID;
    credit_account_id := (transaction_data->>'credit_account_id')::UUID;
    
    -- توليد رقم القيد
    journal_entry_number := generate_journal_entry_number();
    
    -- إنشاء القيد الرئيسي
    INSERT INTO journal_entries (
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        status,
        created_by,
        tenant_id
    ) VALUES (
        journal_entry_number,
        CURRENT_DATE,
        description,
        reference_type,
        reference_id,
        amount,
        amount,
        'posted',
        auth.uid(),
        tenant_id
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطر المدين
    INSERT INTO journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount,
        line_number,
        tenant_id
    ) VALUES (
        journal_entry_id,
        debit_account_id,
        description,
        amount,
        0,
        1,
        tenant_id
    );
    
    -- إنشاء سطر الدائن
    INSERT INTO journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount,
        line_number,
        tenant_id
    ) VALUES (
        journal_entry_id,
        credit_account_id,
        description,
        0,
        amount,
        2,
        tenant_id
    );
    
    -- تحديث أرصدة الحسابات
    PERFORM update_account_balances(journal_entry_id);
    
    RETURN journal_entry_id;
END;
$$;

-- إصلاح دالة generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    next_number INTEGER;
    journal_number TEXT;
BEGIN
    -- الحصول على الرقم التالي
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM journal_entries
    WHERE tenant_id = get_current_tenant_id();
    
    -- تكوين رقم القيد
    journal_number := 'JE-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN journal_number;
END;
$$;

-- إصلاح دالة create_contract_accounting_entry
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(contract_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    transaction_entry JSONB;
BEGIN
    -- تحضير بيانات المعاملة
    transaction_entry := jsonb_build_object(
        'amount', contract_data->>'total_amount',
        'description', 'عقد إيجار - ' || (contract_data->>'customer_name'),
        'reference_type', 'contract',
        'reference_id', contract_data->>'contract_id',
        'debit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '1121' AND tenant_id = get_current_tenant_id()),
        'credit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '411' AND tenant_id = get_current_tenant_id())
    );
    
    -- إنشاء القيد المحاسبي
    RETURN log_transaction(transaction_entry);
END;
$$;

-- إصلاح دالة create_attendance_accounting_entry
CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(attendance_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    transaction_entry JSONB;
    employee_name TEXT;
    salary_amount NUMERIC;
BEGIN
    -- استخراج البيانات
    employee_name := attendance_data->>'employee_name';
    salary_amount := (attendance_data->>'daily_salary')::NUMERIC;
    
    -- تحضير بيانات المعاملة
    transaction_entry := jsonb_build_object(
        'amount', salary_amount,
        'description', 'راتب يومي - ' || employee_name,
        'reference_type', 'attendance',
        'reference_id', attendance_data->>'attendance_id',
        'debit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '5111' AND tenant_id = get_current_tenant_id()),
        'credit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '2111' AND tenant_id = get_current_tenant_id())
    );
    
    -- إنشاء القيد المحاسبي
    RETURN log_transaction(transaction_entry);
END;
$$;

-- إصلاح دالة update_account_balances
CREATE OR REPLACE FUNCTION public.update_account_balances(journal_entry_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    line_record RECORD;
BEGIN
    -- تحديث الأرصدة لكل سطر في القيد
    FOR line_record IN
        SELECT jel.account_id, jel.debit_amount, jel.credit_amount, coa.account_type
        FROM journal_entry_lines jel
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE jel.journal_entry_id = journal_entry_id_param
    LOOP
        -- تحديث الرصيد حسب نوع الحساب
        IF line_record.account_type IN ('asset', 'expense') THEN
            -- الأصول والمصروفات تزيد بالمدين وتقل بالدائن
            UPDATE chart_of_accounts 
            SET current_balance = current_balance + line_record.debit_amount - line_record.credit_amount
            WHERE id = line_record.account_id;
        ELSE
            -- الالتزامات وحقوق الملكية والإيرادات تزيد بالدائن وتقل بالمدين
            UPDATE chart_of_accounts 
            SET current_balance = current_balance + line_record.credit_amount - line_record.debit_amount
            WHERE id = line_record.account_id;
        END IF;
    END LOOP;
END;
$$;

-- إصلاح دالة setup_comprehensive_chart_of_accounts
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- استدعاء الدالة الصحيحة لإنشاء دليل الحسابات
    SELECT create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    RETURN inserted_count;
END;
$$;

-- إصلاح دالة complete_liabilities_equity_revenue_expenses
CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إضافة الحسابات المتخصصة
    SELECT add_specialized_rental_accounts(tenant_id_param) INTO inserted_count;
    
    RETURN inserted_count;
END;
$$;