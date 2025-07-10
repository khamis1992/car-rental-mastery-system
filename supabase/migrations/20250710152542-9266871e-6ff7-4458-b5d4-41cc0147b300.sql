-- إنشاء جداول نظام SADAD للدفعات

-- جدول إعدادات SADAD
CREATE TABLE public.sadad_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id TEXT NOT NULL,
  merchant_key TEXT NOT NULL,
  api_url TEXT NOT NULL DEFAULT 'https://api.sadad.qa',
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول مدفوعات SADAD
CREATE TABLE public.sadad_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  saas_invoice_id UUID REFERENCES saas_invoices(id),
  subscription_id UUID REFERENCES saas_subscriptions(id),
  
  -- معلومات SADAD
  sadad_transaction_id TEXT UNIQUE,
  sadad_reference_number TEXT,
  sadad_status TEXT NOT NULL DEFAULT 'pending',
  
  -- معلومات الدفعة
  amount NUMERIC(10,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KWD',
  description TEXT,
  
  -- معلومات العميل
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- معلومات الاستجابة من SADAD
  sadad_response JSONB,
  payment_url TEXT,
  
  -- تواريخ
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_sadad_status CHECK (sadad_status IN ('pending', 'processing', 'paid', 'failed', 'expired', 'cancelled'))
);

-- جدول webhook events من SADAD
CREATE TABLE public.sadad_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  sadad_transaction_id TEXT,
  payment_id UUID REFERENCES sadad_payments(id),
  event_data JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول سجل معاملات SADAD
CREATE TABLE public.sadad_transaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES sadad_payments(id),
  action TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إنشاء indexes للأداء
CREATE INDEX idx_sadad_payments_tenant_id ON public.sadad_payments(tenant_id);
CREATE INDEX idx_sadad_payments_transaction_id ON public.sadad_payments(sadad_transaction_id);
CREATE INDEX idx_sadad_payments_status ON public.sadad_payments(sadad_status);
CREATE INDEX idx_sadad_payments_created_at ON public.sadad_payments(created_at);
CREATE INDEX idx_sadad_webhook_events_transaction_id ON public.sadad_webhook_events(sadad_transaction_id);
CREATE INDEX idx_sadad_webhook_events_processed ON public.sadad_webhook_events(processed);

-- تفعيل RLS
ALTER TABLE public.sadad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sadad_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sadad_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sadad_transaction_log ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لإعدادات SADAD
CREATE POLICY "Super admins can manage SADAD settings"
ON public.sadad_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- سياسات RLS لمدفوعات SADAD
CREATE POLICY "Tenants can view their SADAD payments"
ON public.sadad_payments
FOR SELECT
USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant admins can manage SADAD payments"
ON public.sadad_payments
FOR ALL
USING (
  tenant_id = public.get_current_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = public.get_current_tenant_id()
    AND role IN ('tenant_admin', 'manager')
  )
);

-- سياسات RLS لأحداث webhook
CREATE POLICY "System can manage webhook events"
ON public.sadad_webhook_events
FOR ALL
USING (true);

-- سياسات RLS لسجل المعاملات
CREATE POLICY "Tenant admins can view transaction logs"
ON public.sadad_transaction_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sadad_payments sp
    WHERE sp.id = payment_id 
    AND sp.tenant_id = public.get_current_tenant_id()
  ) AND
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = public.get_current_tenant_id()
    AND role IN ('tenant_admin', 'manager')
  )
);

-- إضافة triggers للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_sadad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sadad_settings_updated_at
  BEFORE UPDATE ON public.sadad_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_sadad_updated_at();

CREATE TRIGGER sadad_payments_updated_at
  BEFORE UPDATE ON public.sadad_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_sadad_updated_at();

-- إدراج إعدادات افتراضية للاختبار
INSERT INTO public.sadad_settings (
  merchant_id,
  merchant_key,
  api_url,
  is_sandbox,
  is_active
) VALUES (
  'TEST_MERCHANT_ID',
  'TEST_MERCHANT_KEY',
  'https://sandbox-api.sadad.qa',
  true,
  true
) ON CONFLICT DO NOTHING;