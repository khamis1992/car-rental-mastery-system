-- إصلاح دالة توليد رقم العميل لضمان الحصول على tenant_id الصحيح
CREATE OR REPLACE FUNCTION public.generate_customer_number_simple()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    next_number integer;
    customer_number text;
BEGIN
    -- الحصول على معرف المؤسسة الحالية
    current_tenant_id := public.get_current_tenant_id();
    
    -- التأكد من وجود المؤسسة
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية. يرجى التأكد من تسجيل الدخول بشكل صحيح';
    END IF;
    
    -- الحصول على آخر رقم مستخدم للمؤسسة الحالية
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(customer_number FROM '^CUS(\d+)$') AS INTEGER)), 
        0
    ) + 1 
    INTO next_number
    FROM public.customers 
    WHERE tenant_id = current_tenant_id 
    AND customer_number ~ '^CUS\d+$';
    
    -- التأكد من أن الرقم ليس أقل من 1
    IF next_number < 1 THEN
        next_number := 1;
    END IF;
    
    -- إنشاء رقم العميل
    customer_number := 'CUS' || LPAD(next_number::text, 4, '0');
    
    -- التحقق من عدم وجود الرقم (احتياط إضافي)
    WHILE EXISTS (
        SELECT 1 FROM public.customers 
        WHERE customer_number = customer_number 
        AND tenant_id = current_tenant_id
    ) LOOP
        next_number := next_number + 1;
        customer_number := 'CUS' || LPAD(next_number::text, 4, '0');
    END LOOP;
    
    RETURN customer_number;
END;
$function$;