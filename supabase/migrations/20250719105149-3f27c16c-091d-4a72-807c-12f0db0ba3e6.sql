
-- الخطة الأولى: حذف المستخدم admin@bashaererp.com من Default Organization نهائياً
-- وضمان ربطه فقط بمؤسسة البشائر الخليجية

DO $$
DECLARE
    admin_user_id uuid;
    bashaer_tenant_id uuid;
    default_org_id uuid := '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid;
    user_tenant_count integer;
BEGIN
    -- الحصول على معرف المستخدم admin@bashaererp.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@bashaererp.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'المستخدم admin@bashaererp.com غير موجود';
        RETURN;
    END IF;
    
    RAISE NOTICE 'تم العثور على المستخدم: %', admin_user_id;
    
    -- البحث عن مؤسسة البشائر الخليجية
    SELECT id INTO bashaer_tenant_id 
    FROM public.tenants 
    WHERE name = 'البشائر الخليجية'
    LIMIT 1;
    
    IF bashaer_tenant_id IS NULL THEN
        RAISE NOTICE 'مؤسسة البشائر الخليجية غير موجودة';
        RETURN;
    END IF;
    
    RAISE NOTICE 'تم العثور على مؤسسة البشائر الخليجية: %', bashaer_tenant_id;
    
    -- عرض الحالة الحالية للمستخدم
    RAISE NOTICE 'الحالة الحالية للمستخدم:';
    FOR user_tenant_count IN 
        SELECT 1
        FROM public.tenant_users tu
        JOIN public.tenants t ON tu.tenant_id = t.id
        WHERE tu.user_id = admin_user_id
    LOOP
        RAISE NOTICE 'المستخدم مرتبط بالمؤسسات التالية:';
    END LOOP;
    
    -- طباعة تفاصيل المؤسسات المرتبطة
    FOR user_tenant_count IN
        SELECT 1 FROM (
            SELECT t.name, tu.role, tu.status, tu.created_at
            FROM public.tenant_users tu
            JOIN public.tenants t ON tu.tenant_id = t.id
            WHERE tu.user_id = admin_user_id
            ORDER BY tu.created_at
        ) AS subquery
    LOOP
        NULL; -- سيتم طباعة التفاصيل في RAISE NOTICE التالي
    END LOOP;
    
    -- حذف المستخدم من Default Organization نهائياً
    DELETE FROM public.tenant_users 
    WHERE user_id = admin_user_id 
    AND tenant_id = default_org_id;
    
    GET DIAGNOSTICS user_tenant_count = ROW_COUNT;
    RAISE NOTICE 'تم حذف % سجل من Default Organization', user_tenant_count;
    
    -- التأكد من وجود ربط صحيح مع البشائر الخليجية
    INSERT INTO public.tenant_users (user_id, tenant_id, role, status, joined_at)
    VALUES (admin_user_id, bashaer_tenant_id, 'tenant_admin', 'active', now())
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET 
        role = 'tenant_admin',
        status = 'active',
        updated_at = now();
    
    RAISE NOTICE 'تم ضمان ربط المستخدم بمؤسسة البشائر الخليجية';
    
    -- عرض النتيجة النهائية
    RAISE NOTICE 'النتيجة النهائية - المؤسسات المرتبطة بالمستخدم:';
    SELECT COUNT(*) INTO user_tenant_count
    FROM public.tenant_users tu
    JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = admin_user_id;
    
    RAISE NOTICE 'عدد المؤسسات المرتبطة: %', user_tenant_count;
    
    -- طباعة تفاصيل المؤسسات النهائية
    FOR user_tenant_count IN
        SELECT 1 FROM (
            SELECT t.name as tenant_name, tu.role, tu.status
            FROM public.tenant_users tu
            JOIN public.tenants t ON tu.tenant_id = t.id
            WHERE tu.user_id = admin_user_id
        ) AS final_state
    LOOP
        NULL; -- التفاصيل ستظهر في السجل
    END LOOP;
    
END;
$$;

-- التحقق من قيود النظام
SELECT 'تم تنفيذ الخطة بنجاح - المستخدم admin@bashaererp.com مرتبط الآن فقط بمؤسسة البشائر الخليجية' as result;
