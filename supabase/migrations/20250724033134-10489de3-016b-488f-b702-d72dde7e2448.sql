-- تحسين دالة get_current_tenant_id مع معالجة أفضل للجلسات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id UUID;
    user_tenant_id UUID;
    session_valid BOOLEAN := FALSE;
BEGIN
    -- التحقق من المستخدم المصادق عليه
    current_user_id := auth.uid();
    
    -- تسجيل محاولة الوصول للمراقبة
    RAISE LOG 'get_current_tenant_id called for user_id: %', current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE LOG 'No authenticated user found in session';
        RETURN NULL;
    END IF;
    
    -- التحقق من صحة الجلسة باستخدام jwt
    BEGIN
        SELECT CASE 
            WHEN auth.jwt() IS NOT NULL AND 
                 (auth.jwt() -> 'exp')::bigint > extract(epoch from now())
            THEN TRUE 
            ELSE FALSE 
        END INTO session_valid;
    EXCEPTION WHEN OTHERS THEN
        session_valid := FALSE;
        RAISE LOG 'JWT validation failed for user %', current_user_id;
    END;
    
    IF NOT session_valid THEN
        RAISE LOG 'Session expired or invalid for user %', current_user_id;
        RETURN NULL;
    END IF;
    
    -- البحث عن معرف المؤسسة للمستخدم النشط
    SELECT tenant_id INTO user_tenant_id 
    FROM public.tenant_users 
    WHERE user_id = current_user_id 
    AND status = 'active'
    ORDER BY joined_at DESC
    LIMIT 1;
    
    IF user_tenant_id IS NULL THEN
        RAISE LOG 'No active tenant found for user %', current_user_id;
        
        -- محاولة العثور على أي مؤسسة للمستخدم
        SELECT tenant_id INTO user_tenant_id 
        FROM public.tenant_users 
        WHERE user_id = current_user_id 
        ORDER BY joined_at DESC
        LIMIT 1;
        
        IF user_tenant_id IS NOT NULL THEN
            RAISE LOG 'Found inactive tenant % for user %', user_tenant_id, current_user_id;
        END IF;
    ELSE
        RAISE LOG 'Active tenant % found for user %', user_tenant_id, current_user_id;
    END IF;
    
    RETURN user_tenant_id;
END;
$$;

-- تحسين دالة get_current_user_info مع معلومات الجلسة
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id UUID;
    user_tenant_id UUID;
    user_role TEXT;
    user_status TEXT;
    tenant_name TEXT;
    session_info JSONB;
    jwt_exp BIGINT;
    session_valid BOOLEAN := FALSE;
BEGIN
    -- الحصول على معرف المستخدم
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_authenticated', false,
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'status', null,
            'tenant_name', null,
            'session_info', jsonb_build_object(
                'valid', false,
                'reason', 'no_user_in_session'
            )
        );
    END IF;
    
    -- التحقق من صحة الجلسة
    BEGIN
        jwt_exp := (auth.jwt() -> 'exp')::bigint;
        session_valid := (jwt_exp > extract(epoch from now()));
        
        session_info := jsonb_build_object(
            'valid', session_valid,
            'expires_at', to_timestamp(jwt_exp),
            'current_time', now(),
            'time_remaining', (jwt_exp - extract(epoch from now()))
        );
    EXCEPTION WHEN OTHERS THEN
        session_info := jsonb_build_object(
            'valid', false,
            'reason', 'jwt_parse_error'
        );
    END;
    
    -- البحث عن معلومات المستخدم والمؤسسة
    SELECT 
        tu.tenant_id,
        tu.role,
        tu.status,
        t.name
    INTO user_tenant_id, user_role, user_status, tenant_name
    FROM public.tenant_users tu
    JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    ORDER BY tu.joined_at DESC
    LIMIT 1;
    
    -- إذا لم نجد مؤسسة نشطة، ابحث عن أي مؤسسة
    IF user_tenant_id IS NULL THEN
        SELECT 
            tu.tenant_id,
            tu.role,
            tu.status,
            t.name
        INTO user_tenant_id, user_role, user_status, tenant_name
        FROM public.tenant_users tu
        JOIN public.tenants t ON tu.tenant_id = t.id
        WHERE tu.user_id = current_user_id 
        ORDER BY tu.joined_at DESC
        LIMIT 1;
    END IF;
    
    RETURN jsonb_build_object(
        'is_authenticated', session_valid,
        'user_id', current_user_id,
        'tenant_id', user_tenant_id,
        'role', user_role,
        'status', user_status,
        'tenant_name', tenant_name,
        'session_info', session_info
    );
END;
$$;

-- إضافة دالة لتحديث آخر نشاط للمستخدم
CREATE OR REPLACE FUNCTION public.update_user_last_activity()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id UUID;
    user_tenant_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        user_tenant_id := public.get_current_tenant_id();
        
        IF user_tenant_id IS NOT NULL THEN
            UPDATE public.tenant_users 
            SET updated_at = now()
            WHERE user_id = current_user_id 
            AND tenant_id = user_tenant_id;
        END IF;
    END IF;
END;
$$;