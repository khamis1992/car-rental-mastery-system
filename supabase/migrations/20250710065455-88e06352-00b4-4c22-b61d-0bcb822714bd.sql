-- إنشاء جداول نظام الفوترة والاشتراكات للـ SaaS

-- جدول خطط الاشتراك
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  plan_name_en TEXT,
  plan_code TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  max_tenants INTEGER,
  max_users_per_tenant INTEGER,
  max_vehicles INTEGER,
  max_contracts INTEGER,
  storage_limit_gb INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول الاشتراكات
CREATE TABLE public.saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  canceled_at TIMESTAMPTZ,
  pause_collection JSONB -- لحفظ تفاصيل إيقاف التحصيل المؤقت
);

-- جدول فواتير SaaS
CREATE TABLE public.saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  amount_due NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  amount_remaining NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invoice_pdf_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- جدول عناصر الفواتير
CREATE TABLE public.saas_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول مدفوعات SaaS
CREATE TABLE public.saas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'succeeded', 'failed', 'canceled', 'requires_action')),
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- جدول استخدام الموارد (لتتبع الاستخدام والحدود)
CREATE TABLE public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  users_count INTEGER DEFAULT 0,
  vehicles_count INTEGER DEFAULT 0,
  contracts_count INTEGER DEFAULT 0,
  storage_used_gb NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, usage_date)
);

-- فهارس لتحسين الأداء
CREATE INDEX idx_saas_subscriptions_tenant_id ON public.saas_subscriptions(tenant_id);
CREATE INDEX idx_saas_subscriptions_status ON public.saas_subscriptions(status);
CREATE INDEX idx_saas_subscriptions_stripe_subscription_id ON public.saas_subscriptions(stripe_subscription_id);
CREATE INDEX idx_saas_invoices_subscription_id ON public.saas_invoices(subscription_id);
CREATE INDEX idx_saas_invoices_tenant_id ON public.saas_invoices(tenant_id);
CREATE INDEX idx_saas_invoices_status ON public.saas_invoices(status);
CREATE INDEX idx_saas_payments_subscription_id ON public.saas_payments(subscription_id);
CREATE INDEX idx_tenant_usage_tenant_date ON public.tenant_usage(tenant_id, usage_date);

-- تمكين RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لخطط الاشتراك (قراءة للجميع، تعديل للمدراء)
CREATE POLICY "Everyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      JOIN public.tenants t ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid() AND t.tenant_type = 'platform' AND tu.role = 'tenant_admin'
    )
  );

-- سياسات RLS للاشتراكات (المستأجرون يرون اشتراكاتهم فقط)
CREATE POLICY "Tenants can view their subscriptions" ON public.saas_subscriptions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Super admins can manage all subscriptions" ON public.saas_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      JOIN public.tenants t ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid() AND t.tenant_type = 'platform' AND tu.role = 'tenant_admin'
    )
  );

-- سياسات RLS للفواتير
CREATE POLICY "Tenants can view their invoices" ON public.saas_invoices
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Super admins can manage all invoices" ON public.saas_invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      JOIN public.tenants t ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid() AND t.tenant_type = 'platform' AND tu.role = 'tenant_admin'
    )
  );

-- سياسات RLS لعناصر الفواتير
CREATE POLICY "Users can view invoice items for their invoices" ON public.saas_invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM public.saas_invoices
      WHERE tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Super admins can manage all invoice items" ON public.saas_invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      JOIN public.tenants t ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid() AND t.tenant_type = 'platform' AND tu.role = 'tenant_admin'
    )
  );

-- سياسات RLS للمدفوعات  
CREATE POLICY "Tenants can view their payments" ON public.saas_payments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Super admins can manage all payments" ON public.saas_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      JOIN public.tenants t ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid() AND t.tenant_type = 'platform' AND tu.role = 'tenant_admin'
    )
  );

-- سياسات RLS لاستخدام المستأجرين
CREATE POLICY "Tenants can view their usage" ON public.tenant_usage
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Super admins can manage all usage data" ON public.tenant_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      JOIN public.tenants t ON tu.tenant_id = t.id
      WHERE tu.user_id = auth.uid() AND t.tenant_type = 'platform' AND tu.role = 'tenant_admin'
    )
  );

-- إدراج خطط اشتراك افتراضية
INSERT INTO public.subscription_plans (plan_name, plan_name_en, plan_code, description, price_monthly, price_yearly, features, max_tenants, max_users_per_tenant, max_vehicles, max_contracts, storage_limit_gb, is_popular)
VALUES 
  ('الخطة الأساسية', 'Basic Plan', 'basic', 'خطة مناسبة للشركات الصغيرة', 29.99, 299.99, '["إدارة العقود", "إدارة المركبات", "التقارير الأساسية", "دعم بالبريد الإلكتروني"]'::jsonb, 1, 5, 10, 50, 1, false),
  ('الخطة المتقدمة', 'Professional Plan', 'professional', 'خطة مناسبة للشركات المتوسطة', 59.99, 599.99, '["جميع مميزات الخطة الأساسية", "تقارير متقدمة", "إدارة المخالفات", "النسخ الاحتياطي التلقائي", "دعم هاتفي"]'::jsonb, 1, 25, 50, 200, 5, true),
  ('خطة المؤسسات', 'Enterprise Plan', 'enterprise', 'خطة مناسبة للشركات الكبيرة', 149.99, 1499.99, '["جميع المميزات", "مستأجرين متعددين", "مستخدمين غير محدودين", "API مخصص", "دعم مخصص 24/7", "تدريب مخصص"]'::jsonb, 10, 999999, 999999, 999999, 100, false);

-- وظيفة لتوليد أرقام الفواتير
CREATE OR REPLACE FUNCTION generate_saas_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.saas_invoices
  WHERE invoice_number ~ '^SAAS-[0-9]+$';
  
  invoice_number := 'SAAS-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_number;
END;
$$;

-- تريجر لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_subscriptions_updated_at
  BEFORE UPDATE ON public.saas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_invoices_updated_at
  BEFORE UPDATE ON public.saas_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_payments_updated_at
  BEFORE UPDATE ON public.saas_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_usage_updated_at
  BEFORE UPDATE ON public.tenant_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();