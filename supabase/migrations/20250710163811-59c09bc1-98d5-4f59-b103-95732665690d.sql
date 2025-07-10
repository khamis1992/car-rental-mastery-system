-- إنشاء جداول نظام SaaS
-- جدول خطط الاشتراك
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  plan_name_en TEXT,
  plan_code TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,3) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,3) NOT NULL DEFAULT 0,
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
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KWD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  canceled_at TIMESTAMP WITH TIME ZONE,
  pause_collection JSONB
);

-- جدول فواتير SaaS
CREATE TABLE IF NOT EXISTS public.saas_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  stripe_invoice_id TEXT,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void', 'sent', 'overdue')),
  subtotal DECIMAL(10,3) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KWD',
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invoice_pdf_url TEXT,
  description TEXT,
  metadata JSONB
);

-- جدول بنود فواتير SaaS
CREATE TABLE IF NOT EXISTS public.saas_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,3) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,3) NOT NULL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مدفوعات SaaS
CREATE TABLE IF NOT EXISTS public.saas_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id),
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  stripe_payment_intent_id TEXT,
  sadad_transaction_id TEXT,
  sadad_bill_id TEXT,
  amount DECIMAL(10,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KWD',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'succeeded', 'failed', 'canceled', 'requires_action')),
  payment_method TEXT NOT NULL DEFAULT 'sadad' CHECK (payment_method IN ('stripe', 'sadad', 'manual', 'bank_transfer')),
  payment_gateway TEXT CHECK (payment_gateway IN ('stripe', 'sadad')),
  paid_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- جدول استخدام المؤسسات
CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  users_count INTEGER NOT NULL DEFAULT 0,
  vehicles_count INTEGER NOT NULL DEFAULT 0,
  contracts_count INTEGER NOT NULL DEFAULT 0,
  storage_used_gb NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, usage_date)
);

-- تمكين RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- المؤشرات لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_tenant_id ON public.saas_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_status ON public.saas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_subscription_id ON public.saas_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_status ON public.saas_invoices(status);
CREATE INDEX IF NOT EXISTS idx_saas_payments_invoice_id ON public.saas_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_date ON public.tenant_usage(tenant_id, usage_date);

-- المشغلات للتحديث التلقائي
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saas_subscriptions_updated_at
  BEFORE UPDATE ON public.saas_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saas_invoices_updated_at
  BEFORE UPDATE ON public.saas_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saas_payments_updated_at
  BEFORE UPDATE ON public.saas_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();