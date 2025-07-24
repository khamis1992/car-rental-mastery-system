-- حذف الدالة المتضاربة وإعادة إنشائها
DROP FUNCTION IF EXISTS public.log_user_activity(text, text);

-- إصلاح الدوال التالية بإضافة SET search_path TO 'public'

-- إصلاح دالة create_payment_accounting_entry
CREATE OR REPLACE FUNCTION public.create_payment_accounting_entry(payment_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    transaction_entry JSONB;
BEGIN
    -- تحضير بيانات المعاملة
    transaction_entry := jsonb_build_object(
        'amount', payment_data->>'amount',
        'description', 'سداد - ' || (payment_data->>'customer_name') || ' - ' || (payment_data->>'payment_reference'),
        'reference_type', 'payment',
        'reference_id', payment_data->>'payment_id',
        'debit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '1111' AND tenant_id = get_current_tenant_id()),
        'credit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '1121' AND tenant_id = get_current_tenant_id())
    );
    
    -- إنشاء القيد المحاسبي
    RETURN log_transaction(transaction_entry);
END;
$$;

-- إصلاح دالة setup_tenant_default_accounting_data
CREATE OR REPLACE FUNCTION public.setup_tenant_default_accounting_data(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ دليل الحسابات الافتراضي
    SELECT create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    -- إضافة الحسابات المتخصصة
    PERFORM add_specialized_rental_accounts(tenant_id_param);
    
    RETURN inserted_count;
END;
$$;

-- إصلاح دالة check_period_status
CREATE OR REPLACE FUNCTION public.check_period_status(check_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    period_info JSONB;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- افتراض أن جميع الفترات مفتوحة للتعديل حالياً
    period_info := jsonb_build_object(
        'can_modify', true,
        'message', 'الفترة مفتوحة للتعديل',
        'period_status', 'open',
        'check_date', check_date
    );
    
    RETURN period_info;
END;
$$;

-- إصلاح دالة get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- الحصول على معرف المؤسسة من جدول tenant_users
    SELECT tenant_id INTO current_tenant_id
    FROM tenant_users
    WHERE user_id = auth.uid()
    AND status = 'active'
    LIMIT 1;
    
    -- إذا لم يتم العثور على معرف، جرب جدول tenant_user_roles
    IF current_tenant_id IS NULL THEN
        SELECT tenant_id INTO current_tenant_id
        FROM tenant_user_roles
        WHERE user_id = auth.uid()
        AND status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN current_tenant_id;
END;
$$;

-- إصلاح دالة get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_context JSONB;
    user_role TEXT;
    tenant_id_val UUID;
    permissions_val JSONB;
BEGIN
    tenant_id_val := get_current_tenant_id();
    
    -- الحصول على دور المستخدم
    SELECT role INTO user_role
    FROM tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = tenant_id_val
    AND status = 'active'
    LIMIT 1;
    
    -- إذا لم يتم العثور على الدور، جرب جدول tenant_user_roles
    IF user_role IS NULL THEN
        SELECT role::text INTO user_role
        FROM tenant_user_roles
        WHERE user_id = auth.uid()
        AND tenant_id = tenant_id_val
        AND status = 'active'
        LIMIT 1;
    END IF;
    
    -- تحديد الصلاحيات بناءً على الدور
    CASE user_role
        WHEN 'super_admin' THEN
            permissions_val := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        WHEN 'tenant_admin' THEN
            permissions_val := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        WHEN 'manager' THEN
            permissions_val := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        ELSE
            permissions_val := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false
            );
    END CASE;
    
    user_context := jsonb_build_object(
        'user_id', auth.uid(),
        'tenant_id', tenant_id_val,
        'role', COALESCE(user_role, 'user'),
        'permissions', permissions_val
    );
    
    RETURN user_context;
END;
$$;

-- إنشاء دالة log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type TEXT, activity_description TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- تسجيل نشاط المستخدم (دالة بسيطة لتسجيل الأنشطة)
    -- يمكن توسيعها لاحقاً لتشمل تسجيل الأنشطة في جدول منفصل
    NULL;
END;
$$;

-- إصلاح دالة copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- استدعاء دالة إنشاء دليل الحسابات الصحيح
    SELECT create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    RETURN inserted_count;
END;
$$;