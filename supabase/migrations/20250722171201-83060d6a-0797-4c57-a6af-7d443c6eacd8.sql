
-- المرحلة الأولى: تحسين قاعدة البيانات
-- تحديث جدول payroll_settings لجعله أكثر مرونة
ALTER TABLE public.payroll_settings 
ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT get_current_tenant_id(),
ADD COLUMN IF NOT EXISTS auto_generate_journal_entries BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS default_salary_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS default_overtime_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS default_allowance_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS default_deduction_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS default_tax_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS default_insurance_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS payroll_approval_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_post_entries BOOLEAN DEFAULT false;

-- إضافة قيود فريدة للمؤسسة
ALTER TABLE public.payroll_settings 
ADD CONSTRAINT payroll_settings_tenant_unique 
UNIQUE (tenant_id);

-- إنشاء جدول سير عمل الموافقات للرواتب
CREATE TABLE IF NOT EXISTS public.payroll_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    approval_level INTEGER NOT NULL DEFAULT 1,
    approver_id UUID NOT NULL REFERENCES public.employees(id),
    approval_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);

-- إنشاء جدول تفاصيل الرواتب المحسن
CREATE TABLE IF NOT EXISTS public.payroll_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    detail_type TEXT NOT NULL CHECK (detail_type IN ('basic_salary', 'overtime', 'allowance', 'bonus', 'deduction', 'tax', 'insurance')),
    account_id UUID REFERENCES public.chart_of_accounts(id),
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    calculation_method TEXT,
    is_taxable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول ربط الرواتب بالمحاسبة المحسن
CREATE TABLE IF NOT EXISTS public.payroll_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('accrual', 'payment', 'adjustment')),
    amount NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);

-- إنشاء جدول قواعد الرواتب التلقائية
CREATE TABLE IF NOT EXISTS public.payroll_automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('allowance', 'deduction', 'bonus', 'overtime')),
    conditions JSONB NOT NULL DEFAULT '{}',
    calculation_formula TEXT NOT NULL,
    target_account_id UUID REFERENCES public.chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    applies_to_all_employees BOOLEAN DEFAULT false,
    specific_employee_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_payroll_approvals_payroll_id ON public.payroll_approvals(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_approvals_tenant_id ON public.payroll_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_details_payroll_id ON public.payroll_details(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_details_tenant_id ON public.payroll_details(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_journal_entries_payroll_id ON public.payroll_journal_entries(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_automation_rules_tenant_id ON public.payroll_automation_rules(tenant_id);

-- تطبيق RLS على الجداول الجديدة
ALTER TABLE public.payroll_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_automation_rules ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للموافقات
CREATE POLICY "المديرون والمحاسبون يمكنهم إدارة موافقات الرواتب"
ON public.payroll_approvals FOR ALL
TO authenticated
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role) OR
     approver_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
)
WITH CHECK (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
);

-- سياسات RLS لتفاصيل الرواتب
CREATE POLICY "المديرون والمحاسبون يمكنهم إدارة تفاصيل الرواتب"
ON public.payroll_details FOR ALL
TO authenticated
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
)
WITH CHECK (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
);

-- سياسات RLS لقيود الرواتب
CREATE POLICY "المديرون والمحاسبون يمكنهم رؤية قيود الرواتب"
ON public.payroll_journal_entries FOR ALL
TO authenticated
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
)
WITH CHECK (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
);

-- سياسات RLS لقواعد الأتمتة
CREATE POLICY "المديرون يمكنهم إدارة قواعد الأتمتة"
ON public.payroll_automation_rules FOR ALL
TO authenticated
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role))
)
WITH CHECK (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role))
);

-- إضافة تريجر للتحديث التلقائي
CREATE TRIGGER update_payroll_approvals_updated_at
    BEFORE UPDATE ON public.payroll_approvals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_automation_rules_updated_at
    BEFORE UPDATE ON public.payroll_automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- دالة محسنة لحساب الرواتب مع الربط المحاسبي
CREATE OR REPLACE FUNCTION public.calculate_payroll_with_accounting(
    payroll_id UUID,
    auto_create_journal_entry BOOLEAN DEFAULT true
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payroll_record RECORD;
    employee_record RECORD;
    settings_record RECORD;
    rule_record RECORD;
    journal_entry_id UUID;
    result_data JSONB;
    total_allowances NUMERIC := 0;
    total_deductions NUMERIC := 0;
    calculated_overtime NUMERIC := 0;
BEGIN
    -- جلب بيانات الراتب
    SELECT * INTO payroll_record FROM public.payroll WHERE id = payroll_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'راتب غير موجود');
    END IF;
    
    -- جلب بيانات الموظف
    SELECT * INTO employee_record FROM public.employees WHERE id = payroll_record.employee_id;
    
    -- جلب إعدادات الرواتب
    SELECT * INTO settings_record FROM public.payroll_settings 
    WHERE tenant_id = get_current_tenant_id() LIMIT 1;
    
    -- تطبيق قواعد الأتمتة
    FOR rule_record IN 
        SELECT * FROM public.payroll_automation_rules 
        WHERE tenant_id = get_current_tenant_id() 
        AND is_active = true
        AND (applies_to_all_employees = true OR payroll_record.employee_id = ANY(specific_employee_ids))
    LOOP
        -- تطبيق القاعدة حسب نوعها
        CASE rule_record.rule_type
            WHEN 'allowance' THEN
                total_allowances := total_allowances + COALESCE(
                    execute_formula(rule_record.calculation_formula, payroll_record), 0
                );
            WHEN 'deduction' THEN
                total_deductions := total_deductions + COALESCE(
                    execute_formula(rule_record.calculation_formula, payroll_record), 0
                );
            WHEN 'overtime' THEN
                calculated_overtime := calculated_overtime + COALESCE(
                    execute_formula(rule_record.calculation_formula, payroll_record), 0
                );
        END CASE;
        
        -- حفظ تفاصيل الراتب
        INSERT INTO public.payroll_details (
            payroll_id, detail_type, account_id, amount, description, calculation_method
        ) VALUES (
            payroll_id, rule_record.rule_type, rule_record.target_account_id,
            COALESCE(execute_formula(rule_record.calculation_formula, payroll_record), 0),
            rule_record.rule_name, rule_record.calculation_formula
        );
    END LOOP;
    
    -- تحديث الراتب بالقيم المحسوبة
    UPDATE public.payroll SET
        allowances = COALESCE(allowances, 0) + total_allowances,
        deductions = COALESCE(deductions, 0) + total_deductions,
        overtime_amount = COALESCE(overtime_amount, 0) + calculated_overtime,
        updated_at = now()
    WHERE id = payroll_id;
    
    -- إنشاء القيد المحاسبي إذا كان مطلوباً
    IF auto_create_journal_entry AND settings_record.auto_generate_journal_entries THEN
        SELECT public.create_enhanced_payroll_journal_entry(payroll_id) INTO journal_entry_id;
        
        -- ربط القيد بالراتب
        INSERT INTO public.payroll_journal_entries (
            payroll_id, journal_entry_id, entry_type, amount, description
        ) VALUES (
            payroll_id, journal_entry_id, 'accrual', 
            payroll_record.gross_salary, 'قيد استحقاق راتب'
        );
    END IF;
    
    result_data := jsonb_build_object(
        'success', true,
        'payroll_id', payroll_id,
        'total_allowances', total_allowances,
        'total_deductions', total_deductions,
        'calculated_overtime', calculated_overtime,
        'journal_entry_id', journal_entry_id,
        'calculation_date', now()
    );
    
    RETURN result_data;
END;
$$;

-- دالة مساعدة لتنفيذ صيغ الحساب (مبسطة)
CREATE OR REPLACE FUNCTION public.execute_formula(
    formula TEXT,
    payroll_data RECORD
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- تنفيذ صيغ بسيطة (يمكن تطويرها لاحقاً)
    CASE formula
        WHEN 'basic_salary * 0.1' THEN RETURN payroll_data.basic_salary * 0.1;
        WHEN 'basic_salary * 0.05' THEN RETURN payroll_data.basic_salary * 0.05;
        WHEN 'overtime_hours * 5' THEN RETURN payroll_data.overtime_hours * 5;
        ELSE RETURN 0;
    END CASE;
END;
$$;

-- دالة إنشاء القيد المحاسبي المحسن
CREATE OR REPLACE FUNCTION public.create_enhanced_payroll_journal_entry(
    payroll_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    journal_entry_id UUID;
    payroll_record RECORD;
    employee_record RECORD;
    settings_record RECORD;
    detail_record RECORD;
    entry_number TEXT;
    line_number INTEGER := 1;
BEGIN
    -- جلب بيانات الراتب والموظف
    SELECT p.*, e.first_name, e.last_name, e.employee_number
    INTO payroll_record, employee_record
    FROM public.payroll p
    JOIN public.employees e ON p.employee_id = e.id
    WHERE p.id = payroll_id;
    
    -- جلب إعدادات الرواتب
    SELECT * INTO settings_record 
    FROM public.payroll_settings 
    WHERE tenant_id = get_current_tenant_id() LIMIT 1;
    
    -- إنشاء رقم القيد
    entry_number := 'PAY-' || EXTRACT(YEAR FROM now()) || '-' || 
                   LPAD(nextval('journal_entry_sequence')::TEXT, 6, '0');
    
    -- إنشاء القيد المحاسبي
    INSERT INTO public.journal_entries (
        entry_number, entry_date, description, reference_type,
        reference_id, total_debit, total_credit, status, tenant_id
    ) VALUES (
        entry_number, payroll_record.pay_period_end,
        'قيد راتب ' || employee_record.first_name || ' ' || employee_record.last_name ||
        ' - الفترة: ' || payroll_record.pay_period_start || ' إلى ' || payroll_record.pay_period_end,
        'payroll', payroll_id, payroll_record.gross_salary, payroll_record.gross_salary,
        CASE WHEN settings_record.auto_post_entries THEN 'posted' ELSE 'draft' END,
        get_current_tenant_id()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد من تفاصيل الراتب
    FOR detail_record IN 
        SELECT * FROM public.payroll_details 
        WHERE payroll_id = payroll_id AND account_id IS NOT NULL
        ORDER BY detail_type
    LOOP
        -- تحديد المدين والدائن حسب نوع التفصيل
        IF detail_record.detail_type IN ('basic_salary', 'overtime', 'allowance', 'bonus') THEN
            -- مصروفات (مدين)
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, description,
                debit_amount, credit_amount, line_number, tenant_id
            ) VALUES (
                journal_entry_id, detail_record.account_id,
                detail_record.description || ' - ' || employee_record.first_name || ' ' || employee_record.last_name,
                detail_record.amount, 0, line_number, get_current_tenant_id()
            );
        ELSE
            -- خصومات وضرائب (دائن)
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, description,
                debit_amount, credit_amount, line_number, tenant_id
            ) VALUES (
                journal_entry_id, detail_record.account_id,
                detail_record.description || ' - ' || employee_record.first_name || ' ' || employee_record.last_name,
                0, detail_record.amount, line_number, get_current_tenant_id()
            );
        END IF;
        
        line_number := line_number + 1;
    END LOOP;
    
    -- إضافة سطر الرواتب المستحقة (دائن)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description,
        debit_amount, credit_amount, line_number, tenant_id
    ) VALUES (
        journal_entry_id, 
        COALESCE(settings_record.default_salary_account_id, 
                (SELECT id FROM public.chart_of_accounts 
                 WHERE account_code = '2110' AND tenant_id = get_current_tenant_id() LIMIT 1)),
        'راتب مستحق - ' || employee_record.first_name || ' ' || employee_record.last_name,
        0, payroll_record.net_salary, line_number, get_current_tenant_id()
    );
    
    RETURN journal_entry_id;
END;
$$;

-- إدراج إعدادات افتراضية للرواتب لكل مؤسسة
INSERT INTO public.payroll_settings (
    tenant_id, tax_rate, social_insurance_rate, overtime_multiplier,
    working_hours_per_day, working_days_per_month, auto_generate_journal_entries,
    payroll_approval_required, auto_post_entries
) 
SELECT 
    t.id, 5.0, 6.0, 1.5, 8, 22, true, false, false
FROM public.tenants t
WHERE t.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM public.payroll_settings ps WHERE ps.tenant_id = t.id
);
