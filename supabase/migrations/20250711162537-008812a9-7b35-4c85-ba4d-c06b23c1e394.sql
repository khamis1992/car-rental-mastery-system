-- إنشاء جداول نظام متابعة الأقساط

-- جدول خطط الأقساط
CREATE TABLE IF NOT EXISTS public.installment_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_number text NOT NULL UNIQUE,
    plan_name text NOT NULL,
    contract_id uuid REFERENCES public.contracts(id),
    supplier_name text NOT NULL,
    total_amount numeric NOT NULL,
    down_payment numeric DEFAULT 0,
    remaining_amount numeric NOT NULL,
    number_of_installments integer NOT NULL,
    installment_frequency text NOT NULL DEFAULT 'monthly', -- monthly, quarterly, annually
    first_installment_date date NOT NULL,
    last_installment_date date NOT NULL,
    interest_rate numeric DEFAULT 0,
    penalty_rate numeric DEFAULT 0,
    status text NOT NULL DEFAULT 'active', -- active, completed, cancelled, suspended
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id)
);

-- جدول الأقساط الفردية
CREATE TABLE IF NOT EXISTS public.installments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    installment_plan_id uuid NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
    installment_number integer NOT NULL,
    due_date date NOT NULL,
    original_amount numeric NOT NULL,
    penalty_amount numeric DEFAULT 0,
    total_amount numeric NOT NULL,
    paid_amount numeric DEFAULT 0,
    remaining_amount numeric GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    payment_date date,
    payment_method text,
    payment_reference text,
    status text NOT NULL DEFAULT 'pending', -- pending, paid, overdue, partial
    days_overdue integer DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id)
);

-- جدول تنبيهات الأقساط
CREATE TABLE IF NOT EXISTS public.installment_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    installment_id uuid NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
    alert_type text NOT NULL, -- upcoming, overdue, critical
    message text NOT NULL,
    severity text NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    is_read boolean DEFAULT false,
    sent_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    created_by uuid,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id)
);

-- جدول دفعات الأقساط
CREATE TABLE IF NOT EXISTS public.installment_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    installment_id uuid NOT NULL REFERENCES public.installments(id),
    payment_amount numeric NOT NULL,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    payment_method text NOT NULL,
    payment_reference text,
    journal_entry_id uuid REFERENCES public.journal_entries(id),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_installment_plans_tenant ON public.installment_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON public.installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_installment_plans_contract ON public.installment_plans(contract_id);

CREATE INDEX IF NOT EXISTS idx_installments_tenant ON public.installments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_installments_plan ON public.installments(installment_plan_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON public.installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON public.installments(status);

CREATE INDEX IF NOT EXISTS idx_installment_alerts_tenant ON public.installments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_installment_alerts_read ON public.installment_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_installment_alerts_type ON public.installment_alerts(alert_type);

-- إنشاء دالة لتوليد رقم خطة الأقساط
CREATE OR REPLACE FUNCTION public.generate_installment_plan_number()
RETURNS text AS $$
DECLARE
  next_number INTEGER;
  plan_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(plan_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.installment_plans
  WHERE plan_number ~ '^PLAN[0-9]+$';
  
  plan_number := 'PLAN' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN plan_number;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب الأقساط المتأخرة
CREATE OR REPLACE FUNCTION public.update_overdue_installments()
RETURNS void AS $$
BEGIN
  UPDATE public.installments 
  SET 
    status = CASE 
      WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 'overdue'
      ELSE status 
    END,
    days_overdue = CASE 
      WHEN due_date < CURRENT_DATE THEN CURRENT_DATE - due_date
      ELSE 0
    END,
    updated_at = now()
  WHERE status IN ('pending', 'overdue', 'partial');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لإنشاء تنبيهات تلقائية
CREATE OR REPLACE FUNCTION public.create_installment_alerts()
RETURNS void AS $$
DECLARE
  installment_record RECORD;
  alert_message TEXT;
BEGIN
  -- تنبيهات للأقساط المستحقة خلال 7 أيام
  FOR installment_record IN
    SELECT i.*, ip.plan_name, ip.supplier_name
    FROM public.installments i
    JOIN public.installment_plans ip ON i.installment_plan_id = ip.id
    WHERE i.status = 'pending' 
    AND i.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.installment_alerts ia 
      WHERE ia.installment_id = i.id 
      AND ia.alert_type = 'upcoming'
      AND ia.sent_at::date = CURRENT_DATE
    )
  LOOP
    alert_message := 'قسط مستحق خلال ' || (installment_record.due_date - CURRENT_DATE) || ' أيام - ' || 
                    installment_record.plan_name || ' - ' || installment_record.supplier_name ||
                    ' - المبلغ: ' || installment_record.total_amount || ' د.ك';
    
    INSERT INTO public.installment_alerts (
      installment_id, alert_type, message, severity, tenant_id
    ) VALUES (
      installment_record.id, 'upcoming', alert_message, 'medium', installment_record.tenant_id
    );
  END LOOP;

  -- تنبيهات للأقساط المتأخرة
  FOR installment_record IN
    SELECT i.*, ip.plan_name, ip.supplier_name
    FROM public.installments i
    JOIN public.installment_plans ip ON i.installment_plan_id = ip.id
    WHERE i.status = 'overdue'
    AND NOT EXISTS (
      SELECT 1 FROM public.installment_alerts ia 
      WHERE ia.installment_id = i.id 
      AND ia.alert_type = 'overdue'
      AND ia.sent_at::date = CURRENT_DATE
    )
  LOOP
    alert_message := 'قسط متأخر ' || installment_record.days_overdue || ' يوم - ' || 
                    installment_record.plan_name || ' - ' || installment_record.supplier_name ||
                    ' - المبلغ: ' || installment_record.total_amount || ' د.ك';
    
    INSERT INTO public.installment_alerts (
      installment_id, alert_type, message, 
      severity, tenant_id
    ) VALUES (
      installment_record.id, 'overdue', alert_message,
      CASE WHEN installment_record.days_overdue > 30 THEN 'critical'
           WHEN installment_record.days_overdue > 7 THEN 'high'
           ELSE 'medium' END,
      installment_record.tenant_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لحساب إجمالي المستحقات
CREATE OR REPLACE FUNCTION public.calculate_installment_summary(tenant_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  total_pending numeric := 0;
  total_overdue numeric := 0;
  total_this_month numeric := 0;
  overdue_count integer := 0;
  upcoming_count integer := 0;
BEGIN
  -- المجموع المعلق
  SELECT COALESCE(SUM(remaining_amount), 0) INTO total_pending
  FROM public.installments
  WHERE tenant_id = tenant_id_param AND status IN ('pending', 'partial');
  
  -- المجموع المتأخر
  SELECT COALESCE(SUM(remaining_amount), 0), COUNT(*) INTO total_overdue, overdue_count
  FROM public.installments
  WHERE tenant_id = tenant_id_param AND status = 'overdue';
  
  -- مستحقات هذا الشهر
  SELECT COALESCE(SUM(remaining_amount), 0), COUNT(*) INTO total_this_month, upcoming_count
  FROM public.installments
  WHERE tenant_id = tenant_id_param 
  AND status = 'pending'
  AND due_date BETWEEN date_trunc('month', CURRENT_DATE) 
  AND (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');
  
  RETURN jsonb_build_object(
    'total_pending', total_pending,
    'total_overdue', total_overdue,
    'total_this_month', total_this_month,
    'overdue_count', overdue_count,
    'upcoming_count', upcoming_count,
    'calculated_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لتحديث الأوقات
CREATE OR REPLACE FUNCTION public.update_installment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_installment_plans_updated_at
  BEFORE UPDATE ON public.installment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_installment_updated_at();

CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_installment_updated_at();

-- تمكين RLS
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة خطط الأقساط"
ON public.installment_plans
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الأقساط"
ON public.installments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تنبيهات الأقساط"
ON public.installment_alerts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دفعات الأقساط"
ON public.installment_payments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));