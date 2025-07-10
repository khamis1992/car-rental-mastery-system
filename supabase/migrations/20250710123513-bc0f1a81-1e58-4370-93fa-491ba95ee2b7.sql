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

-- جدول الفواتير
CREATE TABLE IF NOT EXISTS public.saas_invoices (
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

-- جدول عناصر الفواتير
CREATE TABLE IF NOT EXISTS public.saas_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'subscription' CHECK (item_type IN ('subscription', 'usage', 'addon', 'discount')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS public.saas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id),
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

-- تفعيل RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لخطط الاشتراك
CREATE POLICY "الجميع يمكنهم رؤية الخطط النشطة" ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "مديرو النظام يمكنهم إدارة الخطط" ON public.subscription_plans
  FOR ALL
  USING (has_any_tenant_role(ARRAY['super_admin']))
  WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- سياسات RLS للاشتراكات
CREATE POLICY "المؤسسات يمكنها رؤية اشتراكاتها" ON public.saas_subscriptions
  FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR has_any_tenant_role(ARRAY['super_admin']));

CREATE POLICY "مديرو النظام يمكنهم إدارة الاشتراكات" ON public.saas_subscriptions
  FOR ALL
  USING (has_any_tenant_role(ARRAY['super_admin']))
  WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- سياسات RLS للفواتير
CREATE POLICY "المؤسسات يمكنها رؤية فواتيرها" ON public.saas_invoices
  FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR has_any_tenant_role(ARRAY['super_admin']));

CREATE POLICY "مديرو النظام يمكنهم إدارة الفواتير" ON public.saas_invoices
  FOR ALL
  USING (has_any_tenant_role(ARRAY['super_admin']))
  WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- سياسات RLS لعناصر الفواتير
CREATE POLICY "المؤسسات يمكنها رؤية عناصر فواتيرها" ON public.saas_invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.saas_invoices 
      WHERE tenant_id = get_current_tenant_id()
    ) OR has_any_tenant_role(ARRAY['super_admin'])
  );

CREATE POLICY "مديرو النظام يمكنهم إدارة عناصر الفواتير" ON public.saas_invoice_items
  FOR ALL
  USING (has_any_tenant_role(ARRAY['super_admin']))
  WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- سياسات RLS للمدفوعات
CREATE POLICY "المؤسسات يمكنها رؤية مدفوعاتها" ON public.saas_payments
  FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR has_any_tenant_role(ARRAY['super_admin']));

CREATE POLICY "مديرو النظام يمكنهم إدارة المدفوعات" ON public.saas_payments
  FOR ALL
  USING (has_any_tenant_role(ARRAY['super_admin']))
  WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- سياسات RLS لاستخدام المؤسسات
CREATE POLICY "المؤسسات يمكنها رؤية استخدامها" ON public.tenant_usage
  FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR has_any_tenant_role(ARRAY['super_admin']));

CREATE POLICY "مديرو النظام يمكنهم إدارة الاستخدام" ON public.tenant_usage
  FOR ALL
  USING (has_any_tenant_role(ARRAY['super_admin']))
  WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- إضافة البيانات التجريبية لخطط الاشتراك
INSERT INTO public.subscription_plans (
  plan_name, plan_name_en, plan_code, description, 
  price_monthly, price_yearly, features, 
  max_tenants, max_users_per_tenant, max_vehicles, max_contracts,
  storage_limit_gb, is_popular, sort_order
) VALUES 
(
  'الخطة الأساسية', 'Basic Plan', 'BASIC',
  'خطة مناسبة للشركات الصغيرة',
  50, 500, 
  ARRAY['إدارة المركبات', 'العقود الأساسية', 'التقارير البسيطة', 'دعم فني أساسي'],
  1, 10, 20, 100,
  5, false, 1
),
(
  'الخطة المتقدمة', 'Premium Plan', 'PREMIUM',
  'خطة مناسبة للشركات المتوسطة',
  100, 1000,
  ARRAY['جميع ميزات الخطة الأساسية', 'تقارير متقدمة', 'إدارة المخالفات', 'التكامل مع APIs', 'دعم فني متقدم'],
  3, 50, 100, 500,
  25, true, 2
),
(
  'خطة الشركات', 'Enterprise Plan', 'ENTERPRISE',
  'خطة مناسبة للشركات الكبيرة',
  200, 2000,
  ARRAY['جميع الميزات', 'تخصيص كامل', 'تقارير تفصيلية', 'دعم فني مخصص 24/7', 'تدريب مجاني'],
  NULL, NULL, NULL, NULL,
  100, false, 3
);

-- trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_subscriptions_updated_at
  BEFORE UPDATE ON public.saas_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_invoices_updated_at
  BEFORE UPDATE ON public.saas_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_usage_updated_at
  BEFORE UPDATE ON public.tenant_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();