-- المرحلة الأولى: تحسين النظام المحاسبي للمؤسسات الكويتية الكبيرة - الجزء الأول

-- 1. تحسين جدول دليل الحسابات لدعم المعايير الكويتية
ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS account_name_arabic TEXT,
ADD COLUMN IF NOT EXISTS account_name_english TEXT,
ADD COLUMN IF NOT EXISTS legal_reference TEXT,
ADD COLUMN IF NOT EXISTS regulatory_code TEXT,
ADD COLUMN IF NOT EXISTS ksaap_compliant BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ministry_commerce_code TEXT,
ADD COLUMN IF NOT EXISTS zakat_applicable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consolidation_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS report_position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_documentation TEXT[],
ADD COLUMN IF NOT EXISTS auto_reconcile BOOLEAN DEFAULT false;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_chart_accounts_regulatory_code ON public.chart_of_accounts(regulatory_code);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_ministry_code ON public.chart_of_accounts(ministry_commerce_code);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_consolidation ON public.chart_of_accounts(consolidation_account_id);

-- 2. إنشاء جدول العملات المتعددة
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  currency_code TEXT NOT NULL,
  currency_name_ar TEXT NOT NULL,
  currency_name_en TEXT,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 3,
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

-- تطبيق RLS على الجداول الجديدة
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates_history ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للجداول الجديدة
CREATE POLICY "Tenant isolation for currencies" ON public.currencies
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for exchange_rates_history" ON public.exchange_rates_history
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- تحديث الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_currencies_tenant_active ON public.currencies(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON public.exchange_rates_history(tenant_id, effective_date DESC);