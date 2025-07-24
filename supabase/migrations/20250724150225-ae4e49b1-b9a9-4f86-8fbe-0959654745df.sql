-- إصلاح خطأ المايجريشن السابق بحذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS public.log_user_activity(text, text);

-- إعادة إنشاء الدالة مع search_path آمن
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, activity_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    -- تسجيل النشاط
    INSERT INTO public.user_activity_log (
        user_id,
        tenant_id,
        activity_type,
        activity_description,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        current_user_id,
        current_tenant_id,
        activity_type,
        activity_description,
        NULL, -- يمكن إضافة منطق للحصول على IP
        NULL, -- يمكن إضافة منطق للحصول على User Agent
        now()
    );
END;
$function$;