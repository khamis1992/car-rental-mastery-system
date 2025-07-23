-- إضافة دالة مبسطة لتوليد رقم العميل
CREATE OR REPLACE FUNCTION public.generate_customer_number_simple()
RETURNS TEXT AS $$
DECLARE
    current_tenant_id uuid;
    last_number INTEGER := 0;
    customer_number TEXT;
BEGIN
    -- التحقق من المصادقة
    current_tenant_id := public.get_current_tenant_id();
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'غير مصرح بالوصول - معرف المؤسسة مطلوب';
    END IF;

    -- الحصول على آخر رقم عميل في المؤسسة
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN customer_number ~ '^CUS[0-9]+$' 
                THEN substring(customer_number FROM 4)::INTEGER
                ELSE 0
            END
        ), 0
    ) INTO last_number
    FROM public.customers 
    WHERE tenant_id = current_tenant_id;

    -- توليد الرقم الجديد
    customer_number := 'CUS' || LPAD((last_number + 1)::TEXT, 6, '0');
    
    RETURN customer_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- منح الصلاحيات للدالة
GRANT EXECUTE ON FUNCTION public.generate_customer_number_simple() TO authenticated;