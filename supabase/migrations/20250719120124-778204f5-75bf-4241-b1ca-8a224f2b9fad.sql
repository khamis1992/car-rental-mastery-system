
-- إنشاء جدول لقواعد الأتمتة المتقدمة
CREATE TABLE IF NOT EXISTS public.automated_entry_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN (
        'contract_created', 'contract_completed', 'payment_received', 
        'vehicle_maintenance', 'fuel_purchase', 'invoice_generated',
        'scheduled', 'manual_trigger', 'period_end'
    )),
    conditions JSONB DEFAULT '{}',
    account_mappings JSONB NOT NULL,
    template_description TEXT,
    is_active BOOLEAN DEFAULT true,
    schedule_type TEXT CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    schedule_config JSONB DEFAULT '{}',
    next_execution_date TIMESTAMP WITH TIME ZONE,
    last_execution_date TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول لسجل تنفيذ القواعد
CREATE TABLE IF NOT EXISTS public.rule_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES public.automated_entry_rules(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    execution_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'warning')),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    error_message TEXT,
    processing_time_ms INTEGER,
    input_data JSONB,
    output_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول لمؤشرات الأداء
CREATE TABLE IF NOT EXISTS public.accounting_performance_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    kpi_type TEXT NOT NULL CHECK (kpi_type IN (
        'automation_rate', 'error_rate', 'processing_time', 
        'cost_savings', 'accuracy_score', 'coverage_percentage'
    )),
    kpi_name TEXT NOT NULL,
    current_value NUMERIC(15,4),
    target_value NUMERIC(15,4),
    previous_value NUMERIC(15,4),
    calculation_date DATE DEFAULT CURRENT_DATE,
    calculation_period TEXT DEFAULT 'monthly',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول لأدوات التصحيح
CREATE TABLE IF NOT EXISTS public.error_correction_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_type TEXT NOT NULL CHECK (tool_type IN (
        'duplicate_detector', 'balance_validator', 'missing_entry_finder',
        'account_reconciler', 'pattern_analyzer', 'anomaly_detector'
    )),
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    auto_fix_enabled BOOLEAN DEFAULT false,
    notification_enabled BOOLEAN DEFAULT true,
    last_run_date TIMESTAMP WITH TIME ZONE,
    findings_count INTEGER DEFAULT 0,
    fixes_applied INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول لسجل التصحيحات
CREATE TABLE IF NOT EXISTS public.correction_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public.error_correction_tools(id),
    detection_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    error_type TEXT NOT NULL,
    error_description TEXT NOT NULL,
    affected_entries UUID[] DEFAULT '{}',
    severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'reviewing', 'fixed', 'ignored')),
    auto_fix_applied BOOLEAN DEFAULT false,
    manual_fix_required BOOLEAN DEFAULT false,
    correction_details JSONB,
    fixed_by UUID,
    fixed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول لقوالب القيود المحاسبية
CREATE TABLE IF NOT EXISTS public.journal_entry_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_category TEXT NOT NULL,
    description TEXT,
    template_structure JSONB NOT NULL,
    variables JSONB DEFAULT '[]',
    default_values JSONB DEFAULT '{}',
    validation_rules JSONB DEFAULT '{}',
    is_system_template BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_automated_entry_rules_tenant_active ON public.automated_entry_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_automated_entry_rules_trigger_event ON public.automated_entry_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automated_entry_rules_next_execution ON public.automated_entry_rules(next_execution_date) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_rule_execution_log_rule_date ON public.rule_execution_log(rule_id, execution_date);
CREATE INDEX IF NOT EXISTS idx_rule_execution_log_status ON public.rule_execution_log(status);

CREATE INDEX IF NOT EXISTS idx_accounting_kpis_tenant_type ON public.accounting_performance_kpis(tenant_id, kpi_type);
CREATE INDEX IF NOT EXISTS idx_accounting_kpis_calculation_date ON public.accounting_performance_kpis(calculation_date);

CREATE INDEX IF NOT EXISTS idx_correction_log_tenant_status ON public.correction_log(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_correction_log_detection_date ON public.correction_log(detection_date);

-- إضافة RLS للجداول الجديدة
ALTER TABLE public.automated_entry_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_performance_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_correction_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_templates ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "tenant_isolation_automated_entry_rules" ON public.automated_entry_rules
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_rule_execution_log" ON public.rule_execution_log
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_accounting_kpis" ON public.accounting_performance_kpis
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_error_correction_tools" ON public.error_correction_tools
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_correction_log" ON public.correction_log
    FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_isolation_journal_templates" ON public.journal_entry_templates
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- إنشاء وظائف مساعدة لحساب مؤشرات الأداء
CREATE OR REPLACE FUNCTION public.calculate_automation_rate(tenant_id_param UUID, period_start DATE, period_end DATE)
RETURNS NUMERIC AS $$
DECLARE
    total_entries INTEGER;
    automated_entries INTEGER;
    automation_rate NUMERIC;
BEGIN
    -- حساب إجمالي القيود
    SELECT COUNT(*) INTO total_entries
    FROM public.journal_entries
    WHERE tenant_id = tenant_id_param
    AND entry_date BETWEEN period_start AND period_end;
    
    -- حساب القيود الآلية
    SELECT COUNT(*) INTO automated_entries
    FROM public.journal_entries
    WHERE tenant_id = tenant_id_param
    AND entry_date BETWEEN period_start AND period_end
    AND reference_type != 'manual';
    
    -- حساب معدل الأتمتة
    IF total_entries > 0 THEN
        automation_rate := (automated_entries::NUMERIC / total_entries::NUMERIC) * 100;
    ELSE
        automation_rate := 0;
    END IF;
    
    RETURN automation_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- وظيفة لحساب معدل الأخطاء
CREATE OR REPLACE FUNCTION public.calculate_error_rate(tenant_id_param UUID, period_start DATE, period_end DATE)
RETURNS NUMERIC AS $$
DECLARE
    total_executions INTEGER;
    failed_executions INTEGER;
    error_rate NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_executions
    FROM public.rule_execution_log
    WHERE tenant_id = tenant_id_param
    AND execution_date::DATE BETWEEN period_start AND period_end;
    
    SELECT COUNT(*) INTO failed_executions
    FROM public.rule_execution_log
    WHERE tenant_id = tenant_id_param
    AND execution_date::DATE BETWEEN period_start AND period_end
    AND status = 'failed';
    
    IF total_executions > 0 THEN
        error_rate := (failed_executions::NUMERIC / total_executions::NUMERIC) * 100;
    ELSE
        error_rate := 0;
    END IF;
    
    RETURN error_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- وظيفة للكشف عن القيود المكررة
CREATE OR REPLACE FUNCTION public.detect_duplicate_entries(tenant_id_param UUID)
RETURNS TABLE(
    entry_ids UUID[],
    duplicate_count INTEGER,
    total_amount NUMERIC,
    entry_date DATE,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        array_agg(je.id) as entry_ids,
        COUNT(*)::INTEGER as duplicate_count,
        je.total_debit as total_amount,
        je.entry_date,
        je.description
    FROM public.journal_entries je
    WHERE je.tenant_id = tenant_id_param
    AND je.status = 'posted'
    GROUP BY je.entry_date, je.description, je.total_debit, je.total_credit
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC, je.entry_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- وظيفة للكشف عن القيود غير المتوازنة
CREATE OR REPLACE FUNCTION public.detect_unbalanced_entries(tenant_id_param UUID)
RETURNS TABLE(
    entry_id UUID,
    entry_number TEXT,
    entry_date DATE,
    total_debit NUMERIC,
    total_credit NUMERIC,
    difference NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        je.id,
        je.entry_number,
        je.entry_date,
        je.total_debit,
        je.total_credit,
        ABS(je.total_debit - je.total_credit) as difference
    FROM public.journal_entries je
    WHERE je.tenant_id = tenant_id_param
    AND ABS(je.total_debit - je.total_credit) > 0.001
    ORDER BY difference DESC, je.entry_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- وظيفة تنفيذ قاعدة أتمتة
CREATE OR REPLACE FUNCTION public.execute_automation_rule(rule_id_param UUID, input_data JSONB DEFAULT '{}')
RETURNS UUID AS $$
DECLARE
    rule_record RECORD;
    journal_entry_id UUID;
    execution_start TIMESTAMP;
    execution_end TIMESTAMP;
    processing_time INTEGER;
    current_tenant_id UUID;
BEGIN
    execution_start := clock_timestamp();
    current_tenant_id := get_current_tenant_id();
    
    -- جلب تفاصيل القاعدة
    SELECT * INTO rule_record
    FROM public.automated_entry_rules
    WHERE id = rule_id_param 
    AND tenant_id = current_tenant_id
    AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'قاعدة الأتمتة غير موجودة أو غير نشطة';
    END IF;
    
    -- تنفيذ القاعدة (سيتم تطوير هذا الجزء في الكود)
    -- هنا سيتم إنشاء القيد المحاسبي بناءً على القاعدة
    
    execution_end := clock_timestamp();
    processing_time := EXTRACT(MILLISECONDS FROM (execution_end - execution_start));
    
    -- تسجيل نتيجة التنفيذ
    IF journal_entry_id IS NOT NULL THEN
        -- تحديث إحصائيات القاعدة
        UPDATE public.automated_entry_rules 
        SET 
            execution_count = execution_count + 1,
            success_count = success_count + 1,
            last_execution_date = now(),
            updated_at = now()
        WHERE id = rule_id_param;
        
        -- تسجيل في سجل التنفيذ
        INSERT INTO public.rule_execution_log (
            rule_id, tenant_id, status, journal_entry_id,
            processing_time_ms, input_data, output_data
        ) VALUES (
            rule_id_param, current_tenant_id, 'success', journal_entry_id,
            processing_time, input_data, jsonb_build_object('journal_entry_id', journal_entry_id)
        );
    END IF;
    
    RETURN journal_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
