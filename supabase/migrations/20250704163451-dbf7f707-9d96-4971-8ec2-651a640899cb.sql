-- تفعيل Realtime للعقود
ALTER TABLE public.contracts REPLICA IDENTITY FULL;

-- إضافة الجدول لقناة Realtime
-- يتم تفعيلها تلقائياً عبر supabase_realtime publication