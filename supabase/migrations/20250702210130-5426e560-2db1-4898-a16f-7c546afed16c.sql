-- إصلاح مشكلة التباس contract_number في دالة generate_contract_number
CREATE OR REPLACE FUNCTION public.generate_contract_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
  new_contract_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(contracts.contract_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.contracts
  WHERE contracts.contract_number ~ '^CON[0-9]+$';
  
  new_contract_number := 'CON' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_contract_number;
END;
$function$