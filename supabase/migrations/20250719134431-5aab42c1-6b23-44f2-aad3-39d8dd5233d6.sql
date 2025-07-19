
-- Fix the log_account_changes function to map TG_OP values to allowed constraint values
CREATE OR REPLACE FUNCTION public.log_account_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  mapped_action_type TEXT;
BEGIN
  -- Map TG_OP values to the allowed values in the check constraint
  CASE TG_OP
    WHEN 'INSERT' THEN mapped_action_type := 'created';
    WHEN 'UPDATE' THEN mapped_action_type := 'updated';
    WHEN 'DELETE' THEN mapped_action_type := 'deleted';
    ELSE mapped_action_type := 'updated'; -- fallback
  END CASE;

  INSERT INTO public.account_audit_log (
    account_id, user_id, tenant_id,
    action_type, old_values, new_values
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    get_current_tenant_id(),
    mapped_action_type,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Also update the check constraint to include 'deleted' if it's not already there
ALTER TABLE public.account_audit_log 
DROP CONSTRAINT IF EXISTS account_audit_log_action_type_check;

ALTER TABLE public.account_audit_log 
ADD CONSTRAINT account_audit_log_action_type_check 
CHECK (action_type IN ('created', 'updated', 'deleted', 'modified', 'balance_updated'));
