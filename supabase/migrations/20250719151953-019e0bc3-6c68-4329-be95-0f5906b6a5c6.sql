
-- إنشاء جدول قواعد الأتمتة المحسن
CREATE TABLE IF NOT EXISTS public.journal_automation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN ('contract_created', 'invoice_generated', 'payment_received', 'expense_recorded', 'rental_completed', 'maintenance_completed')),
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    account_mappings JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    execution_count INTEGER NOT NULL DEFAULT 0,
    last_executed TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    
    CONSTRAINT fk_journal_automation_rules_tenant 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- إنشاء جدول تنفيذ قواعد الأتمتة
CREATE TABLE IF NOT EXISTS public.journal_automation_executions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID NOT NULL,
    triggered_by TEXT NOT NULL,
    reference_id UUID NOT NULL,
    reference_type TEXT NOT NULL,
    journal_entry_id UUID,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    execution_time_ms INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT fk_journal_automation_executions_rule 
    FOREIGN KEY (rule_id) REFERENCES public.journal_automation_rules(id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_automation_executions_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE SET NULL
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_journal_automation_rules_tenant_id ON public.journal_automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_automation_rules_trigger_event ON public.journal_automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_journal_automation_rules_is_active ON public.journal_automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_journal_automation_executions_rule_id ON public.journal_automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_journal_automation_executions_executed_at ON public.journal_automation_executions(executed_at);

-- تفعيل Row Level Security
ALTER TABLE public.journal_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_automation_executions ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS لقواعد الأتمتة
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة قواعد الأتمتة"
ON public.journal_automation_rules
FOR ALL
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
);

-- إنشاء سياسات RLS لسجل التنفيذ
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية سجل التنفيذ"
ON public.journal_automation_executions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.journal_automation_rules jar 
        WHERE jar.id = rule_id 
        AND jar.tenant_id = get_current_tenant_id()
    ) AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR 
     has_role(auth.uid(), 'accountant'::user_role))
);

CREATE POLICY "النظام يمكنه إدراج سجلات التنفيذ"
ON public.journal_automation_executions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.journal_automation_rules jar 
        WHERE jar.id = rule_id 
        AND jar.tenant_id = get_current_tenant_id()
    )
);

-- إنشاء وظيفة لتنفيذ قواعد الأتمتة
CREATE OR REPLACE FUNCTION public.execute_automation_rule(
    rule_id_param UUID,
    reference_id_param UUID,
    reference_type_param TEXT,
    transaction_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rule_record RECORD;
    journal_entry_id UUID;
    current_tenant_id UUID;
    execution_start_time BIGINT;
    result JSONB;
BEGIN
    current_tenant_id := get_current_tenant_id();
    execution_start_time := EXTRACT(EPOCH FROM clock_timestamp()) * 1000;
    
    -- جلب قاعدة الأتمتة
    SELECT * INTO rule_record
    FROM public.journal_automation_rules
    WHERE id = rule_id_param 
    AND tenant_id = current_tenant_id 
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'قاعدة الأتمتة غير موجودة أو غير نشطة'
        );
    END IF;
    
    -- التحقق من الشروط
    IF NOT public.evaluate_automation_conditions(rule_record.conditions, transaction_data) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'الشروط غير مطابقة'
        );
    END IF;
    
    -- إنشاء القيد المحاسبي
    SELECT public.create_automated_journal_entry(
        rule_id_param,
        reference_type_param,
        reference_id_param,
        transaction_data
    ) INTO journal_entry_id;
    
    -- تسجيل التنفيذ الناجح
    INSERT INTO public.journal_automation_executions (
        rule_id, triggered_by, reference_id, reference_type,
        journal_entry_id, status, executed_at, execution_time_ms
    ) VALUES (
        rule_id_param, 'system', reference_id_param, reference_type_param,
        journal_entry_id, 'completed', now(),
        (EXTRACT(EPOCH FROM clock_timestamp()) * 1000 - execution_start_time)::INTEGER
    );
    
    -- تحديث إحصائيات القاعدة
    UPDATE public.journal_automation_rules
    SET 
        execution_count = execution_count + 1,
        success_rate = (
            SELECT (COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)) * 100
            FROM public.journal_automation_executions
            WHERE rule_id = rule_id_param
        ),
        last_executed = now()
    WHERE id = rule_id_param;
    
    result := jsonb_build_object(
        'success', true,
        'journal_entry_id', journal_entry_id,
        'rule_name', rule_record.rule_name,
        'execution_time_ms', (EXTRACT(EPOCH FROM clock_timestamp()) * 1000 - execution_start_time)::INTEGER
    );
    
    RETURN result;
    
EXCEPTION WHEN others THEN
    -- تسجيل الفشل
    INSERT INTO public.journal_automation_executions (
        rule_id, triggered_by, reference_id, reference_type,
        status, error_message, executed_at, execution_time_ms
    ) VALUES (
        rule_id_param, 'system', reference_id_param, reference_type_param,
        'failed', SQLERRM, now(),
        (EXTRACT(EPOCH FROM clock_timestamp()) * 1000 - execution_start_time)::INTEGER
    );
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- إنشاء وظيفة لتقييم شروط الأتمتة
CREATE OR REPLACE FUNCTION public.evaluate_automation_conditions(
    conditions JSONB,
    transaction_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    condition_key TEXT;
    condition_value JSONB;
    transaction_value JSONB;
BEGIN
    -- إذا لم تكن هناك شروط، فالقاعدة تنطبق
    IF conditions = '{}'::jsonb OR conditions IS NULL THEN
        RETURN true;
    END IF;
    
    -- فحص كل شرط
    FOR condition_key, condition_value IN SELECT * FROM jsonb_each(conditions)
    LOOP
        transaction_value := transaction_data -> condition_key;
        
        -- إذا كان الشرط غير مطابق، ارجع false
        IF transaction_value IS NULL OR transaction_value != condition_value THEN
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$;

-- إنشاء وظيفة لإعداد قواعد الأتمتة الافتراضية
CREATE OR REPLACE FUNCTION public.setup_default_automation_rules(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cash_account_id UUID;
    receivables_account_id UUID;
    revenue_account_id UUID;
    expense_account_id UUID;
    rules_created INTEGER := 0;
BEGIN
    -- جلب الحسابات المطلوبة
    SELECT id INTO cash_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param AND account_code LIKE '1110%' AND is_active = true LIMIT 1;
    
    SELECT id INTO receivables_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param AND account_code LIKE '1130%' AND is_active = true LIMIT 1;
    
    SELECT id INTO revenue_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param AND account_code LIKE '411%' AND is_active = true LIMIT 1;
    
    SELECT id INTO expense_account_id 
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param AND account_code LIKE '51%' AND is_active = true LIMIT 1;
    
    -- قاعدة أتمتة الفواتير
    IF receivables_account_id IS NOT NULL AND revenue_account_id IS NOT NULL THEN
        INSERT INTO public.journal_automation_rules (
            tenant_id, rule_name, trigger_event, conditions, account_mappings, created_by
        ) VALUES (
            tenant_id_param,
            'قيود الفواتير التلقائية',
            'invoice_generated',
            '{"invoice_type": "rental"}'::jsonb,
            jsonb_build_object(
                'debit_account_id', receivables_account_id,
                'credit_account_id', revenue_account_id,
                'description_template', 'قيد فاتورة تأجير رقم {{invoice_number}}'
            ),
            auth.uid()
        );
        rules_created := rules_created + 1;
    END IF;
    
    -- قاعدةأتمتة المدفوعات
    IF cash_account_id IS NOT NULL AND receivables_account_id IS NOT NULL THEN
        INSERT INTO public.journal_automation_rules (
            tenant_id, rule_name, trigger_event, conditions, account_mappings, created_by
        ) VALUES (
            tenant_id_param,
            'قيود المدفوعات التلقائية',
            'payment_received',
            '{}'::jsonb,
            jsonb_build_object(
                'debit_account_id', cash_account_id,
                'credit_account_id', receivables_account_id,
                'description_template', 'قيد دفعة رقم {{payment_id}}'
            ),
            auth.uid()
        );
        rules_created := rules_created + 1;
    END IF;
    
    -- قاعدة أتمتة المصروفات
    IF expense_account_id IS NOT NULL AND cash_account_id IS NOT NULL THEN
        INSERT INTO public.journal_automation_rules (
            tenant_id, rule_name, trigger_event, conditions, account_mappings, created_by
        ) VALUES (
            tenant_id_param,
            'قيود المصروفات التلقائية',
            'expense_recorded',
            '{}'::jsonb,
            jsonb_build_object(
                'debit_account_id', expense_account_id,
                'credit_account_id', cash_account_id,
                'description_template', 'قيد مصروف {{expense_type}}'
            ),
            auth.uid()
        );
        rules_created := rules_created + 1;
    END IF;
    
    RETURN rules_created;
END;
$$;

-- إنشاط trigger لإعداد قواعد الأتمتة للمؤسسات الجديدة
CREATE OR REPLACE FUNCTION public.setup_automation_for_new_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- إعداد قواعد الأتمتة الافتراضية للمؤسسة الجديدة
    IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
        PERFORM public.setup_default_automation_rules(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- ربط الـ trigger بجدول المؤسسات
DROP TRIGGER IF EXISTS setup_automation_for_new_tenant_trigger ON public.tenants;
CREATE TRIGGER setup_automation_for_new_tenant_trigger
    AFTER INSERT OR UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.setup_automation_for_new_tenant();
