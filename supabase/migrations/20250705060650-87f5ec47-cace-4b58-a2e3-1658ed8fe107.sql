-- Update the reference_type check constraint to include violation types
ALTER TABLE public.journal_entries 
DROP CONSTRAINT journal_entries_reference_type_check;

ALTER TABLE public.journal_entries 
ADD CONSTRAINT journal_entries_reference_type_check 
CHECK (reference_type = ANY (ARRAY[
  'manual'::text, 
  'contract'::text, 
  'invoice'::text, 
  'payment'::text, 
  'adjustment'::text,
  'violation'::text,
  'violation_payment'::text
]));