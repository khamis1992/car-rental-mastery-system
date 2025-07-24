-- إصلاح الدوال - الدفعة الرابعة

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    current_year text;
    sequence_number integer;
    entry_number text;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    current_year := EXTRACT(year FROM CURRENT_DATE)::text;
    
    -- الحصول على الرقم التالي في التسلسل
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id
    AND EXTRACT(year FROM entry_date) = EXTRACT(year FROM CURRENT_DATE);
    
    -- تكوين رقم القيد
    entry_number := 'JE-' || current_year || '-' || LPAD(sequence_number::text, 6, '0');
    
    RETURN entry_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_id uuid;
    tenant_context jsonb;
    user_role text;
    tenant_id uuid;
    permissions jsonb;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', '{}'::jsonb
        );
    END IF;
    
    -- محاولة الحصول على السياق من tenant_user_roles أولاً
    SELECT 
        tur.tenant_id,
        tur.role::text,
        COALESCE(tur.permissions, '{}'::jsonb)
    INTO tenant_id, user_role, permissions
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = user_id 
    AND tur.status = 'active'
    ORDER BY tur.created_at DESC
    LIMIT 1;
    
    -- إذا لم نجد في tenant_user_roles، نبحث في tenant_users
    IF tenant_id IS NULL THEN
        SELECT 
            tu.tenant_id,
            tu.role::text,
            COALESCE(tu.permissions, '{}'::jsonb)
        INTO tenant_id, user_role, permissions
        FROM public.tenant_users tu
        WHERE tu.user_id = user_id 
        AND tu.status = 'active'
        ORDER BY tu.created_at DESC
        LIMIT 1;
    END IF;
    
    tenant_context := jsonb_build_object(
        'authenticated', true,
        'user_id', user_id,
        'tenant_id', tenant_id,
        'role', user_role,
        'permissions', permissions
    );
    
    RETURN tenant_context;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- محاولة الحصول على tenant_id من tenant_user_roles أولاً
    SELECT tenant_id INTO current_tenant_id
    FROM public.tenant_user_roles
    WHERE user_id = current_user_id 
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- إذا لم نجد، نبحث في tenant_users
    IF current_tenant_id IS NULL THEN
        SELECT tenant_id INTO current_tenant_id
        FROM public.tenant_users
        WHERE user_id = current_user_id 
        AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN current_tenant_id;
END;
$function$;