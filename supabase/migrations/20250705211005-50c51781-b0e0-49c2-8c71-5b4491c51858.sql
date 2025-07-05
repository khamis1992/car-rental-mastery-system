-- إضافة عمود journal_entry_id إلى جدول invoices
ALTER TABLE public.invoices 
ADD COLUMN journal_entry_id UUID REFERENCES public.journal_entries(id);

-- إضافة فهرس لتحسين الأداء
CREATE INDEX idx_invoices_journal_entry_id ON public.invoices(journal_entry_id);

-- تحديث دالة إنشاء القيود المحاسبية للفواتير لتحديث العمود الجديد
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
  SELECT journal_entry_id INTO journal_entry_id FROM public.invoices WHERE id = invoice_id;
  IF journal_entry_id IS NOT NULL THEN
    RETURN journal_entry_id; -- القيد موجود بالفعل
  END IF;
  
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
$function$;