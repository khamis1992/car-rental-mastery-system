
-- إصلاح دالة get_current_tenant_id مع تحسينات أفضل
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    tenant_id_result uuid;
    user_id_current uuid;
BEGIN
    -- الحصول على معرف المستخدم الحالي
    user_id_current := auth.uid();
    
    -- إذا لم يكن هناك مستخدم مسجل دخول
    IF user_id_current IS NULL THEN
        RAISE LOG 'get_current_tenant_id: No authenticated user found';
        RETURN NULL;
    END IF;
    
    -- محاولة الحصول على معرف المؤسسة للمستخدم الحالي
    SELECT tu.tenant_id
    INTO tenant_id_result
    FROM public.tenant_users tu
    INNER JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = user_id_current
    AND tu.status = 'active'
    AND public.is_tenant_valid(tu.tenant_id)
    ORDER BY 
        CASE WHEN t.status = 'active' THEN 1 ELSE 2 END,
        tu.created_at DESC
    LIMIT 1;
    
    -- تسجيل النتيجة للمراقبة
    IF tenant_id_result IS NULL THEN
        RAISE LOG 'get_current_tenant_id: No valid tenant found for user %', user_id_current;
    ELSE
        RAISE LOG 'get_current_tenant_id: Found tenant % for user %', tenant_id_result, user_id_current;
    END IF;
    
    RETURN tenant_id_result;
END;
$$;

-- منح الصلاحيات المطلوبة
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;

-- إنشاء دالة مساعدة للتحقق من حالة المؤسسة والمستخدم
CREATE OR REPLACE FUNCTION public.debug_user_tenant_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    user_id_current uuid;
BEGIN
    user_id_current := auth.uid();
    
    SELECT jsonb_build_object(
        'current_user_id', user_id_current,
        'current_tenant_id', public.get_current_tenant_id(),
        'user_tenants', (
            SELECT json_agg(
                json_build_object(
                    'tenant_id', tu.tenant_id,
                    'tenant_name', t.name,
                    'tenant_status', t.status,
                    'user_role', tu.role,
                    'user_status', tu.status,
                    'is_valid', public.is_tenant_valid(tu.tenant_id)
                )
            )
            FROM public.tenant_users tu
            INNER JOIN public.tenants t ON tu.tenant_id = t.id
            WHERE tu.user_id = user_id_current
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.debug_user_tenant_status() TO authenticated;
