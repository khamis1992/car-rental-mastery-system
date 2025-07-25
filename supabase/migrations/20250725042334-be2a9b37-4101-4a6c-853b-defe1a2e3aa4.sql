-- إصلاح مشكلة ربط المستخدم بالمؤسسة
-- أولاً: التحقق من وجود المستخدم الحالي وربطه بالمؤسسة الافتراضية

-- إدراج المستخدم الحالي في جدول tenant_users إذا لم يكن موجوداً
INSERT INTO public.tenant_users (user_id, tenant_id, role, status, joined_at)
SELECT 
    auth.uid(),
    (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1),
    'tenant_admin',
    'active',
    now()
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid()
)
AND EXISTS (
    SELECT 1 FROM public.tenants WHERE status = 'active'
);

-- تحديث دالة get_current_tenant_id لتوفير رسائل خطأ أوضح
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    tenant_id uuid;
    user_id uuid;
BEGIN
    -- الحصول على معرف المستخدم الحالي
    user_id := auth.uid();
    
    -- التحقق من وجود المستخدم
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'المستخدم غير مسجل الدخول';
    END IF;
    
    -- البحث عن المؤسسة في tenant_users أولاً
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    INNER JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = user_id 
    AND tu.status = 'active'
    AND t.status = 'active'
    ORDER BY tu.joined_at DESC
    LIMIT 1;
    
    -- إذا لم توجد في tenant_users، البحث في tenant_user_roles
    IF tenant_id IS NULL THEN
        SELECT tur.tenant_id INTO tenant_id
        FROM public.tenant_user_roles tur
        INNER JOIN public.tenants t ON tur.tenant_id = t.id
        WHERE tur.user_id = user_id 
        AND tur.status = 'active'
        AND t.status = 'active'
        ORDER BY tur.created_at DESC
        LIMIT 1;
    END IF;
    
    -- إذا لم توجد المؤسسة، محاولة ربط المستخدم بالمؤسسة الافتراضية
    IF tenant_id IS NULL THEN
        -- البحث عن مؤسسة نشطة
        SELECT id INTO tenant_id
        FROM public.tenants 
        WHERE status = 'active'
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- إنشاء ربط إذا وجدت مؤسسة
        IF tenant_id IS NOT NULL THEN
            INSERT INTO public.tenant_users (user_id, tenant_id, role, status, joined_at)
            VALUES (user_id, tenant_id, 'user', 'active', now())
            ON CONFLICT (user_id, tenant_id) DO NOTHING;
        END IF;
    END IF;
    
    -- إذا لم توجد مؤسسة نشطة، إنشاء مؤسسة افتراضية
    IF tenant_id IS NULL THEN
        INSERT INTO public.tenants (
            name, slug, country, timezone, currency, status, subscription_plan, 
            subscription_status, max_users, max_vehicles, max_contracts, settings
        )
        VALUES (
            'المؤسسة الافتراضية', 'default-org', 'KW', 'Asia/Kuwait', 'KWD', 
            'active', 'basic', 'active', 100, 100, 100, '{}'::jsonb
        )
        RETURNING id INTO tenant_id;
        
        -- ربط المستخدم بالمؤسسة الجديدة
        INSERT INTO public.tenant_users (user_id, tenant_id, role, status, joined_at)
        VALUES (user_id, tenant_id, 'tenant_admin', 'active', now());
    END IF;
    
    RETURN tenant_id;
END;
$function$;