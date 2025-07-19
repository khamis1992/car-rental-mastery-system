-- إنشاء مستخدم نظام افتراضي وحذف الحساب التجريبي
-- إنشاء مستخدم نظام افتراضي إذا لم يكن موجود
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system@internal.local',
  now(),
  now(),
  now(),
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- حذف الحساب التجريبي
DELETE FROM public.chart_of_accounts 
WHERE account_code = '100001' 
AND account_name = 'تجربة' 
AND id = '995cdde1-1e89-4fef-bd84-91e0e906b999';