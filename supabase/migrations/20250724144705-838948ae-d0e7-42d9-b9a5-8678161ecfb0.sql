-- الدفعة الثانية: إصلاح 6 دوال أخرى لإضافة SET search_path TO 'public'

-- إصلاح دالة get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_id uuid;
    context jsonb;
    user_role text;
    tenant_id uuid;
    permissions jsonb;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', null
        );
    END IF;
    
    -- الحصول على دور المستخدم ومعرف المؤسسة
    SELECT tu.role, tu.tenant_id 
    INTO user_role, tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = user_id 
    AND tu.status = 'active'
    LIMIT 1;
    
    -- إذا لم يتم العثور على المستخدم في tenant_users، تحقق من tenant_user_roles
    IF user_role IS NULL THEN
        SELECT tur.role::text, tur.tenant_id 
        INTO user_role, tenant_id
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = user_id 
        AND tur.status = 'active'
        LIMIT 1;
    END IF;
    
    -- الحصول على الصلاحيات
    permissions := jsonb_build_object(
        'can_manage_users', user_role IN ('super_admin', 'tenant_admin'),
        'can_manage_accounting', user_role IN ('super_admin', 'tenant_admin', 'accountant'),
        'can_manage_vehicles', user_role IN ('super_admin', 'tenant_admin', 'manager'),
        'can_view_reports', user_role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
        'can_manage_contracts', user_role IN ('super_admin', 'tenant_admin', 'manager')
    );
    
    context := jsonb_build_object(
        'authenticated', true,
        'user_id', user_id,
        'tenant_id', tenant_id,
        'role', user_role,
        'permissions', permissions
    );
    
    RETURN context;
END;
$function$;

-- إصلاح دالة get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- البحث في tenant_user_roles أولاً
    SELECT tur.tenant_id INTO tenant_id
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = current_user_id 
    AND tur.status = 'active'
    LIMIT 1;
    
    -- إذا لم يتم العثور عليه، البحث في tenant_users القديم
    IF tenant_id IS NULL THEN
        SELECT tu.tenant_id INTO tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = current_user_id 
        AND tu.status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$function$;

-- إصلاح دالة generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_year INTEGER;
    next_sequence INTEGER;
    entry_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- الحصول على الرقم التسلسلي التالي للسنة الحالية
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ ('^JE' || current_year || '-[0-9]+$') 
            THEN CAST(SUBSTRING(entry_number FROM LENGTH('JE' || current_year || '-') + 1) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO next_sequence
    FROM public.journal_entries
    WHERE EXTRACT(YEAR FROM entry_date) = current_year;
    
    entry_number := 'JE' || current_year || '-' || LPAD(next_sequence::TEXT, 6, '0');
    
    RETURN entry_number;
END;
$function$;

-- إصلاح دالة check_period_status
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

-- إصلاح دالة log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, description text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    activity_id uuid;
    current_user_id uuid;
    current_tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    -- إدراج سجل النشاط
    INSERT INTO public.user_activity_logs (
        user_id,
        tenant_id,
        activity_type,
        description,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        current_user_id,
        current_tenant_id,
        activity_type,
        description,
        current_setting('request.headers')::json->>'x-forwarded-for',
        current_setting('request.headers')::json->>'user-agent',
        NOW()
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$function$;

-- إصلاح دالة copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ دليل الحسابات الافتراضي
    INSERT INTO public.chart_of_accounts (
        tenant_id,
        account_code,
        account_name,
        account_name_en,
        account_type,
        account_category,
        parent_account_id,
        level,
        allow_posting,
        is_active,
        opening_balance,
        current_balance
    )
    SELECT 
        tenant_id_param,
        account_code,
        account_name,
        account_name_en,
        account_type,
        account_category,
        NULL, -- سيتم تحديث parent_account_id لاحقاً
        level,
        allow_posting,
        is_active,
        0,
        0
    FROM public.chart_of_accounts
    WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1);
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;