-- Fix ambiguous column reference in generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoices.invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoices.invoice_number ~ '^INV[0-9]+$';
  
  invoice_number := 'INV' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_number;
END;
$$;