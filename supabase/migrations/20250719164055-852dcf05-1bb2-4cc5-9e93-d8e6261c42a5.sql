
-- تغيير نوع حقل reference_id من UUID إلى TEXT في جدول journal_entries
ALTER TABLE public.journal_entries 
ALTER COLUMN reference_id TYPE TEXT;

-- تحديث الفهارس إذا كانت موجودة
DROP INDEX IF EXISTS idx_journal_entries_reference_id;
CREATE INDEX idx_journal_entries_reference_id ON public.journal_entries(reference_id) WHERE reference_id IS NOT NULL;

-- إضافة تعليق لتوضيح الغرض من الحقل
COMMENT ON COLUMN public.journal_entries.reference_id IS 'مرجع القيد - يمكن أن يكون رقم مرجعي أو نص توضيحي';
