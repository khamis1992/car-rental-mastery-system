-- إنشاء جدول فئات المصروفات
CREATE TABLE public.expense_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    category_code TEXT NOT NULL,
    category_name_ar TEXT NOT NULL,
    category_name_en TEXT,
    parent_category_id UUID,
    account_id UUID,
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    approval_limit NUMERIC(15,3) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    
    CONSTRAINT fk_expense_categories_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
    CONSTRAINT fk_expense_categories_parent FOREIGN KEY (parent_category_id) REFERENCES public.expense_categories(id),
    CONSTRAINT fk_expense_categories_account FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id),
    CONSTRAINT unique_expense_category_code_per_tenant UNIQUE (tenant_id, category_code)
);

-- إنشاء جدول سندات الصرف
CREATE TABLE public.expense_vouchers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    voucher_number TEXT NOT NULL,
    voucher_date DATE NOT NULL,
    beneficiary_name TEXT NOT NULL,
    beneficiary_type TEXT DEFAULT 'supplier' CHECK (beneficiary_type IN ('supplier', 'employee', 'other')),
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) DEFAULT 0,
    discount_amount NUMERIC(15,3) DEFAULT 0,
    net_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'check')),
    bank_account_id UUID,
    check_number TEXT,
    reference_number TEXT,
    description TEXT,
    notes TEXT,
    attachments TEXT[],
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paid', 'cancelled')),
    cost_center_id UUID,
    journal_entry_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    
    CONSTRAINT fk_expense_vouchers_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
    CONSTRAINT fk_expense_vouchers_bank_account FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id),
    CONSTRAINT fk_expense_vouchers_cost_center FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id),
    CONSTRAINT fk_expense_vouchers_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
    CONSTRAINT unique_expense_voucher_number_per_tenant UNIQUE (tenant_id, voucher_number)
);

-- إنشاء جدول بنود سندات الصرف
CREATE TABLE public.expense_voucher_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_voucher_id UUID NOT NULL,
    expense_category_id UUID NOT NULL,
    account_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,3) DEFAULT 1,
    unit_price NUMERIC(15,3) NOT NULL,
    total_amount NUMERIC(15,3) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(15,3) DEFAULT 0,
    cost_center_id UUID,
    project_code TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT fk_expense_voucher_items_voucher FOREIGN KEY (expense_voucher_id) REFERENCES public.expense_vouchers(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_voucher_items_category FOREIGN KEY (expense_category_id) REFERENCES public.expense_categories(id),
    CONSTRAINT fk_expense_voucher_items_account FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id),
    CONSTRAINT fk_expense_voucher_items_cost_center FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id)
);

-- إنشاء جدول موافقات المصروفات
CREATE TABLE public.expense_approvals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_voucher_id UUID NOT NULL,
    approver_id UUID NOT NULL,
    approval_level INTEGER NOT NULL DEFAULT 1,
    required_amount_limit NUMERIC(15,3) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT fk_expense_approvals_voucher FOREIGN KEY (expense_voucher_id) REFERENCES public.expense_vouchers(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_approvals_approver FOREIGN KEY (approver_id) REFERENCES public.employees(id),
    CONSTRAINT unique_expense_approval_per_voucher_level UNIQUE (expense_voucher_id, approval_level)
);

-- إنشاء جدول قوالب المصروفات
CREATE TABLE public.expense_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    template_name TEXT NOT NULL,
    template_description TEXT,
    default_beneficiary_type TEXT DEFAULT 'supplier',
    default_payment_method TEXT DEFAULT 'cash',
    default_cost_center_id UUID,
    template_items JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    
    CONSTRAINT fk_expense_templates_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
    CONSTRAINT fk_expense_templates_cost_center FOREIGN KEY (default_cost_center_id) REFERENCES public.cost_centers(id),
    CONSTRAINT unique_expense_template_name_per_tenant UNIQUE (tenant_id, template_name)
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_expense_categories_tenant_id ON public.expense_categories(tenant_id);
CREATE INDEX idx_expense_categories_parent_id ON public.expense_categories(parent_category_id);
CREATE INDEX idx_expense_vouchers_tenant_id ON public.expense_vouchers(tenant_id);
CREATE INDEX idx_expense_vouchers_date ON public.expense_vouchers(voucher_date);
CREATE INDEX idx_expense_vouchers_status ON public.expense_vouchers(status);
CREATE INDEX idx_expense_voucher_items_voucher_id ON public.expense_voucher_items(expense_voucher_id);
CREATE INDEX idx_expense_approvals_voucher_id ON public.expense_approvals(expense_voucher_id);
CREATE INDEX idx_expense_approvals_approver_id ON public.expense_approvals(approver_id);
CREATE INDEX idx_expense_templates_tenant_id ON public.expense_templates(tenant_id);

-- إضافة تحديث التواريخ تلقائياً
CREATE OR REPLACE FUNCTION update_expense_vouchers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_vouchers_updated_at_trigger
    BEFORE UPDATE ON public.expense_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_vouchers_updated_at();

-- تحديث المبالغ تلقائياً في سندات الصرف
CREATE OR REPLACE FUNCTION update_expense_voucher_totals()
RETURNS TRIGGER AS $$
DECLARE
    voucher_total NUMERIC(15,3) := 0;
    voucher_tax NUMERIC(15,3) := 0;
BEGIN
    -- حساب المجاميع من البنود
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO voucher_total, voucher_tax
    FROM public.expense_voucher_items
    WHERE expense_voucher_id = COALESCE(NEW.expense_voucher_id, OLD.expense_voucher_id);
    
    -- تحديث السند
    UPDATE public.expense_vouchers
    SET 
        total_amount = voucher_total,
        tax_amount = voucher_tax,
        net_amount = voucher_total - COALESCE(discount_amount, 0),
        updated_at = now()
    WHERE id = COALESCE(NEW.expense_voucher_id, OLD.expense_voucher_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_voucher_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.expense_voucher_items
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_voucher_totals();