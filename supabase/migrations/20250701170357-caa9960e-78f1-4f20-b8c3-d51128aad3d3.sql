-- إنشاء حساب admin مباشرة (إذا لم يكن موجوداً)
-- ملاحظة: يفضل إنشاء هذا الحساب من لوحة تحكم Supabase Authentication
-- هذا الكود للمرجع فقط

-- التحقق من وجود ملف admin وإنشاؤه إذا لم يكن موجوداً
DO $$
BEGIN
  -- التحقق من وجود ملف admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE full_name = 'مدير النظام' AND role = 'admin') THEN
    -- إضافة ملف admin بشكل مؤقت (يجب إنشاء المستخدم من لوحة التحكم)
    INSERT INTO public.profiles (user_id, full_name, role, phone, is_active)
    VALUES (
      '00000000-0000-0000-0000-000000000000', -- معرف مؤقت
      'مدير النظام',
      'admin',
      '+966500000000',
      true
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;