-- إضافة عمود journal_entry_id إلى جدول payments
ALTER TABLE public.payments 
ADD COLUMN journal_entry_id UUID REFERENCES public.journal_entries(id);

-- إضافة فهرس لتحسين الأداء
CREATE INDEX idx_payments_journal_entry_id ON public.payments(journal_entry_id);

-- تحديث دالة إنشاء القيود المحاسبية للمدفوعات
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
  SELECT journal_entry_id INTO journal_entry_id FROM public.payments WHERE id = payment_id;
  IF journal_entry_id IS NOT NULL THEN
    RETURN journal_entry_id; -- القيد موجود بالفعل
  END IF;
  
  -- استخراج البيانات
  customer_name := payment_data->>'customer_name';
  invoice_number := payment_data->>'invoice_number';
  payment_amount := (payment_data->>'payment_amount')::NUMERIC;
  payment_method := payment_data->>'payment_method';
  payment_date := payment_data->>'payment_date';
  
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
  WHERE id = payment_id;
  
  RETURN journal_entry_id;
END;
$function$;