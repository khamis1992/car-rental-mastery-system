-- حذف الدالة الموجودة مسبقاً وإعادة إنشائها مع search_path

DROP FUNCTION IF EXISTS public.check_period_status(date);

-- إصلاح الدفعة التالية من الدوال بإضافة SET search_path TO 'public'

-- وظيفة لإنشاء دليل حسابات افتراضي
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    account_record RECORD;
    inserted_count INTEGER := 0;
    new_account_id UUID;
BEGIN
    -- نسخ دليل الحسابات من المؤسسة الافتراضية إلى المؤسسة الجديدة
    FOR account_record IN 
        SELECT * FROM public.chart_of_accounts 
        WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1)
        ORDER BY level ASC, account_code ASC
    LOOP
        INSERT INTO public.chart_of_accounts (
            tenant_id, account_code, account_name, account_name_en, 
            account_type, account_category, parent_account_id, level, 
            allow_posting, is_active, opening_balance, current_balance
        ) VALUES (
            tenant_id_param, account_record.account_code, account_record.account_name, 
            account_record.account_name_en, account_record.account_type, 
            account_record.account_category, account_record.parent_account_id, 
            account_record.level, account_record.allow_posting, account_record.is_active, 
            0, 0
        ) RETURNING id INTO new_account_id;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$function$;

-- وظيفة لنسخ مراكز التكلفة الافتراضية
CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    cost_center_record RECORD;
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ مراكز التكلفة من المؤسسة الافتراضية
    FOR cost_center_record IN 
        SELECT * FROM public.cost_centers 
        WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1)
    LOOP
        INSERT INTO public.cost_centers (
            tenant_id, cost_center_code, cost_center_name, cost_center_type,
            parent_cost_center_id, level, hierarchy_path, is_active,
            budget_amount, actual_spent
        ) VALUES (
            tenant_id_param, cost_center_record.cost_center_code, 
            cost_center_record.cost_center_name, cost_center_record.cost_center_type,
            cost_center_record.parent_cost_center_id, cost_center_record.level,
            cost_center_record.hierarchy_path, cost_center_record.is_active,
            0, 0
        );
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$function$;

-- وظيفة لنسخ العلامة التجارية الافتراضية
CREATE OR REPLACE FUNCTION public.copy_default_company_branding(tenant_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    default_branding RECORD;
BEGIN
    -- نسخ العلامة التجارية من المؤسسة الافتراضية
    SELECT * INTO default_branding 
    FROM public.company_branding 
    WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1)
    LIMIT 1;
    
    IF FOUND THEN
        INSERT INTO public.company_branding (
            tenant_id, company_name, logo_url, primary_color, 
            secondary_color, font_family, header_text
        ) VALUES (
            tenant_id_param, default_branding.company_name, 
            default_branding.logo_url, default_branding.primary_color,
            default_branding.secondary_color, default_branding.font_family,
            default_branding.header_text
        );
    END IF;
END;
$function$;

-- وظيفة للحصول على سياق المستخدم والمؤسسة
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    user_context jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', null,
            'message', 'المستخدم غير مصادق عليه'
        );
    END IF;
    
    -- جلب بيانات المستخدم والمؤسسة والدور
    SELECT jsonb_build_object(
        'user_id', tu.user_id,
        'tenant_id', tu.tenant_id,
        'role', tu.role,
        'permissions', jsonb_build_object(
            'can_manage_users', CASE WHEN tu.role IN ('super_admin', 'tenant_admin') THEN true ELSE false END,
            'can_manage_accounting', CASE WHEN tu.role IN ('super_admin', 'tenant_admin', 'accountant') THEN true ELSE false END,
            'can_manage_vehicles', CASE WHEN tu.role IN ('super_admin', 'tenant_admin', 'manager') THEN true ELSE false END,
            'can_view_reports', CASE WHEN tu.role IN ('super_admin', 'tenant_admin', 'manager', 'accountant') THEN true ELSE false END,
            'can_manage_contracts', CASE WHEN tu.role IN ('super_admin', 'tenant_admin', 'manager') THEN true ELSE false END
        )
    ) INTO user_context
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    LIMIT 1;
    
    RETURN COALESCE(user_context, jsonb_build_object(
        'user_id', current_user_id,
        'tenant_id', null,
        'role', null,
        'permissions', null,
        'message', 'المستخدم غير مرتبط بأي مؤسسة'
    ));
END;
$function$;

-- وظيفة للحصول على معرف المؤسسة الحالية
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
    
    -- جلب معرف المؤسسة للمستخدم الحالي
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    LIMIT 1;
    
    RETURN tenant_id;
END;
$function$;

-- وظيفة لتسجيل نشاط المستخدم
CREATE OR REPLACE FUNCTION public.log_user_activity(
    activity_type text,
    activity_description text,
    related_entity_type text DEFAULT NULL,
    related_entity_id uuid DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
    activity_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    -- إدراج سجل النشاط
    INSERT INTO public.user_activity_logs (
        user_id, tenant_id, activity_type, activity_description,
        related_entity_type, related_entity_id, ip_address, user_agent
    ) VALUES (
        current_user_id, current_tenant_id, activity_type, activity_description,
        related_entity_type, related_entity_id, 
        COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown'),
        COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'unknown')
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$function$;

-- وظيفة لتوليد رقم قيد محاسبي
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    next_number integer;
    journal_number text;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرقم التالي للقيد
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id
    AND entry_number ~ '^JE-[0-9]+$';
    
    -- تكوين رقم القيد
    journal_number := 'JE-' || LPAD(next_number::text, 6, '0');
    
    RETURN journal_number;
END;
$function$;

-- وظيفة للتحقق من حالة الفترة المحاسبية
CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    period_record RECORD;
    result jsonb;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المحاسبية التي تحتوي على التاريخ المحدد
    SELECT * INTO period_record
    FROM public.accounting_periods
    WHERE tenant_id = current_tenant_id
    AND check_date BETWEEN start_date AND end_date
    LIMIT 1;
    
    IF FOUND THEN
        result := jsonb_build_object(
            'period_found', true,
            'period_id', period_record.id,
            'period_name', period_record.period_name,
            'status', period_record.status,
            'can_modify', CASE 
                WHEN period_record.status = 'open' THEN true 
                ELSE false 
            END,
            'message', CASE 
                WHEN period_record.status = 'open' THEN 'الفترة مفتوحة ويمكن التعديل'
                WHEN period_record.status = 'closed' THEN 'الفترة مقفلة ولا يمكن التعديل'
                WHEN period_record.status = 'locked' THEN 'الفترة مقفلة نهائياً ولا يمكن التعديل'
                ELSE 'حالة الفترة غير معروفة'
            END
        );
    ELSE
        result := jsonb_build_object(
            'period_found', false,
            'can_modify', false,
            'message', 'لم يتم العثور على فترة محاسبية للتاريخ المحدد'
        );
    END IF;
    
    RETURN result;
END;
$function$;