-- تحديث الـ trigger لاستخدام admin@admin.com
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
      WHEN NEW.email = 'admin@admin.com' THEN 'admin'::public.user_role
      ELSE 'receptionist'::public.user_role
    END
  );
  RETURN NEW;
END;
$$;