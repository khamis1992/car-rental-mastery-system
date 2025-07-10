
-- إنشاء جداول نظام فوترة SaaS

-- جدول خطط الاشتراك
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  plan_name_en TEXT,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_users INTEGER DEFAULT 10,
  max_vehicles INTEGER DEFAULT 5,
  max_contracts INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول اشتراكات المؤسسات
CREATE TABLE public.saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_end DATE NOT NULL,
  next_billing_date DATE,
  trial_ends_at DATE,
  canceled_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول فواتير SaaS
CREATE TABLE public.saas_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'canceled')),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'KWD',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول عناصر الفواتير
CREATE TABLE public.saas_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  item_type TEXT DEFAULT 'subscription' CHECK (item_type IN ('subscription', 'usage', 'addon', 'discount')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول مدفوعات SaaS
CREATE TABLE public.saas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'KWD',
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  external_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- جدول استخدام المؤسسات
CREATE TABLE public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  users_count INTEGER DEFAULT 0,
  vehicles_count INTEGER DEFAULT 0,
  contracts_count INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, usage_date)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_saas_subscriptions_tenant ON saas_subscriptions(tenant_id);
CREATE INDEX idx_saas_subscriptions_status ON saas_subscriptions(status);
CREATE INDEX idx_saas_subscriptions_billing_date ON saas_subscriptions(next_billing_date);
CREATE INDEX idx_saas_invoices_tenant ON saas_invoices(tenant_id);
CREATE INDEX idx_saas_invoices_subscription ON saas_invoices(subscription_id);
CREATE INDEX idx_saas_invoices_status ON saas_invoices(status);
CREATE INDEX idx_saas_invoices_due_date ON saas_invoices(due_date);
CREATE INDEX idx_saas_payments_invoice ON saas_payments(invoice_id);
CREATE INDEX idx_saas_payments_status ON saas_payments(status);
CREATE INDEX idx_tenant_usage_tenant_date ON tenant_usage(tenant_id, usage_date);

-- تفعيل Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لخطط الاشتراك
CREATE POLICY "الجميع يمكنهم رؤية خطط الاشتراك النشطة" ON subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "المديرون يمكنهم إدارة خطط الاشتراك" ON subscription_plans
  FOR ALL USING (
    auth.uid() IN (
      SELECT tu.user_id FROM tenant_users tu WHERE tu.role = 'super_admin'
    )
  );

-- سياسات الأمان للاشتراكات
CREATE POLICY "المؤسسات يمكنها رؤية اشتراكاتها" ON saas_subscriptions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()
    )
  );

CREATE POLICY "المديرون يمكنهم إدارة جميع الاشتراكات" ON saas_subscriptions
  FOR ALL USING (
    auth.uid() IN (
      SELECT tu.user_id FROM tenant_users tu WHERE tu.role = 'super_admin'
    )
  );

-- سياسات الأمان للفواتير
CREATE POLICY "المؤسسات يمكنها رؤية فواتيرها" ON saas_invoices
  FOR SELECT USING (
    tenant_id IN (
      SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()
    )
  );

CREATE POLICY "المديرون يمكنهم إدارة جميع الفواتير" ON saas_invoices
  FOR ALL USING (
    auth.uid() IN (
      SELECT tu.user_id FROM tenant_users tu WHERE tu.role = 'super_admin'
    )
  );

-- سياسات الأمان لعناصر الفواتير
CREATE POLICY "عناصر الفواتير تتبع نفس صلاحيات الفاتورة" ON saas_invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM saas_invoices WHERE 
      tenant_id IN (
        SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "المديرون يمكنهم إدارة عناصر الفواتير" ON saas_invoice_items
  FOR ALL USING (
    auth.uid() IN (
      SELECT tu.user_id FROM tenant_users tu WHERE tu.role = 'super_admin'
    )
  );

-- سياسات الأمان للمدفوعات
CREATE POLICY "المؤسسات يمكنها رؤية مدفوعاتها" ON saas_payments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()
    )
  );

CREATE POLICY "المديرون يمكنهم إدارة جميع المدفوعات" ON saas_payments
  FOR ALL USING (
    auth.uid() IN (
      SELECT tu.user_id FROM tenant_users tu WHERE tu.role = 'super_admin'
    )
  );

-- سياسات الأمان لاستخدام المؤسسات
CREATE POLICY "المؤسسات يمكنها رؤية استخدامها" ON tenant_usage
  FOR SELECT USING (
    tenant_id IN (
      SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()
    )
  );

CREATE POLICY "المديرون يمكنهم إدارة استخدام المؤسسات" ON tenant_usage
  FOR ALL USING (
    auth.uid() IN (
      SELECT tu.user_id FROM tenant_users tu WHERE tu.role = 'super_admin'
    )
  );

-- إدراج بعض خطط الاشتراك الافتراضية
INSERT INTO subscription_plans (plan_name, plan_name_en, description, price_monthly, price_yearly, max_users, max_vehicles, max_contracts, features) VALUES
('الخطة الأساسية', 'Basic Plan', 'خطة مناسبة للشركات الصغيرة', 29.99, 299.99, 5, 10, 50, '{"support": "email", "features": ["basic_reports", "user_management"]}'),
('الخطة المتقدمة', 'Premium Plan', 'خطة شاملة للشركات المتوسطة', 59.99, 599.99, 15, 25, 150, '{"support": "priority", "features": ["advanced_reports", "api_access", "custom_branding"]}'),
('خطة المؤسسات', 'Enterprise Plan', 'حلول متقدمة للمؤسسات الكبيرة', 129.99, 1299.99, 50, 100, 500, '{"support": "dedicated", "features": ["all_features", "custom_integrations", "advanced_security"]}');

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_subscriptions_updated_at BEFORE UPDATE ON saas_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_invoices_updated_at BEFORE UPDATE ON saas_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_payments_updated_at BEFORE UPDATE ON saas_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_usage_updated_at BEFORE UPDATE ON tenant_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
