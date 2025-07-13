-- إعادة تحميل schema cache لـ PostgREST
NOTIFY pgrst, 'reload schema';