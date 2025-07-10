-- إنشاء الجداول المتبقية لنظام SaaS

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

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.saas_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- إضافة المراجع الخارجية
DO $$
BEGIN
  -- إضافة مرجع لجدول عناصر الفواتير
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saas_invoice_items_invoice_id_fkey'
  ) THEN
    ALTER TABLE public.saas_invoice_items 
    ADD CONSTRAINT saas_invoice_items_invoice_id_fkey 
    FOREIGN KEY (invoice_id) REFERENCES public.saas_invoices(id) ON DELETE CASCADE;
  END IF;
  
  -- إضافة مرجع لجدول المدفوعات
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'saas_payments_invoice_id_fkey'
  ) THEN
    ALTER TABLE public.saas_payments 
    ADD CONSTRAINT saas_payments_invoice_id_fkey 
    FOREIGN KEY (invoice_id) REFERENCES public.saas_invoices(id);
  END IF;
END $$;

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

-- إنشاء الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_tenant ON public.saas_subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_billing ON public.saas_subscriptions(next_billing_date, auto_renew);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_subscription ON public.saas_invoices(subscription_id, status);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_tenant ON public.saas_invoices(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_saas_payments_invoice ON public.saas_payments(invoice_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_date ON public.tenant_usage(tenant_id, usage_date);