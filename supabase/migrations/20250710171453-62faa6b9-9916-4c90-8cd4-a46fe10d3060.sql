-- إضافة RLS policies لجداول SaaS (بدون IF NOT EXISTS)

-- خطط الاشتراك
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Super admins can manage subscription plans') THEN
    CREATE POLICY "Super admins can manage subscription plans"
    ON public.subscription_plans FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::user_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Everyone can view active subscription plans') THEN
    CREATE POLICY "Everyone can view active subscription plans"
    ON public.subscription_plans FOR SELECT
    TO authenticated
    USING (is_active = true);
  END IF;
END $$;

-- اشتراكات SaaS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_subscriptions' AND policyname = 'Super admins can manage all saas subscriptions') THEN
    CREATE POLICY "Super admins can manage all saas subscriptions"
    ON public.saas_subscriptions FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::user_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_subscriptions' AND policyname = 'Tenant admins can view their subscriptions') THEN
    CREATE POLICY "Tenant admins can view their subscriptions"
    ON public.saas_subscriptions FOR SELECT
    TO authenticated
    USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- فواتير SaaS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_invoices' AND policyname = 'Super admins can manage all saas invoices') THEN
    CREATE POLICY "Super admins can manage all saas invoices"
    ON public.saas_invoices FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::user_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_invoices' AND policyname = 'Tenant admins can view their invoices') THEN
    CREATE POLICY "Tenant admins can view their invoices"
    ON public.saas_invoices FOR SELECT
    TO authenticated
    USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- بنود الفواتير
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_invoice_items' AND policyname = 'Super admins can manage all invoice items') THEN
    CREATE POLICY "Super admins can manage all invoice items"
    ON public.saas_invoice_items FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::user_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));
  END IF;
END $$;

-- مدفوعات SaaS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_payments' AND policyname = 'Super admins can manage all saas payments') THEN
    CREATE POLICY "Super admins can manage all saas payments"
    ON public.saas_payments FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::user_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));
  END IF;
END $$;

-- إعدادات SADAD
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sadad_settings' AND policyname = 'Super admins can manage sadad settings') THEN
    CREATE POLICY "Super admins can manage sadad settings"
    ON public.sadad_settings FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::user_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));
  END IF;
END $$;

-- مدفوعات SADAD
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sadad_payments' AND policyname = 'Super admins can manage all sadad payments') THEN
    CREATE POLICY "Super admins can manage all sadad payments"
    ON public.sadad_payments FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::user_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::user_role));
  END IF;
END $$;