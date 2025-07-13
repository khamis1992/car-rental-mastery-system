-- المرحلة الأولى: الجزء الثاني - إضافة باقي الجداول والإعدادات

-- 4. تحسين جدول القيود المحاسبية لدعم العملات المتعددة
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'KWD',
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(15,6) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS ministry_compliance_check BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS zakat_calculated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachment_urls TEXT[],
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.journal_entry_lines 
ADD COLUMN IF NOT EXISTS original_currency TEXT DEFAULT 'KWD',
ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(15,6) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 0;

-- 5. إنشاء جدول الفروع المحسن
CREATE TABLE IF NOT EXISTS public.enhanced_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_code TEXT NOT NULL,
  branch_name_ar TEXT NOT NULL,
  branch_name_en TEXT,
  branch_type TEXT DEFAULT 'main',
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
  financial_year_start INTEGER DEFAULT 4,
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
  setting_category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_description TEXT,
  ministry_required BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, setting_category, setting_key)
);

-- 7. إنشاء جدول القوالب المحاسبية
CREATE TABLE IF NOT EXISTS public.accounting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_structure JSONB NOT NULL,
  default_accounts JSONB,
  auto_apply_rules JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(tenant_id, template_name, template_type)
);

-- تطبيق RLS على الجداول الجديدة
ALTER TABLE public.enhanced_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_accounting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_templates ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Tenant isolation for enhanced_branches" ON public.enhanced_branches
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for advanced_accounting_settings" ON public.advanced_accounting_settings
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for accounting_templates" ON public.accounting_templates
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_branches_type ON public.enhanced_branches(tenant_id, branch_type);
CREATE INDEX IF NOT EXISTS idx_accounting_settings_category ON public.advanced_accounting_settings(tenant_id, setting_category);
CREATE INDEX IF NOT EXISTS idx_accounting_templates_type ON public.accounting_templates(tenant_id, template_type);