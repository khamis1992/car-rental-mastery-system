-- Fix ambiguous column references and create reprocessing functions for payment accounting

-- Fix create_payment_accounting_entry function with proper table aliases
CREATE OR REPLACE FUNCTION public.create_payment_accounting_entry(payment_id uuid, payment_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  selected_account UUID;
BEGIN
  -- التحقق من عدم وجود قيد محاسبي مسبق
  SELECT p.journal_entry_id INTO journal_entry_id 
  FROM public.payments p 
  WHERE p.id = create_payment_accounting_entry.payment_id;
  
  IF journal_entry_id IS NOT NULL THEN
    RETURN journal_entry_id; -- القيد موجود بالفعل
  END IF;
  
  -- استخراج البيانات
  customer_name := payment_data->>'customer_name';
  invoice_number := payment_data->>'invoice_number';
  payment_amount := (payment_data->>'payment_amount')::NUMERIC;
  payment_method := payment_data->>'payment_method';
  payment_date := payment_data->>'payment_date';
  
  -- التحقق من صحة المبالغ
  IF payment_amount IS NULL OR payment_amount <= 0 THEN
    RAISE EXCEPTION 'مبلغ الدفعة يجب أن يكون أكبر من صفر';
  END IF;
  
  -- الحصول على معرفات الحسابات بالأكواد الصحيحة
  SELECT id INTO cash_account FROM public.chart_of_accounts WHERE account_code = '111001'; -- الصندوق
  SELECT id INTO bank_account FROM public.chart_of_accounts WHERE account_code = '112001'; -- البنك
  SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130'; -- عملاء عقود الإيجار
  
  -- التحقق من وجود الحسابات المطلوبة
  IF receivable_account IS NULL THEN
    RAISE EXCEPTION 'حساب عملاء عقود الإيجار (1130) غير موجود';
  END IF;
  
  -- اختيار الحساب المناسب بناء على طريقة الدفع
  IF payment_method = 'cash' THEN
    selected_account := cash_account;
    IF selected_account IS NULL THEN
      RAISE EXCEPTION 'حساب الصندوق (111001) غير موجود';
    END IF;
  ELSE
    selected_account := bank_account;
    IF selected_account IS NULL THEN
      RAISE EXCEPTION 'حساب البنك (112001) غير موجود';
    END IF;
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
    create_payment_accounting_entry.payment_id,
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
    journal_entry_id, selected_account, 'تحصيل دفعة - ' || invoice_number, payment_amount, 0, 1
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
  WHERE id = create_payment_accounting_entry.payment_id;
  
  RETURN journal_entry_id;
END;
$function$;

-- Fix create_invoice_accounting_entry function with proper table aliases
CREATE OR REPLACE FUNCTION public.create_invoice_accounting_entry(invoice_id uuid, invoice_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  -- التحقق من عدم وجود قيد محاسبي مسبق
  SELECT i.journal_entry_id INTO journal_entry_id 
  FROM public.invoices i 
  WHERE i.id = create_invoice_accounting_entry.invoice_id;
  
  IF journal_entry_id IS NOT NULL THEN
    RETURN journal_entry_id; -- القيد موجود بالفعل
  END IF;
  
  -- استخراج البيانات
  customer_name := invoice_data->>'customer_name';
  invoice_number := invoice_data->>'invoice_number';
  total_amount := (invoice_data->>'total_amount')::NUMERIC;
  tax_amount := COALESCE((invoice_data->>'tax_amount')::NUMERIC, 0);
  discount_amount := COALESCE((invoice_data->>'discount_amount')::NUMERIC, 0);
  
  -- التحقق من صحة المبالغ
  IF total_amount IS NULL OR total_amount <= 0 THEN
    RAISE EXCEPTION 'المبلغ الإجمالي للفاتورة يجب أن يكون أكبر من صفر';
  END IF;
  
  -- حساب صافي الإيراد
  net_revenue := total_amount;
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO receivable_account FROM public.chart_of_accounts WHERE account_code = '1130';
  SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '4110';
  SELECT id INTO tax_account FROM public.chart_of_accounts WHERE account_code = '2140';
  SELECT id INTO discount_account FROM public.chart_of_accounts WHERE account_code = '4113';
  
  -- التحقق من وجود الحسابات المطلوبة
  IF receivable_account IS NULL THEN
    RAISE EXCEPTION 'حساب عملاء عقود الإيجار (1130) غير موجود';
  END IF;
  
  IF revenue_account IS NULL THEN
    RAISE EXCEPTION 'حساب إيرادات التأجير (4110) غير موجود';
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
    CURRENT_DATE,
    'قيد فاتورة - ' || invoice_number || ' - ' || customer_name,
    'invoice',
    create_invoice_accounting_entry.invoice_id,
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
  IF tax_amount > 0 AND tax_account IS NOT NULL THEN
    INSERT INTO public.journal_entry_lines (
      journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
      journal_entry_id, tax_account, 'ضرائب فاتورة - ' || invoice_number, 0, tax_amount, 3
    );
  END IF;
  
  -- الخصومات (مدين لتقليل الإيراد)
  IF discount_amount > 0 AND discount_account IS NOT NULL THEN
    INSERT INTO public.journal_entry_lines (
      journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
    ) VALUES (
      journal_entry_id, discount_account, 'خصم فاتورة - ' || invoice_number, discount_amount, 0, 4
    );
  END IF;
  
  -- تحديث جدول الفواتير بمعرف القيد
  UPDATE public.invoices 
  SET journal_entry_id = journal_entry_id 
  WHERE id = create_invoice_accounting_entry.invoice_id;
  
  RETURN journal_entry_id;
END;
$function$;

-- Create function to reprocess missing payment entries
CREATE OR REPLACE FUNCTION public.reprocess_missing_payment_entries()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  payment_record RECORD;
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
  results JSONB := '[]'::jsonb;
  result_item JSONB;
BEGIN
  -- البحث عن المدفوعات التي لا تحتوي على قيود محاسبية
  FOR payment_record IN (
    SELECT 
      p.id,
      p.amount,
      p.payment_date,
      p.payment_method,
      i.invoice_number,
      c.name as customer_name
    FROM public.payments p
    JOIN public.invoices i ON p.invoice_id = i.id
    JOIN public.customers c ON i.customer_id = c.id
    WHERE p.journal_entry_id IS NULL
    AND p.status = 'completed'
    ORDER BY p.created_at DESC
  ) LOOP
    BEGIN
      -- إنشاء القيد المحاسبي للدفعة
      PERFORM public.create_payment_accounting_entry(
        payment_record.id,
        jsonb_build_object(
          'customer_name', payment_record.customer_name,
          'invoice_number', payment_record.invoice_number,
          'payment_amount', payment_record.amount,
          'payment_method', payment_record.payment_method,
          'payment_date', payment_record.payment_date
        )
      );
      
      processed_count := processed_count + 1;
      
      result_item := jsonb_build_object(
        'payment_id', payment_record.id,
        'invoice_number', payment_record.invoice_number,
        'amount', payment_record.amount,
        'status', 'success'
      );
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      
      result_item := jsonb_build_object(
        'payment_id', payment_record.id,
        'invoice_number', payment_record.invoice_number,
        'amount', payment_record.amount,
        'status', 'error',
        'error_message', SQLERRM
      );
    END;
    
    results := results || result_item;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed_count', processed_count,
    'error_count', error_count,
    'total_processed', processed_count + error_count,
    'results', results
  );
END;
$function$;

-- Create comprehensive validation function
CREATE OR REPLACE FUNCTION public.validate_accounting_integrity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  payments_without_entries INTEGER;
  invoices_without_entries INTEGER;
  unbalanced_entries INTEGER;
  missing_accounts INTEGER;
  results JSONB;
BEGIN
  -- عدد المدفوعات بدون قيود محاسبية
  SELECT COUNT(*) INTO payments_without_entries
  FROM public.payments p
  WHERE p.journal_entry_id IS NULL 
  AND p.status = 'completed';
  
  -- عدد الفواتير بدون قيود محاسبية
  SELECT COUNT(*) INTO invoices_without_entries
  FROM public.invoices i
  WHERE i.journal_entry_id IS NULL;
  
  -- عدد القيود غير المتوازنة
  SELECT COUNT(*) INTO unbalanced_entries
  FROM (
    SELECT je.id
    FROM public.journal_entries je
    LEFT JOIN public.journal_entry_lines jel ON je.id = jel.journal_entry_id
    WHERE je.status = 'posted'
    GROUP BY je.id
    HAVING COALESCE(SUM(jel.debit_amount), 0) != COALESCE(SUM(jel.credit_amount), 0)
  ) unbalanced;
  
  -- فحص الحسابات المطلوبة
  SELECT COUNT(*) INTO missing_accounts
  FROM (
    SELECT unnest(ARRAY['111001', '112001', '1130', '4110']) as required_code
  ) required_codes
  LEFT JOIN public.chart_of_accounts coa ON required_codes.required_code = coa.account_code
  WHERE coa.id IS NULL;
  
  results := jsonb_build_object(
    'payments_without_entries', payments_without_entries,
    'invoices_without_entries', invoices_without_entries,
    'unbalanced_entries', unbalanced_entries,
    'missing_required_accounts', missing_accounts,
    'overall_status', CASE 
      WHEN (payments_without_entries + invoices_without_entries + unbalanced_entries + missing_accounts) = 0 
      THEN 'healthy' 
      ELSE 'needs_attention' 
    END,
    'validation_timestamp', now()
  );
  
  RETURN results;
END;
$function$;