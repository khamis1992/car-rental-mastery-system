-- سياسات RLS للنظام SaaS
-- سياسات مدراء النظام الكاملة
CREATE POLICY "super_admin_full_access_subscription_plans" ON public.subscription_plans
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "super_admin_full_access_saas_subscriptions" ON public.saas_subscriptions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "super_admin_full_access_saas_invoices" ON public.saas_invoices
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "super_admin_full_access_saas_invoice_items" ON public.saas_invoice_items
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "super_admin_full_access_saas_payments" ON public.saas_payments
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

CREATE POLICY "super_admin_full_access_tenant_usage" ON public.tenant_usage
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));

-- سياسات للمؤسسات لرؤية بياناتها الخاصة
CREATE POLICY "tenants_view_own_subscription" ON public.saas_subscriptions
FOR SELECT TO authenticated
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenants_view_own_invoices" ON public.saas_invoices
FOR SELECT TO authenticated
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenants_view_own_payments" ON public.saas_payments
FOR SELECT TO authenticated
USING (tenant_id = get_current_tenant_id());

-- سياسة لرؤية الخطط المتاحة للجميع
CREATE POLICY "public_view_active_plans" ON public.subscription_plans
FOR SELECT TO authenticated
USING (is_active = true);