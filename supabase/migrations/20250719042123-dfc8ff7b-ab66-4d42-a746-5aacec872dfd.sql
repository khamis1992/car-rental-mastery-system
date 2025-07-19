
-- إضافة حقول جديدة لجدول دليل الحسابات لنظام القفل
ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS first_transaction_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS modification_requires_approval BOOLEAN DEFAULT FALSE;

-- إنشاء جدول طلبات تعديل الحسابات
CREATE TABLE IF NOT EXISTS public.account_modification_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    approver_id UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('update_code', 'update_name', 'update_type', 'update_category', 'deactivate', 'other')),
    current_values JSONB NOT NULL DEFAULT '{}',
    proposed_values JSONB NOT NULL DEFAULT '{}',
    justification TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

-- إنشاء جدول سجل التدقيق للحسابات
CREATE TABLE IF NOT EXISTS public.account_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'locked', 'unlocked', 'approved_modification', 'rejected_modification')),
    old_values JSONB,
    new_values JSONB,
    modification_request_id UUID REFERENCES public.account_modification_requests(id),
    ip_address TEXT,
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_account_modification_requests_account_id ON public.account_modification_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_account_modification_requests_tenant_id ON public.account_modification_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_account_modification_requests_status ON public.account_modification_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_modification_requests_requester ON public.account_modification_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_account_audit_log_account_id ON public.account_audit_log(account_id);
CREATE INDEX IF NOT EXISTS idx_account_audit_log_tenant_id ON public.account_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_account_audit_log_created_at ON public.account_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_locked ON public.chart_of_accounts(is_locked) WHERE is_locked = true;

-- تمكين Row Level Security
ALTER TABLE public.account_modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_audit_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لطلبات تعديل الحسابات
CREATE POLICY "المحاسبون يمكنهم رؤية طلبات التعديل" ON public.account_modification_requests
    FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون يمكنهم إنشاء طلبات التعديل" ON public.account_modification_requests
    FOR INSERT TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المديرون المختصون يمكنهم تحديث طلبات التعديل" ON public.account_modification_requests
    FOR UPDATE TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- سياسات الأمان لسجل التدقيق
CREATE POLICY "المحاسبون يمكنهم رؤية سجل التدقيق" ON public.account_audit_log
    FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "النظام يمكنه إدراج سجلات التدقيق" ON public.account_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- دالة للتحقق من وجود معاملات مالية للحساب
CREATE OR REPLACE FUNCTION public.has_financial_transactions(account_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من وجود معاملات في دفتر اليومية
    IF EXISTS (
        SELECT 1 FROM public.journal_entry_lines 
        WHERE account_id = account_id_param
        LIMIT 1
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- التحقق من وجود معاملات في دفتر الأستاذ المساعد للعملاء
    IF EXISTS (
        SELECT 1 FROM public.customer_subsidiary_ledger 
        WHERE account_id = account_id_param
        LIMIT 1
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- دالة لقفل الحساب تلقائياً عند أول معاملة
CREATE OR REPLACE FUNCTION public.auto_lock_account_on_first_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    account_record RECORD;
BEGIN
    -- الحصول على معلومات الحساب
    SELECT * INTO account_record 
    FROM public.chart_of_accounts 
    WHERE id = NEW.account_id;
    
    -- إذا لم يكن الحساب مقفلاً وليس لديه تاريخ أول معاملة
    IF account_record.is_locked = FALSE AND account_record.first_transaction_date IS NULL THEN
        -- قفل الحساب وتسجيل تاريخ أول معاملة
        UPDATE public.chart_of_accounts 
        SET 
            is_locked = TRUE,
            first_transaction_date = now(),
            locked_at = now(),
            locked_by = auth.uid(),
            modification_requires_approval = TRUE
        WHERE id = NEW.account_id;
        
        -- تسجيل في سجل التدقيق
        INSERT INTO public.account_audit_log (
            account_id, user_id, tenant_id, action_type, 
            new_values, notes
        ) VALUES (
            NEW.account_id, 
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 
            account_record.tenant_id,
            'locked',
            jsonb_build_object(
                'is_locked', true,
                'first_transaction_date', now(),
                'reason', 'auto_locked_on_first_transaction'
            ),
            'تم قفل الحساب تلقائياً عند أول معاملة مالية'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- إنشاء المحفزات لقفل الحسابات تلقائياً
CREATE TRIGGER trigger_auto_lock_on_journal_entry
    AFTER INSERT ON public.journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_lock_account_on_first_transaction();

CREATE TRIGGER trigger_auto_lock_on_customer_ledger
    AFTER INSERT ON public.customer_subsidiary_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_lock_account_on_first_transaction();

-- دالة للتحقق من صلاحية تعديل الحساب
CREATE OR REPLACE FUNCTION public.can_modify_account(account_id_param UUID, user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    account_record RECORD;
    result JSONB;
BEGIN
    -- الحصول على معلومات الحساب
    SELECT * INTO account_record 
    FROM public.chart_of_accounts 
    WHERE id = account_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'can_modify', false,
            'reason', 'account_not_found',
            'requires_approval', false
        );
    END IF;
    
    -- إذا كان الحساب غير مقفل، يمكن التعديل مباشرة
    IF account_record.is_locked = FALSE THEN
        RETURN jsonb_build_object(
            'can_modify', true,
            'reason', 'account_not_locked',
            'requires_approval', false
        );
    END IF;
    
    -- إذا كان المستخدم مديراً مالياً، يمكنه التعديل مباشرة
    IF has_role(user_id_param, 'admin'::user_role) THEN
        RETURN jsonb_build_object(
            'can_modify', true,
            'reason', 'admin_override',
            'requires_approval', false
        );
    END IF;
    
    -- خلاف ذلك، يتطلب موافقة
    RETURN jsonb_build_object(
        'can_modify', false,
        'reason', 'account_locked_requires_approval',
        'requires_approval', true,
        'has_transactions', public.has_financial_transactions(account_id_param)
    );
END;
$$;
