-- إضافة RLS policies لجداول SaaS

-- خطط الاشتراك
CREATE POLICY IF NOT EXISTS "Super admins can manage subscription plans"
ON public.subscription_plans FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY IF NOT EXISTS "Everyone can view active subscription plans"
ON public.subscription_plans FOR SELECT
TO authenticated
USING (is_active = true);

-- اشتراكات SaaS
CREATE POLICY IF NOT EXISTS "Super admins can manage all saas subscriptions"
ON public.saas_subscriptions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY IF NOT EXISTS "Tenant admins can view their subscriptions"
ON public.saas_subscriptions FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id());

-- فواتير SaaS
CREATE POLICY IF NOT EXISTS "Super admins can manage all saas invoices"
ON public.saas_invoices FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY IF NOT EXISTS "Tenant admins can view their invoices"
ON public.saas_invoices FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id());

-- بنود الفواتير
CREATE POLICY IF NOT EXISTS "Super admins can manage all invoice items"
ON public.saas_invoice_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY IF NOT EXISTS "Tenant users can view their invoice items"
ON public.saas_invoice_items FOR SELECT
TO authenticated
USING (
  invoice_id IN (
    SELECT id FROM public.saas_invoices 
    WHERE tenant_id = get_current_tenant_id()
  )
);

-- مدفوعات SaaS
CREATE POLICY IF NOT EXISTS "Super admins can manage all saas payments"
ON public.saas_payments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY IF NOT EXISTS "Tenant admins can view their payments"
ON public.saas_payments FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id());

-- استخدام المؤسسات
CREATE POLICY IF NOT EXISTS "Super admins can manage all tenant usage"
ON public.tenant_usage FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY IF NOT EXISTS "Tenant admins can view their usage"
ON public.tenant_usage FOR SELECT
TO authenticated
USING (tenant_id = get_current_tenant_id());

-- إعدادات SADAD
CREATE POLICY IF NOT EXISTS "Super admins can manage sadad settings"
ON public.sadad_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

-- مدفوعات SADAD
CREATE POLICY IF NOT EXISTS "Super admins can manage all sadad payments"
ON public.sadad_payments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY IF NOT EXISTS "Tenant users can manage their sadad payments"
ON public.sadad_payments FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id())
WITH CHECK (tenant_id = get_current_tenant_id());

-- أحداث webhook لـ SADAD
CREATE POLICY IF NOT EXISTS "Super admins can manage sadad webhook events"
ON public.sadad_webhook_events FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

-- سجل معاملات SADAD
CREATE POLICY IF NOT EXISTS "Super admins can view sadad transaction logs"
ON public.sadad_transaction_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY IF NOT EXISTS "Tenant users can view their transaction logs"
ON public.sadad_transaction_log FOR SELECT
TO authenticated
USING (
  payment_id IN (
    SELECT id FROM public.sadad_payments 
    WHERE tenant_id = get_current_tenant_id()
  )
);