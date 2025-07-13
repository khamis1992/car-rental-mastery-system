-- المرحلة الأولى: تحسين النظام المحاسبي للمؤسسات الكويتية الكبيرة

-- 1. تحسين جدول دليل الحسابات لدعم المعايير الكويتية
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS 
  account_name_arabic TEXT,
  account_name_english TEXT,
  legal_reference TEXT,
  regulatory_code TEXT,
  ksaap_compliant BOOLEAN DEFAULT true,
  ministry_commerce_code TEXT,
  zakat_applicable BOOLEAN DEFAULT false,
  consolidation_account_id UUID REFERENCES public.chart_of_accounts(id),
  report_position INTEGER DEFAULT 0,
  required_documentation TEXT[],
  auto_reconcile BOOLEAN DEFAULT false;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_chart_accounts_regulatory_code ON public.chart_of_accounts(regulatory_code);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_ministry_code ON public.chart_of_accounts(ministry_commerce_code);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_consolidation ON public.chart_of_accounts(consolidation_account_id);

-- 2. إنشاء جدول العملات المتعددة
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  currency_code TEXT NOT NULL, -- KWD, USD, EUR, etc.
  currency_name_ar TEXT NOT NULL,
  currency_name_en TEXT,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 3, -- KWD uses 3 decimal places
  exchange_rate NUMERIC(15,6) DEFAULT 1.0,
  base_currency BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  central_bank_rate NUMERIC(15,6),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, currency_code)
);

-- إضافة العملة الأساسية KWD
INSERT INTO public.currencies (tenant_id, currency_code, currency_name_ar, currency_name_en, symbol, base_currency, exchange_rate)
SELECT 
  t.id,
  'KWD',
  'دينار كويتي',
  'Kuwaiti Dinar',
  'د.ك',
  true,
  1.0
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.currencies c 
  WHERE c.tenant_id = t.id AND c.currency_code = 'KWD'
);

-- 3. إنشاء جدول أسعار الصرف التاريخية
CREATE TABLE IF NOT EXISTS public.exchange_rates_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(15,6) NOT NULL,
  effective_date DATE NOT NULL,
  source TEXT DEFAULT 'central_bank_kuwait',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, from_currency, to_currency, effective_date)
);

-- 4. تحسين جدول القيود المحاسبية لدعم العملات المتعددة
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS
  base_currency TEXT DEFAULT 'KWD',
  exchange_rate NUMERIC(15,6) DEFAULT 1.0,
  ministry_compliance_check BOOLEAN DEFAULT false,
  zakat_calculated BOOLEAN DEFAULT false,
  audit_trail JSONB DEFAULT '{}',
  attachment_urls TEXT[],
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.journal_entry_lines ADD COLUMN IF NOT EXISTS
  original_currency TEXT DEFAULT 'KWD',
  original_amount NUMERIC(15,2) DEFAULT 0,
  exchange_rate NUMERIC(15,6) DEFAULT 1.0,
  vat_amount NUMERIC(15,2) DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 0;

-- 5. إنشاء جدول الفروع المحسن
CREATE TABLE IF NOT EXISTS public.enhanced_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_code TEXT NOT NULL,
  branch_name_ar TEXT NOT NULL,
  branch_name_en TEXT,
  branch_type TEXT DEFAULT 'main', -- main, subsidiary, representative
  parent_branch_id UUID REFERENCES public.enhanced_branches(id),
  commercial_registration TEXT,
  tax_registration TEXT,
  zakat_number TEXT,
  manager_name TEXT,
  manager_email TEXT,
  manager_phone TEXT,
  address_ar TEXT,
  address_en TEXT,
  po_box TEXT,
  postal_code TEXT,
  city TEXT,
  governorate TEXT,
  country TEXT DEFAULT 'Kuwait',
  phone TEXT,
  fax TEXT,
  email TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  established_date DATE,
  financial_year_start INTEGER DEFAULT 4, -- April for Kuwait
  reporting_currency TEXT DEFAULT 'KWD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, branch_code)
);

-- 6. إنشاء جدول إعدادات المحاسبة المتقدمة
CREATE TABLE IF NOT EXISTS public.advanced_accounting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  setting_category TEXT NOT NULL, -- depreciation, zakat, vat, reporting
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_description TEXT,
  ministry_required BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, setting_category, setting_key)
);

-- إضافة إعدادات افتراضية للمحاسبة الكويتية
INSERT INTO public.advanced_accounting_settings (tenant_id, setting_category, setting_key, setting_value, setting_description)
SELECT 
  t.id,
  'depreciation',
  'default_method',
  '"straight_line"'::jsonb,
  'طريقة الإهلاك الافتراضية'
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.advanced_accounting_settings aas 
  WHERE aas.tenant_id = t.id AND aas.setting_key = 'default_method'
);

-- 7. إنشاء جدول القوالب المحاسبية
CREATE TABLE IF NOT EXISTS public.accounting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- journal_entry, report, budget
  template_structure JSONB NOT NULL,
  default_accounts JSONB,
  auto_apply_rules JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, template_name, template_type)
);

-- 8. تحسين مراكز التكلفة للمؤسسات الكبيرة
ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS
  cost_center_name_en TEXT,
  reporting_manager_id UUID REFERENCES public.employees(id),
  business_unit TEXT,
  profit_center_code TEXT,
  budget_version INTEGER DEFAULT 1,
  approval_workflow JSONB DEFAULT '{}',
  variance_threshold NUMERIC(5,2) DEFAULT 10.0,
  auto_alerts BOOLEAN DEFAULT true,
  ministry_classification TEXT,
  requires_pre_approval BOOLEAN DEFAULT false;

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
  status TEXT DEFAULT 'draft', -- draft, approved, active, closed
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
  report_type TEXT NOT NULL, -- balance_sheet, income_statement, cash_flow, trial_balance
  report_structure JSONB NOT NULL,
  ministry_format BOOLEAN DEFAULT false,
  legal_requirement BOOLEAN DEFAULT false,
  auto_generate BOOLEAN DEFAULT false,
  generation_frequency TEXT, -- monthly, quarterly, annually
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
  document_type TEXT NOT NULL, -- journal_entry, invoice, payment, etc.
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

-- تطبيق RLS على الجداول الجديدة
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_accounting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_center_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للجداول الجديدة
CREATE POLICY "Tenant isolation for currencies" ON public.currencies
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for exchange_rates_history" ON public.exchange_rates_history
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for enhanced_branches" ON public.enhanced_branches
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for advanced_accounting_settings" ON public.advanced_accounting_settings
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for accounting_templates" ON public.accounting_templates
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for cost_center_budgets" ON public.cost_center_budgets
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for financial_report_templates" ON public.financial_report_templates
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for document_sequences" ON public.document_sequences
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- تحديث الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_currencies_tenant_active ON public.currencies(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON public.exchange_rates_history(tenant_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_branches_type ON public.enhanced_branches(tenant_id, branch_type);
CREATE INDEX IF NOT EXISTS idx_cost_center_budgets_year ON public.cost_center_budgets(tenant_id, budget_year);
CREATE INDEX IF NOT EXISTS idx_document_sequences_type ON public.document_sequences(tenant_id, document_type);

-- دوال مساعدة لإدارة أرقام المستندات
CREATE OR REPLACE FUNCTION public.get_next_document_number(
  p_tenant_id UUID,
  p_document_type TEXT,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sequence RECORD;
  v_next_number INTEGER;
  v_formatted_number TEXT;
  v_current_year INTEGER;
  v_current_month INTEGER;
BEGIN
  -- الحصول على السنة والشهر الحاليين
  v_current_year := EXTRACT(YEAR FROM now());
  v_current_month := EXTRACT(MONTH FROM now());
  
  -- البحث عن تسلسل المستند
  SELECT * INTO v_sequence
  FROM public.document_sequences
  WHERE tenant_id = p_tenant_id
    AND document_type = p_document_type
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND is_active = true;
  
  IF NOT FOUND THEN
    -- إنشاء تسلسل جديد إذا لم يوجد
    INSERT INTO public.document_sequences (
      tenant_id, document_type, branch_id, current_number
    ) VALUES (
      p_tenant_id, p_document_type, p_branch_id, 1
    ) RETURNING * INTO v_sequence;
    
    v_next_number := 1;
  ELSE
    -- فحص إعادة التعيين السنوي أو الشهري
    IF (v_sequence.reset_annually AND 
        (v_sequence.last_reset IS NULL OR 
         EXTRACT(YEAR FROM v_sequence.last_reset) < v_current_year)) OR
       (v_sequence.reset_monthly AND 
        (v_sequence.last_reset IS NULL OR 
         DATE_TRUNC('month', v_sequence.last_reset) < DATE_TRUNC('month', now()))) THEN
      
      -- إعادة تعيين الرقم
      v_next_number := 1;
      
      UPDATE public.document_sequences
      SET current_number = v_next_number + 1,
          last_reset = CURRENT_DATE
      WHERE id = v_sequence.id;
    ELSE
      -- استخدام الرقم التالي
      v_next_number := v_sequence.current_number;
      
      UPDATE public.document_sequences
      SET current_number = current_number + 1
      WHERE id = v_sequence.id;
    END IF;
  END IF;
  
  -- تنسيق الرقم
  v_formatted_number := v_sequence.prefix || 
                       LPAD(v_next_number::TEXT, v_sequence.padding_length, '0') || 
                       v_sequence.suffix;
  
  RETURN v_formatted_number;
END;
$$;

-- دالة حساب أسعار الصرف
CREATE OR REPLACE FUNCTION public.convert_currency(
  p_amount NUMERIC,
  p_from_currency TEXT,
  p_to_currency TEXT,
  p_tenant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  -- إذا كانت العملة نفسها، إرجاع المبلغ كما هو
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;
  
  -- البحث عن سعر الصرف
  SELECT rate INTO v_rate
  FROM public.exchange_rates_history
  WHERE tenant_id = p_tenant_id
    AND from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND effective_date <= p_date
  ORDER BY effective_date DESC
  LIMIT 1;
  
  -- إذا لم يوجد سعر صرف، استخدام السعر من جدول العملات
  IF v_rate IS NULL THEN
    SELECT c1.exchange_rate / c2.exchange_rate INTO v_rate
    FROM public.currencies c1, public.currencies c2
    WHERE c1.tenant_id = p_tenant_id
      AND c2.tenant_id = p_tenant_id
      AND c1.currency_code = p_from_currency
      AND c2.currency_code = p_to_currency
      AND c1.is_active = true
      AND c2.is_active = true;
  END IF;
  
  -- إرجاع المبلغ المحول
  RETURN COALESCE(p_amount * v_rate, p_amount);
END;
$$;