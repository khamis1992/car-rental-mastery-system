-- إنشاء باقي جداول نظام SaaS

-- جدول الاشتراكات
CREATE TABLE public.saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'trialing')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  next_billing_date DATE NOT NULL,
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

-- تفعيل RLS للاشتراكات
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للاشتراكات
CREATE POLICY "المؤسسات يمكنها رؤية اشتراكاتها" ON public.saas_subscriptions
  FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR has_any_tenant_role(ARRAY['super_admin']));

CREATE POLICY "مديرو النظام يمكنهم إدارة الاشتراكات" ON public.saas_subscriptions
  FOR ALL
  USING (has_any_tenant_role(ARRAY['super_admin']))
  WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- إنشاء دالة توليد رقم الفاتورة
CREATE OR REPLACE FUNCTION public.generate_saas_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.saas_invoices
  WHERE invoice_number ~ '^SAAS-[0-9]+$';
  
  invoice_number := 'SAAS-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_number;
END;
$$;

-- جدول الفواتير
CREATE TABLE public.saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  invoice_number TEXT NOT NULL DEFAULT generate_saas_invoice_number(),
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

-- تفعيل RLS للفواتير
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للفواتير
CREATE POLICY "المؤسسات يمكنها رؤية فواتيرها" ON public.saas_invoices
  FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR has_any_tenant_role(ARRAY['super_admin']));

CREATE POLICY "مديرو النظام يمكنهم إدارة الفواتير" ON public.saas_invoices
  FOR ALL
  USING (has_any_tenant_role(ARRAY['super_admin']))
  WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));