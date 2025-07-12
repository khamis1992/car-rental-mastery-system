-- تحديث نظام تعيين الأدوار لدعم admin@bashaererp.com
-- Update the handle_new_user function to recognize admin@bashaererp.com as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE 
      WHEN NEW.email IN ('admin@admin.com', 'admin@bashaererp.com') THEN 'admin'::public.user_role
      ELSE 'receptionist'::public.user_role
    END
  );
  RETURN NEW;
END;
$$;

-- تصحيح الدور للمستخدم الموجود admin@bashaererp.com
-- Update existing admin@bashaererp.com user to have admin role
UPDATE public.profiles 
SET role = 'admin'::public.user_role
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@bashaererp.com'
);