-- دالة إنشاء قيد محاسبي للفاتورة
CREATE OR REPLACE FUNCTION create_invoice_accounting_entry(
  invoice_id UUID,
  invoice_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  customer_name TEXT;
  invoice_number TEXT;
  
  -- معرفات الحسابات
  receivable_account UUID;
  revenue_account UUID;
  tax_account UUID;
  discount_account UUID;
  
  -- المبالغ
  total_amount NUMERIC;
  tax_amount NUMERIC;
  discount_amount NUMERIC;
  net_revenue NUMERIC;
BEGIN
  -- استخراج البيانات
  customer_name := invoice_data->>'customer_name';
  invoice_number := invoice_data->>'invoice_number';
  total_amount := (invoice_data->>'total_amount')::NUMERIC;
  tax_amount := COALESCE((invoice_data->>'tax_amount')::NUMERIC, 0);
  discount_amount := COALESCE((invoice_data->>'discount_amount')::NUMERIC, 0);
  
  -- حساب صافي الإيراد
  net_revenue := total_amount - discount_amount;
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130';
  SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '4110';
  SELECT id INTO tax_account FROM public.chart_of_accounts WHERE account_code = '2140';
  SELECT id INTO discount_account FROM public.chart_of_accounts WHERE account_code = '4113';
  
  -- توليد رقم القيد
  journal_entry_number := public.generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
  INSERT INTO public.journal_entries (
    entry_number,
    entry_date,
    description,
    reference_type,
    reference_id,
    total_debit,
    total_credit,
    status,
    created_by
  ) VALUES (
    journal_entry_number,
    CURRENT_DATE,
    'قيد فاتورة - ' || invoice_number || ' - ' || customer_name,
    'invoice',
    invoice_id,
    net_revenue,
    net_revenue,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- المدينون (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivable_account, 'مديونية فاتورة - ' || invoice_number, net_revenue, 0, 1
  );
  
  -- إيرادات الخدمة (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, revenue_account, 'إيراد فاتورة - ' || invoice_number, 0, total_amount - tax_amount, 2
  );
  
  -- الضرائب (دائن)
  IF tax_amount > 0 THEN
    INSERT INTO public.journal_entry_lines (
      journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
      journal_entry_id, tax_account, 'ضرائب فاتورة - ' || invoice_number, 0, tax_amount, 3
    );
  END IF;
  
  -- الخصومات (مدين لتقليل الإيراد)
  IF discount_amount > 0 THEN
    INSERT INTO public.journal_entry_lines (
      journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
      journal_entry_id, discount_account, 'خصم فاتورة - ' || invoice_number, discount_amount, 0, 4
    );
  END IF;
  
  -- تحديث جدول الفواتير بمعرف القيد
  UPDATE public.invoices 
  SET journal_entry_id = journal_entry_id 
  WHERE id = invoice_id;
  
  RETURN journal_entry_id;
END;
$$;

-- دالة إنشاء قيد محاسبي للدفعة
CREATE OR REPLACE FUNCTION create_payment_accounting_entry(
  payment_id UUID,
  payment_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  customer_name TEXT;
  invoice_number TEXT;
  payment_amount NUMERIC;
  payment_method TEXT;
  payment_date TEXT;
  
  -- معرفات الحسابات
  cash_account UUID;
  bank_account UUID;
  receivable_account UUID;
BEGIN
  -- استخراج البيانات
  customer_name := payment_data->>'customer_name';
  invoice_number := payment_data->>'invoice_number';
  payment_amount := (payment_data->>'payment_amount')::NUMERIC;
  payment_method := payment_data->>'payment_method';
  payment_date := payment_data->>'payment_date';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO cash_account FROM public.chart_of_accounts WHERE account_code = '1110';
  SELECT id INTO bank_account FROM public.chart_of_accounts WHERE account_code = '1120';
  SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130';
  
  -- الحصول على حساب النقدية أو البنك بناء على طريقة الدفع
  IF payment_method = 'cash' THEN
    -- استخدام حساب النقدية
    NULL;
  ELSE
    -- استخدام حساب البنك للدفعات الأخرى
    cash_account := bank_account;
  END IF;
  
  -- توليد رقم القيد
  journal_entry_number := public.generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
  INSERT INTO public.journal_entries (
    entry_number,
    entry_date,
    description,
    reference_type,
    reference_id,
    total_debit,
    total_credit,
    status,
    created_by
  ) VALUES (
    journal_entry_number,
    payment_date::DATE,
    'قيد دفعة - ' || invoice_number || ' - ' || customer_name,
    'payment',
    payment_id,
    payment_amount,
    payment_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- النقدية/البنك (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, cash_account, 'تحصيل دفعة - ' || invoice_number, payment_amount, 0, 1
  );
  
  -- المدينون (دائن - تخفيض المديونية)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivable_account, 'تخفيض مديونية - ' || invoice_number, 0, payment_amount, 2
  );
  
  -- تحديث جدول المدفوعات بمعرف القيد
  UPDATE public.payments 
  SET journal_entry_id = journal_entry_id 
  WHERE id = payment_id;
  
  RETURN journal_entry_id;
END;
$$;

-- دالة إنشاء قيد محاسبي للصيانة
CREATE OR REPLACE FUNCTION create_maintenance_accounting_entry(
  maintenance_id UUID,
  maintenance_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  vehicle_info TEXT;
  maintenance_type TEXT;
  cost NUMERIC;
  maintenance_date TEXT;
  vendor_name TEXT;
  
  -- معرفات الحسابات
  maintenance_expense_account UUID;
  payable_account UUID;
BEGIN
  -- استخراج البيانات
  vehicle_info := maintenance_data->>'vehicle_info';
  maintenance_type := maintenance_data->>'maintenance_type';
  cost := (maintenance_data->>'cost')::NUMERIC;
  maintenance_date := maintenance_data->>'maintenance_date';
  vendor_name := maintenance_data->>'vendor_name';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO maintenance_expense_account FROM public.chart_of_accounts WHERE account_code = '5130';
  SELECT id INTO payable_account FROM public.chart_of_accounts WHERE account_code = '2150';
  
  -- توليد رقم القيد
  journal_entry_number := public.generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
  INSERT INTO public.journal_entries (
    entry_number,
    entry_date,
    description,
    reference_type,
    reference_id,
    total_debit,
    total_credit,
    status,
    created_by
  ) VALUES (
    journal_entry_number,
    maintenance_date::DATE,
    'مصروف صيانة - ' || maintenance_type || ' - ' || vehicle_info,
    'maintenance',
    maintenance_id,
    cost,
    cost,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- مصروف الصيانة (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, maintenance_expense_account, 'صيانة ' || maintenance_type || ' - ' || vehicle_info, cost, 0, 1
  );
  
  -- الدائنون (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, payable_account, 'مستحق لمورد - ' || vendor_name, 0, cost, 2
  );
  
  RETURN journal_entry_id;
END;
$$;

-- دالة إنشاء قيد محاسبي للحضور (تكاليف العمالة)
CREATE OR REPLACE FUNCTION create_attendance_accounting_entry(
  attendance_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  employee_name TEXT;
  attendance_date TEXT;
  total_cost NUMERIC;
  
  -- معرفات الحسابات
  labor_expense_account UUID;
  wages_payable_account UUID;
BEGIN
  -- استخراج البيانات
  employee_name := attendance_data->>'employee_name';
  attendance_date := attendance_data->>'date';
  total_cost := (attendance_data->>'total_cost')::NUMERIC;
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO labor_expense_account FROM public.chart_of_accounts WHERE account_code = '5110';
  SELECT id INTO wages_payable_account FROM public.chart_of_accounts WHERE account_code = '2110';
  
  -- توليد رقم القيد
  journal_entry_number := public.generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
  INSERT INTO public.journal_entries (
    entry_number,
    entry_date,
    description,
    reference_type,
    reference_id,
    total_debit,
    total_credit,
    status,
    created_by
  ) VALUES (
    journal_entry_number,
    attendance_date::DATE,
    'تكلفة عمالة يومية - ' || employee_name || ' - ' || attendance_date,
    'attendance',
    NULL,
    total_cost,
    total_cost,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- مصروف العمالة (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, labor_expense_account, 'تكلفة عمالة - ' || employee_name, total_cost, 0, 1
  );
  
  -- الأجور المستحقة (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, wages_payable_account, 'أجور مستحقة - ' || employee_name, 0, total_cost, 2
  );
  
  RETURN journal_entry_id;
END;
$$;

-- دالة الحصول على ملخص القيود المحاسبية
CREATE OR REPLACE FUNCTION get_accounting_entries_summary(
  filters JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  date_from TEXT;
  date_to TEXT;
  entry_type TEXT;
  result JSONB;
  total_entries INTEGER;
  total_debit NUMERIC;
  total_credit NUMERIC;
  by_type JSONB;
BEGIN
  -- استخراج المرشحات
  date_from := filters->>'date_from';
  date_to := filters->>'date_to';
  entry_type := filters->>'entry_type';
  
  -- بناء الاستعلام الأساسي
  WITH filtered_entries AS (
    SELECT je.*, jel.debit_amount, jel.credit_amount
    FROM public.journal_entries je
    JOIN public.journal_entry_lines jel ON je.id = jel.journal_entry_id
    WHERE 1=1
      AND (date_from IS NULL OR je.entry_date >= date_from::DATE)
      AND (date_to IS NULL OR je.entry_date <= date_to::DATE)
      AND (entry_type IS NULL OR je.reference_type = entry_type)
      AND je.status = 'posted'
  ),
  summary_data AS (
    SELECT 
      COUNT(DISTINCT id) as total_entries,
      SUM(debit_amount) as total_debit,
      SUM(credit_amount) as total_credit
    FROM filtered_entries
  ),
  type_summary AS (
    SELECT 
      reference_type,
      COUNT(DISTINCT id) as count,
      SUM(debit_amount) as total_amount
    FROM filtered_entries
    GROUP BY reference_type
  )
  SELECT 
    json_build_object(
      'total_entries', s.total_entries,
      'total_debit', s.total_debit,
      'total_credit', s.total_credit,
      'by_type', COALESCE(json_agg(
        json_build_object(
          'entry_type', t.reference_type,
          'count', t.count,
          'total_amount', t.total_amount
        )
      ), '[]'::json)
    ) INTO result
  FROM summary_data s
  LEFT JOIN type_summary t ON true
  GROUP BY s.total_entries, s.total_debit, s.total_credit;
  
  RETURN COALESCE(result, '{"total_entries":0,"total_debit":0,"total_credit":0,"by_type":[]}'::jsonb);
END;
$$;