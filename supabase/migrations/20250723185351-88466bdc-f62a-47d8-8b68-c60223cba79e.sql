-- إصلاح سياسات الأمان لجدول العملاء - المرحلة الثانية
-- إزالة السياسات المتضاربة وإنشاء سياسة موحدة وواضحة

-- إزالة السياسات الحالية للعملاء
DROP POLICY IF EXISTS "Users can view customers in their tenant" ON public.customers;
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية العملاء في" ON public.customers;
DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة عملاءهم" ON public.customers;
DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم ر" ON public.customers;
DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة العملاء" ON public.customers;

-- إنشاء سياسة موحدة وواضحة للعملاء
-- سياسة العرض: المستخدمون المصادق عليهم يمكنهم رؤية عملاء مؤسستهم
CREATE POLICY "customers_tenant_read_access" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (
  tenant_id = get_current_tenant_id() AND
  has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant', 'receptionist'])
);

-- سياسة الإدخال: الموظفون المخولون يمكنهم إضافة عملاء لمؤسستهم
CREATE POLICY "customers_tenant_insert_access" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id = get_current_tenant_id() AND
  has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'receptionist'])
);

-- سياسة التحديث: الموظفون المخولون يمكنهم تحديث عملاء مؤسستهم
CREATE POLICY "customers_tenant_update_access" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (
  tenant_id = get_current_tenant_id() AND
  has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'receptionist'])
)
WITH CHECK (
  tenant_id = get_current_tenant_id() AND
  has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'receptionist'])
);

-- سياسة الحذف: المديرون فقط يمكنهم حذف العملاء
CREATE POLICY "customers_tenant_delete_access" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (
  tenant_id = get_current_tenant_id() AND
  has_any_tenant_role(ARRAY['tenant_admin', 'manager'])
);

-- إصلاح الدالة المسؤولة عن إضافة tenant_id تلقائياً
CREATE OR REPLACE FUNCTION public.ensure_customer_tenant_id()
RETURNS TRIGGER AS $$
DECLARE
    current_tenant_id uuid;
BEGIN
    -- الحصول على معرف المؤسسة الحالية
    current_tenant_id := public.get_current_tenant_id();
    
    -- التحقق من وجود معرف المؤسسة
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد معرف المؤسسة الحالية. يرجى التأكد من تسجيل الدخول بشكل صحيح.';
    END IF;
    
    -- تعيين معرف المؤسسة للسجل الجديد
    NEW.tenant_id := current_tenant_id;
    
    -- التأكد من وجود created_by
    IF NEW.created_by IS NULL THEN
        NEW.created_by := auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- حذف الـ trigger القديم إن وجد وإنشاء واحد جديد
DROP TRIGGER IF EXISTS ensure_customer_tenant_id_trigger ON public.customers;
CREATE TRIGGER ensure_customer_tenant_id_trigger
    BEFORE INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_customer_tenant_id();

-- إنشاء دالة مساعدة لتوليد رقم العميل مع تحسينات أمنية
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS TEXT AS $$
DECLARE
    current_tenant_id uuid;
    last_number INTEGER := 0;
    next_number INTEGER;
    customer_number TEXT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    -- التحقق من المصادقة
    current_tenant_id := public.get_current_tenant_id();
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'غير مصرح بالوصول - معرف المؤسسة مطلوب';
    END IF;

    -- الحصول على آخر رقم عميل في المؤسسة
    SELECT COALESCE(
        MAX(
            CAST(
                CASE 
                    WHEN customer_number ~ '^CUS[0-9]+$' 
                    THEN substring(customer_number FROM 4)::INTEGER
                    ELSE 0
                END
            )
        ), 0
    ) INTO last_number
    FROM public.customers 
    WHERE tenant_id = current_tenant_id;

    -- محاولة توليد رقم فريد
    WHILE attempt < max_attempts LOOP
        next_number := last_number + attempt + 1;
        customer_number := 'CUS' || LPAD(next_number::TEXT, 6, '0');
        
        -- التحقق من عدم وجود الرقم
        IF NOT EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customer_number = customer_number 
            AND tenant_id = current_tenant_id
        ) THEN
            RETURN customer_number;
        END IF;
        
        attempt := attempt + 1;
    END LOOP;

    -- في حالة فشل توليد رقم فريد، استخدم timestamp
    customer_number := 'CUS' || LPAD(EXTRACT(EPOCH FROM now())::INTEGER::TEXT, 6, '0');
    RETURN customer_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- منح الصلاحيات للدالة
GRANT EXECUTE ON FUNCTION public.generate_customer_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_customer_tenant_id() TO authenticated;