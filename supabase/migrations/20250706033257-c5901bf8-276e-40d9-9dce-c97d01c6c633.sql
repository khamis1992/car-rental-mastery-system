-- Create function to check related records for a contract
CREATE OR REPLACE FUNCTION public.check_contract_related_records(contract_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  related_records JSONB := '{}'::jsonb;
  invoice_count INTEGER;
  charge_count INTEGER;
  incident_count INTEGER;
  extension_count INTEGER;
  evaluation_count INTEGER;
BEGIN
  -- Check invoices
  SELECT COUNT(*) INTO invoice_count
  FROM public.invoices
  WHERE contract_id = contract_id_param;
  
  -- Check additional charges
  SELECT COUNT(*) INTO charge_count
  FROM public.additional_charges
  WHERE contract_id = contract_id_param;
  
  -- Check contract incidents
  SELECT COUNT(*) INTO incident_count
  FROM public.contract_incidents
  WHERE contract_id = contract_id_param;
  
  -- Check contract extensions
  SELECT COUNT(*) INTO extension_count
  FROM public.contract_extensions
  WHERE contract_id = contract_id_param;
  
  -- Check customer evaluations
  SELECT COUNT(*) INTO evaluation_count
  FROM public.customer_evaluations
  WHERE contract_id = contract_id_param;
  
  related_records := jsonb_build_object(
    'invoices', invoice_count,
    'additional_charges', charge_count,
    'incidents', incident_count,
    'extensions', extension_count,
    'evaluations', evaluation_count,
    'has_related_records', (invoice_count + charge_count + incident_count + extension_count + evaluation_count) > 0,
    'total_related', invoice_count + charge_count + incident_count + extension_count + evaluation_count
  );
  
  RETURN related_records;
END;
$function$;

-- Create function to safely delete contract and all related records
CREATE OR REPLACE FUNCTION public.safe_delete_contract(contract_id_param uuid, delete_related boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_records JSONB := '{}'::jsonb;
  contract_number TEXT;
  invoice_count INTEGER := 0;
  charge_count INTEGER := 0;
  incident_count INTEGER := 0;
  extension_count INTEGER := 0;
  evaluation_count INTEGER := 0;
BEGIN
  -- Get contract number for logging
  SELECT contracts.contract_number INTO contract_number
  FROM public.contracts
  WHERE id = contract_id_param;
  
  IF contract_number IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  -- If delete_related is true, delete all related records
  IF delete_related THEN
    -- Delete payments first (they reference invoices)
    DELETE FROM public.payments 
    WHERE invoice_id IN (
      SELECT id FROM public.invoices WHERE contract_id = contract_id_param
    );
    
    -- Delete invoices
    DELETE FROM public.invoices 
    WHERE contract_id = contract_id_param;
    GET DIAGNOSTICS invoice_count = ROW_COUNT;
    
    -- Delete additional charges
    DELETE FROM public.additional_charges
    WHERE contract_id = contract_id_param;
    GET DIAGNOSTICS charge_count = ROW_COUNT;
    
    -- Delete contract incidents
    DELETE FROM public.contract_incidents
    WHERE contract_id = contract_id_param;
    GET DIAGNOSTICS incident_count = ROW_COUNT;
    
    -- Delete contract extensions
    DELETE FROM public.contract_extensions
    WHERE contract_id = contract_id_param;
    GET DIAGNOSTICS extension_count = ROW_COUNT;
    
    -- Delete customer evaluations
    DELETE FROM public.customer_evaluations
    WHERE contract_id = contract_id_param;
    GET DIAGNOSTICS evaluation_count = ROW_COUNT;
    
    -- Delete contract accounting entries
    DELETE FROM public.contract_accounting_entries
    WHERE contract_id = contract_id_param;
  END IF;
  
  -- Delete the contract itself
  DELETE FROM public.contracts
  WHERE id = contract_id_param;
  
  -- Log the deletion
  INSERT INTO public.contract_deletion_log (
    contract_id,
    contract_number,
    deleted_by,
    deletion_type,
    related_records_deleted,
    deleted_at
  ) VALUES (
    contract_id_param,
    contract_number,
    auth.uid(),
    CASE WHEN delete_related THEN 'cascade' ELSE 'simple' END,
    jsonb_build_object(
      'invoices', invoice_count,
      'additional_charges', charge_count,
      'incidents', incident_count,
      'extensions', extension_count,
      'evaluations', evaluation_count
    ),
    now()
  );
  
  deleted_records := jsonb_build_object(
    'contract_number', contract_number,
    'deleted_related_records', delete_related,
    'counts', jsonb_build_object(
      'invoices', invoice_count,
      'additional_charges', charge_count,
      'incidents', incident_count,
      'extensions', extension_count,
      'evaluations', evaluation_count
    )
  );
  
  RETURN deleted_records;
END;
$function$;

-- Create function to mark contract as deleted instead of actually deleting
CREATE OR REPLACE FUNCTION public.mark_contract_deleted(contract_id_param uuid, reason text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  contract_number TEXT;
  result JSONB;
BEGIN
  -- Get contract number
  SELECT contracts.contract_number INTO contract_number
  FROM public.contracts
  WHERE id = contract_id_param;
  
  IF contract_number IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  -- Update contract status to cancelled and add deletion info
  UPDATE public.contracts
  SET 
    status = 'cancelled',
    notes = COALESCE(notes, '') || 
      CASE WHEN notes IS NOT NULL AND LENGTH(notes) > 0 THEN E'\n\n' ELSE '' END ||
      '*** تم وسم العقد كمحذوف في ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS') || ' ***' ||
      CASE WHEN reason IS NOT NULL THEN E'\nالسبب: ' || reason ELSE '' END,
    updated_at = now()
  WHERE id = contract_id_param;
  
  -- Log the soft deletion
  INSERT INTO public.contract_deletion_log (
    contract_id,
    contract_number,
    deleted_by,
    deletion_type,
    deletion_reason,
    deleted_at
  ) VALUES (
    contract_id_param,
    contract_number,
    auth.uid(),
    'soft_delete',
    reason,
    now()
  );
  
  result := jsonb_build_object(
    'contract_number', contract_number,
    'action', 'marked_as_deleted',
    'reason', reason
  );
  
  RETURN result;
END;
$function$;

-- Create contract deletion log table
CREATE TABLE IF NOT EXISTS public.contract_deletion_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL,
  contract_number text NOT NULL,
  deleted_by uuid REFERENCES auth.users(id),
  deletion_type text NOT NULL CHECK (deletion_type IN ('simple', 'cascade', 'soft_delete')),
  deletion_reason text,
  related_records_deleted jsonb,
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on contract_deletion_log
ALTER TABLE public.contract_deletion_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for contract_deletion_log
CREATE POLICY "المديرون يمكنهم رؤية سجل حذف العقود"
  ON public.contract_deletion_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));