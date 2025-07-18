-- إنشاء جدول دفاتر الشيكات
CREATE TABLE public.checkbooks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    bank_account_id UUID NOT NULL,
    checkbook_number TEXT NOT NULL,
    start_check_number INTEGER NOT NULL,
    end_check_number INTEGER NOT NULL,
    total_checks INTEGER NOT NULL,
    used_checks INTEGER DEFAULT 0,
    remaining_checks INTEGER DEFAULT 0,
    issue_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    CONSTRAINT fk_checkbooks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_checkbooks_bank_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    CONSTRAINT chk_checkbooks_status CHECK (status IN ('active', 'completed', 'cancelled')),
    CONSTRAINT chk_start_end_numbers CHECK (end_check_number > start_check_number),
    CONSTRAINT chk_remaining_checks CHECK (remaining_checks >= 0)
);

-- إنشاء جدول الشيكات المستلمة
CREATE TABLE public.received_checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    check_number TEXT NOT NULL,
    drawer_name TEXT NOT NULL,
    drawer_account TEXT,
    amount NUMERIC(15,3) NOT NULL,
    check_date DATE NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    bank_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received',
    deposit_bank_account_id UUID,
    deposited_at TIMESTAMP WITH TIME ZONE,
    cleared_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    bounce_reason TEXT,
    reference_type TEXT,
    reference_id UUID,
    journal_entry_id UUID,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    CONSTRAINT fk_received_checks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_received_checks_bank_account FOREIGN KEY (deposit_bank_account_id) REFERENCES bank_accounts(id),
    CONSTRAINT fk_received_checks_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    CONSTRAINT chk_received_checks_status CHECK (status IN ('received', 'deposited', 'cleared', 'bounced', 'cancelled')),
    CONSTRAINT chk_received_checks_amount CHECK (amount > 0)
);

-- تحديث جدول الشيكات الموجود لإضافة ربط بدفتر الشيكات
ALTER TABLE public.checks 
ADD COLUMN checkbook_id UUID,
ADD COLUMN check_category TEXT DEFAULT 'outgoing',
ADD CONSTRAINT fk_checks_checkbook FOREIGN KEY (checkbook_id) REFERENCES checkbooks(id),
ADD CONSTRAINT chk_check_category CHECK (check_category IN ('outgoing', 'incoming'));

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_checkbooks_tenant_id ON public.checkbooks(tenant_id);
CREATE INDEX idx_checkbooks_bank_account_id ON public.checkbooks(bank_account_id);
CREATE INDEX idx_checkbooks_status ON public.checkbooks(status);

CREATE INDEX idx_received_checks_tenant_id ON public.received_checks(tenant_id);
CREATE INDEX idx_received_checks_status ON public.received_checks(status);
CREATE INDEX idx_received_checks_check_date ON public.received_checks(check_date);
CREATE INDEX idx_received_checks_due_date ON public.received_checks(due_date);

CREATE INDEX idx_checks_checkbook_id ON public.checks(checkbook_id);
CREATE INDEX idx_checks_category ON public.checks(check_category);

-- إنشاء trigger لحساب الشيكات المتبقية في دفتر الشيكات
CREATE OR REPLACE FUNCTION public.update_checkbook_remaining()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث عدد الشيكات المستخدمة والمتبقية
    UPDATE public.checkbooks 
    SET 
        used_checks = (
            SELECT COUNT(*) 
            FROM public.checks 
            WHERE checkbook_id = NEW.checkbook_id
        ),
        remaining_checks = total_checks - (
            SELECT COUNT(*) 
            FROM public.checks 
            WHERE checkbook_id = NEW.checkbook_id
        ),
        updated_at = now()
    WHERE id = NEW.checkbook_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checkbook_remaining
    AFTER INSERT OR UPDATE OR DELETE ON public.checks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_checkbook_remaining();

-- إنشاء دالة لإنشاء قيد محاسبي للشيكات المستلمة
CREATE OR REPLACE FUNCTION public.create_journal_entry_for_received_check(received_check_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    check_record RECORD;
    entry_id UUID;
    entry_number TEXT;
    bank_account_chart_id UUID;
    receivables_account_id UUID;
BEGIN
    -- جلب بيانات الشيك المستلم
    SELECT * INTO check_record
    FROM public.received_checks
    WHERE id = received_check_id;
    
    IF check_record IS NULL THEN
        RAISE EXCEPTION 'الشيك المستلم غير موجود';
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
        check_record.tenant_id, entry_number, check_record.received_date,
        'received_check', received_check_id, 
        'شيك مستلم رقم ' || check_record.check_number || ' من ' || check_record.drawer_name,
        check_record.amount, check_record.amount,
        'draft', check_record.created_by
    ) RETURNING id INTO entry_id;
    
    -- البحث عن حساب الذمم المدينة
    SELECT id INTO receivables_account_id
    FROM public.chart_of_accounts
    WHERE tenant_id = check_record.tenant_id
    AND account_code LIKE '112%'
    AND is_active = true
    LIMIT 1;
    
    IF receivables_account_id IS NULL THEN
        RAISE EXCEPTION 'لم يتم العثور على حساب الذمم المدينة';
    END IF;
    
    -- إضافة بند المدين (الذمم المدينة أو الشيكات تحت التحصيل)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, created_at
    ) VALUES (
        entry_id, receivables_account_id,
        'شيك مستلم رقم ' || check_record.check_number,
        check_record.amount, 0, now()
    );
    
    -- إضافة بند الدائن (المبيعات أو الإيرادات)
    -- سيتم تحديد الحساب بناءً على المرجع
    IF check_record.reference_type IS NOT NULL AND check_record.reference_id IS NOT NULL THEN
        -- يمكن ربطه بالفاتورة أو العقد المرجعي
        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, description, debit_amount, credit_amount, created_at
        ) VALUES (
            entry_id, receivables_account_id,
            'إيراد مقابل شيك مستلم رقم ' || check_record.check_number,
            0, check_record.amount, now()
        );
    END IF;
    
    -- تحديث الشيك المستلم بمعرف القيد
    UPDATE public.received_checks
    SET journal_entry_id = entry_id, updated_at = now()
    WHERE id = received_check_id;
    
    RETURN entry_id;
END;
$$;

-- إنشاء سياسات الحماية
ALTER TABLE public.checkbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_checks ENABLE ROW LEVEL SECURITY;

-- سياسات دفاتر الشيكات
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دفاتر الشيكات"
ON public.checkbooks
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- سياسات الشيكات المستلمة
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الشيكات المستلمة"
ON public.received_checks
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));