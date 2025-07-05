-- Fix the generate_journal_entry_number function (resolve ambiguous column reference)
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
  new_entry_number TEXT;  -- Renamed from entry_number to avoid ambiguity
  current_year TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Explicitly specify the column name to avoid ambiguity
  SELECT COALESCE(MAX(CAST(SPLIT_PART(journal_entries.entry_number, '-', 2) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.journal_entries
  WHERE journal_entries.entry_number LIKE 'JE-' || current_year || '-%';
  
  new_entry_number := 'JE-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_entry_number;
END;
$function$;