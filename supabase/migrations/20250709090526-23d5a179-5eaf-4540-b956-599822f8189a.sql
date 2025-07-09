-- إصلاح مشكلة حساب مصروفات الصيانة في دالة create_maintenance_accounting_entry
-- تحديث الدالة لتستخدم الحساب الصحيح 5101 بدلاً من 5130

CREATE OR REPLACE FUNCTION public.create_maintenance_accounting_entry(maintenance_id uuid, maintenance_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  
  -- الحصول على معرفات الحسابات (تم تصحيح رقم الحساب من 5130 إلى 5101)
  SELECT id INTO maintenance_expense_account FROM public.chart_of_accounts WHERE account_code = '5101';
  SELECT id INTO payable_account FROM public.chart_of_accounts WHERE account_code = '2150';
  
  -- التحقق من وجود الحسابات المطلوبة
  IF maintenance_expense_account IS NULL THEN
    RAISE EXCEPTION 'حساب مصروفات الصيانة (5101) غير موجود في دليل الحسابات';
  END IF;
  
  IF payable_account IS NULL THEN
    RAISE EXCEPTION 'حساب الدائنون (2150) غير موجود في دليل الحسابات';
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
$function$;