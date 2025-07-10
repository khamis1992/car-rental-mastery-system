-- إنشاء الجداول المفقودة لنظام SaaS

-- جدول خطط الاشتراك
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  plan_name_en TEXT,
  plan_code TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,3) NOT NULL,
  price_yearly NUMERIC(10,3) NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  max_tenants INTEGER,
  max_users_per_tenant INTEGER,
  max_vehicles INTEGER,
  max_contracts INTEGER,
  storage_limit_gb INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول اشتراكات SaaS
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  amount NUMERIC(10,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KWD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  canceled_at TIMESTAMP WITH TIME ZONE,
  pause_collection JSONB
);

-- جدول فواتير SaaS
CREATE TABLE IF NOT EXISTS public.saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void', 'sent', 'overdue')),
  subtotal NUMERIC(10,3) NOT NULL,
  tax_amount NUMERIC(10,3) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,3) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KWD',
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invoice_pdf_url TEXT,
  description TEXT,
  metadata JSONB
);

-- جدول بنود الفواتير
CREATE TABLE IF NOT EXISTS public.saas_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10,3) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,3) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مدفوعات SaaS
CREATE TABLE IF NOT EXISTS public.saas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  sadad_transaction_id TEXT,
  sadad_bill_id TEXT,
  amount NUMERIC(10,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KWD',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'succeeded', 'failed', 'canceled', 'requires_action')),
  payment_method TEXT NOT NULL DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'sadad', 'manual', 'bank_transfer')),
  payment_gateway TEXT CHECK (payment_gateway IN ('stripe', 'sadad')),
  paid_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- جدول استخدام المؤسسات
CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  users_count INTEGER NOT NULL DEFAULT 0,
  vehicles_count INTEGER NOT NULL DEFAULT 0,
  contracts_count INTEGER NOT NULL DEFAULT 0,
  storage_used_gb NUMERIC(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, usage_date)
);

-- جداول SADAD
CREATE TABLE IF NOT EXISTS public.sadad_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT NOT NULL,
  merchant_key TEXT NOT NULL,
  api_url TEXT NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول مدفوعات SADAD
CREATE TABLE IF NOT EXISTS public.sadad_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  saas_invoice_id UUID REFERENCES public.saas_invoices(id),
  subscription_id UUID REFERENCES public.saas_subscriptions(id),
  sadad_transaction_id TEXT,
  sadad_reference_number TEXT,
  sadad_status TEXT NOT NULL DEFAULT 'pending' CHECK (sadad_status IN ('pending', 'processing', 'paid', 'failed', 'expired', 'cancelled')),
  amount NUMERIC(10,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KWD',
  description TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  sadad_response JSONB,
  payment_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أحداث webhook لـ SADAD
CREATE TABLE IF NOT EXISTS public.sadad_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  sadad_transaction_id TEXT,
  payment_id UUID REFERENCES public.sadad_payments(id),
  event_data JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجل معاملات SADAD
CREATE TABLE IF NOT EXISTS public.sadad_transaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.sadad_payments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON public.subscription_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_tenant ON public.saas_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_status ON public.saas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_tenant ON public.saas_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_status ON public.saas_invoices(status);
CREATE INDEX IF NOT EXISTS idx_saas_payments_invoice ON public.saas_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_saas_payments_status ON public.saas_payments(status);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_date ON public.tenant_usage(tenant_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_sadad_payments_tenant ON public.sadad_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sadad_payments_status ON public.sadad_payments(sadad_status);

-- إنشاء الـ triggers
CREATE OR REPLACE FUNCTION public.update_saas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_saas_updated_at();

CREATE TRIGGER update_saas_subscriptions_updated_at
  BEFORE UPDATE ON public.saas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_saas_updated_at();

CREATE TRIGGER update_saas_invoices_updated_at
  BEFORE UPDATE ON public.saas_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_saas_updated_at();

CREATE TRIGGER update_saas_payments_updated_at
  BEFORE UPDATE ON public.saas_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_saas_updated_at();

CREATE TRIGGER update_tenant_usage_updated_at
  BEFORE UPDATE ON public.tenant_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_saas_updated_at();

CREATE TRIGGER update_sadad_payments_updated_at
  BEFORE UPDATE ON public.sadad_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_sadad_updated_at();

-- تمكين RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sadad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sadad_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sadad_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sadad_transaction_log ENABLE ROW LEVEL SECURITY;