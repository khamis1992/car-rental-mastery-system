-- إصلاح مشكلة دالة setup_comprehensive_chart_of_accounts بحذف النسخة القديمة أولاً
DROP FUNCTION IF EXISTS public.setup_comprehensive_chart_of_accounts(uuid);

-- إنشاء الدالة مرة أخرى مع search_path آمن
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إنشاء دليل حسابات شامل للمؤسسة
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    -- إضافة حسابات متخصصة إضافية
    PERFORM public.add_specialized_rental_accounts(tenant_id_param);
    
    RETURN inserted_count;
END;
$function$;