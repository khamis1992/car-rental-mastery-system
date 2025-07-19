-- حذف الحساب التجريبي رقم 100001 مباشرة دون تسجيل تدقيق
DELETE FROM public.chart_of_accounts 
WHERE account_code = '100001' 
AND account_name = 'تجربة' 
AND id = '995cdde1-1e89-4fef-bd84-91e0e906b999';