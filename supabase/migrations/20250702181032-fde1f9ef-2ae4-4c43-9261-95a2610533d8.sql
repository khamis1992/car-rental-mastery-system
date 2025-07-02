-- Fix ambiguous contract_number column issue
-- First, let's check which tables have contract_number columns

-- Remove contract_number from any tables that shouldn't have it
-- Keep it only in the main contracts table

-- Check if there are any duplicate contract_number columns
DO $$
BEGIN
    -- Remove contract_number from additional_charges if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'additional_charges' 
        AND column_name = 'contract_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.additional_charges DROP COLUMN IF EXISTS contract_number;
    END IF;

    -- Remove contract_number from invoices if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'contract_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.invoices DROP COLUMN IF EXISTS contract_number;
    END IF;

    -- Remove contract_number from any other tables that might have it
    -- except the main contracts table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contract_extensions' 
        AND column_name = 'contract_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.contract_extensions DROP COLUMN IF EXISTS contract_number;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contract_incidents' 
        AND column_name = 'contract_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.contract_incidents DROP COLUMN IF EXISTS contract_number;
    END IF;
END $$;