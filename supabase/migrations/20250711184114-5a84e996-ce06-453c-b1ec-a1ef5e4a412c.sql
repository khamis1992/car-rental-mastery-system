-- إصلاح مشكلة إنشاء المؤسسة الأولى
-- السماح للمستخدم الحالي (admin@admin.com) بإنشاء المؤسسات مباشرة

-- إلغاء السياسة الحالية للإنشاء
DROP POLICY IF EXISTS "Super admins can create tenants" ON public.tenants;

-- إنشاء سياسة جديدة تسمح للمستخدم الأساسي بإنشاء المؤسسات
CREATE POLICY "Allow first super admin to create tenants" ON public.tenants
FOR INSERT WITH CHECK (
  -- السماح للمستخدم الحالي (المدير الأساسي) بإنشاء المؤسسات
  auth.uid() = '8fc12ff9-a4e6-4c7d-b9c5-fce03450e091'::uuid
  OR
  -- أو السماح لمن لديه دور super_admin مسبقاً
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND status = 'active'
  )
);