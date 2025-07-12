-- تحديث دالة handle_new_user لتجنب تعيين دور افتراضي غير صحيح
-- سنقوم بتعديلها لتتحقق من وجود tenant_users قبل تعيين الدور

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_tenant_role text;
BEGIN
  -- البحث عن دور المستخدم في أي مؤسسة
  SELECT role INTO user_tenant_role
  FROM public.tenant_users 
  WHERE user_id = NEW.id 
  AND status = 'active'
  LIMIT 1;
  
  -- إنشاء السجل في جدول profiles
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE 
      WHEN NEW.email IN ('admin@admin.com', 'admin@bashaererp.com') THEN 'admin'::public.user_role
      WHEN user_tenant_role = 'tenant_admin' THEN 'admin'::public.user_role
      WHEN user_tenant_role = 'manager' THEN 'manager'::public.user_role
      WHEN user_tenant_role = 'accountant' THEN 'accountant'::public.user_role
      ELSE 'receptionist'::public.user_role
    END
  );
  RETURN NEW;
END;
$$;