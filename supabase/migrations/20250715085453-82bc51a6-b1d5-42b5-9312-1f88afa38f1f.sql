-- إنشاء جدول سندات المصروفات
CREATE TABLE public.expense_vouchers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    voucher_number TEXT NOT NULL,
    voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID,
    expense_category TEXT NOT NULL,
    expense_subcategory TEXT,
    total_amount NUMERIC(15,3) NOT NULL,
    tax_amount NUMERIC(15,3) DEFAULT 0,
    discount_amount NUMERIC(15,3) DEFAULT 0,
    net_amount NUMERIC(15,3) NOT NULL,
    cost_center_id UUID,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    check_number TEXT,
    check_date DATE,
    bank_account_id UUID,
    description TEXT,
    notes TEXT,
    attachments TEXT[],
    journal_entry_id UUID,
    approval_status TEXT DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_expense_vouchers_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
    CONSTRAINT fk_expense_vouchers_cost_center FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id),
    CONSTRAINT fk_expense_vouchers_bank_account FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id),
    CONSTRAINT fk_expense_vouchers_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id)
);

-- إنشاء جدول الشيكات
CREATE TABLE public.checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    check_number TEXT NOT NULL,
    check_date DATE NOT NULL,
    due_date DATE,
    amount NUMERIC(15,3) NOT NULL,
    currency TEXT DEFAULT 'KWD',
    bank_account_id UUID NOT NULL,
    payee_name TEXT NOT NULL,
    payee_account TEXT,
    check_type TEXT NOT NULL DEFAULT 'outgoing',
    status TEXT NOT NULL DEFAULT 'issued',
    memo TEXT,
    reference_type TEXT,
    reference_id UUID,
    journal_entry_id UUID,
    cleared_date DATE,
    bounced_date DATE,
    bounced_reason TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_checks_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
    CONSTRAINT fk_checks_bank_account FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id),
    CONSTRAINT fk_checks_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id)
);

-- إنشاء جدول بنود سندات المصروفات
CREATE TABLE public.expense_voucher_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_voucher_id UUID NOT NULL,
    account_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,3) DEFAULT 1,
    unit_price NUMERIC(15,3) NOT NULL,
    total_amount NUMERIC(15,3) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(15,3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT fk_expense_voucher_items_voucher FOREIGN KEY (expense_voucher_id) REFERENCES public.expense_vouchers(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_voucher_items_account FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_expense_vouchers_tenant_id ON public.expense_vouchers(tenant_id);
CREATE INDEX idx_expense_vouchers_voucher_number ON public.expense_vouchers(voucher_number);
CREATE INDEX idx_expense_vouchers_voucher_date ON public.expense_vouchers(voucher_date);
CREATE INDEX idx_expense_vouchers_cost_center_id ON public.expense_vouchers(cost_center_id);

CREATE INDEX idx_checks_tenant_id ON public.checks(tenant_id);
CREATE INDEX idx_checks_check_number ON public.checks(check_number);
CREATE INDEX idx_checks_status ON public.checks(status);
CREATE INDEX idx_checks_check_date ON public.checks(check_date);

CREATE INDEX idx_expense_voucher_items_voucher_id ON public.expense_voucher_items(expense_voucher_id);

-- تفعيل RLS
ALTER TABLE public.expense_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_voucher_items ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لسندات المصروفات
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة سندات المصروفات"
ON public.expense_vouchers
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

-- سياسات RLS للشيكات
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الشيكات"
ON public.checks
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

-- سياسات RLS لبنود سندات المصروفات
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة بنود سندات المصروفات"
ON public.expense_voucher_items
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

-- إنشاء دالة لإنشاء قيد محاسبي من سند مصروفات
CREATE OR REPLACE FUNCTION public.create_journal_entry_from_expense_voucher(voucher_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    voucher_record RECORD;
    item_record RECORD;
    entry_id UUID;
    entry_number TEXT;
    total_debits NUMERIC := 0;
    supplier_account_id UUID;
BEGIN
    -- جلب بيانات السند
    SELECT * INTO voucher_record
    FROM public.expense_vouchers
    WHERE id = voucher_id;
    
    IF voucher_record IS NULL THEN
        RAISE EXCEPTION 'سند المصروفات غير موجود';
    END IF;
    
    -- توليد رقم القيد
    SELECT 'JE-' || to_char(now(), 'YYYY') || '-' || LPAD(
        (COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '\d+$') AS INTEGER)), 0) + 1)::TEXT,
        6, '0'
    ) INTO entry_number
    FROM public.journal_entries
    WHERE tenant_id = voucher_record.tenant_id
    AND entry_number ~ '^JE-\d{4}-\d+$';
    
    -- إنشاء القيد المحاسبي
    INSERT INTO public.journal_entries (
        tenant_id, entry_number, entry_date, reference_type, reference_id,
        description, total_debit, total_credit, status, created_by
    ) VALUES (
        voucher_record.tenant_id, entry_number, voucher_record.voucher_date,
        'expense_voucher', voucher_id, voucher_record.description,
        voucher_record.net_amount, voucher_record.net_amount,
        'draft', voucher_record.created_by
    ) RETURNING id INTO entry_id;
    
    -- إضافة بنود المدين (حسابات المصروفات)
    FOR item_record IN 
        SELECT * FROM public.expense_voucher_items 
        WHERE expense_voucher_id = voucher_id
    LOOP
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount,
            cost_center_id, created_at
        ) VALUES (
            entry_id, item_record.account_id, item_record.description,
            item_record.total_amount, 0, voucher_record.cost_center_id, now()
        );
        
        total_debits := total_debits + item_record.total_amount;
    END LOOP;
    
    -- إضافة بند الدائن (حساب الموردين أو النقدية)
    IF voucher_record.payment_method = 'cash' THEN
        -- البحث عن حساب الصندوق
        SELECT id INTO supplier_account_id
        FROM public.chart_of_accounts
        WHERE tenant_id = voucher_record.tenant_id
        AND account_code LIKE '1110101%'
        AND is_active = true
        LIMIT 1;
    ELSE
        -- البحث عن حساب البنك
        SELECT account_id INTO supplier_account_id
        FROM public.bank_accounts
        WHERE id = voucher_record.bank_account_id;
    END IF;
    
    IF supplier_account_id IS NULL THEN
        RAISE EXCEPTION 'لم يتم العثور على الحساب المناسب للدفع';
    END IF;
    
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount,
        cost_center_id, created_at
    ) VALUES (
        entry_id, supplier_account_id, 
        'دفع سند مصروفات رقم ' || voucher_record.voucher_number,
        0, voucher_record.net_amount, voucher_record.cost_center_id, now()
    );
    
    -- تحديث سند المصروفات بمعرف القيد
    UPDATE public.expense_vouchers
    SET journal_entry_id = entry_id, updated_at = now()
    WHERE id = voucher_id;
    
    RETURN entry_id;
END;
$$;

-- إنشاء دالة لإنشاء قيد محاسبي من شيك
CREATE OR REPLACE FUNCTION public.create_journal_entry_from_check(check_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    check_record RECORD;
    entry_id UUID;
    entry_number TEXT;
    bank_account_chart_id UUID;
BEGIN
    -- جلب بيانات الشيك
    SELECT c.*, ba.account_id 
    INTO check_record
    FROM public.checks c
    JOIN public.bank_accounts ba ON c.bank_account_id = ba.id
    WHERE c.id = check_id;
    
    IF check_record IS NULL THEN
        RAISE EXCEPTION 'الشيك غير موجود';
    END IF;
    
    -- توليد رقم القيد
    SELECT 'JE-' || to_char(now(), 'YYYY') || '-' || LPAD(
        (COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '\d+$') AS INTEGER)), 0) + 1)::TEXT,
        6, '0'
    ) INTO entry_number
    FROM public.journal_entries
    WHERE tenant_id = check_record.tenant_id
    AND entry_number ~ '^JE-\d{4}-\d+$';
    
    -- إنشاء القيد المحاسبي
    INSERT INTO public.journal_entries (
        tenant_id, entry_number, entry_date, reference_type, reference_id,
        description, total_debit, total_credit, status, created_by
    ) VALUES (
        check_record.tenant_id, entry_number, check_record.check_date,
        'check', check_id, 'شيك رقم ' || check_record.check_number || ' - ' || check_record.payee_name,
        check_record.amount, check_record.amount,
        'draft', check_record.created_by
    ) RETURNING id INTO entry_id;
    
    -- إضافة بند المدين (الحساب المرجعي)
    IF check_record.reference_type IS NOT NULL AND check_record.reference_id IS NOT NULL THEN
        -- سيتم ربطه بالمرجع المناسب
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, created_at
        ) VALUES (
            entry_id, check_record.account_id, 
            'شيك مدفوع - ' || check_record.memo,
            check_record.amount, 0, now()
        );
    END IF;
    
    -- إضافة بند الدائن (حساب البنك)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, created_at
    ) VALUES (
        entry_id, check_record.account_id,
        'شيك رقم ' || check_record.check_number || ' مدفوع لـ ' || check_record.payee_name,
        0, check_record.amount, now()
    );
    
    -- تحديث الشيك بمعرف القيد
    UPDATE public.checks
    SET journal_entry_id = entry_id, updated_at = now()
    WHERE id = check_id;
    
    RETURN entry_id;
END;
$$;