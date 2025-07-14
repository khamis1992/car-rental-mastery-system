-- إنشاء جداول نظام تتبع العملاء المحاسبي المتكامل

-- جدول حسابات العملاء التفصيلية (Customer Subsidiary Ledger)
CREATE TABLE IF NOT EXISTS public.customer_subsidiary_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    journal_entry_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_amount NUMERIC(15,3) DEFAULT 0,
    credit_amount NUMERIC(15,3) DEFAULT 0,
    running_balance NUMERIC(15,3) DEFAULT 0,
    reference_type TEXT NOT NULL, -- 'invoice', 'payment', 'adjustment', 'refund'
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    tenant_id UUID NOT NULL,
    CONSTRAINT fk_customer_subsidiary_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_subsidiary_journal FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_subsidiary_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- جدول كشوف حسابات العملاء (Customer Statements)
CREATE TABLE IF NOT EXISTS public.customer_statements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    statement_date DATE NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    opening_balance NUMERIC(15,3) DEFAULT 0,
    closing_balance NUMERIC(15,3) DEFAULT 0,
    total_debits NUMERIC(15,3) DEFAULT 0,
    total_credits NUMERIC(15,3) DEFAULT 0,
    statement_data JSONB NOT NULL DEFAULT '{}',
    generated_by UUID,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed')),
    tenant_id UUID NOT NULL,
    CONSTRAINT fk_customer_statements_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_statements_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- جدول تحليل أعمار الديون (Aging Analysis)
CREATE TABLE IF NOT EXISTS public.customer_aging_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    analysis_date DATE NOT NULL,
    current_amount NUMERIC(15,3) DEFAULT 0, -- 0-30 days
    days_30_60 NUMERIC(15,3) DEFAULT 0,     -- 31-60 days
    days_61_90 NUMERIC(15,3) DEFAULT 0,     -- 61-90 days
    days_91_120 NUMERIC(15,3) DEFAULT 0,    -- 91-120 days
    over_120_days NUMERIC(15,3) DEFAULT 0,  -- Over 120 days
    total_outstanding NUMERIC(15,3) DEFAULT 0,
    oldest_invoice_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    tenant_id UUID NOT NULL,
    CONSTRAINT fk_customer_aging_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_aging_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- جدول تتبع معاملات العملاء (Customer Transaction Log)
CREATE TABLE IF NOT EXISTS public.customer_transaction_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    transaction_type TEXT NOT NULL, -- 'invoice_created', 'payment_received', 'credit_applied', 'adjustment'
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    amount NUMERIC(15,3) NOT NULL,
    description TEXT NOT NULL,
    reference_type TEXT, -- 'invoice', 'payment', 'credit_note', 'adjustment'
    reference_id UUID,
    journal_entry_id UUID,
    balance_before NUMERIC(15,3) DEFAULT 0,
    balance_after NUMERIC(15,3) DEFAULT 0,
    created_by UUID,
    tenant_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    CONSTRAINT fk_customer_transaction_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_transaction_journal FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    CONSTRAINT fk_customer_transaction_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- جدول إعدادات تتبع العملاء (Customer Tracking Settings)
CREATE TABLE IF NOT EXISTS public.customer_tracking_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    auto_generate_statements BOOLEAN DEFAULT true,
    statement_frequency TEXT DEFAULT 'monthly' CHECK (statement_frequency IN ('weekly', 'monthly', 'quarterly')),
    aging_analysis_frequency TEXT DEFAULT 'weekly' CHECK (aging_analysis_frequency IN ('daily', 'weekly', 'monthly')),
    credit_limit_alerts BOOLEAN DEFAULT true,
    overdue_payment_alerts BOOLEAN DEFAULT true,
    aging_thresholds JSONB DEFAULT '{"current": 30, "warning": 60, "overdue": 90, "critical": 120}',
    auto_send_statements BOOLEAN DEFAULT false,
    statement_email_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    CONSTRAINT fk_customer_tracking_settings_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT unique_customer_tracking_settings_per_tenant UNIQUE (tenant_id)
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_customer_subsidiary_ledger_customer_date ON public.customer_subsidiary_ledger(customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_subsidiary_ledger_journal ON public.customer_subsidiary_ledger(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_customer_subsidiary_ledger_reference ON public.customer_subsidiary_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_customer_subsidiary_ledger_tenant ON public.customer_subsidiary_ledger(tenant_id);

CREATE INDEX IF NOT EXISTS idx_customer_statements_customer_date ON public.customer_statements(customer_id, statement_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_statements_tenant ON public.customer_statements(tenant_id);

CREATE INDEX IF NOT EXISTS idx_customer_aging_customer_date ON public.customer_aging_analysis(customer_id, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_aging_tenant ON public.customer_aging_analysis(tenant_id);

CREATE INDEX IF NOT EXISTS idx_customer_transaction_log_customer_date ON public.customer_transaction_log(customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_transaction_log_type ON public.customer_transaction_log(transaction_type);
CREATE INDEX IF NOT EXISTS idx_customer_transaction_log_tenant ON public.customer_transaction_log(tenant_id);

-- تمكين Row Level Security
ALTER TABLE public.customer_subsidiary_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_aging_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tracking_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
-- Customer Subsidiary Ledger Policies
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة سجلات العملاء" ON public.customer_subsidiary_ledger
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- Customer Statements Policies
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة كشوف الحسابات" ON public.customer_statements
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- Customer Aging Analysis Policies
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تحليل أعمار الديون" ON public.customer_aging_analysis
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- Customer Transaction Log Policies
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية سجل معاملات العملاء" ON public.customer_transaction_log
    FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));

CREATE POLICY "النظام يمكنه إدراج سجلات المعاملات تلقائياً" ON public.customer_transaction_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Customer Tracking Settings Policies
CREATE POLICY "المديرون يمكنهم إدارة إعدادات تتبع العملاء" ON public.customer_tracking_settings
    FOR ALL TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- إنشاء دالة لتحديث رصيد العميل الجاري
CREATE OR REPLACE FUNCTION public.update_customer_running_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance NUMERIC(15,3) := 0;
BEGIN
    -- حساب الرصيد الجاري للعميل
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    INTO current_balance
    FROM public.customer_subsidiary_ledger
    WHERE customer_id = NEW.customer_id
    AND transaction_date <= NEW.transaction_date
    AND id <= NEW.id;
    
    -- تحديث الرصيد الجاري للسجل الحالي
    NEW.running_balance := current_balance;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث الرصيد الجاري تلقائياً
CREATE TRIGGER update_customer_running_balance_trigger
    BEFORE INSERT OR UPDATE ON public.customer_subsidiary_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_customer_running_balance();

-- إنشاء دالة لتسجيل معاملات العملاء تلقائياً
CREATE OR REPLACE FUNCTION public.log_customer_transaction()
RETURNS TRIGGER AS $$
DECLARE
    customer_balance NUMERIC(15,3) := 0;
    transaction_amount NUMERIC(15,3) := 0;
    balance_before NUMERIC(15,3) := 0;
    balance_after NUMERIC(15,3) := 0;
BEGIN
    -- حساب مبلغ المعاملة
    transaction_amount := NEW.debit_amount - NEW.credit_amount;
    
    -- حساب الرصيد قبل المعاملة
    SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
    INTO balance_before
    FROM public.customer_subsidiary_ledger
    WHERE customer_id = NEW.customer_id
    AND transaction_date < NEW.transaction_date;
    
    balance_after := balance_before + transaction_amount;
    
    -- إدراج سجل في جدول تتبع المعاملات
    INSERT INTO public.customer_transaction_log (
        customer_id,
        transaction_type,
        transaction_date,
        amount,
        description,
        reference_type,
        reference_id,
        journal_entry_id,
        balance_before,
        balance_after,
        tenant_id
    ) VALUES (
        NEW.customer_id,
        CASE 
            WHEN NEW.debit_amount > 0 THEN 'debit_entry'
            WHEN NEW.credit_amount > 0 THEN 'credit_entry'
            ELSE 'adjustment'
        END,
        NEW.transaction_date,
        ABS(transaction_amount),
        NEW.description,
        NEW.reference_type,
        NEW.reference_id,
        NEW.journal_entry_id,
        balance_before,
        balance_after,
        NEW.tenant_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتسجيل معاملات العملاء تلقائياً
CREATE TRIGGER log_customer_transaction_trigger
    AFTER INSERT ON public.customer_subsidiary_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.log_customer_transaction();

-- إنشاء دالة لحساب تحليل أعمار الديون
CREATE OR REPLACE FUNCTION public.calculate_customer_aging(customer_id_param UUID, analysis_date_param DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    aging_result JSONB;
    current_amt NUMERIC(15,3) := 0;
    days_30_60_amt NUMERIC(15,3) := 0;
    days_61_90_amt NUMERIC(15,3) := 0;
    days_91_120_amt NUMERIC(15,3) := 0;
    over_120_amt NUMERIC(15,3) := 0;
    total_amt NUMERIC(15,3) := 0;
    oldest_date DATE;
BEGIN
    -- حساب المبالغ حسب الفترات العمرية
    SELECT
        COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) <= 30 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) BETWEEN 31 AND 60 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) BETWEEN 61 AND 90 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) BETWEEN 91 AND 120 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) > 120 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
        COALESCE(SUM(debit_amount - credit_amount), 0),
        MIN(CASE WHEN (debit_amount - credit_amount) > 0 THEN transaction_date ELSE NULL END)
    INTO current_amt, days_30_60_amt, days_61_90_amt, days_91_120_amt, over_120_amt, total_amt, oldest_date
    FROM public.customer_subsidiary_ledger
    WHERE customer_id = customer_id_param
    AND transaction_date <= analysis_date_param;
    
    aging_result := jsonb_build_object(
        'current_amount', current_amt,
        'days_30_60', days_30_60_amt,
        'days_61_90', days_61_90_amt,
        'days_91_120', days_91_120_amt,
        'over_120_days', over_120_amt,
        'total_outstanding', total_amt,
        'oldest_invoice_date', oldest_date
    );
    
    RETURN aging_result;
END;
$$ LANGUAGE plpgsql;