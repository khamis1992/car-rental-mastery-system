
-- إنشاء جدول لقواعد الربط التلقائي المحسنة
CREATE TABLE IF NOT EXISTS public.automated_entry_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  rule_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'contract_created', 'contract_activated', 'contract_completed',
    'payment_received', 'invoice_generated', 'invoice_paid',
    'vehicle_maintenance', 'fuel_purchase', 'violation_payment'
  )),
  conditions JSONB DEFAULT '{}',
  account_mappings JSONB NOT NULL,
  template_description TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول لمراقبة تنفيذ القواعد التلقائية
CREATE TABLE IF NOT EXISTS public.automated_entry_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  rule_id UUID REFERENCES automated_entry_rules(id),
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  journal_entry_id UUID REFERENCES journal_entries(id),
  execution_status TEXT NOT NULL DEFAULT 'pending' CHECK (execution_status IN (
    'pending', 'processing', 'completed', 'failed', 'skipped'
  )),
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- إنشاء جدول لمنع الإدخال المزدوج
CREATE TABLE IF NOT EXISTS public.accounting_entry_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  journal_entry_id UUID REFERENCES journal_entries(id),
  lock_type TEXT NOT NULL CHECK (lock_type IN (
    'contract_receivable', 'payment_revenue', 'invoice_receivable',
    'maintenance_expense', 'violation_revenue'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(reference_type, reference_id, lock_type)
);

-- إضافة RLS للجداول الجديدة
ALTER TABLE public.automated_entry_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_entry_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entry_locks ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لقواعد الأتمتة
CREATE POLICY "automated_entry_rules_tenant_isolation" ON public.automated_entry_rules
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "automated_entry_rules_admin_access" ON public.automated_entry_rules
  FOR ALL USING (
    has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant'])
  );

-- سياسات الأمان لسجل التنفيذ
CREATE POLICY "automated_executions_tenant_isolation" ON public.automated_entry_executions
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "automated_executions_read_access" ON public.automated_entry_executions
  FOR SELECT USING (
    has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant'])
  );

-- سياسات الأمان لمنع الإدخال المزدوج
CREATE POLICY "accounting_locks_tenant_isolation" ON public.accounting_entry_locks
  FOR ALL USING (tenant_id = get_current_tenant_id());

CREATE POLICY "accounting_locks_system_access" ON public.accounting_entry_locks
  FOR ALL USING (true); -- النظام يحتاج وصول كامل

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_automated_entry_rules_tenant_trigger 
  ON automated_entry_rules(tenant_id, trigger_event) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_automated_executions_reference 
  ON automated_entry_executions(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_accounting_locks_reference 
  ON accounting_entry_locks(reference_type, reference_id);

-- دالة للتحقق من وجود قيد محاسبي مسبق
CREATE OR REPLACE FUNCTION public.has_existing_accounting_entry(
  p_reference_type TEXT,
  p_reference_id UUID,
  p_lock_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tenant_id UUID;
BEGIN
  current_tenant_id := get_current_tenant_id();
  
  RETURN EXISTS (
    SELECT 1 FROM accounting_entry_locks
    WHERE tenant_id = current_tenant_id
      AND reference_type = p_reference_type
      AND reference_id = p_reference_id
      AND lock_type = p_lock_type
  );
END;
$$;

-- دالة لإنشاء قفل محاسبي
CREATE OR REPLACE FUNCTION public.create_accounting_lock(
  p_reference_type TEXT,
  p_reference_id UUID,
  p_journal_entry_id UUID,
  p_lock_type TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lock_id UUID;
  current_tenant_id UUID;
BEGIN
  current_tenant_id := get_current_tenant_id();
  
  INSERT INTO accounting_entry_locks (
    tenant_id, reference_type, reference_id, 
    journal_entry_id, lock_type, created_by
  ) VALUES (
    current_tenant_id, p_reference_type, p_reference_id,
    p_journal_entry_id, p_lock_type, auth.uid()
  ) RETURNING id INTO lock_id;
  
  RETURN lock_id;
END;
$$;

-- دالة لتنفيذ قاعدة أتمتة محددة
CREATE OR REPLACE FUNCTION public.execute_automation_rule(
  p_rule_id UUID,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_event_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  journal_entry_id UUID;
  execution_id UUID;
  current_tenant_id UUID;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
BEGIN
  current_tenant_id := get_current_tenant_id();
  start_time := clock_timestamp();
  
  -- إنشاء سجل تنفيذ
  INSERT INTO automated_entry_executions (
    tenant_id, rule_id, reference_type, reference_id, execution_status
  ) VALUES (
    current_tenant_id, p_rule_id, p_reference_type, p_reference_id, 'processing'
  ) RETURNING id INTO execution_id;
  
  -- جلب قاعدة الأتمتة
  SELECT * INTO rule_record
  FROM automated_entry_rules
  WHERE id = p_rule_id 
    AND tenant_id = current_tenant_id 
    AND is_active = true;
    
  IF NOT FOUND THEN
    UPDATE automated_entry_executions
    SET execution_status = 'failed',
        error_message = 'قاعدة الأتمتة غير موجودة أو غير نشطة'
    WHERE id = execution_id;
    RETURN NULL;
  END IF;
  
  -- تنفيذ الدالة المناسبة حسب نوع الحدث
  CASE rule_record.trigger_event
    WHEN 'contract_created' THEN
      SELECT create_contract_customer_accounting_entry(
        p_reference_id,
        (p_event_data->>'customer_id')::UUID,
        p_event_data
      ) INTO journal_entry_id;
      
    WHEN 'payment_received' THEN
      SELECT create_payment_customer_accounting_entry(
        p_reference_id,
        (p_event_data->>'customer_id')::UUID,
        (p_event_data->>'invoice_id')::UUID,
        p_event_data
      ) INTO journal_entry_id;
      
    WHEN 'invoice_generated' THEN
      SELECT create_invoice_customer_accounting_entry(
        p_reference_id,
        (p_event_data->>'customer_id')::UUID,
        p_event_data
      ) INTO journal_entry_id;
      
    ELSE
      RAISE EXCEPTION 'نوع حدث غير مدعوم: %', rule_record.trigger_event;
  END CASE;
  
  end_time := clock_timestamp();
  
  -- تحديث سجل التنفيذ
  UPDATE automated_entry_executions
  SET execution_status = 'completed',
      journal_entry_id = journal_entry_id,
      execution_time_ms = EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER,
      processed_at = end_time
  WHERE id = execution_id;
  
  RETURN journal_entry_id;
  
EXCEPTION WHEN OTHERS THEN
  -- تسجيل الخطأ
  UPDATE automated_entry_executions
  SET execution_status = 'failed',
      error_message = SQLERRM,
      processed_at = clock_timestamp()
  WHERE id = execution_id;
  
  RAISE;
END;
$$;

-- دالة لمعالجة الأحداث التلقائية
CREATE OR REPLACE FUNCTION public.process_automated_accounting_event(
  p_event_type TEXT,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_event_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  result_data JSONB := '{"processed_rules": [], "errors": []}';
  journal_entry_id UUID;
  current_tenant_id UUID;
  lock_type TEXT;
BEGIN
  current_tenant_id := get_current_tenant_id();
  
  -- تحديد نوع القفل المطلوب
  CASE p_event_type
    WHEN 'contract_created' THEN lock_type := 'contract_receivable';
    WHEN 'payment_received' THEN lock_type := 'payment_revenue';
    WHEN 'invoice_generated' THEN lock_type := 'invoice_receivable';
    WHEN 'vehicle_maintenance' THEN lock_type := 'maintenance_expense';
    WHEN 'violation_payment' THEN lock_type := 'violation_revenue';
    ELSE lock_type := 'general';
  END CASE;
  
  -- التحقق من عدم وجود قيد مسبق
  IF has_existing_accounting_entry(p_reference_type, p_reference_id, lock_type) THEN
    result_data := jsonb_set(
      result_data, 
      '{errors}', 
      result_data->'errors' || jsonb_build_array('يوجد قيد محاسبي مسبق لهذا المرجع')
    );
    RETURN result_data;
  END IF;
  
  -- البحث عن القواعد المطبقة
  FOR rule_record IN 
    SELECT * FROM automated_entry_rules
    WHERE tenant_id = current_tenant_id
      AND trigger_event = p_event_type
      AND is_active = true
    ORDER BY priority ASC
  LOOP
    BEGIN
      -- تنفيذ القاعدة
      SELECT execute_automation_rule(
        rule_record.id,
        p_reference_type,
        p_reference_id,
        p_event_data
      ) INTO journal_entry_id;
      
      IF journal_entry_id IS NOT NULL THEN
        -- إنشاء قفل محاسبي
        PERFORM create_accounting_lock(
          p_reference_type,
          p_reference_id,
          journal_entry_id,
          lock_type
        );
        
        -- إضافة النتيجة
        result_data := jsonb_set(
          result_data,
          '{processed_rules}',
          result_data->'processed_rules' || jsonb_build_object(
            'rule_id', rule_record.id,
            'rule_name', rule_record.rule_name,
            'journal_entry_id', journal_entry_id,
            'status', 'success'
          )
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- تسجيل الخطأ والمتابعة
      result_data := jsonb_set(
        result_data,
        '{errors}',
        result_data->'errors' || jsonb_build_object(
          'rule_id', rule_record.id,
          'rule_name', rule_record.rule_name,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;
  
  RETURN result_data;
END;
$$;

-- إنشاء القواعد الافتراضية للربط التلقائي
DO $$
DECLARE
  tenant_record RECORD;
  accounts_receivable_id UUID;
  deferred_revenue_id UUID;
  cash_account_id UUID;
  revenue_account_id UUID;
BEGIN
  -- تطبيق القواعد على جميع المؤسسات النشطة
  FOR tenant_record IN (
    SELECT id FROM tenants WHERE status = 'active'
  ) LOOP
    -- البحث عن الحسابات المطلوبة
    SELECT id INTO accounts_receivable_id
    FROM chart_of_accounts
    WHERE tenant_id = tenant_record.id AND account_code = '11301';
    
    SELECT id INTO deferred_revenue_id
    FROM chart_of_accounts
    WHERE tenant_id = tenant_record.id AND account_code = '21301';
    
    SELECT id INTO cash_account_id
    FROM chart_of_accounts
    WHERE tenant_id = tenant_record.id AND account_code = '11101';
    
    SELECT id INTO revenue_account_id
    FROM chart_of_accounts
    WHERE tenant_id = tenant_record.id AND account_code = '4110101';
    
    -- إنشاء قاعدة العقود
    IF accounts_receivable_id IS NOT NULL AND deferred_revenue_id IS NOT NULL THEN
      INSERT INTO automated_entry_rules (
        tenant_id, rule_name, trigger_event, account_mappings,
        template_description, is_active, priority
      ) VALUES (
        tenant_record.id,
        'ربط تلقائي - مديونية العقود',
        'contract_created',
        jsonb_build_object(
          'debit_account_id', accounts_receivable_id,
          'credit_account_id', deferred_revenue_id,
          'description_template', 'مديونية عقد - {{contract_number}} - العميل: {{customer_name}}'
        ),
        'قيد تلقائي لمديونية العقود الجديدة',
        true,
        1
      ) ON CONFLICT DO NOTHING;
    END IF;
    
    -- إنشاء قاعدة الدفعات
    IF cash_account_id IS NOT NULL AND revenue_account_id IS NOT NULL THEN
      INSERT INTO automated_entry_rules (
        tenant_id, rule_name, trigger_event, account_mappings,
        template_description, is_active, priority
      ) VALUES (
        tenant_record.id,
        'ربط تلقائي - إيرادات الدفعات',
        'payment_received',
        jsonb_build_object(
          'debit_account_id', cash_account_id,
          'credit_account_id', revenue_account_id,
          'description_template', 'دفعة مستلمة - فاتورة {{invoice_number}} - العميل: {{customer_name}}'
        ),
        'قيد تلقائي لإيرادات الدفعات المستلمة',
        true,
        1
      ) ON CONFLICT DO NOTHING;
    END IF;
    
  END LOOP;
END;
$$;

-- إضافة تعليقات توضيحية
COMMENT ON TABLE automated_entry_rules IS 'قواعد الربط التلقائي بين العمليات والقيود المحاسبية';
COMMENT ON TABLE automated_entry_executions IS 'سجل تنفيذ قواعد الربط التلقائي';
COMMENT ON TABLE accounting_entry_locks IS 'أقفال لمنع الإدخال المزدوج للقيود المحاسبية';
