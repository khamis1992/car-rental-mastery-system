-- حذف الدوال المتعارضة وإعادة إنشاؤها مع SET search_path TO 'public'

DROP FUNCTION IF EXISTS public.copy_default_company_branding(uuid);
DROP FUNCTION IF EXISTS public.copy_default_cost_centers(uuid);
DROP FUNCTION IF EXISTS public.copy_default_chart_of_accounts(uuid);

-- إعادة إنشاء الدوال مع الإصلاح
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
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, parent_account_id, level,
        allow_posting, is_active, opening_balance, current_balance
    )
    SELECT 
        tenant_id_param, account_code, account_name, account_name_en,
        account_type, account_category, 
        CASE 
            WHEN parent_account_id IS NOT NULL THEN 
                (SELECT id FROM public.chart_of_accounts 
                 WHERE tenant_id = tenant_id_param 
                 AND account_code = (
                     SELECT account_code FROM public.chart_of_accounts default_parent 
                     WHERE default_parent.id = default_accounts.parent_account_id
                 ))
            ELSE NULL
        END,
        level, allow_posting, is_active, opening_balance, current_balance
    FROM public.chart_of_accounts default_accounts
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
    ORDER BY level, account_code;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
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
    -- نسخ مراكز التكلفة الافتراضية
    INSERT INTO public.cost_centers (
        tenant_id, cost_center_code, cost_center_name, cost_center_name_en,
        cost_center_type, parent_cost_center_id, level, hierarchy_path,
        is_active, budget_amount, actual_spent
    )
    SELECT 
        tenant_id_param, cost_center_code, cost_center_name, cost_center_name_en,
        cost_center_type, 
        CASE 
            WHEN parent_cost_center_id IS NOT NULL THEN 
                (SELECT id FROM public.cost_centers 
                 WHERE tenant_id = tenant_id_param 
                 AND cost_center_code = (
                     SELECT cost_center_code FROM public.cost_centers default_parent 
                     WHERE default_parent.id = default_centers.parent_cost_center_id
                 ))
            ELSE NULL
        END,
        level, hierarchy_path, is_active, budget_amount, actual_spent
    FROM public.cost_centers default_centers
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
    ORDER BY level, cost_center_code;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.copy_default_company_branding(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ العلامة التجارية الافتراضية
    INSERT INTO public.company_branding (
        tenant_id, logo_url, primary_color, secondary_color,
        font_family, letter_head_template, invoice_template,
        report_template, created_by
    )
    SELECT 
        tenant_id_param, logo_url, primary_color, secondary_color,
        font_family, letter_head_template, invoice_template,
        report_template, auth.uid()
    FROM public.company_branding
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
    LIMIT 1;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;