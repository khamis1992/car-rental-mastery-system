-- إصلاح مشكلة القيد الخارجي في عمود approved_by
-- إزالة القيد الخارجي الخاطئ إذا كان موجوداً
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_approved_by_fkey;

-- تعديل العمود ليشير إلى جدول profiles بدلاً من auth.users
-- لأن auth.users غير متاح للاستعلام المباشر
ALTER TABLE public.leave_requests 
ADD CONSTRAINT leave_requests_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(user_id);