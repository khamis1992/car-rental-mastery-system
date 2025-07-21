
-- إنشاء جدول فواتير الموردين
CREATE TABLE public.supplier_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    invoice_number TEXT NOT NULL,
    supplier_invoice_number TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    outstanding_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    invoice_type TEXT NOT NULL DEFAULT 'purchase' CHECK (invoice_type IN ('purchase', 'maintenance', 'insurance', 'utilities', 'rent', 'other')),
    payment_terms INTEGER,
    description TEXT,
    notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    CONSTRAINT fk_supplier_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_supplier_invoices_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- إنشاء جدول بنود فواتير الموردين
CREATE TABLE public.supplier_invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_invoice_id UUID NOT NULL,
    description TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'service' CHECK (item_type IN ('service', 'part', 'maintenance', 'insurance', 'fuel', 'other')),
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,3) NOT NULL,
    total_price NUMERIC(15,3) NOT NULL,
    vehicle_id UUID,
    service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT fk_supplier_invoice_items_invoice FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id) ON DELETE CASCADE
);

-- إنشاء جدول مدفوعات الموردين
CREATE TABLE public.supplier_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    payment_number TEXT NOT NULL,
    supplier_invoice_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    amount NUMERIC(15,3) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card', 'online')),
    transaction_reference TEXT,
    bank_name TEXT,
    check_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    notes TEXT,
    receipt_url TEXT,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    CONSTRAINT fk_supplier_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_supplier_payments_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_supplier_payments_invoice FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id)
);

-- إنشاء جدول دفتر الأستاذ المساعد للموردين
CREATE TABLE public.supplier_subsidiary_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    journal_entry_id UUID,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    running_balance NUMERIC(15,3) NOT NULL DEFAULT 0,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('invoice', 'payment', 'adjustment', 'opening_balance')),
    reference_id UUID,
    invoice_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    CONSTRAINT fk_supplier_subsidiary_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_supplier_subsidiary_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- إنشاء جدول تحليل أعمار الموردين
CREATE TABLE public.supplier_aging_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id UUID NOT NULL,
    analysis_date DATE NOT NULL,
    current_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    days_30_60 NUMERIC(15,3) NOT NULL DEFAULT 0,
    days_61_90 NUMERIC(15,3) NOT NULL DEFAULT 0,
    days_91_120 NUMERIC(15,3) NOT NULL DEFAULT 0,
    over_120_days NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_outstanding NUMERIC(15,3) NOT NULL DEFAULT 0,
    oldest_invoice_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    CONSTRAINT fk_supplier_aging_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_supplier_aging_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_supplier_invoices_tenant_id ON public.supplier_invoices(tenant_id);
CREATE INDEX idx_supplier_invoices_supplier_id ON public.supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_status ON public.supplier_invoices(status);
CREATE INDEX idx_supplier_invoices_date ON public.supplier_invoices(invoice_date);
CREATE INDEX idx_supplier_invoices_due_date ON public.supplier_invoices(due_date);

CREATE INDEX idx_supplier_payments_tenant_id ON public.supplier_payments(tenant_id);
CREATE INDEX idx_supplier_payments_supplier_id ON public.supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_invoice_id ON public.supplier_payments(supplier_invoice_id);
CREATE INDEX idx_supplier_payments_date ON public.supplier_payments(payment_date);

CREATE INDEX idx_supplier_subsidiary_tenant_id ON public.supplier_subsidiary_ledger(tenant_id);
CREATE INDEX idx_supplier_subsidiary_supplier_id ON public.supplier_subsidiary_ledger(supplier_id);
CREATE INDEX idx_supplier_subsidiary_date ON public.supplier_subsidiary_ledger(transaction_date);

-- إنشاء سياسات الحماية (RLS)
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_subsidiary_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_aging_analysis ENABLE ROW LEVEL SECURITY;

-- سياسات فواتير الموردين
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة فواتير الموردين"
ON public.supplier_invoices
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- سياسات بنود الفواتير
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة بنود فواتير الموردين"
ON public.supplier_invoice_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- سياسات المدفوعات
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة مدفوعات الموردين"
ON public.supplier_payments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- سياسات دفتر الأستاذ المساعد
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دفتر الأستاذ المساعد للموردين"
ON public.supplier_subsidiary_ledger
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- سياسات تحليل الأعمار
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تحليل أعمار الموردين"
ON public.supplier_aging_analysis
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء دوال لتوليد الأرقام التلقائية
CREATE OR REPLACE FUNCTION public.generate_supplier_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.supplier_invoices
    WHERE tenant_id = current_tenant_id
    AND invoice_number ~ '^SIN[0-9]+$';
    
    invoice_number := 'SIN' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_supplier_payment_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    next_number INTEGER;
    payment_number TEXT;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.supplier_payments
    WHERE tenant_id = current_tenant_id
    AND payment_number ~ '^SPY[0-9]+$';
    
    payment_number := 'SPY' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN payment_number;
END;
$$;

-- إنشاء دالة لتوليد رقم المورد
CREATE OR REPLACE FUNCTION public.generate_supplier_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
    next_number INTEGER;
    supplier_code TEXT;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(supplier_code FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.suppliers
    WHERE tenant_id = current_tenant_id
    AND supplier_code ~ '^SUP[0-9]+$';
    
    supplier_code := 'SUP' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN supplier_code;
END;
$$;

-- إنشاء تريجر لتحديث المبالغ المستحقة
CREATE OR REPLACE FUNCTION public.update_supplier_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- تحديث الرصيد في جدول الموردين
        UPDATE public.suppliers
        SET current_balance = (
            SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
            FROM public.supplier_subsidiary_ledger
            WHERE supplier_id = NEW.supplier_id
        ),
        updated_at = now()
        WHERE id = NEW.supplier_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- تحديث الرصيد في جدول الموردين
        UPDATE public.suppliers
        SET current_balance = (
            SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
            FROM public.supplier_subsidiary_ledger
            WHERE supplier_id = OLD.supplier_id
        ),
        updated_at = now()
        WHERE id = OLD.supplier_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_supplier_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.supplier_subsidiary_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_supplier_balance();

-- إنشاء تريجر لتحديث المبالغ المستحقة للفواتير
CREATE OR REPLACE FUNCTION public.update_supplier_invoice_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- تحديث المبالغ في الفاتورة
    UPDATE public.supplier_invoices
    SET 
        subtotal = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM public.supplier_invoice_items
            WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM public.supplier_invoice_items
            WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
        ) + tax_amount - discount_amount,
        outstanding_amount = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM public.supplier_invoice_items
            WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
        ) + tax_amount - discount_amount - paid_amount,
        updated_at = now()
    WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_supplier_invoice_amounts
    AFTER INSERT OR UPDATE OR DELETE ON public.supplier_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_supplier_invoice_amounts();

-- إنشاء تريجر لتحديث حالة الفواتير عند المدفوعات
CREATE OR REPLACE FUNCTION public.update_supplier_invoice_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- تحديث المبالغ المدفوعة في الفاتورة
    UPDATE public.supplier_invoices
    SET 
        paid_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.supplier_payments
            WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
            AND status = 'completed'
        ),
        outstanding_amount = total_amount - (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.supplier_payments
            WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
            AND status = 'completed'
        ),
        status = CASE 
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM public.supplier_payments
                WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
                AND status = 'completed'
            ) >= total_amount THEN 'paid'
            WHEN (
                SELECT COALESCE(SUM(amount), 0)
                FROM public.supplier_payments
                WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
                AND status = 'completed'
            ) > 0 THEN 'partially_paid'
            WHEN due_date < CURRENT_DATE THEN 'overdue'
            ELSE 'pending'
        END,
        updated_at = now()
    WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_supplier_invoice_status
    AFTER INSERT OR UPDATE OR DELETE ON public.supplier_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_supplier_invoice_status();
