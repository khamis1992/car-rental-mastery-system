
-- إضافة حقول ناقصة في جدول الفواتير
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_category TEXT DEFAULT 'individual';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS billing_period_start DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS billing_period_end DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES public.invoices(id);

-- إضافة حقول ناقصة في جدول المدفوعات
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_category TEXT DEFAULT 'invoice_payment';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS collected_by UUID REFERENCES auth.users(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS collection_location TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- إنشاء جدول الفواتير الجماعية
CREATE TABLE IF NOT EXISTS public.collective_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_contracts INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    notes TEXT,
    auto_generated BOOLEAN DEFAULT true
);

-- إنشاء جدول تفاصيل الفواتير الجماعية
CREATE TABLE IF NOT EXISTS public.collective_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collective_invoice_id UUID NOT NULL REFERENCES public.collective_invoices(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES public.contracts(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    individual_invoice_id UUID REFERENCES public.invoices(id),
    rental_amount DECIMAL(10,3) NOT NULL,
    additional_charges DECIMAL(10,3) DEFAULT 0,
    discount_amount DECIMAL(10,3) DEFAULT 0,
    tax_amount DECIMAL(10,3) DEFAULT 0,
    total_amount DECIMAL(10,3) NOT NULL,
    rental_days INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
);

-- إنشاء جدول ربط المدفوعات بالفواتير الجماعية
CREATE TABLE IF NOT EXISTS public.collective_invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collective_invoice_id UUID NOT NULL REFERENCES public.collective_invoices(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    allocation_amount DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    UNIQUE(collective_invoice_id, payment_id)
);

-- إنشاء جدول سجلات التحصيل
CREATE TABLE IF NOT EXISTS public.collection_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id),
    collection_type TEXT NOT NULL CHECK (collection_type IN ('cash', 'bank_transfer', 'check', 'credit_card', 'online')),
    collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collection_amount DECIMAL(10,3) NOT NULL,
    collector_id UUID NOT NULL REFERENCES auth.users(id),
    collection_location TEXT,
    bank_name TEXT,
    account_number TEXT,
    check_number TEXT,
    reference_number TEXT,
    collection_notes TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
);

-- إنشاء جدول إعدادات الفوترة التلقائية
CREATE TABLE IF NOT EXISTS public.auto_billing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    enabled BOOLEAN NOT NULL DEFAULT true,
    billing_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_frequency IN ('weekly', 'monthly', 'quarterly')),
    billing_day INTEGER NOT NULL DEFAULT 1,
    due_days INTEGER NOT NULL DEFAULT 30,
    auto_send_invoices BOOLEAN NOT NULL DEFAULT false,
    auto_send_reminders BOOLEAN NOT NULL DEFAULT false,
    reminder_days_before INTEGER NOT NULL DEFAULT 7,
    late_fee_enabled BOOLEAN NOT NULL DEFAULT false,
    late_fee_amount DECIMAL(10,3) DEFAULT 0,
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(tenant_id)
);

-- إنشاء جدول سجل الفوترة التلقائية
CREATE TABLE IF NOT EXISTS public.auto_billing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_invoices_generated INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
    execution_status TEXT NOT NULL DEFAULT 'success' CHECK (execution_status IN ('success', 'failed', 'partial')),
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_collective_invoices_period ON public.collective_invoices(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_collective_invoices_status ON public.collective_invoices(status);
CREATE INDEX IF NOT EXISTS idx_collective_invoice_items_contract ON public.collective_invoice_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_collective_invoice_items_customer ON public.collective_invoice_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_records_payment ON public.collection_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_collection_records_date ON public.collection_records(collection_date);
CREATE INDEX IF NOT EXISTS idx_collection_records_type ON public.collection_records(collection_type);

-- إضافة RLS للجداول الجديدة
ALTER TABLE public.collective_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_billing_log ENABLE ROW LEVEL SECURITY;

-- RLS policies للفواتير الجماعية
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية الفواتير الجماعية"
ON public.collective_invoices FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة الفواتير الجماعية"
ON public.collective_invoices FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)));

-- RLS policies لتفاصيل الفواتير الجماعية
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية تفاصيل الفواتير الجماعية"
ON public.collective_invoice_items FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة تفاصيل الفواتير الجماعية"
ON public.collective_invoice_items FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)));

-- RLS policies لمدفوعات الفواتير الجماعية
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية مدفوعات الفواتير الجماعية"
ON public.collective_invoice_payments FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة مدفوعات الفواتير الجماعية"
ON public.collective_invoice_payments FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)));

-- RLS policies لسجلات التحصيل
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية سجلات التحصيل"
ON public.collection_records FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة سجلات التحصيل"
ON public.collection_records FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role)));

-- RLS policies لإعدادات الفوترة التلقائية
CREATE POLICY "المديرون يمكنهم إدارة إعدادات الفوترة التلقائية"
ON public.auto_billing_settings FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role)));

-- RLS policies لسجل الفوترة التلقائية
CREATE POLICY "المديرون يمكنهم رؤية سجل الفوترة التلقائية"
ON public.auto_billing_log FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)));

CREATE POLICY "النظام يمكنه إدراج سجلات الفوترة التلقائية"
ON public.auto_billing_log FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_current_tenant_id());

-- إنشاء دالة لإنشاء الفواتير الجماعية
CREATE OR REPLACE FUNCTION generate_collective_invoice(
    period_start DATE,
    period_end DATE,
    due_days INTEGER DEFAULT 30
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    collective_invoice_id UUID;
    total_contracts INTEGER := 0;
    total_amount DECIMAL(10,3) := 0;
    tax_amount DECIMAL(10,3) := 0;
    contract_record RECORD;
    current_tenant_id UUID;
    invoice_number TEXT;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- إنشاء رقم الفاتورة الجماعية
    invoice_number := 'COL-' || EXTRACT(YEAR FROM period_start) || '-' || 
                     LPAD(EXTRACT(MONTH FROM period_start)::TEXT, 2, '0') || '-' ||
                     LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
    
    -- إنشاء الفاتورة الجماعية
    INSERT INTO public.collective_invoices (
        invoice_number, billing_period_start, billing_period_end,
        due_date, status, tenant_id, created_by, auto_generated
    ) VALUES (
        invoice_number, period_start, period_end,
        period_end + INTERVAL '1 day' * due_days,
        'draft', current_tenant_id, auth.uid(), true
    ) RETURNING id INTO collective_invoice_id;
    
    -- إضافة العقود النشطة في الفترة المحددة
    FOR contract_record IN 
        SELECT c.id, c.customer_id, c.total_amount, c.daily_rate,
               (period_end - period_start + 1) as rental_days
        FROM public.contracts c
        WHERE c.tenant_id = current_tenant_id
        AND c.status = 'active'
        AND c.start_date <= period_end
        AND (c.end_date IS NULL OR c.end_date >= period_start)
    LOOP
        total_contracts := total_contracts + 1;
        total_amount := total_amount + contract_record.total_amount;
        
        -- إدراج تفاصيل الفاتورة الجماعية
        INSERT INTO public.collective_invoice_items (
            collective_invoice_id, contract_id, customer_id,
            rental_amount, total_amount, rental_days, tenant_id
        ) VALUES (
            collective_invoice_id, contract_record.id, contract_record.customer_id,
            contract_record.total_amount, contract_record.total_amount,
            contract_record.rental_days, current_tenant_id
        );
    END LOOP;
    
    -- تحديث مجاميع الفاتورة الجماعية
    UPDATE public.collective_invoices
    SET total_contracts = total_contracts,
        total_amount = total_amount,
        net_amount = total_amount
    WHERE id = collective_invoice_id;
    
    RETURN collective_invoice_id;
END;
$$;

-- إنشاء دالة لتحديث حالة الفواتير بناءً على المدفوعات
CREATE OR REPLACE FUNCTION update_collective_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث حالة الفاتورة الجماعية عند إضافة/تحديث مدفوعات
    UPDATE public.collective_invoices ci
    SET status = CASE 
        WHEN (
            SELECT COALESCE(SUM(cip.allocation_amount), 0) 
            FROM public.collective_invoice_payments cip
            JOIN public.payments p ON cip.payment_id = p.id
            WHERE cip.collective_invoice_id = ci.id AND p.status = 'completed'
        ) >= ci.total_amount THEN 'paid'
        WHEN (
            SELECT COALESCE(SUM(cip.allocation_amount), 0) 
            FROM public.collective_invoice_payments cip
            JOIN public.payments p ON cip.payment_id = p.id
            WHERE cip.collective_invoice_id = ci.id AND p.status = 'completed'
        ) > 0 THEN 'partially_paid'
        WHEN ci.due_date < CURRENT_DATE THEN 'overdue'
        ELSE 'sent'
    END,
    updated_at = now()
    WHERE ci.id = NEW.collective_invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث حالة الفواتير الجماعية
CREATE TRIGGER update_collective_invoice_status_trigger
    AFTER INSERT OR UPDATE ON public.collective_invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_collective_invoice_status();

-- إنشاء تسلسل لأرقام الفواتير إذا لم يكن موجود
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
