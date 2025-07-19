-- إضافة عمود tenant_slug إلى جدول tenant_deletion_log
ALTER TABLE public.tenant_deletion_log 
ADD COLUMN tenant_slug TEXT;