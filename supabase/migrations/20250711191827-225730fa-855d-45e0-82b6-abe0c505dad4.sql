-- جعل الحساب admin@admin.com مدير نظام عام (super_admin)

-- إضافة المستخدم admin@admin.com كـ super_admin
INSERT INTO public.tenant_users (user_id, tenant_id, role, status)
SELECT 
    au.id,
    '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid, -- tenant_id افتراضي
    'super_admin',
    'active'
FROM auth.users au
WHERE au.email = 'admin@admin.com'
AND NOT EXISTS (
    SELECT 1 FROM public.tenant_users tu 
    WHERE tu.user_id = au.id 
    AND tu.role = 'super_admin' 
    AND tu.status = 'active'
);