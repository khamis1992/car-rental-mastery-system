-- إضافة أعمدة جديدة لدعم القيود اليدوية المتقدمة
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS entry_source TEXT DEFAULT 'manual' CHECK (entry_source IN ('manual', 'automatic', 'import', 'system')),
ADD COLUMN IF NOT EXISTS entry_subtype TEXT CHECK (entry_subtype IN ('adjustment', 'correction', 'closing', 'opening', 'bank_reconciliation', 'reclassification', 'accrual', 'reversal')),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reversal_entry_id UUID,
ADD COLUMN IF NOT EXISTS reversed_by_entry_id UUID,
ADD COLUMN IF NOT EXISTS supporting_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS auto_reverse_date DATE,
ADD COLUMN IF NOT EXISTS recurring_schedule JSONB,
ADD COLUMN IF NOT EXISTS fiscal_period_id UUID,
ADD COLUMN IF NOT EXISTS department_id UUID,
ADD COLUMN IF NOT EXISTS project_id UUID;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_source ON public.journal_entries(entry_source);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_subtype ON public.journal_entries(entry_subtype);
CREATE INDEX IF NOT EXISTS idx_journal_entries_approval_status ON public.journal_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_requires_approval ON public.journal_entries(requires_approval);

-- إضافة أعمدة جديدة لسطور القيود
ALTER TABLE public.journal_entry_lines
ADD COLUMN IF NOT EXISTS line_type TEXT DEFAULT 'standard' CHECK (line_type IN ('standard', 'tax', 'discount', 'rounding', 'allocation')),
ADD COLUMN IF NOT EXISTS supporting_reference TEXT,
ADD COLUMN IF NOT EXISTS allocation_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS is_reversible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS line_notes TEXT;

-- جدول سجل الموافقات
CREATE TABLE IF NOT EXISTS public.journal_entry_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL,
    approval_level INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL
);

-- جدول قوالب القيود
CREATE TABLE IF NOT EXISTS public.journal_entry_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL,
    template_name_en TEXT,
    description TEXT,
    entry_type TEXT NOT NULL,
    entry_subtype TEXT,
    template_lines JSONB NOT NULL,
    default_accounts JSONB,
    requires_approval BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL
);

-- جدول التحقق التلقائي من القيود
CREATE TABLE IF NOT EXISTS public.journal_entry_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    validation_type TEXT NOT NULL,
    validation_status TEXT NOT NULL CHECK (validation_status IN ('passed', 'failed', 'warning')),
    validation_message TEXT,
    validation_details JSONB,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tenant_id UUID NOT NULL
);

-- دالة للتحقق من توازن القيد
CREATE OR REPLACE FUNCTION public.validate_journal_entry_balance(entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_debit NUMERIC := 0;
    total_credit NUMERIC := 0;
BEGIN
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debit, total_credit
    FROM public.journal_entry_lines
    WHERE journal_entry_id = entry_id;
    
    RETURN total_debit = total_credit;
END;
$$;

-- دالة للتحقق من صحة الحسابات
CREATE OR REPLACE FUNCTION public.validate_journal_entry_accounts(entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invalid_accounts INTEGER := 0;
BEGIN
    SELECT COUNT(*)
    INTO invalid_accounts
    FROM public.journal_entry_lines jel
    LEFT JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
    WHERE jel.journal_entry_id = entry_id
    AND (coa.id IS NULL OR coa.allow_posting = false OR coa.is_active = false);
    
    RETURN invalid_accounts = 0;
END;
$$;

-- دالة تنفيذ التحقق التلقائي
CREATE OR REPLACE FUNCTION public.run_journal_entry_validations(entry_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant UUID;
    balance_valid BOOLEAN;
    accounts_valid BOOLEAN;
BEGIN
    current_tenant := public.get_current_tenant_id();
    
    -- حذف التحققات السابقة
    DELETE FROM public.journal_entry_validations 
    WHERE journal_entry_id = entry_id;
    
    -- التحقق من التوازن
    balance_valid := public.validate_journal_entry_balance(entry_id);
    INSERT INTO public.journal_entry_validations (
        journal_entry_id, validation_type, validation_status, validation_message, tenant_id
    ) VALUES (
        entry_id, 
        'balance_check', 
        CASE WHEN balance_valid THEN 'passed' ELSE 'failed' END,
        CASE WHEN balance_valid THEN 'القيد متوازن' ELSE 'القيد غير متوازن - مجموع المدين لا يساوي مجموع الدائن' END,
        current_tenant
    );
    
    -- التحقق من صحة الحسابات
    accounts_valid := public.validate_journal_entry_accounts(entry_id);
    INSERT INTO public.journal_entry_validations (
        journal_entry_id, validation_type, validation_status, validation_message, tenant_id
    ) VALUES (
        entry_id,
        'accounts_check',
        CASE WHEN accounts_valid THEN 'passed' ELSE 'failed' END,
        CASE WHEN accounts_valid THEN 'جميع الحسابات صحيحة ومفعلة' ELSE 'يوجد حسابات غير صحيحة أو غير مفعلة' END,
        current_tenant
    );
END;
$$;

-- ترايجر تشغيل التحقق التلقائي عند إضافة أو تعديل القيد
CREATE OR REPLACE FUNCTION public.trigger_journal_entry_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM public.run_journal_entry_validations(NEW.id);
    RETURN NEW;
END;
$$;

-- إنشاء الترايجر
DROP TRIGGER IF EXISTS journal_entry_validation_trigger ON public.journal_entries;
CREATE TRIGGER journal_entry_validation_trigger
    AFTER INSERT OR UPDATE ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_journal_entry_validation();

-- ترايجر للتحقق عند تعديل سطور القيد
DROP TRIGGER IF EXISTS journal_entry_lines_validation_trigger ON public.journal_entry_lines;
CREATE TRIGGER journal_entry_lines_validation_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_journal_entry_validation();

-- سياسات الأمان
ALTER TABLE public.journal_entry_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_validations ENABLE ROW LEVEL SECURITY;

-- سياسات للموافقات
CREATE POLICY "المحاسبون يمكنهم إدارة الموافقات" ON public.journal_entry_approvals
FOR ALL USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

-- سياسات للقوالب
CREATE POLICY "المحاسبون يمكنهم إدارة القوالب" ON public.journal_entry_templates
FOR ALL USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

-- سياسات للتحققات
CREATE POLICY "المحاسبون يمكنهم رؤية التحققات" ON public.journal_entry_validations
FOR SELECT USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "النظام يمكنه إدراج التحققات" ON public.journal_entry_validations
FOR INSERT WITH CHECK (true);