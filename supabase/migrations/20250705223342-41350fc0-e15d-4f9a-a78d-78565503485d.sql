-- Create missing generate_payment_number function
CREATE OR REPLACE FUNCTION public.generate_payment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  payment_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(p.payment_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.payments p
  WHERE p.payment_number ~ '^PAY[0-9]+$';
  
  payment_number := 'PAY' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN payment_number;
END;
$$;