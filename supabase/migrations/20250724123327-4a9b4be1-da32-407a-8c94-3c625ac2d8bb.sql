-- إزالة الـ view الذي قد يسبب مشكلة أمنية واستخدام الـ function الآمن فقط
DROP VIEW IF EXISTS public.cost_center_report_secure;

-- إضافة تعليق أكثر وضوحاً للـ function
COMMENT ON FUNCTION public.get_cost_center_report() IS 'دالة آمنة للحصول على تقرير مراكز التكلفة - تتطلب صلاحيات مناسبة ومصادقة مع التحقق من المؤسسة';