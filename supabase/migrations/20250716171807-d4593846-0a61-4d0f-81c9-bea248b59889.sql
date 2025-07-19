-- إصلاح مشاكل تفعيل المؤسسة وإضافة المستخدمين

-- 1. إزالة القيود المتضاربة في جدول employees إذا كانت موجودة
DO $$ 
BEGIN
    -- محاولة إزالة القيد المتضارب إذا كان موجوداً
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employees_employee_number_key' 
        AND table_name = 'employees'
    ) THEN
        ALTER TABLE public.employees DROP CONSTRAINT employees_employee_number_key;
    END IF;
    
    -- إضافة فهرس فريد صحيح للـ tenant_id مع employee_number
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'employees_tenant_employee_number_unique'
    ) THEN
        CREATE UNIQUE INDEX employees_tenant_employee_number_unique 
        ON public.employees (tenant_id, employee_number);
    END IF;
END $$;

-- 2. تحسين دالة توليد رقم الموظف لتجنب التضارب
CREATE OR REPLACE FUNCTION public.generate_employee_number(tenant_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
    employee_number TEXT;
    max_attempts INTEGER := 10;
    attempt_count INTEGER := 0;
BEGIN
    LOOP
        -- الحصول على أعلى رقم موظف للمؤسسة
        SELECT COALESCE(
            MAX(CAST(REGEXP_REPLACE(employee_number, '^EMP-', '') AS INTEGER)), 0
        ) + 1
        INTO next_number
        FROM public.employees
        WHERE tenant_id = tenant_id_param
        AND employee_number ~ '^EMP-\d+$';
        
        -- إنشاء رقم الموظف
        employee_number := 'EMP-' || LPAD(next_number::TEXT, 6, '0');
        
        -- التحقق من عدم وجود رقم مماثل
        IF NOT EXISTS (
            SELECT 1 FROM public.employees 
            WHERE tenant_id = tenant_id_param 
            AND employee_number = employee_number
        ) THEN
            RETURN employee_number;
        END IF;
        
        -- زيادة عداد المحاولات
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'فشل في توليد رقم موظف فريد بعد % محاولة', max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- 3. تحسين دالة تفعيل المؤسسة
CREATE OR REPLACE FUNCTION public.activate_tenant_safely(tenant_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    tenant_record RECORD;
BEGIN
    -- التحقق من وجود المؤسسة
    SELECT * INTO tenant_record
    FROM public.tenants
    WHERE id = tenant_id_param;
    
    IF tenant_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'المؤسسة غير موجودة'
        );
    END IF;
    
    -- تفعيل المؤسسة
    UPDATE public.tenants
    SET 
        status = 'active',
        updated_at = now()
    WHERE id = tenant_id_param;
    
    -- إنشاء دليل الحسابات الشامل
    BEGIN
        PERFORM public.setup_comprehensive_chart_of_accounts(tenant_id_param);
        PERFORM public.complete_liabilities_equity_revenue_expenses(tenant_id_param);
    EXCEPTION WHEN OTHERS THEN
        -- في حالة فشل إنشاء دليل الحسابات، نسجل الخطأ ولكن لا نمنع التفعيل
        RAISE WARNING 'فشل في إنشاء دليل الحسابات للمؤسسة %: %', tenant_id_param, SQLERRM;
    END;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم تفعيل المؤسسة بنجاح'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- 4. تحسين RLS policies للجدول employees
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة الموظفين" ON public.employees;
DROP POLICY IF EXISTS "الموظفون يمكنهم رؤية بياناتهم" ON public.employees;

CREATE POLICY "المديرون يمكنهم إدارة الموظفين"
ON public.employees
FOR ALL
TO authenticated
USING (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR
     has_role(auth.uid(), 'super_admin'::user_role))
)
WITH CHECK (
    tenant_id = get_current_tenant_id() AND
    (has_role(auth.uid(), 'admin'::user_role) OR 
     has_role(auth.uid(), 'manager'::user_role) OR
     has_role(auth.uid(), 'super_admin'::user_role))
);

CREATE POLICY "الموظفون يمكنهم رؤية بياناتهم"
ON public.employees
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    (tenant_id = get_current_tenant_id() AND
     (has_role(auth.uid(), 'admin'::user_role) OR 
      has_role(auth.uid(), 'manager'::user_role) OR
      has_role(auth.uid(), 'super_admin'::user_role)))
);

-- 5. إضافة دالة مساعدة للتحقق من صحة البيانات قبل إنشاء الموظف
CREATE OR REPLACE FUNCTION public.validate_employee_creation(
    tenant_id_param UUID,
    email_param TEXT,
    phone_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    validation_result JSONB := jsonb_build_object('valid', true);
BEGIN
    -- التحقق من صحة البريد الإلكتروني
    IF email_param IS NULL OR email_param = '' THEN
        validation_result := jsonb_build_object(
            'valid', false,
            'error', 'البريد الإلكتروني مطلوب'
        );
        RETURN validation_result;
    END IF;
    
    -- التحقق من عدم تكرار البريد الإلكتروني
    IF EXISTS (
        SELECT 1 FROM public.employees 
        WHERE tenant_id = tenant_id_param 
        AND email = email_param
    ) THEN
        validation_result := jsonb_build_object(
            'valid', false,
            'error', 'البريد الإلكتروني مستخدم مسبقاً'
        );
        RETURN validation_result;
    END IF;
    
    -- التحقق من رقم الهاتف إذا تم توفيره
    IF phone_param IS NOT NULL AND phone_param != '' THEN
        IF EXISTS (
            SELECT 1 FROM public.employees 
            WHERE tenant_id = tenant_id_param 
            AND phone = phone_param
        ) THEN
            validation_result := jsonb_build_object(
                'valid', false,
                'error', 'رقم الهاتف مستخدم مسبقاً'
            );
            RETURN validation_result;
        END IF;
    END IF;
    
    RETURN validation_result;
END;
$$;