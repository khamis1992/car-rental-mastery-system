-- إضافة سياسة RLS للسماح لمديري النظام العام بإنشاء مؤسسات جديدة
CREATE POLICY "Super admins can create tenants" ON public.tenants
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND status = 'active'
  )
);