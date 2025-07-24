-- إصلاح الدفعة السادسة من التحذيرات لتأمين مسار البحث في الوظائف

-- 1. إصلاح get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb := '{}';
    current_tenant_id uuid;
    user_role text;
    user_permissions jsonb := '{}';
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN user_context;
    END IF;
    
    -- الحصول على معرف المؤسسة الحالية
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على دور المستخدم
    IF current_tenant_id IS NOT NULL THEN
        -- البحث أولاً في tenant_user_roles
        SELECT tur.role::text INTO user_role
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = auth.uid() 
        AND tur.tenant_id = current_tenant_id
        AND tur.status = 'active'
        LIMIT 1;
        
        -- إذا لم يجد، ابحث في tenant_users
        IF user_role IS NULL THEN
            SELECT tu.role::text INTO user_role
            FROM public.tenant_users tu
            WHERE tu.user_id = auth.uid() 
            AND tu.tenant_id = current_tenant_id
            AND tu.status = 'active'
            LIMIT 1;
        END IF;
        
        -- تحديد الصلاحيات بناءً على الدور
        CASE user_role
            WHEN 'super_admin' THEN
                user_permissions := jsonb_build_object(
                    'can_manage_users', true,
                    'can_manage_accounting', true,
                    'can_manage_vehicles', true,
                    'can_view_reports', true,
                    'can_manage_contracts', true,
                    'can_manage_system', true
                );
            WHEN 'tenant_admin' THEN
                user_permissions := jsonb_build_object(
                    'can_manage_users', true,
                    'can_manage_accounting', true,
                    'can_manage_vehicles', true,
                    'can_view_reports', true,
                    'can_manage_contracts', true,
                    'can_manage_system', false
                );
            WHEN 'manager' THEN
                user_permissions := jsonb_build_object(
                    'can_manage_users', false,
                    'can_manage_accounting', true,
                    'can_manage_vehicles', true,
                    'can_view_reports', true,
                    'can_manage_contracts', true,
                    'can_manage_system', false
                );
            WHEN 'accountant' THEN
                user_permissions := jsonb_build_object(
                    'can_manage_users', false,
                    'can_manage_accounting', true,
                    'can_manage_vehicles', false,
                    'can_view_reports', true,
                    'can_manage_contracts', false,
                    'can_manage_system', false
                );
            WHEN 'user' THEN
                user_permissions := jsonb_build_object(
                    'can_manage_users', false,
                    'can_manage_accounting', false,
                    'can_manage_vehicles', false,
                    'can_view_reports', false,
                    'can_manage_contracts', false,
                    'can_manage_system', false
                );
            ELSE
                user_permissions := jsonb_build_object(
                    'can_manage_users', false,
                    'can_manage_accounting', false,
                    'can_manage_vehicles', false,
                    'can_view_reports', false,
                    'can_manage_contracts', false,
                    'can_manage_system', false
                );
        END CASE;
    END IF;
    
    user_context := jsonb_build_object(
        'user_id', auth.uid(),
        'tenant_id', current_tenant_id,
        'role', COALESCE(user_role, 'user'),
        'permissions', user_permissions
    );
    
    RETURN user_context;
END;
$function$;

-- 2. إصلاح get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    tenant_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- البحث أولاً في tenant_user_roles
    SELECT tur.tenant_id INTO tenant_id
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = auth.uid()
    AND tur.status = 'active'
    LIMIT 1;
    
    -- إذا لم يجد، ابحث في tenant_users
    IF tenant_id IS NULL THEN
        SELECT tu.tenant_id INTO tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$function$;

-- 3. إصلاح log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, activity_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    INSERT INTO public.user_activities (
        user_id,
        tenant_id,
        activity_type,
        activity_description,
        created_at
    ) VALUES (
        auth.uid(),
        current_tenant_id,
        activity_type,
        activity_description,
        now()
    );
END;
$function$;

-- 4. إصلاح generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_year text;
    sequence_number integer;
    journal_number text;
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    current_year := EXTRACT(year FROM current_date)::text;
    
    -- الحصول على الرقم التسلسلي التالي للسنة الحالية والمؤسسة
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM public.journal_entries
    WHERE entry_number LIKE 'JE-' || current_year || '-%'
    AND tenant_id = current_tenant_id;
    
    -- تكوين رقم القيد
    journal_number := 'JE-' || current_year || '-' || LPAD(sequence_number::text, 6, '0');
    
    RETURN journal_number;
END;
$function$;

-- 5. إصلاح check_period_status
CREATE OR REPLACE FUNCTION public.check_period_status(entry_date_param date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record record;
    result jsonb;
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المالية التي تتضمن التاريخ المحدد
    SELECT * INTO period_record
    FROM public.accounting_periods
    WHERE tenant_id = current_tenant_id
    AND start_date <= entry_date_param
    AND end_date >= entry_date_param
    LIMIT 1;
    
    -- إذا لم تجد فترة محددة، إنشاء استجابة افتراضية
    IF period_record IS NULL THEN
        result := jsonb_build_object(
            'exists', false,
            'can_modify', true,
            'message', 'لا توجد فترة محاسبية محددة لهذا التاريخ - يُسمح بالتعديل'
        );
    ELSE
        result := jsonb_build_object(
            'exists', true,
            'period_id', period_record.id,
            'period_name', period_record.period_name,
            'start_date', period_record.start_date,
            'end_date', period_record.end_date,
            'status', period_record.status,
            'can_modify', CASE 
                WHEN period_record.status = 'open' THEN true
                WHEN period_record.status = 'closed' THEN false
                ELSE true
            END,
            'message', CASE 
                WHEN period_record.status = 'open' THEN 'الفترة مفتوحة - يُسمح بالتعديل'
                WHEN period_record.status = 'closed' THEN 'الفترة مقفلة - لا يُسمح بالتعديل'
                ELSE 'حالة الفترة غير محددة - يُسمح بالتعديل'
            END
        );
    END IF;
    
    RETURN result;
END;
$function$;