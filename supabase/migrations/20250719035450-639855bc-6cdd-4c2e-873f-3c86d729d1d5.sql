-- المرحلة الثانية: تطوير التقارير المالية المتقدمة
-- إنشاء قوالب التقارير المالية وتقارير متقدمة

-- 1. جدول قوالب التقارير المالية المتقدمة
CREATE TABLE IF NOT EXISTS public.advanced_financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    report_name TEXT NOT NULL,
    report_name_en TEXT,
    report_type TEXT NOT NULL CHECK (report_type IN (
        'balance_sheet', 
        'income_statement', 
        'cash_flow', 
        'equity_changes',
        'trial_balance',
        'general_ledger',
        'subsidiary_ledger',
        'aging_report'
    )),
    report_structure JSONB NOT NULL DEFAULT '{}',
    calculation_rules JSONB NOT NULL DEFAULT '{}',
    formatting_rules JSONB NOT NULL DEFAULT '{}',
    legal_compliance BOOLEAN DEFAULT true,
    ministry_format BOOLEAN DEFAULT false,
    auto_generate BOOLEAN DEFAULT false,
    generation_frequency TEXT CHECK (generation_frequency IN (
        'manual', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    )) DEFAULT 'manual',
    last_generated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    notes TEXT
);

-- 2. جدول بيانات التقارير المالية المُولدة
CREATE TABLE IF NOT EXISTS public.financial_report_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    report_template_id UUID REFERENCES public.advanced_financial_reports(id),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    report_data JSONB NOT NULL DEFAULT '{}',
    summary_data JSONB NOT NULL DEFAULT '{}',
    comparison_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'approved', 'archived')),
    approval_level INTEGER DEFAULT 0,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    file_path TEXT,
    file_size BIGINT,
    checksum TEXT,
    created_by UUID,
    notes TEXT
);

-- 3. جدول المؤشرات المالية المتقدمة (KPIs)
CREATE TABLE IF NOT EXISTS public.advanced_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    kpi_code TEXT NOT NULL,
    kpi_name TEXT NOT NULL,
    kpi_name_en TEXT,
    kpi_category TEXT NOT NULL CHECK (kpi_category IN (
        'liquidity', 'profitability', 'efficiency', 'leverage', 'growth', 'operational'
    )),
    calculation_formula TEXT NOT NULL,
    target_value NUMERIC,
    current_value NUMERIC,
    previous_value NUMERIC,
    benchmark_value NUMERIC,
    unit_of_measure TEXT DEFAULT 'percentage',
    frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable')),
    alert_threshold_high NUMERIC,
    alert_threshold_low NUMERIC,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, kpi_code)
);

-- 4. جدول تاريخ المؤشرات المالية
CREATE TABLE IF NOT EXISTS public.kpi_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    kpi_id UUID NOT NULL REFERENCES public.advanced_kpis(id),
    calculation_date DATE NOT NULL,
    calculated_value NUMERIC NOT NULL,
    target_value NUMERIC,
    variance_amount NUMERIC,
    variance_percentage NUMERIC,
    factors JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(kpi_id, calculation_date)
);

-- 5. جدول التنبؤات المالية
CREATE TABLE IF NOT EXISTS public.financial_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    forecast_type TEXT NOT NULL CHECK (forecast_type IN (
        'revenue', 'expenses', 'cash_flow', 'profit', 'assets', 'liabilities'
    )),
    forecast_period DATE NOT NULL,
    predicted_value NUMERIC NOT NULL,
    confidence_level NUMERIC CHECK (confidence_level BETWEEN 0 AND 100),
    methodology TEXT NOT NULL CHECK (methodology IN (
        'linear_regression', 'moving_average', 'seasonal', 'expert_judgment', 'ai_model'
    )),
    base_data JSONB DEFAULT '{}',
    assumptions JSONB DEFAULT '{}',
    current_value NUMERIC,
    accuracy_percentage NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);

-- 6. جدول تحليل التباين (Variance Analysis)
CREATE TABLE IF NOT EXISTS public.variance_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    account_id UUID REFERENCES public.chart_of_accounts(id),
    budget_amount NUMERIC,
    actual_amount NUMERIC,
    variance_amount NUMERIC,
    variance_percentage NUMERIC,
    variance_type TEXT CHECK (variance_type IN ('favorable', 'unfavorable', 'neutral')),
    analysis_level TEXT DEFAULT 'account' CHECK (analysis_level IN ('account', 'category', 'department', 'total')),
    explanation TEXT,
    corrective_actions JSONB DEFAULT '[]',
    responsible_person UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);

-- 7. جدول إعدادات لوحة المعلومات المحاسبية
CREATE TABLE IF NOT EXISTS public.accounting_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    user_id UUID,
    dashboard_name TEXT NOT NULL,
    layout_config JSONB NOT NULL DEFAULT '{}',
    widget_settings JSONB NOT NULL DEFAULT '[]',
    refresh_interval INTEGER DEFAULT 300,
    auto_refresh BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, user_id, dashboard_name)
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_advanced_financial_reports_tenant_type ON public.advanced_financial_reports(tenant_id, report_type);
CREATE INDEX IF NOT EXISTS idx_financial_report_data_period ON public.financial_report_data(tenant_id, report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_advanced_kpis_tenant_category ON public.advanced_kpis(tenant_id, kpi_category);
CREATE INDEX IF NOT EXISTS idx_kpi_history_date ON public.kpi_history(kpi_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_financial_forecasts_period ON public.financial_forecasts(tenant_id, forecast_period);
CREATE INDEX IF NOT EXISTS idx_variance_analysis_period ON public.variance_analysis(tenant_id, analysis_period_start, analysis_period_end);

-- سياسات الأمان (RLS)
ALTER TABLE public.advanced_financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variance_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- سياسات للتقارير المالية المتقدمة
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة التقارير المالية المتقدمة"
ON public.advanced_financial_reports
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة بيانات التقارير"
ON public.financial_report_data
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة المؤشرات المالية"
ON public.advanced_kpis
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية تاريخ المؤشرات"
ON public.kpi_history
FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة التنبؤات المالية"
ON public.financial_forecasts
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تحليل التباين"
ON public.variance_analysis
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "المستخدمون يمكنهم إدارة إعدادات لوحاتهم"
ON public.accounting_dashboard_settings
FOR ALL
USING (
    user_id = auth.uid() OR 
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role)
);

-- إدراج قوالب التقارير المالية الأساسية
INSERT INTO public.advanced_financial_reports (
    tenant_id, report_name, report_name_en, report_type, 
    report_structure, legal_compliance, ministry_format
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'تقرير المركز المالي',
    'Balance Sheet Report',
    'balance_sheet',
    '{
        "sections": [
            {
                "name": "الأصول",
                "name_en": "Assets",
                "accounts": ["1"],
                "subsections": [
                    {"name": "الأصول المتداولة", "accounts": ["11"]},
                    {"name": "الأصول الثابتة", "accounts": ["13"]}
                ]
            },
            {
                "name": "الخصوم وحقوق الملكية",
                "name_en": "Liabilities and Equity",
                "accounts": ["2", "3"],
                "subsections": [
                    {"name": "الخصوم المتداولة", "accounts": ["21"]},
                    {"name": "الخصوم طويلة الأجل", "accounts": ["22"]},
                    {"name": "حقوق الملكية", "accounts": ["3"]}
                ]
            }
        ]
    }',
    true,
    true
);

-- قالب قائمة الدخل
INSERT INTO public.advanced_financial_reports (
    tenant_id, report_name, report_name_en, report_type,
    report_structure, legal_compliance
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'قائمة الدخل',
    'Income Statement',
    'income_statement',
    '{
        "sections": [
            {
                "name": "الإيرادات",
                "name_en": "Revenue",
                "accounts": ["4"],
                "calculation": "sum"
            },
            {
                "name": "المصروفات",
                "name_en": "Expenses", 
                "accounts": ["5"],
                "calculation": "sum"
            },
            {
                "name": "صافي الربح",
                "name_en": "Net Profit",
                "calculation": "revenue_minus_expenses"
            }
        ]
    }',
    true
);

-- قالب تقرير التدفقات النقدية
INSERT INTO public.advanced_financial_reports (
    tenant_id, report_name, report_name_en, report_type,
    report_structure, legal_compliance
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'قائمة التدفقات النقدية',
    'Cash Flow Statement',
    'cash_flow',
    '{
        "sections": [
            {
                "name": "التدفقات النقدية من الأنشطة التشغيلية",
                "name_en": "Cash Flow from Operating Activities",
                "type": "operating"
            },
            {
                "name": "التدفقات النقدية من الأنشطة الاستثمارية",
                "name_en": "Cash Flow from Investing Activities", 
                "type": "investing"
            },
            {
                "name": "التدفقات النقدية من الأنشطة التمويلية",
                "name_en": "Cash Flow from Financing Activities",
                "type": "financing"
            }
        ]
    }',
    true
);