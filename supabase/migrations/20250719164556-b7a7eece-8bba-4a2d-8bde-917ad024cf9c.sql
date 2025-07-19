-- حذف الحساب التجريبي رقم 100001 مع إدراج سجل تدقيق يدوي
-- إدراج سجل التدقيق يدوياً قبل الحذف
INSERT INTO public.account_audit_log (
    account_id, 
    user_id, 
    tenant_id,
    action_type, 
    old_values,
    notes
) VALUES (
    '995cdde1-1e89-4fef-bd84-91e0e906b999',
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    '5566e078-92c0-4396-aebc-2850ca7d47b0',
    'deleted',
    '{"id": "995cdde1-1e89-4fef-bd84-91e0e906b999", "account_code": "100001", "account_name": "تجربة", "account_type": "asset"}',
    'حذف الحساب التجريبي من قاعدة البيانات'
);

-- حذف الحساب
DELETE FROM public.chart_of_accounts 
WHERE account_code = '100001' 
AND account_name = 'تجربة' 
AND id = '995cdde1-1e89-4fef-bd84-91e0e906b999';