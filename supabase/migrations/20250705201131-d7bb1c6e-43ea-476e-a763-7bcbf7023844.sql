-- إضافة دالة توليد رقم القيد المحاسبي المفقودة
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  entry_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.journal_entries
  WHERE entry_number ~ '^JE[0-9]+$';
  
  entry_number := 'JE' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN entry_number;
END;
$$;