-- فحص الحسابات المكررة والتنظيف
-- 1. إنشاء دالة لتنظيف دليل الحسابات وحل مشكلة الحسابات المكررة

-- أولاً: إنشاء دالة للبحث عن الحسابات المكررة
CREATE OR REPLACE FUNCTION find_duplicate_accounts()
RETURNS TABLE (
  account_name TEXT,
  account_type TEXT,
  count_duplicates BIGINT,
  account_codes TEXT[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    coa.account_name,
    coa.account_type,
    COUNT(*) as count_duplicates,
    ARRAY_AGG(coa.account_code ORDER BY coa.account_code) as account_codes
  FROM public.chart_of_accounts coa
  WHERE coa.is_active = true
  GROUP BY coa.account_name, coa.account_type
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, coa.account_name;
END;
$$;

-- ثانياً: إنشاء دالة لتنظيف الحسابات المكررة بأمان
CREATE OR REPLACE FUNCTION cleanup_duplicate_accounts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_record RECORD;
  primary_account_id UUID;
  secondary_account_id UUID;
  affected_count INTEGER := 0;
  cleanup_summary JSONB := '[]'::jsonb;
  cleanup_item JSONB;
BEGIN
  -- التعامل مع حسابات النقدية المكررة أولاً
  FOR duplicate_record IN (
    SELECT 
      account_name,
      account_type,
      ARRAY_AGG(id ORDER BY created_at ASC) as account_ids,
      ARRAY_AGG(account_code ORDER BY created_at ASC) as account_codes
    FROM public.chart_of_accounts 
    WHERE account_name ILIKE '%صندوق%' OR account_name ILIKE '%نقدية%' OR account_name ILIKE '%cash%'
    AND is_active = true
    GROUP BY account_name, account_type
    HAVING COUNT(*) > 1
  ) LOOP
    -- اختيار الحساب الأساسي (الأقدم)
    primary_account_id := duplicate_record.account_ids[1];
    
    -- معالجة الحسابات الثانوية
    FOR i IN 2..array_length(duplicate_record.account_ids, 1) LOOP
      secondary_account_id := duplicate_record.account_ids[i];
      
      -- نقل أي أرصدة من الحساب الثانوي إلى الأساسي
      UPDATE public.chart_of_accounts 
      SET current_balance = current_balance + (
        SELECT COALESCE(current_balance, 0) 
        FROM public.chart_of_accounts 
        WHERE id = secondary_account_id
      )
      WHERE id = primary_account_id;
      
      -- تحديث أي قيود محاسبية تشير للحساب الثانوي
      UPDATE public.journal_entry_lines 
      SET account_id = primary_account_id 
      WHERE account_id = secondary_account_id;
      
      -- إلغاء تفعيل الحساب الثانوي بدلاً من حذفه
      UPDATE public.chart_of_accounts 
      SET 
        is_active = false,
        account_name = account_name || ' (مدمج)',
        notes = COALESCE(notes, '') || ' - تم دمج هذا الحساب مع ' || duplicate_record.account_codes[1],
        updated_at = now()
      WHERE id = secondary_account_id;
      
      affected_count := affected_count + 1;
    END LOOP;
    
    -- إضافة معلومات التنظيف للتقرير
    cleanup_item := jsonb_build_object(
      'account_name', duplicate_record.account_name,
      'primary_account_code', duplicate_record.account_codes[1],
      'merged_accounts', array_length(duplicate_record.account_ids, 1) - 1
    );
    cleanup_summary := cleanup_summary || cleanup_item;
  END LOOP;

  -- التعامل مع الحسابات المكررة الأخرى
  FOR duplicate_record IN (
    SELECT 
      account_name,
      account_type,
      ARRAY_AGG(id ORDER BY created_at ASC) as account_ids,
      ARRAY_AGG(account_code ORDER BY created_at ASC) as account_codes
    FROM public.chart_of_accounts 
    WHERE is_active = true
    AND NOT (account_name ILIKE '%صندوق%' OR account_name ILIKE '%نقدية%' OR account_name ILIKE '%cash%')
    GROUP BY account_name, account_type
    HAVING COUNT(*) > 1
  ) LOOP
    -- اختيار الحساب الأساسي (الأقدم)
    primary_account_id := duplicate_record.account_ids[1];
    
    -- معالجة الحسابات الثانوية
    FOR i IN 2..array_length(duplicate_record.account_ids, 1) LOOP
      secondary_account_id := duplicate_record.account_ids[i];
      
      -- نقل الأرصدة
      UPDATE public.chart_of_accounts 
      SET current_balance = current_balance + (
        SELECT COALESCE(current_balance, 0) 
        FROM public.chart_of_accounts 
        WHERE id = secondary_account_id
      )
      WHERE id = primary_account_id;
      
      -- تحديث القيود المحاسبية
      UPDATE public.journal_entry_lines 
      SET account_id = primary_account_id 
      WHERE account_id = secondary_account_id;
      
      -- إلغاء تفعيل الحساب الثانوي
      UPDATE public.chart_of_accounts 
      SET 
        is_active = false,
        account_name = account_name || ' (مدمج)',
        notes = COALESCE(notes, '') || ' - تم دمج هذا الحساب مع ' || duplicate_record.account_codes[1],
        updated_at = now()
      WHERE id = secondary_account_id;
      
      affected_count := affected_count + 1;
    END LOOP;
    
    -- إضافة للتقرير
    cleanup_item := jsonb_build_object(
      'account_name', duplicate_record.account_name,
      'primary_account_code', duplicate_record.account_codes[1],
      'merged_accounts', array_length(duplicate_record.account_ids, 1) - 1
    );
    cleanup_summary := cleanup_summary || cleanup_item;
  END LOOP;

  RETURN jsonb_build_object(
    'total_accounts_processed', affected_count,
    'cleanup_details', cleanup_summary,
    'timestamp', now()
  );
END;
$$;

-- ثالثاً: إنشاء دالة لإعادة ترقيم الحسابات بشكل منطقي
CREATE OR REPLACE FUNCTION reorganize_account_codes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account_record RECORD;
  new_code TEXT;
  base_code TEXT;
  sequence_number INTEGER;
  reorganized_count INTEGER := 0;
BEGIN
  -- إعادة ترقيم الأصول النقدية
  sequence_number := 1;
  FOR account_record IN (
    SELECT id, account_name, account_code
    FROM public.chart_of_accounts 
    WHERE account_type = 'asset' 
    AND account_category = 'current_asset'
    AND (account_name ILIKE '%صندوق%' OR account_name ILIKE '%نقدية%' OR account_name ILIKE '%cash%')
    AND is_active = true
    ORDER BY created_at ASC
  ) LOOP
    new_code := '1110' || LPAD(sequence_number::TEXT, 2, '0');
    
    UPDATE public.chart_of_accounts 
    SET 
      account_code = new_code,
      updated_at = now()
    WHERE id = account_record.id;
    
    sequence_number := sequence_number + 1;
    reorganized_count := reorganized_count + 1;
  END LOOP;

  -- إعادة ترقيم الحسابات المصرفية
  sequence_number := 1;
  FOR account_record IN (
    SELECT id, account_name, account_code
    FROM public.chart_of_accounts 
    WHERE account_type = 'asset' 
    AND account_category = 'current_asset'
    AND (account_name ILIKE '%بنك%' OR account_name ILIKE '%مصرف%' OR account_name ILIKE '%bank%')
    AND is_active = true
    ORDER BY created_at ASC
  ) LOOP
    new_code := '1120' || LPAD(sequence_number::TEXT, 2, '0');
    
    UPDATE public.chart_of_accounts 
    SET 
      account_code = new_code,
      updated_at = now()
    WHERE id = account_record.id;
    
    sequence_number := sequence_number + 1;
    reorganized_count := reorganized_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'reorganized_accounts', reorganized_count,
    'timestamp', now()
  );
END;
$$;

-- رابعاً: إنشاء دالة للتحقق من سلامة دليل الحسابات
CREATE OR REPLACE FUNCTION validate_chart_of_accounts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_codes INTEGER;
  duplicate_names INTEGER;
  unbalanced_entries INTEGER;
  validation_result JSONB;
BEGIN
  -- التحقق من عدم وجود أكواد مكررة
  SELECT COUNT(*) INTO duplicate_codes
  FROM (
    SELECT account_code, COUNT(*) 
    FROM public.chart_of_accounts 
    WHERE is_active = true
    GROUP BY account_code 
    HAVING COUNT(*) > 1
  ) duplicates;

  -- التحقق من عدم وجود أسماء مكررة لنفس النوع
  SELECT COUNT(*) INTO duplicate_names
  FROM (
    SELECT account_name, account_type, COUNT(*) 
    FROM public.chart_of_accounts 
    WHERE is_active = true
    GROUP BY account_name, account_type 
    HAVING COUNT(*) > 1
  ) duplicates;

  -- التحقق من القيود غير المتوازنة
  SELECT COUNT(*) INTO unbalanced_entries
  FROM (
    SELECT je.id
    FROM public.journal_entries je
    LEFT JOIN public.journal_entry_lines jel ON je.id = jel.journal_entry_id
    WHERE je.status = 'posted'
    GROUP BY je.id
    HAVING COALESCE(SUM(jel.debit_amount), 0) != COALESCE(SUM(jel.credit_amount), 0)
  ) unbalanced;

  validation_result := jsonb_build_object(
    'duplicate_codes', duplicate_codes,
    'duplicate_names', duplicate_names,
    'unbalanced_entries', unbalanced_entries,
    'is_valid', (duplicate_codes = 0 AND duplicate_names = 0 AND unbalanced_entries = 0),
    'validation_date', now()
  );

  RETURN validation_result;
END;
$$;