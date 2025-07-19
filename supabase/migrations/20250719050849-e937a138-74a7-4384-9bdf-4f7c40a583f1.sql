
-- إضافة حقول جديدة لجدول financial_periods
ALTER TABLE public.financial_periods 
ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closing_reason text,
ADD COLUMN IF NOT EXISTS reopened_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reopened_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reopening_reason text,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- تحديث السجلات الموجودة لإضافة tenant_id
UPDATE public.financial_periods 
SET tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1)
WHERE tenant_id IS NULL;

-- جعل tenant_id مطلوب
ALTER TABLE public.financial_periods 
ALTER COLUMN tenant_id SET NOT NULL;

-- إنشاء جدول سجل إقفال الفترات
CREATE TABLE IF NOT EXISTS public.period_closing_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id uuid NOT NULL REFERENCES public.financial_periods(id) ON DELETE CASCADE,
    action_type text NOT NULL CHECK (action_type IN ('close', 'reopen')),
    performed_by uuid NOT NULL REFERENCES auth.users(id),
    performed_at timestamp with time zone NOT NULL DEFAULT now(),
    reason text,
    ip_address text,
    user_agent text,
    additional_data jsonb DEFAULT '{}',
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    created_at timestamp with time zone DEFAULT now()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_period_closing_audit_period_id ON public.period_closing_audit(period_id);
CREATE INDEX IF NOT EXISTS idx_period_closing_audit_tenant_id ON public.period_closing_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_periods_tenant_id ON public.financial_periods(tenant_id);

-- تفعيل RLS على الجداول
ALTER TABLE public.period_closing_audit ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للجدول الجديد
CREATE POLICY "المحاسبون يمكنهم رؤية سجل إقفال الفترات" ON public.period_closing_audit
FOR SELECT USING (
    tenant_id = public.get_current_tenant_id() AND 
    (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

CREATE POLICY "النظام يمكنه إدراج سجلات الإقفال" ON public.period_closing_audit
FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
);

-- تحديث سياسات RLS لجدول financial_periods
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية ا" ON public.financial_periods;
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة الفترات الم" ON public.financial_periods;

CREATE POLICY "المحاسبون يمكنهم رؤية الفترات المالية" ON public.financial_periods
FOR SELECT USING (
    tenant_id = public.get_current_tenant_id() AND 
    (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

CREATE POLICY "المديرون يمكنهم إدارة الفترات المالية" ON public.financial_periods
FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND 
    (has_any_tenant_role(ARRAY['tenant_admin', 'manager']))
);

-- دالة للتحقق من حالة الفترة المالية
CREATE OR REPLACE FUNCTION public.check_period_status(period_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    period_record RECORD;
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    SELECT * INTO period_record
    FROM public.financial_periods
    WHERE tenant_id = current_tenant_id
    AND period_date BETWEEN start_date AND end_date
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_closed', false,
            'is_locked', false,
            'can_modify', true,
            'period_exists', false,
            'message', 'لا توجد فترة مالية محددة لهذا التاريخ'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'is_closed', period_record.is_closed,
        'is_locked', period_record.is_locked,
        'can_modify', NOT (period_record.is_closed OR period_record.is_locked),
        'period_exists', true,
        'period_id', period_record.id,
        'period_name', period_record.period_name,
        'closed_at', period_record.closed_at,
        'closed_by', period_record.closed_by,
        'message', CASE 
            WHEN period_record.is_locked THEN 'الفترة مقفلة ولا يمكن التعديل'
            WHEN period_record.is_closed THEN 'الفترة مغلقة - التعديل يتطلب إعادة فتح'
            ELSE 'الفترة مفتوحة للتعديل'
        END
    );
END;
$$;

-- دالة إقفال الفترة المالية
CREATE OR REPLACE FUNCTION public.close_financial_period(
    period_id_param uuid,
    closing_reason_param text DEFAULT NULL,
    user_ip text DEFAULT NULL,
    user_agent_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id uuid;
    current_user_id uuid;
    period_record RECORD;
    entries_count integer;
    unbalanced_entries integer;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    current_user_id := auth.uid();
    
    -- التحقق من الصلاحيات
    IF NOT has_any_tenant_role(ARRAY['tenant_admin', 'manager']) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ليس لديك صلاحية لإقفال الفترات المالية'
        );
    END IF;
    
    -- الحصول على بيانات الفترة
    SELECT * INTO period_record
    FROM public.financial_periods
    WHERE id = period_id_param AND tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'الفترة المالية غير موجودة'
        );
    END IF;
    
    IF period_record.is_closed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'الفترة المالية مقفلة بالفعل'
        );
    END IF;
    
    -- التحقق من وجود قيود غير متوازنة
    SELECT COUNT(*) INTO unbalanced_entries
    FROM public.journal_entries je
    WHERE je.tenant_id = current_tenant_id
    AND je.entry_date BETWEEN period_record.start_date AND period_record.end_date
    AND je.status = 'draft'
    AND ABS(je.total_debit - je.total_credit) > 0.001;
    
    IF unbalanced_entries > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'يوجد ' || unbalanced_entries || ' قيود غير متوازنة في هذه الفترة'
        );
    END IF;
    
    -- عدد القيود في الفترة
    SELECT COUNT(*) INTO entries_count
    FROM public.journal_entries je
    WHERE je.tenant_id = current_tenant_id
    AND je.entry_date BETWEEN period_record.start_date AND period_record.end_date;
    
    -- إقفال الفترة
    UPDATE public.financial_periods
    SET 
        is_closed = true,
        closed_by = current_user_id,
        closed_at = now(),
        closing_reason = closing_reason_param,
        updated_at = now()
    WHERE id = period_id_param;
    
    -- تسجيل العملية في سجل التدقيق
    INSERT INTO public.period_closing_audit (
        period_id, action_type, performed_by, reason, 
        ip_address, user_agent, tenant_id,
        additional_data
    ) VALUES (
        period_id_param, 'close', current_user_id, closing_reason_param,
        user_ip, user_agent_param, current_tenant_id,
        jsonb_build_object('entries_count', entries_count)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم إقفال الفترة المالية بنجاح',
        'period_name', period_record.period_name,
        'entries_count', entries_count,
        'closed_at', now()
    );
END;
$$;

-- دالة إعادة فتح الفترة المالية
CREATE OR REPLACE FUNCTION public.reopen_financial_period(
    period_id_param uuid,
    reopening_reason_param text,
    user_ip text DEFAULT NULL,
    user_agent_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id uuid;
    current_user_id uuid;
    period_record RECORD;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    current_user_id := auth.uid();
    
    -- التحقق من الصلاحيات (المديرون الماليون فقط)
    IF NOT has_any_tenant_role(ARRAY['tenant_admin', 'manager']) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ليس لديك صلاحية لإعادة فتح الفترات المالية'
        );
    END IF;
    
    -- الحصول على بيانات الفترة
    SELECT * INTO period_record
    FROM public.financial_periods
    WHERE id = period_id_param AND tenant_id = current_tenant_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'الفترة المالية غير موجودة'
        );
    END IF;
    
    IF NOT period_record.is_closed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'الفترة المالية مفتوحة بالفعل'
        );
    END IF;
    
    IF period_record.is_locked THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'الفترة المالية مقفلة نهائياً ولا يمكن إعادة فتحها'
        );
    END IF;
    
    -- إعادة فتح الفترة
    UPDATE public.financial_periods
    SET 
        is_closed = false,
        reopened_by = current_user_id,
        reopened_at = now(),
        reopening_reason = reopening_reason_param,
        updated_at = now()
    WHERE id = period_id_param;
    
    -- تسجيل العملية في سجل التدقيق
    INSERT INTO public.period_closing_audit (
        period_id, action_type, performed_by, reason, 
        ip_address, user_agent, tenant_id
    ) VALUES (
        period_id_param, 'reopen', current_user_id, reopening_reason_param,
        user_ip, user_agent_param, current_tenant_id
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم إعادة فتح الفترة المالية بنجاح',
        'period_name', period_record.period_name,
        'reopened_at', now()
    );
END;
$$;

-- منح الصلاحيات للدوال
GRANT EXECUTE ON FUNCTION public.check_period_status(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_financial_period(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_financial_period(uuid, text, text, text) TO authenticated;

-- إضافة trigger للتحقق من حالة الفترة قبل إدراج/تحديث القيود
CREATE OR REPLACE FUNCTION public.validate_period_before_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    period_status jsonb;
BEGIN
    -- التحقق من حالة الفترة المالية
    SELECT public.check_period_status(NEW.entry_date) INTO period_status;
    
    -- إذا كانت الفترة مقفلة أو غير قابلة للتعديل
    IF NOT (period_status->>'can_modify')::boolean THEN
        RAISE EXCEPTION 'لا يمكن إضافة أو تعديل القيود في هذه الفترة: %', period_status->>'message';
    END IF;
    
    RETURN NEW;
END;
$$;

-- إنشاء trigger على جدول journal_entries
DROP TRIGGER IF EXISTS validate_period_before_entry ON public.journal_entries;
CREATE TRIGGER validate_period_before_entry
    BEFORE INSERT OR UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.validate_period_before_journal_entry();

-- إضافة تعليقات على الجداول والدوال
COMMENT ON TABLE public.period_closing_audit IS 'سجل عمليات إقفال وإعادة فتح الفترات المالية';
COMMENT ON FUNCTION public.check_period_status(date) IS 'التحقق من حالة الفترة المالية لتاريخ معين';
COMMENT ON FUNCTION public.close_financial_period(uuid, text, text, text) IS 'إقفال فترة مالية مع التدقيق';
COMMENT ON FUNCTION public.reopen_financial_period(uuid, text, text, text) IS 'إعادة فتح فترة مالية مع التدقيق';
