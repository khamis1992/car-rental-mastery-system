-- إصلاح الدفعة التاسعة من الدوال بإضافة SET search_path TO 'public'

CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    current_user_id uuid;
    current_tenant_id uuid;
    user_role text;
    tenant_info jsonb;
    permissions jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', jsonb_build_object(),
            'tenant_info', jsonb_build_object()
        );
    END IF;
    
    -- جلب معرف المؤسسة والدور من جدول tenant_user_roles الجديد
    SELECT tur.tenant_id, tur.role::text
    INTO current_tenant_id, user_role
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = current_user_id 
    AND tur.status = 'active'
    ORDER BY tur.created_at DESC
    LIMIT 1;
    
    -- إذا لم نجد في الجدول الجديد، جرب الجدول القديم
    IF current_tenant_id IS NULL THEN
        SELECT tu.tenant_id, tu.role::text
        INTO current_tenant_id, user_role
        FROM public.tenant_users tu
        WHERE tu.user_id = current_user_id 
        AND tu.status = 'active'
        ORDER BY tu.created_at DESC
        LIMIT 1;
    END IF;
    
    -- إذا لم نجد أي مؤسسة، تحقق إذا كان مدير نظام
    IF current_tenant_id IS NULL THEN
        SELECT 'super_admin' INTO user_role
        WHERE EXISTS (
            SELECT 1 FROM public.system_admins sa
            WHERE sa.user_id = current_user_id
            AND sa.is_active = true
        );
    END IF;
    
    -- جلب معلومات المؤسسة
    IF current_tenant_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'name', t.name,
            'slug', t.slug,
            'status', t.status,
            'subscription_plan', t.subscription_plan
        ) INTO tenant_info
        FROM public.tenants t
        WHERE t.id = current_tenant_id;
    ELSE
        tenant_info := jsonb_build_object();
    END IF;
    
    -- تحديد الصلاحيات حسب الدور
    CASE user_role
        WHEN 'super_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_tenants', true,
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_system', true
            );
        WHEN 'tenant_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_tenants', false,
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_system', false
            );
        WHEN 'manager' THEN
            permissions := jsonb_build_object(
                'can_manage_tenants', false,
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_system', false
            );
        WHEN 'accountant' THEN
            permissions := jsonb_build_object(
                'can_manage_tenants', false,
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', false,
                'can_view_reports', true,
                'can_manage_contracts', false,
                'can_manage_system', false
            );
        WHEN 'user' THEN
            permissions := jsonb_build_object(
                'can_manage_tenants', false,
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false,
                'can_manage_system', false
            );
        ELSE
            permissions := jsonb_build_object(
                'can_manage_tenants', false,
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false,
                'can_manage_system', false
            );
    END CASE;
    
    user_context := jsonb_build_object(
        'user_id', current_user_id,
        'tenant_id', current_tenant_id,
        'role', COALESCE(user_role, 'user'),
        'permissions', permissions,
        'tenant_info', tenant_info
    );
    
    RETURN user_context;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- جلب معرف المؤسسة من جدول tenant_user_roles الجديد
    SELECT tur.tenant_id
    INTO current_tenant_id
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = current_user_id 
    AND tur.status = 'active'
    ORDER BY tur.created_at DESC
    LIMIT 1;
    
    -- إذا لم نجد في الجدول الجديد، جرب الجدول القديم
    IF current_tenant_id IS NULL THEN
        SELECT tu.tenant_id
        INTO current_tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = current_user_id 
        AND tu.status = 'active'
        ORDER BY tu.created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN current_tenant_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    next_number integer;
    formatted_number text;
    current_year text;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- الحصول على الرقم التسلسلي التالي للسنة الحالية
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ '^JE-' || current_year || '-\d+$' THEN 
                CAST(SUBSTRING(entry_number FROM '^JE-' || current_year || '-(\d+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 
    INTO next_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id;
    
    formatted_number := 'JE-' || current_year || '-' || LPAD(next_number::text, 6, '0');
    
    RETURN formatted_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, description text)
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
        tenant_id,
        user_id,
        activity_type,
        description,
        created_at
    ) VALUES (
        current_tenant_id,
        auth.uid(),
        activity_type,
        description,
        now()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record RECORD;
    current_tenant_id uuid;
    result jsonb;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المالية المناسبة
    SELECT * INTO period_record
    FROM public.accounting_periods
    WHERE tenant_id = current_tenant_id
    AND start_date <= check_date
    AND end_date >= check_date
    ORDER BY start_date DESC
    LIMIT 1;
    
    -- إذا لم نجد فترة مالية
    IF period_record IS NULL THEN
        result := jsonb_build_object(
            'period_found', false,
            'can_modify', false,
            'message', 'لا توجد فترة مالية محددة لهذا التاريخ'
        );
    ELSE
        -- تحقق من حالة الفترة
        CASE period_record.status
            WHEN 'open' THEN
                result := jsonb_build_object(
                    'period_found', true,
                    'period_id', period_record.id,
                    'period_name', period_record.period_name,
                    'status', period_record.status,
                    'can_modify', true,
                    'message', 'الفترة مفتوحة ويمكن التعديل'
                );
            WHEN 'closed' THEN
                result := jsonb_build_object(
                    'period_found', true,
                    'period_id', period_record.id,
                    'period_name', period_record.period_name,
                    'status', period_record.status,
                    'can_modify', false,
                    'message', 'الفترة مقفلة ولا يمكن التعديل'
                );
            WHEN 'locked' THEN
                result := jsonb_build_object(
                    'period_found', true,
                    'period_id', period_record.id,
                    'period_name', period_record.period_name,
                    'status', period_record.status,
                    'can_modify', false,
                    'message', 'الفترة مؤمنة ولا يمكن التعديل'
                );
            ELSE
                result := jsonb_build_object(
                    'period_found', true,
                    'period_id', period_record.id,
                    'period_name', period_record.period_name,
                    'status', period_record.status,
                    'can_modify', false,
                    'message', 'حالة الفترة غير معروفة'
                );
        END CASE;
    END IF;
    
    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ دليل الحسابات من المؤسسة الافتراضية
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
        0, -- رصيد افتتاحي صفر للمؤسسة الجديدة
        0  -- رصيد حالي صفر للمؤسسة الجديدة
    FROM public.chart_of_accounts
    WHERE tenant_id = (
        SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1
    );
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    -- تحديث parent_account_id للحسابات الفرعية
    UPDATE public.chart_of_accounts ca1
    SET parent_account_id = ca2.id
    FROM public.chart_of_accounts ca2,
         public.chart_of_accounts default_ca,
         public.chart_of_accounts default_parent
    WHERE ca1.tenant_id = tenant_id_param
    AND ca2.tenant_id = tenant_id_param
    AND default_ca.tenant_id = (
        SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1
    )
    AND default_parent.tenant_id = (
        SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1
    )
    AND ca1.account_code = default_ca.account_code
    AND ca2.account_code = default_parent.account_code
    AND default_ca.parent_account_id = default_parent.id;
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ مراكز التكلفة من المؤسسة الافتراضية
    INSERT INTO public.cost_centers (
        tenant_id,
        cost_center_code,
        cost_center_name,
        cost_center_type,
        level,
        hierarchy_path,
        is_active,
        budget_amount,
        actual_spent
    )
    SELECT 
        tenant_id_param,
        cost_center_code,
        cost_center_name,
        cost_center_type,
        level,
        hierarchy_path,
        is_active,
        0, -- ميزانية صفر للمؤسسة الجديدة
        0  -- مصروفات فعلية صفر للمؤسسة الجديدة
    FROM public.cost_centers
    WHERE tenant_id = (
        SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1
    );
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.copy_default_company_branding(tenant_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- نسخ العلامة التجارية من المؤسسة الافتراضية
    INSERT INTO public.company_branding (
        tenant_id,
        company_name_arabic,
        company_name_english,
        logo_url,
        primary_color,
        secondary_color,
        header_text_arabic,
        header_text_english,
        footer_text_arabic,
        footer_text_english,
        address_arabic,
        address_english,
        phone,
        email,
        website,
        commercial_registration,
        tax_number
    )
    SELECT 
        tenant_id_param,
        'اسم الشركة',
        'Company Name',
        logo_url,
        primary_color,
        secondary_color,
        'نص الرأسية',
        'Header Text',
        'نص التذييل',
        'Footer Text',
        'العنوان',
        'Address',
        phone,
        email,
        website,
        '',
        ''
    FROM public.company_branding
    WHERE tenant_id = (
        SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1
    )
    LIMIT 1;
END;
$function$;