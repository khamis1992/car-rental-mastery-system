-- إزالة القيد المرجعي لحل مشكلة حذف الحسابات نهائياً
-- المشكلة: وجود foreign key constraint يمنع إدراج NULL في account_id

-- أولاً: البحث عن وإزالة القيد المرجعي
ALTER TABLE public.account_audit_log 
DROP CONSTRAINT IF EXISTS account_audit_log_account_id_fkey;

-- ثانياً: إنشاء فهرس عادي بدلاً من القيد المرجعي للأداء
CREATE INDEX IF NOT EXISTS idx_account_audit_log_account_id 
ON public.account_audit_log (account_id) 
WHERE account_id IS NOT NULL;

-- ثالثاً: إضافة تعليق توضيحي
COMMENT ON COLUMN public.account_audit_log.account_id IS 
'معرف الحساب - قد يكون NULL للحسابات المحذوفة، معرف الحساب المحذوف محفوظ في old_values.deleted_account_id. لا يوجد قيد مرجعي للسماح بحذف الحسابات';