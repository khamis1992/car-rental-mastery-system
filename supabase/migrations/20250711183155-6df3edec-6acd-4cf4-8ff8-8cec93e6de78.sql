-- إصلاح مشكلة إنشاء المؤسسات - إضافة المستخدم الحالي كـ super admin إذا لم يكن موجوداً
INSERT INTO public.tenant_users (user_id, tenant_id, role, status)
SELECT 
    auth.uid(),
    '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid,
    'super_admin',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND status = 'active'
)
AND auth.uid() IS NOT NULL;