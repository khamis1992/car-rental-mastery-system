-- إصلاح مشكلة دالة check_period_status بحذف النسخة القديمة أولاً
DROP FUNCTION IF EXISTS public.check_period_status(date);

-- إنشاء الدالة مرة أخرى مع search_path آمن
CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record RECORD;
    result jsonb;
BEGIN
    -- البحث عن الفترة المالية المناسبة
    SELECT * INTO period_record
    FROM public.financial_periods
    WHERE check_date BETWEEN start_date AND end_date
    AND tenant_id = public.get_current_tenant_id()
    LIMIT 1;
    
    -- إذا لم توجد فترة، إرجاع حالة مفتوحة افتراضياً
    IF period_record IS NULL THEN
        result := jsonb_build_object(
            'exists', false,
            'is_closed', false,
            'can_modify', true,
            'message', 'لا توجد فترة مالية محددة لهذا التاريخ - مسموح بالتعديل'
        );
    ELSE
        result := jsonb_build_object(
            'exists', true,
            'period_id', period_record.id,
            'period_name', period_record.period_name,
            'is_closed', period_record.is_closed,
            'can_modify', NOT period_record.is_closed,
            'message', 
            CASE 
                WHEN period_record.is_closed THEN 'الفترة المالية مقفلة - لا يمكن التعديل'
                ELSE 'الفترة المالية مفتوحة - يمكن التعديل'
            END
        );
    END IF;
    
    RETURN result;
END;
$function$;