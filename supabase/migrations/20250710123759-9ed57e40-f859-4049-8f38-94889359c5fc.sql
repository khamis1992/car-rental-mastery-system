-- إنشاء جداول نظام SaaS للفوترة والاشتراكات

-- جدول خطط الاشتراك
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  plan_name_en TEXT,
  plan_code TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  max_tenants INTEGER,
  max_users_per_tenant INTEGER,
  max_vehicles INTEGER,
  max_contracts INTEGER,
  storage_limit_gb INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول الاشتراكات
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'trialing')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  trial_end DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KWD',
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  discount_percentage NUMERIC DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  canceled_at TIMESTAMPTZ,
  pause_collection JSONB
);

-- إضافة عمود next_billing_date بشكل منفصل
ALTER TABLE public.saas_subscriptions 
ADD COLUMN IF NOT EXISTS next_billing_date DATE;

-- تحديث القيم للعمود الجديد
UPDATE public.saas_subscriptions 
SET next_billing_date = current_period_end + INTERVAL '1 day'
WHERE next_billing_date IS NULL;

-- جعل العمود مطلوب
ALTER TABLE public.saas_subscriptions 
ALTER COLUMN next_billing_date SET NOT NULL;

-- جدول الفواتير
CREATE TABLE IF NOT EXISTS public.saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KWD',
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  invoice_pdf_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'
);

-- إضافة المراجع الخارجية للفواتير
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.saas_subscriptions LIMIT 1) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'saas_invoices_subscription_id_fkey'
    ) THEN
      ALTER TABLE public.saas_invoices 
      ADD CONSTRAINT saas_invoices_subscription_id_fkey 
      FOREIGN KEY (subscription_id) REFERENCES public.saas_subscriptions(id);
    END IF;
  END IF;
END $$;

-- إضافة دالة توليد رقم الفاتورة إذا لم تكن موجودة
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_saas_invoice_number') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.generate_saas_invoice_number()
    RETURNS text
    LANGUAGE plpgsql
    AS $function$
    DECLARE
      next_number INTEGER;
      invoice_number TEXT;
    BEGIN
      SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
      INTO next_number
      FROM public.saas_invoices
      WHERE invoice_number ~ ''^SAAS-[0-9]+$'';
      
      invoice_number := ''SAAS-'' || LPAD(next_number::TEXT, 6, ''0'');
      
      RETURN invoice_number;
    END;
    $function$';
  END IF;
END $$;

-- تحديث الفواتير لاستخدام الدالة
ALTER TABLE public.saas_invoices 
ALTER COLUMN invoice_number SET DEFAULT generate_saas_invoice_number();

-- جدول عناصر الفواتير
CREATE TABLE IF NOT EXISTS public.saas_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'subscription' CHECK (item_type IN ('subscription', 'usage', 'addon', 'discount')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إضافة المراجع الخارجية لعناصر الفواتير
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.saas_invoices LIMIT 1) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'saas_invoice_items_invoice_id_fkey'
    ) THEN
      ALTER TABLE public.saas_invoice_items 
      ADD CONSTRAINT saas_invoice_items_invoice_id_fkey 
      FOREIGN KEY (invoice_id) REFERENCES public.saas_invoices(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS public.saas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending', 'refunded')),
  gateway_response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إضافة المراجع الخارجية للمدفوعات
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.saas_invoices LIMIT 1) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'saas_payments_invoice_id_fkey'
    ) THEN
      ALTER TABLE public.saas_payments 
      ADD CONSTRAINT saas_payments_invoice_id_fkey 
      FOREIGN KEY (invoice_id) REFERENCES public.saas_invoices(id);
    END IF;
  END IF;
END $$;

-- جدول استخدام المؤسسات
CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  users_count INTEGER NOT NULL DEFAULT 0,
  vehicles_count INTEGER NOT NULL DEFAULT 0,
  contracts_count INTEGER NOT NULL DEFAULT 0,
  storage_used_gb NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, usage_date)
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_tenant ON public.saas_subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_billing ON public.saas_subscriptions(next_billing_date, auto_renew);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_subscription ON public.saas_invoices(subscription_id, status);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_tenant ON public.saas_invoices(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_saas_payments_invoice ON public.saas_payments(invoice_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_date ON public.tenant_usage(tenant_id, usage_date);