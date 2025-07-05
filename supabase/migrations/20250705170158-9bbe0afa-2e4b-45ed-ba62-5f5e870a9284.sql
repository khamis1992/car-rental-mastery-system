-- إضافة جدول ربط الرواتب بالمحاسبة
CREATE TABLE IF NOT EXISTS public.payroll_accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('salary', 'tax', 'insurance', 'allowance', 'deduction')),
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE (payroll_id, journal_entry_id, entry_type)
);

-- إضافة فهرس للبحث السريع
CREATE INDEX idx_payroll_accounting_payroll_id ON public.payroll_accounting_entries(payroll_id);
CREATE INDEX idx_payroll_accounting_journal_id ON public.payroll_accounting_entries(journal_entry_id);

-- إضافة الحسابات المحاسبية المطلوبة للرواتب إذا لم تكن موجودة
INSERT INTO public.chart_of_accounts (account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
VALUES 
    -- حسابات الرواتب والأجور
    ('2110', 'رواتب وأجور مستحقة', 'Accrued Salaries and Wages', 'liability', 'current_liability', 2, true, true, 0, 0),
    ('5110', 'رواتب وأجور', 'Salaries and Wages', 'expense', 'operating_expense', 2, true, true, 0, 0),
    ('5111', 'علاوات ومكافآت', 'Allowances and Bonuses', 'expense', 'operating_expense', 3, true, true, 0, 0),
    ('5112', 'ساعات إضافية', 'Overtime', 'expense', 'operating_expense', 3, true, true, 0, 0),
    
    -- حسابات الضرائب والتأمينات
    ('2120', 'ضرائب مستحقة على الرواتب', 'Accrued Payroll Taxes', 'liability', 'current_liability', 2, true, true, 0, 0),
    ('2121', 'تأمينات اجتماعية مستحقة', 'Accrued Social Insurance', 'liability', 'current_liability', 2, true, true, 0, 0),
    ('5120', 'ضرائب على الرواتب', 'Payroll Taxes', 'expense', 'operating_expense', 2, true, true, 0, 0),
    ('5121', 'تأمينات اجتماعية - حصة الشركة', 'Social Insurance - Company Share', 'expense', 'operating_expense', 2, true, true, 0, 0),
    
    -- حسابات الخصومات
    ('1151', 'سلف الموظفين', 'Employee Advances', 'asset', 'current_asset', 2, true, true, 0, 0),
    ('2122', 'خصومات أخرى مستحقة', 'Other Accrued Deductions', 'liability', 'current_liability', 2, true, true, 0, 0)
ON CONFLICT (account_code) DO NOTHING;

-- إضافة RLS للجدول الجديد
ALTER TABLE public.payroll_accounting_entries ENABLE ROW LEVEL SECURITY;

-- سياسة للمحاسبين والمديرين
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة قيود الرواتب"
ON public.payroll_accounting_entries
FOR ALL
TO authenticated
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
)
WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

-- إضافة عمود journal_entry_id إلى جدول payroll لربط سريع
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS journal_entry_id UUID REFERENCES public.journal_entries(id);

-- إضافة فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_payroll_journal_entry_id ON public.payroll(journal_entry_id);

-- دالة لإنشاء القيود المحاسبية للرواتب
CREATE OR REPLACE FUNCTION public.create_payroll_accounting_entry(
    payroll_id UUID,
    payroll_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
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
    
    -- الحصول على معرفات الحسابات
    SELECT id INTO salary_expense_account FROM public.chart_of_accounts WHERE account_code = '5110';
    SELECT id INTO overtime_expense_account FROM public.chart_of_accounts WHERE account_code = '5112';
    SELECT id INTO allowance_expense_account FROM public.chart_of_accounts WHERE account_code = '5111';
    SELECT id INTO tax_expense_account FROM public.chart_of_accounts WHERE account_code = '5120';
    SELECT id INTO insurance_expense_account FROM public.chart_of_accounts WHERE account_code = '5121';
    
    SELECT id INTO salary_payable_account FROM public.chart_of_accounts WHERE account_code = '2110';
    SELECT id INTO tax_payable_account FROM public.chart_of_accounts WHERE account_code = '2120';
    SELECT id INTO insurance_payable_account FROM public.chart_of_accounts WHERE account_code = '2121';
    SELECT id INTO deductions_account FROM public.chart_of_accounts WHERE account_code = '2122';
    
    -- الحصول على حساب النقدية (أول حساب نقدي متاح)
    SELECT id INTO cash_account 
    FROM public.chart_of_accounts 
    WHERE account_type = 'asset' AND account_category = 'current_asset' 
    AND (account_name ILIKE '%نقدية%' OR account_name ILIKE '%صندوق%' OR account_code IN ('1110', '1100', '1101'))
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
        created_by
    ) VALUES (
        journal_entry_number,
        CURRENT_DATE,
        'قيد راتب - ' || employee_name || ' - ' || pay_period,
        'payroll',
        payroll_id,
        basic_salary + overtime_amount + allowances + social_insurance,
        basic_salary + overtime_amount + allowances + social_insurance,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد
    -- الرواتب الأساسية (مدين)
    IF basic_salary > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, salary_expense_account, 'راتب أساسي - ' || employee_name, basic_salary, 0, 1
        );
    END IF;
    
    -- الساعات الإضافية (مدين)
    IF overtime_amount > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, overtime_expense_account, 'ساعات إضافية - ' || employee_name, overtime_amount, 0, 2
        );
    END IF;
    
    -- العلاوات (مدين)
    IF allowances > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, allowance_expense_account, 'علاوات - ' || employee_name, allowances, 0, 3
        );
    END IF;
    
    -- التأمينات - حصة الشركة (مدين)
    IF social_insurance > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, insurance_expense_account, 'تأمينات - حصة الشركة - ' || employee_name, social_insurance, 0, 4
        );
    END IF;
    
    -- الرواتب المستحقة (دائن)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, salary_payable_account, 'رواتب مستحقة - ' || employee_name, 0, net_salary, 5
    );
    
    -- الضرائب المستحقة (دائن)
    IF tax_deduction > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, tax_payable_account, 'ضرائب مستحقة - ' || employee_name, 0, tax_deduction, 6
        );
    END IF;
    
    -- التأمينات المستحقة (دائن)
    IF social_insurance > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, insurance_payable_account, 'تأمينات مستحقة - ' || employee_name, 0, social_insurance, 7
        );
    END IF;
    
    -- الخصومات الأخرى (دائن)
    IF deductions > 0 THEN
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
        ) VALUES (
            journal_entry_id, deductions_account, 'خصومات أخرى - ' || employee_name, 0, deductions, 8
        );
    END IF;
    
    -- ربط القيد بالراتب
    INSERT INTO public.payroll_accounting_entries (
        payroll_id, journal_entry_id, entry_type, amount, created_by
    ) VALUES 
        (payroll_id, journal_entry_id, 'salary', basic_salary + overtime_amount + allowances, auth.uid());
    
    -- تحديث جدول الرواتب بمعرف القيد
    UPDATE public.payroll 
    SET journal_entry_id = journal_entry_id 
    WHERE id = payroll_id;
    
    RETURN journal_entry_id;
END;
$$;