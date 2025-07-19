
-- إنشاء دفتر الأستاذ المساعد للموردين
CREATE TABLE IF NOT EXISTS public.supplier_subsidiary_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL,
    journal_entry_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_amount NUMERIC(15,3) DEFAULT 0,
    credit_amount NUMERIC(15,3) DEFAULT 0,
    running_balance NUMERIC(15,3) DEFAULT 0,
    reference_type TEXT NOT NULL, -- 'invoice', 'payment', 'adjustment', 'return'
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    tenant_id UUID NOT NULL,
    CONSTRAINT fk_supplier_subsidiary_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE,
    CONSTRAINT fk_supplier_subsidiary_journal FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_supplier_subsidiary_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إنشاء دفتر الأستاذ المساعد للأصول الثابتة
CREATE TABLE IF NOT EXISTS public.fixed_asset_subsidiary_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL,
    journal_entry_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_amount NUMERIC(15,3) DEFAULT 0,
    credit_amount NUMERIC(15,3) DEFAULT 0,
    running_balance NUMERIC(15,3) DEFAULT 0,
    reference_type TEXT NOT NULL, -- 'purchase', 'depreciation', 'disposal', 'adjustment'
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    tenant_id UUID NOT NULL,
    CONSTRAINT fk_fixed_asset_subsidiary_asset FOREIGN KEY (asset_id) REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_fixed_asset_subsidiary_journal FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_fixed_asset_subsidiary_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إنشاء دفتر الأستاذ المساعد للمخزون
CREATE TABLE IF NOT EXISTS public.inventory_subsidiary_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID NOT NULL,
    journal_entry_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_amount NUMERIC(15,3) DEFAULT 0,
    credit_amount NUMERIC(15,3) DEFAULT 0,
    running_balance NUMERIC(15,3) DEFAULT 0,
    quantity_in NUMERIC(15,3) DEFAULT 0,
    quantity_out NUMERIC(15,3) DEFAULT 0,
    unit_cost NUMERIC(15,3) DEFAULT 0,
    reference_type TEXT NOT NULL, -- 'purchase', 'sale', 'adjustment', 'transfer'
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    tenant_id UUID NOT NULL,
    CONSTRAINT fk_inventory_subsidiary_item FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_subsidiary_journal FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_subsidiary_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إنشاء دفتر الأستاذ المساعد للموظفين
CREATE TABLE IF NOT EXISTS public.employee_subsidiary_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    journal_entry_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_amount NUMERIC(15,3) DEFAULT 0,
    credit_amount NUMERIC(15,3) DEFAULT 0,
    running_balance NUMERIC(15,3) DEFAULT 0,
    reference_type TEXT NOT NULL, -- 'salary', 'advance', 'deduction', 'bonus', 'end_service'
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    tenant_id UUID NOT NULL,
    CONSTRAINT fk_employee_subsidiary_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_subsidiary_journal FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_subsidiary_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_supplier_subsidiary_ledger_supplier_date ON public.supplier_subsidiary_ledger(supplier_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_subsidiary_ledger_journal ON public.supplier_subsidiary_ledger(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_supplier_subsidiary_ledger_tenant ON public.supplier_subsidiary_ledger(tenant_id);

CREATE INDEX IF NOT EXISTS idx_fixed_asset_subsidiary_ledger_asset_date ON public.fixed_asset_subsidiary_ledger(asset_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fixed_asset_subsidiary_ledger_journal ON public.fixed_asset_subsidiary_ledger(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_fixed_asset_subsidiary_ledger_tenant ON public.fixed_asset_subsidiary_ledger(tenant_id);

CREATE INDEX IF NOT EXISTS idx_inventory_subsidiary_ledger_item_date ON public.inventory_subsidiary_ledger(inventory_item_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_subsidiary_ledger_journal ON public.inventory_subsidiary_ledger(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_inventory_subsidiary_ledger_tenant ON public.inventory_subsidiary_ledger(tenant_id);

CREATE INDEX IF NOT EXISTS idx_employee_subsidiary_ledger_employee_date ON public.employee_subsidiary_ledger(employee_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_employee_subsidiary_ledger_journal ON public.employee_subsidiary_ledger(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_employee_subsidiary_ledger_tenant ON public.employee_subsidiary_ledger(tenant_id);

-- تمكين Row Level Security
ALTER TABLE public.supplier_subsidiary_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_asset_subsidiary_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_subsidiary_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_subsidiary_ledger ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دفتر الموردين" ON public.supplier_subsidiary_ledger
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دفتر الأصول الثابتة" ON public.fixed_asset_subsidiary_ledger
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دفتر المخزون" ON public.inventory_subsidiary_ledger
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دفتر الموظفين" ON public.employee_subsidiary_ledger
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- دالة لتحديث الرصيد الجاري للموردين
CREATE OR REPLACE FUNCTION public.update_supplier_running_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance NUMERIC(15,3) := 0;
BEGIN
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    INTO current_balance
    FROM public.supplier_subsidiary_ledger
    WHERE supplier_id = NEW.supplier_id
    AND transaction_date <= NEW.transaction_date
    AND id <= NEW.id;
    
    NEW.running_balance := current_balance;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث الرصيد الجاري للأصول الثابتة
CREATE OR REPLACE FUNCTION public.update_fixed_asset_running_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance NUMERIC(15,3) := 0;
BEGIN
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    INTO current_balance
    FROM public.fixed_asset_subsidiary_ledger
    WHERE asset_id = NEW.asset_id
    AND transaction_date <= NEW.transaction_date
    AND id <= NEW.id;
    
    NEW.running_balance := current_balance;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث الرصيد الجاري للمخزون
CREATE OR REPLACE FUNCTION public.update_inventory_running_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance NUMERIC(15,3) := 0;
BEGIN
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    INTO current_balance
    FROM public.inventory_subsidiary_ledger
    WHERE inventory_item_id = NEW.inventory_item_id
    AND transaction_date <= NEW.transaction_date
    AND id <= NEW.id;
    
    NEW.running_balance := current_balance;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث الرصيد الجاري للموظفين
CREATE OR REPLACE FUNCTION public.update_employee_running_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance NUMERIC(15,3) := 0;
BEGIN
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    INTO current_balance
    FROM public.employee_subsidiary_ledger
    WHERE employee_id = NEW.employee_id
    AND transaction_date <= NEW.transaction_date
    AND id <= NEW.id;
    
    NEW.running_balance := current_balance;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء الترايجرز لتحديث الأرصدة الجارية
CREATE TRIGGER update_supplier_running_balance_trigger
    BEFORE INSERT OR UPDATE ON public.supplier_subsidiary_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_supplier_running_balance();

CREATE TRIGGER update_fixed_asset_running_balance_trigger
    BEFORE INSERT OR UPDATE ON public.fixed_asset_subsidiary_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fixed_asset_running_balance();

CREATE TRIGGER update_inventory_running_balance_trigger
    BEFORE INSERT OR UPDATE ON public.inventory_subsidiary_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_running_balance();

CREATE TRIGGER update_employee_running_balance_trigger
    BEFORE INSERT OR UPDATE ON public.employee_subsidiary_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_employee_running_balance();
