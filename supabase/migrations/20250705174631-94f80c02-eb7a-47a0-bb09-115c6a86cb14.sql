-- إضافة الدوال المحاسبية المفقودة

-- دالة التحقق من توازن القيود المحاسبية
CREATE OR REPLACE FUNCTION validate_accounting_balance(
  journal_entry_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_debit NUMERIC := 0;
  total_credit NUMERIC := 0;
  difference NUMERIC;
  is_balanced BOOLEAN;
BEGIN
  -- حساب إجمالي المدين والدائن
  SELECT 
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM public.journal_entry_lines
  WHERE journal_entry_lines.journal_entry_id = validate_accounting_balance.journal_entry_id;
  
  -- حساب الفرق
  difference := total_debit - total_credit;
  is_balanced := (difference = 0);
  
  RETURN json_build_object(
    'is_balanced', is_balanced,
    'total_debit', total_debit,
    'total_credit', total_credit,
    'difference', difference
  );
END;
$$;

-- دالة تصحيح القيود المحاسبية غير المتوازنة
CREATE OR REPLACE FUNCTION fix_unbalanced_accounting_entries()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unbalanced_entry RECORD;
  fixed_count INTEGER := 0;
  remaining_count INTEGER := 0;
  adjustment_account UUID;
  difference NUMERIC;
BEGIN
  -- الحصول على حساب التسوية
  SELECT id INTO adjustment_account 
  FROM public.chart_of_accounts 
  WHERE account_code = '5999' -- حساب تسويات محاسبية
  LIMIT 1;
  
  -- إنشاء حساب التسوية إذا لم يكن موجوداً
  IF adjustment_account IS NULL THEN
    INSERT INTO public.chart_of_accounts (
      account_code, account_name, account_name_en, account_type, 
      account_category, level, allow_posting, is_active
    ) VALUES (
      '5999', 'تسويات محاسبية', 'Accounting Adjustments', 'expense',
      'operating_expense', 2, true, true
    ) RETURNING id INTO adjustment_account;
  END IF;
  
  -- البحث عن القيود غير المتوازنة وتصحيحها
  FOR unbalanced_entry IN
    SELECT 
      je.id,
      COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0) as difference
    FROM public.journal_entries je
    LEFT JOIN public.journal_entry_lines jel ON je.id = jel.journal_entry_id
    WHERE je.status = 'posted'
    GROUP BY je.id
    HAVING COALESCE(SUM(jel.debit_amount), 0) != COALESCE(SUM(jel.credit_amount), 0)
  LOOP
    difference := unbalanced_entry.difference;
    
    -- إضافة سطر تسوية
    IF difference > 0 THEN
      -- المدين أكبر، إضافة دائن
      INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, 
        debit_amount, credit_amount, line_number
      ) VALUES (
        unbalanced_entry.id, adjustment_account, 'تسوية محاسبية تلقائية',
        0, difference, 999
      );
    ELSE
      -- الدائن أكبر، إضافة مدين
      INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, 
        debit_amount, credit_amount, line_number
      ) VALUES (
        unbalanced_entry.id, adjustment_account, 'تسوية محاسبية تلقائية',
        ABS(difference), 0, 999
      );
    END IF;
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  -- عدد القيود غير المتوازنة المتبقية
  SELECT COUNT(*) INTO remaining_count
  FROM (
    SELECT je.id
    FROM public.journal_entries je
    LEFT JOIN public.journal_entry_lines jel ON je.id = jel.journal_entry_id
    WHERE je.status = 'posted'
    GROUP BY je.id
    HAVING COALESCE(SUM(jel.debit_amount), 0) != COALESCE(SUM(jel.credit_amount), 0)
  ) unbalanced;
  
  RETURN json_build_object(
    'fixed_entries', fixed_count,
    'remaining_unbalanced', remaining_count
  );
END;
$$;