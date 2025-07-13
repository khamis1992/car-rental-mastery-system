-- التحقق من إدراج المستخدم الحالي في جدول tenant_users
DO $$
DECLARE
    current_user_id UUID;
    default_tenant_id UUID;
BEGIN
    -- الحصول على ID المستخدم الحالي
    current_user_id := auth.uid();
    
    -- الحصول على ID المؤسسة الافتراضية
    SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default-tenant' LIMIT 1;
    
    -- إنشاء المؤسسة الافتراضية إذا لم تكن موجودة
    IF default_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name, slug, status) VALUES ('المؤسسة الافتراضية', 'default-tenant', 'active')
        RETURNING id INTO default_tenant_id;
    END IF;
    
    -- ربط المستخدم بالمؤسسة إذا لم يكن مرتبطاً بالفعل
    IF current_user_id IS NOT NULL THEN
        INSERT INTO public.tenant_users (tenant_id, user_id, role, status)
        VALUES (default_tenant_id, current_user_id, 'super_admin', 'active')
        ON CONFLICT (tenant_id, user_id) DO UPDATE SET
            role = 'super_admin',
            status = 'active',
            updated_at = now();
            
        RAISE NOTICE 'User % linked to tenant %', current_user_id, default_tenant_id;
    END IF;
END
$$;