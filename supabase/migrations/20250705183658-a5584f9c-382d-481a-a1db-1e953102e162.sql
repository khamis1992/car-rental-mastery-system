-- Add auto_generated_invoice column to payments table
ALTER TABLE public.payments 
ADD COLUMN auto_generated_invoice BOOLEAN DEFAULT FALSE;

-- Add comment to clarify the column purpose
COMMENT ON COLUMN public.payments.auto_generated_invoice IS 'Indicates if this payment automatically generated an invoice';

-- Create index for better performance when querying auto-generated invoices
CREATE INDEX idx_payments_auto_generated ON public.payments(auto_generated_invoice) WHERE auto_generated_invoice = TRUE;