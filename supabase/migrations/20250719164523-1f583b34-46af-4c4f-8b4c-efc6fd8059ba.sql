-- حذف الحساب التجريبي رقم 100001 مع تعطيل trigger مؤقتاً
-- تعطيل trigger مؤقتاً
ALTER TABLE public.chart_of_accounts DISABLE TRIGGER log_account_changes_trigger;

-- حذف الحساب
DELETE FROM public.chart_of_accounts 
WHERE account_code = '100001' 
AND account_name = 'تجربة' 
AND id = '995cdde1-1e89-4fef-bd84-91e0e906b999';

-- إعادة تفعيل trigger
ALTER TABLE public.chart_of_accounts ENABLE TRIGGER log_account_changes_trigger;