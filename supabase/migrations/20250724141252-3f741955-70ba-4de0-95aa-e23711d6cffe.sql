-- إصلاح المجموعة التالية من تحذيرات Function Search Path Mutable
-- إضافة SET search_path TO 'public' للدوال

-- إصلاح دوال النظام التالية
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف أي حسابات موجودة للمؤسسة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    inserted_count := inserted_count + 5;

    -- المستوى الثاني - الأصول
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '12', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);
    
    inserted_count := inserted_count + 2;
    
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
    -- إضافة مراكز التكلفة الافتراضية
    INSERT INTO public.cost_centers (
        tenant_id, cost_center_code, cost_center_name, cost_center_type,
        level, hierarchy_path, is_active, budget_amount, actual_spent
    ) VALUES 
    (tenant_id_param, 'CC001', 'مركز التكلفة الرئيسي', 'department', 1, 'CC001', true, 0, 0),
    (tenant_id_param, 'CC002', 'مركز تكلفة السيارات', 'vehicle', 2, 'CC001.CC002', true, 0, 0);
    
    inserted_count := 2;
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
    -- إضافة إعدادات العلامة التجارية الافتراضية
    INSERT INTO public.company_branding (
        tenant_id, company_name, company_name_en, 
        primary_color, secondary_color
    ) VALUES (
        tenant_id_param, 'اسم الشركة', 'Company Name',
        '#007bff', '#6c757d'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    next_number INTEGER;
    current_year INTEGER;
    entry_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM journal_entries
    WHERE entry_number LIKE current_year::text || '%';
    
    entry_number := current_year::text || LPAD(next_number::text, 6, '0');
    
    RETURN entry_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO user_activity_logs (
        user_id, tenant_id, activity_type, description, created_at
    ) VALUES (
        auth.uid(),
        public.get_current_tenant_id(),
        activity_type,
        description,
        NOW()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record RECORD;
    result jsonb;
BEGIN
    -- البحث عن الفترة المالية التي تحتوي على التاريخ المحدد
    SELECT * INTO period_record
    FROM accounting_periods
    WHERE check_date BETWEEN start_date AND end_date
    AND tenant_id = public.get_current_tenant_id()
    LIMIT 1;
    
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'can_modify', false,
            'message', 'لا توجد فترة محاسبية محددة لهذا التاريخ'
        );
    ELSIF period_record.is_closed THEN
        result := jsonb_build_object(
            'can_modify', false,
            'message', 'الفترة المحاسبية مقفلة'
        );
    ELSE
        result := jsonb_build_object(
            'can_modify', true,
            'message', 'الفترة المحاسبية مفتوحة للتعديل'
        );
    END IF;
    
    RETURN result;
END;
$function$;

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
    permissions jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', '{}'::jsonb
        );
    END IF;
    
    -- الحصول على معلومات المستخدم والمؤسسة
    SELECT tu.tenant_id, tu.role INTO current_tenant_id, user_role
    FROM tenant_users tu
    WHERE tu.user_id = current_user_id
    AND tu.status = 'active'
    LIMIT 1;
    
    -- الحصول على الصلاحيات
    SELECT COALESCE(
        jsonb_build_object(
            'can_manage_users', CASE WHEN user_role IN ('super_admin', 'tenant_admin') THEN true ELSE false END,
            'can_manage_accounting', CASE WHEN user_role IN ('super_admin', 'tenant_admin', 'accountant') THEN true ELSE false END,
            'can_manage_vehicles', CASE WHEN user_role IN ('super_admin', 'tenant_admin', 'manager') THEN true ELSE false END,
            'can_view_reports', CASE WHEN user_role IN ('super_admin', 'tenant_admin', 'manager', 'accountant') THEN true ELSE false END,
            'can_manage_contracts', CASE WHEN user_role IN ('super_admin', 'tenant_admin', 'manager') THEN true ELSE false END
        ),
        '{}'::jsonb
    ) INTO permissions;
    
    user_context := jsonb_build_object(
        'user_id', current_user_id,
        'tenant_id', current_tenant_id,
        'role', user_role,
        'permissions', permissions
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
BEGIN
    SELECT tenant_id INTO current_tenant_id
    FROM tenant_users
    WHERE user_id = auth.uid()
    AND status = 'active'
    LIMIT 1;
    
    RETURN current_tenant_id;
END;
$function$;