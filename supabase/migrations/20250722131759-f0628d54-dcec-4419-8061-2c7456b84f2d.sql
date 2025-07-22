
-- إنشاء جدول المعاملات النقدية
CREATE TABLE public.cash_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    transaction_number TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'payment', 'transfer')),
    amount NUMERIC(15,3) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'KWD',
    from_cash_account_id UUID REFERENCES public.bank_accounts(id),
    to_cash_account_id UUID REFERENCES public.bank_accounts(id),
    reference_type TEXT CHECK (reference_type IN ('contract', 'invoice', 'supplier', 'employee', 'other')),
    reference_id UUID,
    description TEXT NOT NULL,
    received_from TEXT,
    paid_to TEXT,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'transfer', 'card')),
    check_number TEXT,
    authorization_code TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'posted', 'cancelled')),
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    -- التحقق من صحة البيانات
    CONSTRAINT chk_transfer_accounts CHECK (
        (transaction_type != 'transfer') OR 
        (from_cash_account_id IS NOT NULL AND to_cash_account_id IS NOT NULL AND from_cash_account_id != to_cash_account_id)
    ),
    CONSTRAINT chk_receipt_account CHECK (
        (transaction_type != 'receipt') OR (to_cash_account_id IS NOT NULL)
    ),
    CONSTRAINT chk_payment_account CHECK (
        (transaction_type != 'payment') OR (from_cash_account_id IS NOT NULL)
    )
);

-- تحديث جدول الشيكات لإضافة الربط مع الوحدات الأخرى
ALTER TABLE public.checks 
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id),
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id),
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS cash_transaction_id UUID REFERENCES public.cash_transactions(id);

-- تحديث جدول الشيكات المستلمة لإضافة الربط مع الوحدات الأخرى
ALTER TABLE public.received_checks 
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id),
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id),
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS cash_transaction_id UUID REFERENCES public.cash_transactions(id);

-- إنشاء جدول تتبع أرصدة النقدية اليومية
CREATE TABLE public.daily_cash_balances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    cash_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
    balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opening_balance NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_receipts NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_payments NUMERIC(15,3) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(15,3) NOT NULL DEFAULT 0,
    last_transaction_id UUID REFERENCES public.cash_transactions(id),
    reconciled BOOLEAN DEFAULT false,
    reconciled_by UUID REFERENCES auth.users(id),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    variance_amount NUMERIC(15,3) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, cash_account_id, balance_date)
);

-- إنشاء جدول تفاصيل التسوية البنكية المحسّنة
CREATE TABLE public.bank_reconciliation_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
    reconciliation_date DATE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('bank_only', 'book_only', 'timing_difference', 'error')),
    amount NUMERIC(15,3) NOT NULL,
    description TEXT NOT NULL,
    reference_number TEXT,
    transaction_date DATE,
    bank_transaction_id UUID REFERENCES public.imported_bank_transactions(id),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    cash_transaction_id UUID REFERENCES public.cash_transactions(id),
    check_id UUID REFERENCES public.checks(id),
    received_check_id UUID REFERENCES public.received_checks(id),
    reconciled BOOLEAN DEFAULT false,
    reconciled_by UUID REFERENCES auth.users(id),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_cash_transactions_tenant ON public.cash_transactions(tenant_id);
CREATE INDEX idx_cash_transactions_date ON public.cash_transactions(transaction_date);
CREATE INDEX idx_cash_transactions_type ON public.cash_transactions(transaction_type);
CREATE INDEX idx_cash_transactions_status ON public.cash_transactions(status);
CREATE INDEX idx_cash_transactions_reference ON public.cash_transactions(reference_type, reference_id);

CREATE INDEX idx_daily_cash_balances_tenant_account ON public.daily_cash_balances(tenant_id, cash_account_id);
CREATE INDEX idx_daily_cash_balances_date ON public.daily_cash_balances(balance_date);

CREATE INDEX idx_bank_reconciliation_items_tenant ON public.bank_reconciliation_items(tenant_id);
CREATE INDEX idx_bank_reconciliation_items_account ON public.bank_reconciliation_items(bank_account_id);
CREATE INDEX idx_bank_reconciliation_items_date ON public.bank_reconciliation_items(reconciliation_date);

-- تمكين RLS
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cash_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliation_items ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للمعاملات النقدية
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة المعاملات النقدية"
ON public.cash_transactions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء سياسات RLS لأرصدة النقدية اليومية
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة أرصدة النقدية"
ON public.daily_cash_balances
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء سياسات RLS لبنود التسوية البنكية
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة بنود التسوية البنكية"
ON public.bank_reconciliation_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء دالة لتوليد رقم المعاملة النقدية
CREATE OR REPLACE FUNCTION public.generate_cash_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  transaction_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ct.transaction_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.cash_transactions ct
  WHERE ct.transaction_number ~ '^CSH[0-9]+$';
  
  transaction_number := 'CSH' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN transaction_number;
END;
$$;

-- إنشاء trigger لتحديث أرصدة النقدية عند إضافة معاملة جديدة
CREATE OR REPLACE FUNCTION public.update_cash_balance_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    daily_balance_record RECORD;
    account_id UUID;
BEGIN
    -- تحديد الحساب المتأثر
    IF NEW.transaction_type = 'receipt' THEN
        account_id := NEW.to_cash_account_id;
    ELSIF NEW.transaction_type = 'payment' THEN
        account_id := NEW.from_cash_account_id;
    ELSIF NEW.transaction_type = 'transfer' THEN
        -- تحديث كلا الحسابين في حالة التحويل
        -- تحديث الحساب المرسل منه (خصم)
        UPDATE public.bank_accounts 
        SET current_balance = current_balance - NEW.amount,
            updated_at = now()
        WHERE id = NEW.from_cash_account_id;
        
        -- تحديث الحساب المرسل إليه (إضافة)
        UPDATE public.bank_accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = now()
        WHERE id = NEW.to_cash_account_id;
        
        RETURN NEW;
    END IF;
    
    -- تحديث رصيد الحساب
    IF NEW.transaction_type = 'receipt' THEN
        UPDATE public.bank_accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = now()
        WHERE id = account_id;
    ELSIF NEW.transaction_type = 'payment' THEN
        UPDATE public.bank_accounts 
        SET current_balance = current_balance - NEW.amount,
            updated_at = now()
        WHERE id = account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cash_balance_trigger
    AFTER INSERT OR UPDATE ON public.cash_transactions
    FOR EACH ROW
    WHEN (NEW.status = 'posted')
    EXECUTE FUNCTION public.update_cash_balance_on_transaction();

-- إنشاء دالة لإنشاء قيد محاسبي للمعاملات النقدية
CREATE OR REPLACE FUNCTION public.create_journal_entry_for_cash_transaction(cash_transaction_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    transaction_record RECORD;
    entry_id UUID;
    entry_number TEXT;
    cash_account_chart_id UUID;
    other_account_id UUID;
BEGIN
    -- جلب بيانات المعاملة النقدية
    SELECT * INTO transaction_record
    FROM public.cash_transactions
    WHERE id = cash_transaction_id;
    
    IF transaction_record IS NULL THEN
        RAISE EXCEPTION 'المعاملة النقدية غير موجودة';
    END IF;
    
    -- توليد رقم القيد
    SELECT 'JE-' || to_char(now(), 'YYYY') || '-' || LPAD(
        (COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '\d+$') AS INTEGER)), 0) + 1)::TEXT,
        6, '0'
    ) INTO entry_number
    FROM public.journal_entries
    WHERE tenant_id = transaction_record.tenant_id
    AND entry_number ~ '^JE-\d{4}-\d+$';
    
    -- إنشاء القيد المحاسبي
    INSERT INTO public.journal_entries (
        tenant_id, entry_number, entry_date, reference_type, reference_id,
        description, total_debit, total_credit, status, created_by
    ) VALUES (
        transaction_record.tenant_id, entry_number, transaction_record.transaction_date,
        'cash_transaction', cash_transaction_id, 
        transaction_record.description,
        transaction_record.amount, transaction_record.amount,
        'draft', transaction_record.created_by
    ) RETURNING id INTO entry_id;
    
    -- تحديد حساب النقدية
    IF transaction_record.transaction_type = 'receipt' THEN
        SELECT account_id INTO cash_account_chart_id
        FROM public.bank_accounts
        WHERE id = transaction_record.to_cash_account_id;
    ELSE
        SELECT account_id INTO cash_account_chart_id
        FROM public.bank_accounts
        WHERE id = transaction_record.from_cash_account_id;
    END IF;
    
    -- إضافة بنود القيد حسب نوع المعاملة
    IF transaction_record.transaction_type = 'receipt' THEN
        -- مدين: النقدية
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, created_at
        ) VALUES (
            entry_id, cash_account_chart_id,
            'استلام نقدي - ' || transaction_record.description,
            transaction_record.amount, 0, now()
        );
        
        -- دائن: حساب آخر (يحدد بناءً على المرجع)
        -- سيتم تحديد الحساب بناءً على نوع المرجع
        
    ELSIF transaction_record.transaction_type = 'payment' THEN
        -- دائن: النقدية
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, created_at
        ) VALUES (
            entry_id, cash_account_chart_id,
            'دفع نقدي - ' || transaction_record.description,
            0, transaction_record.amount, now()
        );
        
        -- مدين: حساب آخر (يحدد بناءً على المرجع)
        
    END IF;
    
    -- تحديث المعاملة النقدية بمعرف القيد
    UPDATE public.cash_transactions
    SET journal_entry_id = entry_id, updated_at = now()
    WHERE id = cash_transaction_id;
    
    RETURN entry_id;
END;
$$;
