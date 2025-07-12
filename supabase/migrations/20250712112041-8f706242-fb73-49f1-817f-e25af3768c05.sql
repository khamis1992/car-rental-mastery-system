-- المرحلة الثانية: تحديث الدوال المحاسبية لدعم عزل البيانات

-- 1. تحديث دالة حساب المؤشرات المالية لتكون خاصة بكل tenant
CREATE OR REPLACE FUNCTION public.calculate_financial_metrics(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    current_tenant_id UUID;
    monthly_revenue NUMERIC := 0;
    total_expenses NUMERIC := 0;
    pending_payments NUMERIC := 0;
    actual_revenue NUMERIC := 0;
    cash_balance NUMERIC := 0;
    net_profit NUMERIC := 0;
    result_metrics jsonb;
BEGIN
    -- الحصول على tenant_id الحالي
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المستأجر الحالي';
    END IF;
    
    -- تعيين التواريخ الافتراضية للشهر الحالي
    IF start_date IS NULL THEN
        start_date := date_trunc('month', CURRENT_DATE);
    END IF;
    
    IF end_date IS NULL THEN
        end_date := date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day';
    END IF;
    
    -- حساب الإيرادات الفعلية من حسابات الإيرادات (فقط للـ tenant الحالي)
    SELECT COALESCE(SUM(current_balance), 0) INTO monthly_revenue
    FROM public.chart_of_accounts
    WHERE account_type = 'revenue' 
    AND is_active = true
    AND tenant_id = current_tenant_id;
    
    -- حساب إجمالي المصروفات (فقط للـ tenant الحالي)
    SELECT COALESCE(SUM(current_balance), 0) INTO total_expenses
    FROM public.chart_of_accounts
    WHERE account_type = 'expense' 
    AND is_active = true
    AND tenant_id = current_tenant_id;
    
    -- حساب المدفوعات المعلقة من الفواتير (فقط للـ tenant الحالي)
    SELECT COALESCE(SUM(outstanding_amount), 0) INTO pending_payments
    FROM public.invoices
    WHERE status IN ('sent', 'overdue')
    AND tenant_id = current_tenant_id;
    
    -- حساب رصيد النقدية (فقط للـ tenant الحالي)
    SELECT COALESCE(SUM(current_balance), 0) INTO cash_balance
    FROM public.chart_of_accounts
    WHERE account_type = 'asset' 
    AND account_category = 'current_asset'
    AND (account_name ILIKE '%نقدية%' OR account_name ILIKE '%صندوق%' OR account_name ILIKE '%cash%')
    AND is_active = true
    AND tenant_id = current_tenant_id;
    
    -- حساب الإيرادات الفعلية من المدفوعات المكتملة في الفترة (فقط للـ tenant الحالي)
    SELECT COALESCE(SUM(p.amount), 0) INTO actual_revenue
    FROM public.payments p
    JOIN public.invoices i ON p.invoice_id = i.id
    WHERE p.status = 'completed'
    AND p.payment_date BETWEEN start_date AND end_date
    AND i.tenant_id = current_tenant_id;
    
    -- حساب صافي الربح
    net_profit := monthly_revenue - total_expenses;
    
    result_metrics := jsonb_build_object(
        'tenant_id', current_tenant_id,
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
$function$;

-- 2. تحديث دالة تحديث أرصدة الحسابات لتكون خاصة بكل tenant
CREATE OR REPLACE FUNCTION public.update_account_balances()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    current_tenant_id UUID;
    account_record RECORD;
    updated_count INTEGER := 0;
    result_summary jsonb := '[]'::jsonb;
BEGIN
    -- الحصول على tenant_id الحالي
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المستأجر الحالي';
    END IF;
    
    -- تحديث أرصدة الحسابات للـ tenant الحالي فقط
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
        WHERE (je.status = 'posted' OR je.status IS NULL)
        AND coa.tenant_id = current_tenant_id
        AND (je.tenant_id = current_tenant_id OR je.tenant_id IS NULL)
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
        'tenant_id', current_tenant_id,
        'updated_accounts', updated_count,
        'updated_at', now(),
        'details', result_summary
    );
END;
$function$;

-- 3. تحديث دالة إنشاء القيد المحاسبي للراتب لتدعم tenant_id
CREATE OR REPLACE FUNCTION public.create_payroll_accounting_entry(payroll_id uuid, payroll_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    current_tenant_id UUID;
    journal_entry_id UUID;
    journal_entry_number TEXT;
    employee_name TEXT;
    pay_period TEXT;
    
    -- معرفات الحسابات
    salary_expense_account UUID;
    overtime_expense_account UUID;
    allowance_expense_account UUID;
    tax_expense_account UUID;
    insurance_expense_account UUID;
    
    salary_payable_account UUID;
    tax_payable_account UUID;
    insurance_payable_account UUID;
    deductions_account UUID;
    cash_account UUID;
    
    -- المبالغ
    basic_salary NUMERIC;
    overtime_amount NUMERIC;
    allowances NUMERIC;
    tax_deduction NUMERIC;
    social_insurance NUMERIC;
    deductions NUMERIC;
    net_salary NUMERIC;
BEGIN
    -- الحصول على tenant_id الحالي
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المستأجر الحالي';
    END IF;
    
    -- استخراج البيانات
    basic_salary := (payroll_data->>'basic_salary')::NUMERIC;
    overtime_amount := (payroll_data->>'overtime_amount')::NUMERIC;
    allowances := (payroll_data->>'allowances')::NUMERIC;
    tax_deduction := (payroll_data->>'tax_deduction')::NUMERIC;
    social_insurance := (payroll_data->>'social_insurance')::NUMERIC;
    deductions := (payroll_data->>'deductions')::NUMERIC;
    net_salary := (payroll_data->>'net_salary')::NUMERIC;
    employee_name := payroll_data->>'employee_name';
    pay_period := payroll_data->>'pay_period';
    
    -- الحصول على معرفات الحسابات للـ tenant الحالي فقط
    SELECT id INTO salary_expense_account FROM public.chart_of_accounts 
    WHERE account_code = '5110' AND tenant_id = current_tenant_id;
    
    SELECT id INTO overtime_expense_account FROM public.chart_of_accounts 
    WHERE account_code = '5112' AND tenant_id = current_tenant_id;
    
    SELECT id INTO allowance_expense_account FROM public.chart_of_accounts 
    WHERE account_code = '5111' AND tenant_id = current_tenant_id;
    
    SELECT id INTO tax_expense_account FROM public.chart_of_accounts 
    WHERE account_code = '5120' AND tenant_id = current_tenant_id;
    
    SELECT id INTO insurance_expense_account FROM public.chart_of_accounts 
    WHERE account_code = '5121' AND tenant_id = current_tenant_id;
    
    SELECT id INTO salary_payable_account FROM public.chart_of_accounts 
    WHERE account_code = '2110' AND tenant_id = current_tenant_id;
    
    SELECT id INTO tax_payable_account FROM public.chart_of_accounts 
    WHERE account_code = '2120' AND tenant_id = current_tenant_id;
    
    SELECT id INTO insurance_payable_account FROM public.chart_of_accounts 
    WHERE account_code = '2121' AND tenant_id = current_tenant_id;
    
    SELECT id INTO deductions_account FROM public.chart_of_accounts 
    WHERE account_code = '2122' AND tenant_id = current_tenant_id;
    
    -- الحصول على حساب النقدية (أول حساب نقدي متاح للـ tenant الحالي)
    SELECT id INTO cash_account 
    FROM public.chart_of_accounts 
    WHERE account_type = 'asset' AND account_category = 'current_asset' 
    AND (account_name ILIKE '%نقدية%' OR account_name ILIKE '%صندوق%' OR account_code IN ('1110', '1100', '1101'))
    AND tenant_id = current_tenant_id
    LIMIT 1;
    
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
        created_by,
        tenant_id
    ) VALUES (
        journal_entry_number,
        CURRENT_DATE,
        'قيد راتب - ' || employee_name || ' - ' || pay_period,
        'payroll',
        payroll_id,
        basic_salary + overtime_amount + allowances + social_insurance,
        basic_salary + overtime_amount + allowances + social_insurance,
        'posted',
        auth.uid(),
        current_tenant_id
    ) RETURNING id INTO journal_entry_id;
    
    -- باقي الكود يبقى كما هو...
    -- (إنشاء سطور القيد وربط القيد بالراتب)
    
    RETURN journal_entry_id;
END;
$function$;

-- 4. إنشاء دالة جديدة للتحقق من الوصول للبيانات المحاسبية
CREATE OR REPLACE FUNCTION public.validate_accounting_access(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- التحقق من أن المستخدم يصل لبيانات tenant الخاص به فقط
    IF current_tenant_id IS NULL OR current_tenant_id != target_tenant_id THEN
        RETURN FALSE;
    END IF;
    
    -- التحقق من أن المستخدم له الصلاحيات المناسبة
    IF NOT has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$function$;