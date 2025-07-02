-- Add contract lifecycle tracking fields
ALTER TABLE public.contracts 
ADD COLUMN delivery_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_registered_at TIMESTAMP WITH TIME ZONE;

-- Update contract status workflow to include proper transitions
-- No need to change existing status enum as it already has draft, pending, active, completed, cancelled