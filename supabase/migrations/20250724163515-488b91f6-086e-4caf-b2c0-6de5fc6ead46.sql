CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    current_user_id uuid;
    tenant_record RECORD;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'tenant_id', null,
            'role', null,
            'permissions', jsonb_build_object(),
            'is_authenticated', false
        );
    END IF;
    
    -- البحث في tenant_user_roles أولاً
    SELECT 
        tur.tenant_id,
        tur.role::text,
        COALESCE(tur.permissions, '{}'::jsonb) as permissions
    INTO tenant_record
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = current_user_id 
    AND tur.status = 'active'
    LIMIT 1;
    
    -- إذا لم نجد، نبحث في tenant_users
    IF NOT FOUND THEN
        SELECT 
            tu.tenant_id,
            tu.role::text,
            COALESCE(tu.permissions, '{}'::jsonb) as permissions
        INTO tenant_record
        FROM public.tenant_users tu
        WHERE tu.user_id = current_user_id 
        AND tu.status = 'active'
        LIMIT 1;
    END IF;
    
    IF FOUND THEN
        result := jsonb_build_object(
            'tenant_id', tenant_record.tenant_id,
            'role', tenant_record.role,
            'permissions', tenant_record.permissions,
            'is_authenticated', true
        );
    ELSE
        result := jsonb_build_object(
            'tenant_id', null,
            'role', null,
            'permissions', jsonb_build_object(),
            'is_authenticated', true
        );
    END IF;
    
    RETURN result;
END;
$function$