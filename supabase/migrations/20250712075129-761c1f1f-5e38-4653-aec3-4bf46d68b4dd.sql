-- تنفيذ خطة فصل admin@admin.com عن المؤسسات المحددة
-- Remove admin@admin.com association with specific tenants and keep only as super_admin

DO $$
DECLARE
    admin_user_id uuid;
    default_org_id uuid := '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid;
    stars_tenant_id uuid;
BEGIN
    -- الحصول على معرف المستخدم admin@admin.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@admin.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'User admin@admin.com not found';
        RETURN;
    END IF;
    
    -- الحصول على معرف "شركة النجوم"
    SELECT id INTO stars_tenant_id 
    FROM public.tenants 
    WHERE name = 'شركة النجوم'
    LIMIT 1;
    
    -- إزالة ربط admin@admin.com مع "شركة النجوم"
    IF stars_tenant_id IS NOT NULL THEN
        DELETE FROM public.tenant_users 
        WHERE user_id = admin_user_id
        AND tenant_id = stars_tenant_id;
        
        RAISE NOTICE 'Removed admin@admin.com association with شركة النجوم';
    END IF;
    
    -- إزالة أي ربط آخر مع مؤسسات غير Default Organization
    DELETE FROM public.tenant_users 
    WHERE user_id = admin_user_id
    AND tenant_id != default_org_id;
    
    RAISE NOTICE 'Removed all other tenant associations for admin@admin.com';
    
    -- التأكد من وجود ربط مع Default Organization كـ super_admin فقط
    INSERT INTO public.tenant_users (user_id, tenant_id, role, status, joined_at)
    VALUES (admin_user_id, default_org_id, 'super_admin', 'active', now())
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET 
        role = 'super_admin',
        status = 'active',
        updated_at = now();
    
    RAISE NOTICE 'Ensured admin@admin.com has super_admin role with Default Organization only';
    
    -- عرض النتيجة النهائية
    RAISE NOTICE 'Final tenant associations for admin@admin.com:';
    FOR admin_user_id IN 
        SELECT t.name, tu.role, tu.status
        FROM public.tenant_users tu
        JOIN public.tenants t ON tu.tenant_id = t.id
        WHERE tu.user_id = (SELECT id FROM auth.users WHERE email = 'admin@admin.com')
    LOOP
        RAISE NOTICE '- Tenant: %, Role: %, Status: %', admin_user_id, admin_user_id, admin_user_id;
    END LOOP;
    
END;
$$;