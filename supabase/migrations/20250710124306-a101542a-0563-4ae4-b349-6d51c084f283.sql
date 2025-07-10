-- إكمال إنشاء الجداول والتحديثات الأساسية

-- إضافة triggers لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة trigger لخطط الاشتراك
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إضافة trigger للاشتراكات
DROP TRIGGER IF EXISTS update_saas_subscriptions_updated_at ON public.saas_subscriptions;
CREATE TRIGGER update_saas_subscriptions_updated_at
  BEFORE UPDATE ON public.saas_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إضافة trigger للفواتير
DROP TRIGGER IF EXISTS update_saas_invoices_updated_at ON public.saas_invoices;
CREATE TRIGGER update_saas_invoices_updated_at
  BEFORE UPDATE ON public.saas_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إضافة trigger لاستخدام المؤسسات
DROP TRIGGER IF EXISTS update_tenant_usage_updated_at ON public.tenant_usage;
CREATE TRIGGER update_tenant_usage_updated_at
  BEFORE UPDATE ON public.tenant_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إضافة بيانات تجريبية للاشتراكات (إذا لم تكن موجودة)
INSERT INTO public.saas_subscriptions (
  tenant_id, plan_id, status, billing_cycle,
  current_period_start, current_period_end,
  amount, currency, auto_renew
) 
SELECT 
  t.id,
  sp.id,
  'active',
  'monthly',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month',
  sp.price_monthly,
  'KWD',
  true
FROM public.tenants t
CROSS JOIN public.subscription_plans sp
WHERE sp.plan_code = 'BASIC'
AND NOT EXISTS (
  SELECT 1 FROM public.saas_subscriptions ss 
  WHERE ss.tenant_id = t.id
)
LIMIT 5;