
-- إنشاء جدول دفتر الأستاذ المساعد للعملاء
CREATE TABLE public.customer_subsidiary_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  journal_entry_id UUID,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  debit_amount NUMERIC(15,3) DEFAULT 0,
  credit_amount NUMERIC(15,3) DEFAULT 0,
  running_balance NUMERIC(15,3) DEFAULT 0,
  reference_type TEXT CHECK (reference_type IN ('invoice', 'payment', 'adjustment', 'refund')),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  tenant_id UUID NOT NULL
);

-- إنشاء جدول كشوف حساب العملاء
CREATE TABLE public.customer_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  statement_date DATE NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  opening_balance NUMERIC(15,3) DEFAULT 0,
  closing_balance NUMERIC(15,3) DEFAULT 0,
  total_debits NUMERIC(15,3) DEFAULT 0,
  total_credits NUMERIC(15,3) DEFAULT 0,
  statement_data JSONB,
  generated_by UUID,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed')),
  tenant_id UUID NOT NULL
);

-- إنشاء جدول تحليل أعمار الديون
CREATE TABLE public.customer_aging_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  analysis_date DATE NOT NULL,
  current_amount NUMERIC(15,3) DEFAULT 0,
  days_30_60 NUMERIC(15,3) DEFAULT 0,
  days_61_90 NUMERIC(15,3) DEFAULT 0,
  days_91_120 NUMERIC(15,3) DEFAULT 0,
  over_120_days NUMERIC(15,3) DEFAULT 0,
  total_outstanding NUMERIC(15,3) DEFAULT 0,
  oldest_invoice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  tenant_id UUID NOT NULL
);

-- إنشاء جدول سجل معاملات العملاء
CREATE TABLE public.customer_transaction_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('invoice_created', 'payment_received', 'credit_applied', 'adjustment', 'debit_entry', 'credit_entry')),
  transaction_date DATE NOT NULL,
  amount NUMERIC(15,3) NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('invoice', 'payment', 'credit_note', 'adjustment')),
  reference_id UUID,
  journal_entry_id UUID,
  balance_before NUMERIC(15,3) DEFAULT 0,
  balance_after NUMERIC(15,3) DEFAULT 0,
  created_by UUID,
  tenant_id UUID NOT NULL,
  metadata JSONB
);

-- إنشاء جدول تكاملات المحاسبة للعقود
CREATE TABLE public.contract_accounting_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  journal_entry_id UUID NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('initial', 'collection', 'deposit', 'adjustment')),
  amount NUMERIC(15,3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  notes TEXT,
  tenant_id UUID NOT NULL
);

-- إنشاء فهارس للأداء
CREATE INDEX idx_customer_subsidiary_ledger_customer_id ON public.customer_subsidiary_ledger(customer_id);
CREATE INDEX idx_customer_subsidiary_ledger_date ON public.customer_subsidiary_ledger(transaction_date);
CREATE INDEX idx_customer_subsidiary_ledger_tenant_id ON public.customer_subsidiary_ledger(tenant_id);

CREATE INDEX idx_customer_statements_customer_id ON public.customer_statements(customer_id);
CREATE INDEX idx_customer_statements_date ON public.customer_statements(statement_date);
CREATE INDEX idx_customer_statements_tenant_id ON public.customer_statements(tenant_id);

CREATE INDEX idx_customer_aging_customer_id ON public.customer_aging_analysis(customer_id);
CREATE INDEX idx_customer_aging_date ON public.customer_aging_analysis(analysis_date);
CREATE INDEX idx_customer_aging_tenant_id ON public.customer_aging_analysis(tenant_id);

CREATE INDEX idx_customer_transaction_log_customer_id ON public.customer_transaction_log(customer_id);
CREATE INDEX idx_customer_transaction_log_date ON public.customer_transaction_log(transaction_date);
CREATE INDEX idx_customer_transaction_log_tenant_id ON public.customer_transaction_log(tenant_id);

CREATE INDEX idx_contract_accounting_entries_contract_id ON public.contract_accounting_entries(contract_id);
CREATE INDEX idx_contract_accounting_entries_tenant_id ON public.contract_accounting_entries(tenant_id);

-- تمكين Row Level Security
ALTER TABLE public.customer_subsidiary_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_aging_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_accounting_entries ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دفتر الأستاذ المساعد" 
ON public.customer_subsidiary_ledger FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة كشوف الحساب" 
ON public.customer_statements FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تحليل أعمار الديون" 
ON public.customer_aging_analysis FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة سجل معاملات العملاء" 
ON public.customer_transaction_log FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة قيود العقود المحاسبية" 
ON public.contract_accounting_entries FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- دالة لتسجيل حركة في دفتر الأستاذ المساعد للعملاء
CREATE OR REPLACE FUNCTION public.record_customer_ledger_entry(
  customer_id_param UUID,
  description_param TEXT,
  debit_amount_param NUMERIC DEFAULT 0,
  credit_amount_param NUMERIC DEFAULT 0,
  reference_type_param TEXT DEFAULT NULL,
  reference_id_param UUID DEFAULT NULL,
  journal_entry_id_param UUID DEFAULT NULL,
  transaction_date_param DATE DEFAULT CURRENT_DATE
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ledger_entry_id UUID;
  current_balance NUMERIC := 0;
  current_tenant_id UUID;
  current_user_id UUID;
BEGIN
  current_tenant_id := get_current_tenant_id();
  current_user_id := auth.uid();
  
  -- الحصول على الرصيد الحالي للعميل
  SELECT COALESCE(running_balance, 0) INTO current_balance
  FROM public.customer_subsidiary_ledger
  WHERE customer_id = customer_id_param
  AND tenant_id = current_tenant_id
  ORDER BY transaction_date DESC, created_at DESC
  LIMIT 1;
  
  -- حساب الرصيد الجديد
  current_balance := current_balance + debit_amount_param - credit_amount_param;
  
  -- إدراج القيد الجديد
  INSERT INTO public.customer_subsidiary_ledger (
    customer_id, journal_entry_id, transaction_date, description,
    debit_amount, credit_amount, running_balance,
    reference_type, reference_id, created_by, tenant_id
  ) VALUES (
    customer_id_param, journal_entry_id_param, transaction_date_param, description_param,
    debit_amount_param, credit_amount_param, current_balance,
    reference_type_param, reference_id_param, current_user_id, current_tenant_id
  ) RETURNING id INTO ledger_entry_id;
  
  -- تسجيل في سجل المعاملات
  INSERT INTO public.customer_transaction_log (
    customer_id, transaction_type, transaction_date, amount, description,
    reference_type, reference_id, journal_entry_id,
    balance_before, balance_after, created_by, tenant_id
  ) VALUES (
    customer_id_param, 
    CASE 
      WHEN debit_amount_param > 0 THEN 'debit_entry'
      WHEN credit_amount_param > 0 THEN 'credit_entry'  
      ELSE 'adjustment'
    END,
    transaction_date_param, 
    GREATEST(debit_amount_param, credit_amount_param),
    description_param,
    reference_type_param, reference_id_param, journal_entry_id_param,
    current_balance - debit_amount_param + credit_amount_param,
    current_balance,
    current_user_id, current_tenant_id
  );
  
  RETURN ledger_entry_id;
END;
$$;

-- دالة لإنشاء قيد محاسبي للعقد مع تسجيل حساب العميل
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(
  contract_id_param UUID,
  contract_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  receivable_account_id UUID;
  revenue_account_id UUID;
  deposit_account_id UUID;
  tax_account_id UUID;
  total_amount NUMERIC;
  security_deposit NUMERIC;
  tax_amount NUMERIC;
  customer_id_param UUID;
  current_tenant_id UUID;
  current_user_id UUID;
BEGIN
  current_tenant_id := get_current_tenant_id();
  current_user_id := auth.uid();
  
  -- استخراج البيانات من المعاملات
  total_amount := (contract_data->>'total_amount')::NUMERIC;
  security_deposit := COALESCE((contract_data->>'security_deposit')::NUMERIC, 0);
  tax_amount := COALESCE((contract_data->>'tax_amount')::NUMERIC, 0);
  
  -- الحصول على معرف العميل من العقد
  SELECT customer_id INTO customer_id_param
  FROM public.contracts
  WHERE id = contract_id_param;
  
  -- الحصول على الحسابات المطلوبة
  SELECT id INTO receivable_account_id FROM public.chart_of_accounts 
  WHERE account_code = '1130' AND tenant_id = current_tenant_id;
  
  SELECT id INTO revenue_account_id FROM public.chart_of_accounts 
  WHERE account_code = '4110101' AND tenant_id = current_tenant_id;
  
  SELECT id INTO deposit_account_id FROM public.chart_of_accounts 
  WHERE account_code = '213' AND tenant_id = current_tenant_id;
  
  SELECT id INTO tax_account_id FROM public.chart_of_accounts 
  WHERE account_code = '214' AND tenant_id = current_tenant_id;
  
  -- إنشاء القيد المحاسبي الرئيسي
  INSERT INTO public.journal_entries (
    entry_number, entry_date, description, reference_type, reference_id,
    total_debit, total_credit, status, created_by, tenant_id
  ) VALUES (
    public.generate_journal_entry_number(),
    CURRENT_DATE,
    'قيد عقد إيجار - ' || (contract_data->>'customer_name'),
    'contract',
    contract_id_param,
    total_amount + security_deposit,
    total_amount + security_deposit,
    'posted',
    current_user_id,
    current_tenant_id
  ) RETURNING id INTO journal_entry_id;
  
  -- إدراج تفاصيل القيد
  -- المدين: حساب العملاء (إجمالي المبلغ)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivable_account_id,
    'مديونية عقد - ' || (contract_data->>'customer_name'),
    total_amount, 0, 1
  );
  
  -- الدائن: إيرادات مؤجلة
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, revenue_account_id,
    'إيرادات مؤجلة - ' || (contract_data->>'customer_name'),
    0, total_amount - tax_amount, 2
  );
  
  -- إذا كان هناك عربون
  IF security_deposit > 0 THEN
    INSERT INTO public.journal_entry_lines (
      journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
      journal_entry_id, deposit_account_id,
      'عربون مستلم - ' || (contract_data->>'customer_name'),
      security_deposit, 0, 3
    ),
    (
      journal_entry_id, deposit_account_id,
      'التزام عربون - ' || (contract_data->>'customer_name'),
      0, security_deposit, 4
    );
  END IF;
  
  -- إذا كانت هناك ضرائب
  IF tax_amount > 0 THEN
    INSERT INTO public.journal_entry_lines (
      journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
      journal_entry_id, tax_account_id,
      'ضرائب مستحقة - ' || (contract_data->>'customer_name'),
      0, tax_amount, 5
    );
  END IF;
  
  -- تسجيل الحركة في دفتر العملاء
  PERFORM public.record_customer_ledger_entry(
    customer_id_param,
    'عقد إيجار رقم - ' || (SELECT contract_number FROM public.contracts WHERE id = contract_id_param),
    total_amount,
    0,
    'invoice',
    contract_id_param,
    journal_entry_id,
    CURRENT_DATE
  );
  
  -- ربط القيد بالعقد
  INSERT INTO public.contract_accounting_entries (
    contract_id, journal_entry_id, entry_type, amount, created_by, tenant_id,
    notes
  ) VALUES (
    contract_id_param, journal_entry_id, 'initial', total_amount, 
    current_user_id, current_tenant_id,
    'قيد أولي للعقد'
  );
  
  -- تحديث العقد بمعرف القيد
  UPDATE public.contracts 
  SET journal_entry_id = journal_entry_id
  WHERE id = contract_id_param;
  
  RETURN journal_entry_id;
END;
$$;

-- دالة لإنشاء قيد محاسبي للدفعة مع تحديث حساب العميل
CREATE OR REPLACE FUNCTION public.create_payment_accounting_entry(
  payment_id_param UUID,
  payment_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  cash_account_id UUID;
  receivable_account_id UUID;
  revenue_account_id UUID;
  payment_amount NUMERIC;
  customer_id_param UUID;
  invoice_id_param UUID;
  current_tenant_id UUID;
  current_user_id UUID;
BEGIN
  current_tenant_id := get_current_tenant_id();
  current_user_id := auth.uid();
  
  -- استخراج البيانات
  payment_amount := (payment_data->>'payment_amount')::NUMERIC;
  
  -- الحصول على معرف العميل والفاتورة من الدفعة
  SELECT customer_id, invoice_id INTO customer_id_param, invoice_id_param
  FROM public.payments
  WHERE id = payment_id_param;
  
  -- الحصول على الحسابات المطلوبة
  SELECT id INTO cash_account_id FROM public.chart_of_accounts 
  WHERE account_code = '1101' AND tenant_id = current_tenant_id;
  
  SELECT id INTO receivable_account_id FROM public.chart_of_accounts 
  WHERE account_code = '1130' AND tenant_id = current_tenant_id;
  
  SELECT id INTO revenue_account_id FROM public.chart_of_accounts 
  WHERE account_code = '4110101' AND tenant_id = current_tenant_id;
  
  -- إنشاء القيد المحاسبي
  INSERT INTO public.journal_entries (
    entry_number, entry_date, description, reference_type, reference_id,
    total_debit, total_credit, status, created_by, tenant_id
  ) VALUES (
    public.generate_journal_entry_number(),
    (payment_data->>'payment_date')::DATE,
    'تحصيل دفعة - ' || (payment_data->>'customer_name') || ' - فاتورة ' || (payment_data->>'invoice_number'),
    'payment',
    payment_id_param,
    payment_amount,
    payment_amount,
    'posted',
    current_user_id,
    current_tenant_id
  ) RETURNING id INTO journal_entry_id;
  
  -- تفاصيل القيد
  -- المدين: النقدية
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, cash_account_id,
    'نقدية محصلة - ' || (payment_data->>'customer_name'),
    payment_amount, 0, 1
  );
  
  -- الدائن: حساب العملاء (تقليل المديونية)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivable_account_id,
    'تحصيل من العميل - ' || (payment_data->>'customer_name'),
    0, payment_amount, 2
  );
  
  -- الدائن: تحقيق الإيرادات
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, revenue_account_id,
    'تحقيق إيراد - ' || (payment_data->>'customer_name'),
    0, payment_amount, 3
  );
  
  -- تسجيل الحركة في دفتر العملاء
  PERFORM public.record_customer_ledger_entry(
    customer_id_param,
    'تحصيل دفعة - فاتورة ' || (payment_data->>'invoice_number'),
    0,
    payment_amount,
    'payment',
    payment_id_param,
    journal_entry_id,
    (payment_data->>'payment_date')::DATE
  );
  
  RETURN journal_entry_id;
END;
$$;

-- دالة لحساب تحليل أعمار الديون لعميل محدد
CREATE OR REPLACE FUNCTION public.calculate_customer_aging(
  customer_id_param UUID,
  analysis_date_param DATE DEFAULT CURRENT_DATE
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  aging_result JSONB;
  current_amt NUMERIC(15,3) := 0;
  days_30_60_amt NUMERIC(15,3) := 0;
  days_61_90_amt NUMERIC(15,3) := 0;
  days_91_120_amt NUMERIC(15,3) := 0;
  over_120_amt NUMERIC(15,3) := 0;
  total_amt NUMERIC(15,3) := 0;
  oldest_date DATE;
BEGIN
  -- حساب المبالغ حسب الفترات العمرية
  SELECT
    COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) <= 30 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) BETWEEN 31 AND 60 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) BETWEEN 61 AND 90 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) BETWEEN 91 AND 120 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN (analysis_date_param - transaction_date) > 120 THEN (debit_amount - credit_amount) ELSE 0 END), 0),
    COALESCE(SUM(debit_amount - credit_amount), 0),
    MIN(CASE WHEN (debit_amount - credit_amount) > 0 THEN transaction_date ELSE NULL END)
  INTO current_amt, days_30_60_amt, days_61_90_amt, days_91_120_amt, over_120_amt, total_amt, oldest_date
  FROM public.customer_subsidiary_ledger
  WHERE customer_id = customer_id_param
  AND transaction_date <= analysis_date_param;
  
  aging_result := jsonb_build_object(
    'current_amount', current_amt,
    'days_30_60', days_30_60_amt,
    'days_61_90', days_61_90_amt,
    'days_91_120', days_91_120_amt,
    'over_120_days', over_120_amt,
    'total_outstanding', total_amt,
    'oldest_invoice_date', oldest_date
  );
  
  RETURN aging_result;
END;
$$;
