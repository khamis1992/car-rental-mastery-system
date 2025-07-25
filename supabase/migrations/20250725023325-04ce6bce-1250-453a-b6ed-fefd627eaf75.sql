-- إصلاح الدفعة الخامسة من الدوال - إضافة SET search_path TO 'public'

-- get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    current_user_id uuid;
    tenant_info record;
    user_role text;
    permissions jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'tenant_id', null,
            'role', null,
            'permissions', '{}'::jsonb,
            'status', 'unauthenticated'
        );
    END IF;
    
    -- جلب معلومات المؤسسة والدور
    SELECT 
        tu.tenant_id,
        tu.role::text,
        t.name as tenant_name,
        t.status as tenant_status
    INTO tenant_info
    FROM public.tenant_users tu
    INNER JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    AND t.status = 'active'
    LIMIT 1;
    
    IF tenant_info IS NULL THEN
        RETURN jsonb_build_object(
            'tenant_id', null,
            'role', null,
            'permissions', '{}'::jsonb,
            'status', 'no_tenant'
        );
    END IF;
    
    user_role := tenant_info.role;
    
    -- تحديد الصلاحيات بناءً على الدور
    CASE user_role
        WHEN 'super_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_tenants', true
            );
        WHEN 'tenant_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_tenants', false
            );
        WHEN 'manager' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_tenants', false
            );
        WHEN 'accountant' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', false,
                'can_view_reports', true,
                'can_manage_contracts', false,
                'can_manage_tenants', false
            );
        WHEN 'user' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false,
                'can_manage_tenants', false
            );
        ELSE
            permissions := '{}'::jsonb;
    END CASE;
    
    user_context := jsonb_build_object(
        'tenant_id', tenant_info.tenant_id,
        'role', user_role,
        'permissions', permissions,
        'tenant_name', tenant_info.tenant_name,
        'tenant_status', tenant_info.tenant_status,
        'status', 'authenticated'
    );
    
    RETURN user_context;
END;
$function$;

-- get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT tenant_id INTO current_tenant_id
    FROM public.tenant_users
    WHERE user_id = current_user_id 
    AND status = 'active'
    LIMIT 1;
    
    RETURN current_tenant_id;
END;
$function$;

-- log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, description text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    activity_id uuid;
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    INSERT INTO public.user_activities (
        user_id,
        tenant_id,
        activity_type,
        description,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        current_tenant_id,
        activity_type,
        description,
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent'
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
EXCEPTION WHEN OTHERS THEN
    -- في حالة الفشل، نرجع null بدلاً من رفع خطأ
    RETURN NULL;
END;
$function$;

-- log_transaction
CREATE OR REPLACE FUNCTION public.log_transaction(transaction_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    transaction_amount NUMERIC;
    transaction_description TEXT;
    reference_type TEXT;
    reference_id UUID;
    debit_account_id UUID;
    credit_account_id UUID;
    current_tenant_id UUID;
BEGIN
    -- التحقق من المصادقة
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'غير مصرح لك بتسجيل المعاملات المحاسبية';
    END IF;
    
    -- الحصول على معرف المؤسسة الحالية
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية';
    END IF;
    
    -- استخراج البيانات من JSON
    transaction_amount := (transaction_data->>'amount')::NUMERIC;
    transaction_description := transaction_data->>'description';
    reference_type := transaction_data->>'reference_type';
    reference_id := (transaction_data->>'reference_id')::UUID;
    debit_account_id := (transaction_data->>'debit_account_id')::UUID;
    credit_account_id := (transaction_data->>'credit_account_id')::UUID;
    
    -- التحقق من صحة البيانات
    IF transaction_amount IS NULL OR transaction_amount <= 0 THEN
        RAISE EXCEPTION 'مبلغ المعاملة يجب أن يكون أكبر من صفر';
    END IF;
    
    IF debit_account_id IS NULL OR credit_account_id IS NULL THEN
        RAISE EXCEPTION 'يجب تحديد الحسابات المدينة والدائنة';
    END IF;
    
    -- توليد رقم القيد
    journal_entry_number := public.generate_journal_entry_number();
    
    -- إنشاء القيد المحاسبي
    INSERT INTO public.journal_entries (
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        status,
        created_by,
        tenant_id
    ) VALUES (
        journal_entry_number,
        CURRENT_DATE,
        transaction_description,
        reference_type,
        reference_id,
        transaction_amount,
        transaction_amount,
        'posted',
        auth.uid(),
        current_tenant_id
    ) RETURNING id INTO journal_entry_id;
    
    -- إضافة السطر المدين
    INSERT INTO public.journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount,
        line_number,
        tenant_id
    ) VALUES (
        journal_entry_id,
        debit_account_id,
        transaction_description,
        transaction_amount,
        0,
        1,
        current_tenant_id
    );
    
    -- إضافة السطر الدائن
    INSERT INTO public.journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount,
        line_number,
        tenant_id
    ) VALUES (
        journal_entry_id,
        credit_account_id,
        transaction_description,
        0,
        transaction_amount,
        2,
        current_tenant_id
    );
    
    -- تحديث أرصدة الحسابات
    PERFORM public.update_account_balances(journal_entry_id);
    
    RETURN journal_entry_id;
END;
$function$;

-- generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id UUID;
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرقم التالي للمؤسسة
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ '^JE-[0-9]+$' THEN 
                CAST(SUBSTRING(entry_number FROM 4) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO next_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id;
    
    -- تنسيق الرقم
    formatted_number := 'JE-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$function$;