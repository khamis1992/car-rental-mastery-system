-- إنشاء نظام محاسبة العملاء الشامل
-- =====================================================

-- 1. إنشاء دوال محاسبة العملاء المتطورة
-- ===========================================

-- دالة إنشاء قيد محاسبي للعقد مع دمج محاسبة العملاء
CREATE OR REPLACE FUNCTION create_contract_customer_accounting_entry(
  contract_id_param UUID,
  customer_id_param UUID,
  contract_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  accounts_receivable_id UUID;
  deferred_revenue_id UUID;
  current_tenant_id UUID;
  total_amount NUMERIC;
  customer_name TEXT;
BEGIN
  current_tenant_id := get_current_tenant_id();
  total_amount := (contract_data->>'total_amount')::NUMERIC;
  customer_name := contract_data->>'customer_name';
  
  -- البحث عن حسابات المدينين والإيرادات المؤجلة
  SELECT id INTO accounts_receivable_id 
  FROM chart_of_accounts 
  WHERE tenant_id = current_tenant_id 
    AND account_code = '11301'
    AND is_active = true;
    
  SELECT id INTO deferred_revenue_id 
  FROM chart_of_accounts 
  WHERE tenant_id = current_tenant_id 
    AND account_code = '21301'
    AND is_active = true;
  
  IF accounts_receivable_id IS NULL OR deferred_revenue_id IS NULL THEN
    RAISE EXCEPTION 'حسابات المدينين أو الإيرادات المؤجلة غير موجودة';
  END IF;
  
  -- إنشاء القيد المحاسبي
  INSERT INTO journal_entries (
    tenant_id, entry_number, entry_date, entry_type,
    description, reference_id, reference_table,
    total_debit, total_credit, status,
    created_by
  ) VALUES (
    current_tenant_id,
    'CON-' || extract(year from now()) || '-' || lpad(nextval('journal_entry_sequence')::text, 6, '0'),
    CURRENT_DATE,
    'contract_receivable',
    'قيد مديونية عقد رقم ' || (contract_data->>'contract_number') || ' - العميل: ' || customer_name,
    contract_id_param,
    'contracts',
    total_amount,
    total_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- تفاصيل القيد - المدينين (مدين)
  INSERT INTO journal_entry_details (
    journal_entry_id, account_id, debit_amount, credit_amount,
    description, reference_id, reference_type
  ) VALUES (
    journal_entry_id,
    accounts_receivable_id,
    total_amount,
    0,
    'مديونية العميل ' || customer_name || ' - عقد ' || (contract_data->>'contract_number'),
    contract_id_param,
    'contract'
  );
  
  -- تفاصيل القيد - الإيرادات المؤجلة (دائن)
  INSERT INTO journal_entry_details (
    journal_entry_id, account_id, debit_amount, credit_amount,
    description, reference_id, reference_type
  ) VALUES (
    journal_entry_id,
    deferred_revenue_id,
    0,
    total_amount,
    'إيرادات مؤجلة - عقد ' || (contract_data->>'contract_number'),
    contract_id_param,
    'contract'
  );
  
  -- إنشاء سجل في دفتر الأستاذ المساعد للعملاء
  INSERT INTO customer_subsidiary_ledger (
    customer_id, transaction_date, reference_id, reference_type,
    debit_amount, credit_amount, description,
    invoice_number, running_balance,
    created_by, tenant_id
  ) VALUES (
    customer_id_param,
    CURRENT_DATE,
    contract_id_param,
    'contract',
    total_amount,
    0,
    'مديونية عقد رقم ' || (contract_data->>'contract_number'),
    contract_data->>'contract_number',
    total_amount, -- سيتم تحديثه بـ trigger
    auth.uid(),
    current_tenant_id
  );
  
  RETURN journal_entry_id;
END;
$$;

-- دالة إنشاء قيد محاسبي للدفعة مع تحديث محاسبة العملاء
CREATE OR REPLACE FUNCTION create_payment_customer_accounting_entry(
  payment_id_param UUID,
  customer_id_param UUID,
  invoice_id_param UUID,
  payment_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  cash_account_id UUID;
  accounts_receivable_id UUID;
  revenue_account_id UUID;
  deferred_revenue_id UUID;
  current_tenant_id UUID;
  payment_amount NUMERIC;
  customer_name TEXT;
  invoice_number TEXT;
  payment_method TEXT;
BEGIN
  current_tenant_id := get_current_tenant_id();
  payment_amount := (payment_data->>'payment_amount')::NUMERIC;
  customer_name := payment_data->>'customer_name';
  invoice_number := payment_data->>'invoice_number';
  payment_method := payment_data->>'payment_method';
  
  -- البحث عن الحسابات المطلوبة
  SELECT id INTO cash_account_id 
  FROM chart_of_accounts 
  WHERE tenant_id = current_tenant_id 
    AND account_code = '11101'
    AND is_active = true;
    
  SELECT id INTO accounts_receivable_id 
  FROM chart_of_accounts 
  WHERE tenant_id = current_tenant_id 
    AND account_code = '11301'
    AND is_active = true;
    
  SELECT id INTO revenue_account_id 
  FROM chart_of_accounts 
  WHERE tenant_id = current_tenant_id 
    AND account_code = '4110101'
    AND is_active = true;
    
  SELECT id INTO deferred_revenue_id 
  FROM chart_of_accounts 
  WHERE tenant_id = current_tenant_id 
    AND account_code = '21301'
    AND is_active = true;
  
  -- إنشاء القيد المحاسبي للدفعة
  INSERT INTO journal_entries (
    tenant_id, entry_number, entry_date, entry_type,
    description, reference_id, reference_table,
    total_debit, total_credit, status,
    created_by
  ) VALUES (
    current_tenant_id,
    'PAY-' || extract(year from now()) || '-' || lpad(nextval('journal_entry_sequence')::text, 6, '0'),
    (payment_data->>'payment_date')::DATE,
    'payment_revenue',
    'قيد دفعة فاتورة رقم ' || invoice_number || ' - العميل: ' || customer_name,
    payment_id_param,
    'payments',
    payment_amount * 2, -- مبلغ مضاعف لأننا نسجل قيدين
    payment_amount * 2,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- 1. قيد استلام النقدية (مدين)
  INSERT INTO journal_entry_details (
    journal_entry_id, account_id, debit_amount, credit_amount,
    description, reference_id, reference_type
  ) VALUES (
    journal_entry_id,
    cash_account_id,
    payment_amount,
    0,
    'استلام دفعة من العميل ' || customer_name || ' - فاتورة ' || invoice_number,
    payment_id_param,
    'payment'
  );
  
  -- 2. قيد تقليل المدينين (دائن)
  INSERT INTO journal_entry_details (
    journal_entry_id, account_id, debit_amount, credit_amount,
    description, reference_id, reference_type
  ) VALUES (
    journal_entry_id,
    accounts_receivable_id,
    0,
    payment_amount,
    'تقليل مديونية العميل ' || customer_name || ' - فاتورة ' || invoice_number,
    payment_id_param,
    'payment'
  );
  
  -- 3. قيد تحويل الإيرادات المؤجلة إلى إيرادات فعلية (مدين)
  INSERT INTO journal_entry_details (
    journal_entry_id, account_id, debit_amount, credit_amount,
    description, reference_id, reference_type
  ) VALUES (
    journal_entry_id,
    deferred_revenue_id,
    payment_amount,
    0,
    'تحويل إيرادات مؤجلة إلى فعلية - فاتورة ' || invoice_number,
    payment_id_param,
    'payment'
  );
  
  -- 4. قيد الإيرادات الفعلية (دائن)
  INSERT INTO journal_entry_details (
    journal_entry_id, account_id, debit_amount, credit_amount,
    description, reference_id, reference_type
  ) VALUES (
    journal_entry_id,
    revenue_account_id,
    0,
    payment_amount,
    'إيراد فعلي من العميل ' || customer_name || ' - فاتورة ' || invoice_number,
    payment_id_param,
    'payment'
  );
  
  -- تحديث دفتر الأستاذ المساعد للعملاء
  INSERT INTO customer_subsidiary_ledger (
    customer_id, transaction_date, reference_id, reference_type,
    debit_amount, credit_amount, description,
    invoice_number, running_balance,
    created_by, tenant_id
  ) VALUES (
    customer_id_param,
    (payment_data->>'payment_date')::DATE,
    payment_id_param,
    'payment',
    0,
    payment_amount,
    'دفعة فاتورة رقم ' || invoice_number || ' - ' || payment_method,
    invoice_number,
    0, -- سيتم تحديثه بـ trigger
    auth.uid(),
    current_tenant_id
  );
  
  RETURN journal_entry_id;
END;
$$;

-- دالة إنشاء قيد محاسبي للفاتورة مع محاسبة العملاء
CREATE OR REPLACE FUNCTION create_invoice_customer_accounting_entry(
  invoice_id_param UUID,
  customer_id_param UUID,
  invoice_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  accounts_receivable_id UUID;
  revenue_account_id UUID;
  current_tenant_id UUID;
  total_amount NUMERIC;
  customer_name TEXT;
  invoice_number TEXT;
BEGIN
  current_tenant_id := get_current_tenant_id();
  total_amount := (invoice_data->>'total_amount')::NUMERIC;
  customer_name := invoice_data->>'customer_name';
  invoice_number := invoice_data->>'invoice_number';
  
  -- البحث عن الحسابات المطلوبة
  SELECT id INTO accounts_receivable_id 
  FROM chart_of_accounts 
  WHERE tenant_id = current_tenant_id 
    AND account_code = '11301'
    AND is_active = true;
    
  SELECT id INTO revenue_account_id 
  FROM chart_of_accounts 
  WHERE tenant_id = current_tenant_id 
    AND account_code = '4110101'
    AND is_active = true;
  
  -- إنشاء القيد المحاسبي
  INSERT INTO journal_entries (
    tenant_id, entry_number, entry_date, entry_type,
    description, reference_id, reference_table,
    total_debit, total_credit, status,
    created_by
  ) VALUES (
    current_tenant_id,
    'INV-' || extract(year from now()) || '-' || lpad(nextval('journal_entry_sequence')::text, 6, '0'),
    CURRENT_DATE,
    'invoice_receivable',
    'قيد فاتورة رقم ' || invoice_number || ' - العميل: ' || customer_name,
    invoice_id_param,
    'invoices',
    total_amount,
    total_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- تفاصيل القيد
  INSERT INTO journal_entry_details (
    journal_entry_id, account_id, debit_amount, credit_amount,
    description, reference_id, reference_type
  ) VALUES 
  (
    journal_entry_id,
    accounts_receivable_id,
    total_amount,
    0,
    'مديونية العميل ' || customer_name || ' - فاتورة ' || invoice_number,
    invoice_id_param,
    'invoice'
  ),
  (
    journal_entry_id,
    revenue_account_id,
    0,
    total_amount,
    'إيراد فاتورة ' || invoice_number,
    invoice_id_param,
    'invoice'
  );
  
  -- تحديث دفتر الأستاذ المساعد للعملاء
  INSERT INTO customer_subsidiary_ledger (
    customer_id, transaction_date, reference_id, reference_type,
    debit_amount, credit_amount, description,
    invoice_number, running_balance,
    created_by, tenant_id
  ) VALUES (
    customer_id_param,
    CURRENT_DATE,
    invoice_id_param,
    'invoice',
    total_amount,
    0,
    'فاتورة رقم ' || invoice_number,
    invoice_number,
    total_amount,
    auth.uid(),
    current_tenant_id
  );
  
  RETURN journal_entry_id;
END;
$$;

-- دالة حساب رصيد العميل الجاري
CREATE OR REPLACE FUNCTION get_customer_current_balance(customer_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance NUMERIC := 0;
  current_tenant_id UUID;
BEGIN
  current_tenant_id := get_current_tenant_id();
  
  SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
  INTO current_balance
  FROM customer_subsidiary_ledger
  WHERE customer_id = customer_id_param
    AND tenant_id = current_tenant_id;
    
  RETURN current_balance;
END;
$$;

-- دالة الحصول على ملخص محاسبة العملاء
CREATE OR REPLACE FUNCTION get_customer_accounting_summary(
  customer_id_param UUID DEFAULT NULL,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  current_tenant_id UUID;
  where_clause TEXT := 'WHERE tenant_id = $1';
  query_text TEXT;
BEGIN
  current_tenant_id := get_current_tenant_id();
  
  -- بناء شرط البحث
  IF customer_id_param IS NOT NULL THEN
    where_clause := where_clause || ' AND customer_id = $2';
  END IF;
  
  IF date_from IS NOT NULL THEN
    where_clause := where_clause || ' AND transaction_date >= $3';
  END IF;
  
  IF date_to IS NOT NULL THEN
    where_clause := where_clause || ' AND transaction_date <= $4';
  END IF;
  
  -- بناء الاستعلام
  query_text := '
    SELECT jsonb_build_object(
      ''total_debits'', COALESCE(SUM(debit_amount), 0),
      ''total_credits'', COALESCE(SUM(credit_amount), 0),
      ''net_balance'', COALESCE(SUM(debit_amount - credit_amount), 0),
      ''transaction_count'', COUNT(*),
      ''last_transaction_date'', MAX(transaction_date)
    )
    FROM customer_subsidiary_ledger ' || where_clause;
  
  EXECUTE query_text 
  INTO result
  USING current_tenant_id, customer_id_param, date_from, date_to;
  
  RETURN COALESCE(result, '{}');
END;
$$;

-- إنشاء trigger لتحديث الرصيد الجاري في دفتر الأستاذ المساعد
CREATE OR REPLACE FUNCTION update_customer_running_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance NUMERIC;
  previous_balance NUMERIC := 0;
BEGIN
  -- حساب الرصيد السابق
  SELECT COALESCE(running_balance, 0) INTO previous_balance
  FROM customer_subsidiary_ledger
  WHERE customer_id = NEW.customer_id
    AND transaction_date < NEW.transaction_date
    AND tenant_id = NEW.tenant_id
  ORDER BY transaction_date DESC, created_at DESC
  LIMIT 1;
  
  -- حساب الرصيد الجديد
  current_balance := previous_balance + NEW.debit_amount - NEW.credit_amount;
  NEW.running_balance := current_balance;
  
  -- تحديث أرصدة المعاملات اللاحقة
  UPDATE customer_subsidiary_ledger
  SET running_balance = running_balance + (NEW.debit_amount - NEW.credit_amount)
  WHERE customer_id = NEW.customer_id
    AND transaction_date > NEW.transaction_date
    AND tenant_id = NEW.tenant_id;
  
  RETURN NEW;
END;
$$;

-- إنشاء الـ trigger
DROP TRIGGER IF EXISTS update_customer_running_balance_trigger ON customer_subsidiary_ledger;
CREATE TRIGGER update_customer_running_balance_trigger
  BEFORE INSERT ON customer_subsidiary_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_running_balance();

-- إنشاء sequence للقيود المحاسبية إذا لم تكن موجودة
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'journal_entry_sequence') THEN
    CREATE SEQUENCE journal_entry_sequence START 1;
  END IF;
END $$;