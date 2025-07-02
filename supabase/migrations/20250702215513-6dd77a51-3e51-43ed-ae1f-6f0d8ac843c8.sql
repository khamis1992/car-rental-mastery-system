-- Fix foreign key constraint to allow quotation deletion after contract creation
-- Drop the existing foreign key constraint
ALTER TABLE public.contracts 
DROP CONSTRAINT IF EXISTS contracts_quotation_id_fkey;

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.contracts 
ADD CONSTRAINT contracts_quotation_id_fkey 
FOREIGN KEY (quotation_id) 
REFERENCES public.quotations(id) 
ON DELETE SET NULL;