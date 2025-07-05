-- Fix generate_journal_entry_number function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  entry_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(je.entry_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.journal_entries je
  WHERE je.entry_number ~ '^JE[0-9]+$';
  
  entry_number := 'JE' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN entry_number;
END;
$$;

-- Fix update_invoice_totals function to avoid ambiguous references
CREATE OR REPLACE FUNCTION public.update_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.invoices 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(ii.total_price), 0)
      FROM public.invoice_items ii
      WHERE ii.invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update total amount (subtotal + tax - discount)
  UPDATE public.invoices 
  SET 
    total_amount = subtotal + tax_amount - discount_amount,
    outstanding_amount = (subtotal + tax_amount - discount_amount) - paid_amount,
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix update_invoice_payments function to avoid ambiguous references
CREATE OR REPLACE FUNCTION public.update_invoice_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.invoices 
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(p.amount), 0)
      FROM public.payments p
      WHERE p.invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      AND p.status = 'completed'
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update outstanding amount and status
  UPDATE public.invoices 
  SET 
    outstanding_amount = total_amount - paid_amount,
    status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partially_paid'
      WHEN due_date < CURRENT_DATE AND paid_amount = 0 THEN 'overdue'
      ELSE status
    END,
    paid_at = CASE 
      WHEN paid_amount >= total_amount AND paid_at IS NULL THEN now()
      ELSE paid_at
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;