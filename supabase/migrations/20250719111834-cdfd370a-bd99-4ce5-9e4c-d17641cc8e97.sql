
-- إنشاء جدول لحفظ المقارنات المالية
CREATE TABLE IF NOT EXISTS public.financial_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    comparison_name TEXT NOT NULL,
    base_period_start DATE NOT NULL,
    base_period_end DATE NOT NULL,
    comparison_period_start DATE NOT NULL,
    comparison_period_end DATE NOT NULL,
    comparison_data JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول للتقارير المالية المحفوظة
CREATE TABLE IF NOT EXISTS public.saved_financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    report_data JSONB DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول لسجل التصدير
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_id UUID,
    report_type TEXT NOT NULL,
    export_format TEXT NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    exported_by UUID,
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    parameters JSONB DEFAULT '{}'
);

-- إضافة RLS للجداول الجديدة
ALTER TABLE public.financial_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمقارنات المالية
CREATE POLICY "financial_comparisons_tenant_isolation" ON public.financial_comparisons
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- سياسات RLS للتقارير المحفوظة
CREATE POLICY "saved_financial_reports_tenant_isolation" ON public.saved_financial_reports
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- سياسات RLS لسجل التصدير
CREATE POLICY "export_history_tenant_isolation" ON public.export_history
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- إنشاء دالة لحساب التباين المالي
CREATE OR REPLACE FUNCTION public.calculate_financial_variance(
    tenant_id_param UUID,
    base_start_date DATE,
    base_end_date DATE,
    comparison_start_date DATE,
    comparison_end_date DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    base_data JSONB;
    comparison_data JSONB;
    variance_result JSONB;
BEGIN
    -- حساب البيانات الأساسية
    SELECT jsonb_build_object(
        'revenue', COALESCE(SUM(CASE WHEN coa.account_type = 'revenue' THEN coa.current_balance ELSE 0 END), 0),
        'expenses', COALESCE(SUM(CASE WHEN coa.account_type = 'expense' THEN coa.current_balance ELSE 0 END), 0),
        'assets', COALESCE(SUM(CASE WHEN coa.account_type = 'asset' THEN coa.current_balance ELSE 0 END), 0),
        'liabilities', COALESCE(SUM(CASE WHEN coa.account_type = 'liability' THEN coa.current_balance ELSE 0 END), 0)
    ) INTO base_data
    FROM public.chart_of_accounts coa
    WHERE coa.tenant_id = tenant_id_param
    AND coa.is_active = true;

    -- حساب بيانات المقارنة (نفس البيانات حالياً - يمكن تطويرها لاحقاً)
    comparison_data := base_data;

    -- حساب التباين
    variance_result := jsonb_build_object(
        'base_period', jsonb_build_object(
            'start_date', base_start_date,
            'end_date', base_end_date,
            'data', base_data
        ),
        'comparison_period', jsonb_build_object(
            'start_date', comparison_start_date,
            'end_date', comparison_end_date,
            'data', comparison_data
        ),
        'variance', jsonb_build_object(
            'revenue', (comparison_data->>'revenue')::NUMERIC - (base_data->>'revenue')::NUMERIC,
            'expenses', (comparison_data->>'expenses')::NUMERIC - (base_data->>'expenses')::NUMERIC,
            'assets', (comparison_data->>'assets')::NUMERIC - (base_data->>'assets')::NUMERIC,
            'liabilities', (comparison_data->>'liabilities')::NUMERIC - (base_data->>'liabilities')::NUMERIC
        )
    );

    RETURN variance_result;
END;
$$;

-- إنشاء دالة لحفظ المقارنة المالية
CREATE OR REPLACE FUNCTION public.save_financial_comparison(
    tenant_id_param UUID,
    comparison_name_param TEXT,
    base_start DATE,
    base_end DATE,
    comp_start DATE,
    comp_end DATE,
    created_by_param UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    comparison_id UUID;
    comparison_data JSONB;
BEGIN
    -- حساب بيانات المقارنة
    SELECT public.calculate_financial_variance(
        tenant_id_param, base_start, base_end, comp_start, comp_end
    ) INTO comparison_data;

    -- حفظ المقارنة
    INSERT INTO public.financial_comparisons (
        tenant_id, comparison_name, base_period_start, base_period_end,
        comparison_period_start, comparison_period_end, comparison_data, created_by
    ) VALUES (
        tenant_id_param, comparison_name_param, base_start, base_end,
        comp_start, comp_end, comparison_data, created_by_param
    ) RETURNING id INTO comparison_id;

    RETURN comparison_id;
END;
$$;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_financial_comparisons_tenant_id ON public.financial_comparisons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_financial_reports_tenant_id ON public.saved_financial_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_export_history_tenant_id ON public.export_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_export_history_exported_at ON public.export_history(exported_at);
