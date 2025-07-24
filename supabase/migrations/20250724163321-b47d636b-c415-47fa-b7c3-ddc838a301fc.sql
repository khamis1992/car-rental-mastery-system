CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
BEGIN
    user_context := get_user_tenant_context();
    RETURN (user_context->>'tenant_id')::uuid;
END;
$function$