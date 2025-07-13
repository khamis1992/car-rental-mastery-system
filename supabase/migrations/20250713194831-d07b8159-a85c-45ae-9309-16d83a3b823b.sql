-- المرحلة الأولى: الجزء الثالث - مراكز التكلفة والتقارير والوظائف

-- 8. تحسين مراكز التكلفة للمؤسسات الكبيرة
ALTER TABLE public.cost_centers 
ADD COLUMN IF NOT EXISTS cost_center_name_en TEXT,
ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS business_unit TEXT,
ADD COLUMN IF NOT EXISTS profit_center_code TEXT,
ADD COLUMN IF NOT EXISTS budget_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS approval_workflow JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS variance_threshold NUMERIC(5,2) DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS auto_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ministry_classification TEXT,
ADD COLUMN IF NOT EXISTS requires_pre_approval BOOLEAN DEFAULT false;

-- إنشاء جدول الميزانيات المتقدمة لمراكز التكلفة
CREATE TABLE IF NOT EXISTS public.cost_center_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  budget_year INTEGER NOT NULL,
  budget_version INTEGER DEFAULT 1,
  account_id UUID REFERENCES public.chart_of_accounts(id),
  q1_budget NUMERIC(15,2) DEFAULT 0,
  q2_budget NUMERIC(15,2) DEFAULT 0,
  q3_budget NUMERIC(15,2) DEFAULT 0,
  q4_budget NUMERIC(15,2) DEFAULT 0,
  annual_budget NUMERIC(15,2) DEFAULT 0,
  q1_actual NUMERIC(15,2) DEFAULT 0,
  q2_actual NUMERIC(15,2) DEFAULT 0,
  q3_actual NUMERIC(15,2) DEFAULT 0,
  q4_actual NUMERIC(15,2) DEFAULT 0,
  annual_actual NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, cost_center_id, budget_year, budget_version, account_id)
);

-- 9. إنشاء جدول التقارير المالية المعرفة مسبقاً
CREATE TABLE IF NOT EXISTS public.financial_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_structure JSONB NOT NULL,
  ministry_format BOOLEAN DEFAULT false,
  legal_requirement BOOLEAN DEFAULT false,
  auto_generate BOOLEAN DEFAULT false,
  generation_frequency TEXT,
  last_generated TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, report_name)
);

-- 10. إنشاء جدول أرقام المستندات التلقائية
CREATE TABLE IF NOT EXISTS public.document_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  branch_id UUID REFERENCES public.enhanced_branches(id),
  prefix TEXT DEFAULT '',
  suffix TEXT DEFAULT '',
  current_number INTEGER DEFAULT 1,
  padding_length INTEGER DEFAULT 6,
  reset_annually BOOLEAN DEFAULT true,
  reset_monthly BOOLEAN DEFAULT false,
  last_reset DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(tenant_id, document_type, branch_id)
);

-- تطبيق RLS
ALTER TABLE public.cost_center_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Tenant isolation for cost_center_budgets" ON public.cost_center_budgets
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for financial_report_templates" ON public.financial_report_templates
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for document_sequences" ON public.document_sequences
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_cost_center_budgets_year ON public.cost_center_budgets(tenant_id, budget_year);
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON public.financial_report_templates(tenant_id, report_type);
CREATE INDEX IF NOT EXISTS idx_document_sequences_type ON public.document_sequences(tenant_id, document_type);