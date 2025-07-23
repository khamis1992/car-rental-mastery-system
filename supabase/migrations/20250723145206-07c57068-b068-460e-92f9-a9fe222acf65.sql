-- المرحلة الأولى: إصلاح عزل البيانات للجداول الحرجة
-- إضافة tenant_id وتأمين RLS للجداول المفقودة

-- 1. إصلاح جدول comparison_reports (إضافة tenant_id)
ALTER TABLE public.comparison_reports 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.comparison_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparison_reports_tenant_isolation" 
ON public.comparison_reports 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 2. إصلاح جدول comparison_report_items (إضافة tenant_id)
ALTER TABLE public.comparison_report_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.comparison_report_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comparison_report_items_tenant_isolation" 
ON public.comparison_report_items 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 3. إصلاح جدول budget_items (إضافة tenant_id)
ALTER TABLE public.budget_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_items_tenant_isolation" 
ON public.budget_items 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 4. إصلاح جدول budget_approvals (إضافة tenant_id)
ALTER TABLE public.budget_approvals 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.budget_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_approvals_tenant_isolation" 
ON public.budget_approvals 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 5. إصلاح جدول budget_alerts (إضافة tenant_id)
ALTER TABLE public.budget_alerts 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_alerts_tenant_isolation" 
ON public.budget_alerts 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 6. إصلاح جدول collective_invoice_payments (إضافة tenant_id)
ALTER TABLE public.collective_invoice_payments 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.collective_invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collective_invoice_payments_tenant_isolation" 
ON public.collective_invoice_payments 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 7. إصلاح جدول collective_invoice_items (إضافة tenant_id إذا لم يكن موجوداً)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collective_invoice_items' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.collective_invoice_items 
        ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
    END IF;
END $$;

-- تأمين collective_invoice_items
ALTER TABLE public.collective_invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collective_invoice_items_tenant_isolation" ON public.collective_invoice_items;
CREATE POLICY "collective_invoice_items_tenant_isolation" 
ON public.collective_invoice_items 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 8. إصلاح جدول customer_history (إضافة tenant_id)
ALTER TABLE public.customer_history 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.customer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_history_tenant_isolation" 
ON public.customer_history 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 9. إصلاح جدول financial_summaries (إضافة tenant_id)
ALTER TABLE public.financial_summaries 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.financial_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_summaries_tenant_isolation" 
ON public.financial_summaries 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 10. إصلاح جدول invoice_items (إضافة tenant_id)
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_tenant_isolation" 
ON public.invoice_items 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 11. إصلاح جدول journal_entry_lines (تأمين RLS فقط)
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_entry_lines_tenant_isolation" ON public.journal_entry_lines;
CREATE POLICY "journal_entry_lines_tenant_isolation" 
ON public.journal_entry_lines 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 12. إصلاح جدول journal_entry_details (إضافة tenant_id)
ALTER TABLE public.journal_entry_details 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.journal_entry_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_entry_details_tenant_isolation" 
ON public.journal_entry_details 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 13. إصلاح جدول kpi_calculations (إضافة tenant_id)
ALTER TABLE public.kpi_calculations 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();

ALTER TABLE public.kpi_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_calculations_tenant_isolation" 
ON public.kpi_calculations 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 14. تأمين advanced_kpis (تحديث السياسة)
DROP POLICY IF EXISTS "Users can access advanced KPIs for their tenant" ON public.advanced_kpis;
DROP POLICY IF EXISTS "advanced_kpis_tenant_isolation" ON public.advanced_kpis;

-- إضافة tenant_id إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'advanced_kpis' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.advanced_kpis 
        ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
    END IF;
END $$;

CREATE POLICY "advanced_kpis_tenant_isolation" 
ON public.advanced_kpis 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 15. إصلاح performance_benchmarks
DROP POLICY IF EXISTS "Users can access benchmarks for their tenant" ON public.performance_benchmarks;
DROP POLICY IF EXISTS "performance_benchmarks_tenant_isolation" ON public.performance_benchmarks;

-- إضافة tenant_id إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'performance_benchmarks' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.performance_benchmarks 
        ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
    END IF;
END $$;

CREATE POLICY "performance_benchmarks_tenant_isolation" 
ON public.performance_benchmarks 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 16. إصلاح kpi_targets
DROP POLICY IF EXISTS "Users can access KPI targets for their tenant" ON public.kpi_targets;
DROP POLICY IF EXISTS "kpi_targets_tenant_isolation" ON public.kpi_targets;

-- إضافة tenant_id إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kpi_targets' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.kpi_targets 
        ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
    END IF;
END $$;

CREATE POLICY "kpi_targets_tenant_isolation" 
ON public.kpi_targets 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- إضافة triggers لضمان tenant_id للجداول الجديدة
DO $$
DECLARE
    table_name text;
    tables_to_fix text[] := ARRAY[
        'comparison_reports', 'comparison_report_items', 'budget_items', 
        'budget_approvals', 'budget_alerts', 'collective_invoice_payments',
        'customer_history', 'financial_summaries', 'invoice_items',
        'journal_entry_details', 'kpi_calculations'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_fix
    LOOP
        -- إضافة trigger لضمان tenant_id
        EXECUTE format('
            DROP TRIGGER IF EXISTS ensure_tenant_id_on_%I ON public.%I;
            CREATE TRIGGER ensure_tenant_id_on_%I
                BEFORE INSERT ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;