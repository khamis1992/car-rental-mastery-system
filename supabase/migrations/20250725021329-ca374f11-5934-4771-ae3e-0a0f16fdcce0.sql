-- إصلاح الدوال - الدفعة السادسة

CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, details text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_user_id IS NOT NULL AND current_tenant_id IS NOT NULL THEN
        INSERT INTO public.user_activity_logs (
            user_id,
            tenant_id,
            activity_type,
            details,
            ip_address,
            user_agent
        ) VALUES (
            current_user_id,
            current_tenant_id,
            activity_type,
            details,
            current_setting('request.headers', true)::json->>'x-forwarded-for',
            current_setting('request.headers', true)::json->>'user-agent'
        );
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- إضافة الحسابات المفقودة للإيرادات الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    IF NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '43') THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES 
        (tenant_id_param, '43', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إضافة حسابات تفصيلية للمصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '512';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES 
        (tenant_id_param, '51201', 'صيانة السيارات', 'Vehicle Maintenance', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
        (tenant_id_param, '51202', 'صيانة المعدات', 'Equipment Maintenance', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 2;
    END IF;
    
    -- إضافة حسابات تفصيلية للوقود
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '513';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES 
        (tenant_id_param, '51301', 'وقود السيارات', 'Vehicle Fuel', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
        (tenant_id_param, '51302', 'زيوت ومواد تشحيم', 'Oils and Lubricants', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 2;
    END IF;
    
    -- إضافة حسابات تفصيلية للإهلاك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '514';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES 
        (tenant_id_param, '51401', 'إهلاك السيارات', 'Vehicle Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
        (tenant_id_param, '51402', 'إهلاك المعدات', 'Equipment Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 2;
    END IF;
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    basic_accounts_count INTEGER := 0;
    additional_accounts_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    -- إنشاء الحسابات الأساسية
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO basic_accounts_count;
    
    -- إضافة الحسابات المتخصصة
    SELECT public.add_specialized_rental_accounts(tenant_id_param) INTO additional_accounts_count;
    
    -- إكمال الحسابات المفقودة
    SELECT public.complete_liabilities_equity_revenue_expenses(tenant_id_param) INTO total_count;
    
    total_count := basic_accounts_count + additional_accounts_count + total_count;
    
    RETURN total_count;
END;
$function$;