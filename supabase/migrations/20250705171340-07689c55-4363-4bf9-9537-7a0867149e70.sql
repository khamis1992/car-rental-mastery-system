-- إضافة جدول ربط العقود بالمحاسبة
CREATE TABLE IF NOT EXISTS public.contract_accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('revenue_recognition', 'receivable', 'collection', 'deposit')),
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE (contract_id, journal_entry_id, entry_type)
);

-- إضافة فهارس للبحث السريع
CREATE INDEX idx_contract_accounting_contract_id ON public.contract_accounting_entries(contract_id);
CREATE INDEX idx_contract_accounting_journal_id ON public.contract_accounting_entries(journal_entry_id);

-- إضافة الحسابات المحاسبية المطلوبة للعقود إذا لم تكن موجودة
INSERT INTO public.chart_of_accounts (account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
VALUES 
    -- حسابات العقود والإيرادات
    ('1130', 'عملاء عقود الإيجار', 'Rental Contracts Receivables', 'asset', 'current_asset', 2, true, true, 0, 0),
    ('2130', 'عربون عقود الإيجار', 'Rental Deposits Payable', 'liability', 'current_liability', 2, true, true, 0, 0),
    ('2131', 'إيرادات مؤجلة - عقود الإيجار', 'Deferred Revenue - Rentals', 'liability', 'current_liability', 2, true, true, 0, 0),
    ('4110', 'إيرادات تأجير المركبات', 'Vehicle Rental Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 0),
    ('4111', 'إيرادات التأمين على المركبات', 'Vehicle Insurance Revenue', 'revenue', 'operating_revenue', 3, true, true, 0, 0),
    ('4112', 'إيرادات العربون', 'Security Deposit Revenue', 'revenue', 'operating_revenue', 3, true, true, 0, 0),
    
    -- حسابات الخصومات والضرائب
    ('4113', 'خصومات العقود', 'Contract Discounts', 'revenue', 'operating_revenue', 3, true, true, 0, 0),
    ('2140', 'ضرائب مستحقة على العقود', 'Accrued Contract Taxes', 'liability', 'current_liability', 2, true, true, 0, 0)
ON CONFLICT (account_code) DO NOTHING;

-- إضافة RLS للجدول الجديد
ALTER TABLE public.contract_accounting_entries ENABLE ROW LEVEL SECURITY;

-- سياسة للمحاسبين والمديرين
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة قيود العقود"
ON public.contract_accounting_entries
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

-- إضافة عمود journal_entry_id إلى جدول contracts لربط سريع
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS journal_entry_id UUID REFERENCES public.journal_entries(id);

-- إضافة فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_contracts_journal_entry_id ON public.contracts(journal_entry_id);

-- دالة لإنشاء القيود المحاسبية للعقود
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(
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
    revenue_account UUID;
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
    SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '4110';
    SELECT id INTO deposit_account FROM public.chart_of_accounts WHERE account_code = '2130';
    SELECT id INTO tax_account FROM public.chart_of_accounts WHERE account_code = '2140';
    SELECT id INTO insurance_account FROM public.chart_of_accounts WHERE account_code = '4111';
    SELECT id INTO discount_account FROM public.chart_of_accounts WHERE account_code = '4113';
    
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
        'قيد عقد إيجار - ' || customer_name || ' - ' || vehicle_info,
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
    
    -- إيرادات التأجير (دائن)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
        journal_entry_id, revenue_account, 'إيراد تأجير - ' || customer_name || ' - ' || vehicle_info, 0, total_amount - tax_amount - insurance_amount, 2
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
        (contract_id, journal_entry_id, 'revenue_recognition', net_revenue, auth.uid());
    
    -- تحديث جدول العقود بمعرف القيد
    UPDATE public.contracts 
    SET journal_entry_id = journal_entry_id 
    WHERE id = contract_id;
    
    RETURN journal_entry_id;
END;
$$;