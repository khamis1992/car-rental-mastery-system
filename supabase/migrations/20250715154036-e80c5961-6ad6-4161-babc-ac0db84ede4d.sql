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
CREATE INDEX idx_expense_approvals_voucher_id ON public.expense_approvals(expense_voucher_id);
CREATE INDEX idx_expense_approvals_approver_id ON public.expense_approvals(approver_id);
CREATE INDEX idx_expense_templates_tenant_id ON public.expense_templates(tenant_id);

-- إضافة سياسات أمان للجداول الجديدة
-- فئات المصروفات
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة فئات المصروفات"
ON public.expense_categories FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- موافقات المصروفات
ALTER TABLE public.expense_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة موافقات المصروفات"
ON public.expense_approvals FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- قوالب المصروفات
ALTER TABLE public.expense_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة قوالب المصروفات"
ON public.expense_templates FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));