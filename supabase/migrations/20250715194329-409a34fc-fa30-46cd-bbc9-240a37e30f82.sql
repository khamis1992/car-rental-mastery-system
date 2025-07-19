-- المرحلة الأولى: تحسين تكامل المركبات مع النظام المحاسبي

-- إنشاء جدول تكاليف المركبات
CREATE TABLE IF NOT EXISTS public.vehicle_costs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    cost_type TEXT NOT NULL CHECK (cost_type IN ('fuel', 'maintenance', 'insurance', 'registration', 'depreciation', 'other')),
    amount NUMERIC(15,3) NOT NULL,
    cost_date DATE NOT NULL,
    description TEXT,
    invoice_number TEXT,
    supplier_id UUID,
    journal_entry_id UUID,
    cost_center_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    tenant_id UUID NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    reference_id UUID,
    reference_type TEXT
);

-- إنشاء جدول إهلاك المركبات التلقائي
CREATE TABLE IF NOT EXISTS public.vehicle_depreciation_schedule (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    depreciation_date DATE NOT NULL,
    monthly_depreciation NUMERIC(15,3) NOT NULL,
    accumulated_depreciation NUMERIC(15,3) NOT NULL,
    book_value NUMERIC(15,3) NOT NULL,
    is_processed BOOLEAN DEFAULT false,
    journal_entry_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL
);

-- إنشاء جدول تكامل المخزون مع المحاسبة
CREATE TABLE IF NOT EXISTS public.inventory_accounting (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_code TEXT NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_cost NUMERIC(15,3) NOT NULL,
    quantity_on_hand NUMERIC(15,3) DEFAULT 0,
    total_value NUMERIC(15,3) GENERATED ALWAYS AS (unit_cost * quantity_on_hand) STORED,
    reorder_level NUMERIC(15,3) DEFAULT 0,
    account_id UUID, -- ربط بدليل الحسابات
    cost_center_id UUID,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL,
    supplier_id UUID,
    warehouse_location TEXT,
    valuation_method TEXT DEFAULT 'fifo' CHECK (valuation_method IN ('fifo', 'lifo', 'average'))
);

-- إنشاء جدول حركات المخزون
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'transfer', 'adjustment', 'maintenance_issue')),
    quantity NUMERIC(15,3) NOT NULL,
    unit_cost NUMERIC(15,3),
    total_amount NUMERIC(15,3),
    movement_date DATE NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    journal_entry_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    tenant_id UUID NOT NULL
);

-- إنشاء جدول تحسين إدارة الموردين
CREATE TABLE IF NOT EXISTS public.supplier_accounting (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    supplier_code TEXT NOT NULL,
    account_id UUID, -- ربط بحساب الذمم الدائنة
    credit_limit NUMERIC(15,3) DEFAULT 0,
    current_balance NUMERIC(15,3) DEFAULT 0,
    payment_terms TEXT DEFAULT '30 days',
    preferred_payment_method TEXT DEFAULT 'bank_transfer',
    tax_number TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL
);

-- إنشاء جدول دفتر أستاذ الموردين
CREATE TABLE IF NOT EXISTS public.supplier_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    debit_amount NUMERIC(15,3) DEFAULT 0,
    credit_amount NUMERIC(15,3) DEFAULT 0,
    running_balance NUMERIC(15,3) DEFAULT 0,
    journal_entry_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL
);

-- إضافة المفاتيح الخارجية والفهارس
ALTER TABLE public.vehicle_costs 
ADD CONSTRAINT fk_vehicle_costs_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
ADD CONSTRAINT fk_vehicle_costs_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
ADD CONSTRAINT fk_vehicle_costs_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE public.vehicle_depreciation_schedule 
ADD CONSTRAINT fk_depreciation_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
ADD CONSTRAINT fk_depreciation_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
ADD CONSTRAINT fk_depreciation_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE public.inventory_accounting 
ADD CONSTRAINT fk_inventory_account FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id),
ADD CONSTRAINT fk_inventory_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE public.inventory_movements 
ADD CONSTRAINT fk_movement_inventory FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_accounting(id),
ADD CONSTRAINT fk_movement_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
ADD CONSTRAINT fk_movement_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE public.supplier_accounting 
ADD CONSTRAINT fk_supplier_account FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id),
ADD CONSTRAINT fk_supplier_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

ALTER TABLE public.supplier_ledger 
ADD CONSTRAINT fk_supplier_ledger_supplier FOREIGN KEY (supplier_id) REFERENCES public.supplier_accounting(id),
ADD CONSTRAINT fk_supplier_ledger_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
ADD CONSTRAINT fk_supplier_ledger_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_vehicle_costs_vehicle_date ON public.vehicle_costs(vehicle_id, cost_date);
CREATE INDEX idx_vehicle_costs_type ON public.vehicle_costs(cost_type);
CREATE INDEX idx_vehicle_depreciation_date ON public.vehicle_depreciation_schedule(depreciation_date);
CREATE INDEX idx_inventory_movements_date ON public.inventory_movements(movement_date);
CREATE INDEX idx_supplier_ledger_date ON public.supplier_ledger(supplier_id, transaction_date);

-- تمكين RLS على الجداول الجديدة
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_depreciation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_accounting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_accounting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_ledger ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "المحاسبون يمكنهم إدارة تكاليف المركبات" ON public.vehicle_costs
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون يمكنهم إدارة إهلاك المركبات" ON public.vehicle_depreciation_schedule
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون يمكنهم إدارة المخزون" ON public.inventory_accounting
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون يمكنهم إدارة حركات المخزون" ON public.inventory_movements
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون يمكنهم إدارة الموردين" ON public.supplier_accounting
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون يمكنهم إدارة دفتر أستاذ الموردين" ON public.supplier_ledger
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));