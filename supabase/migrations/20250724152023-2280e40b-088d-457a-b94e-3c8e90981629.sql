-- إصلاح دوال Supabase إضافية - الدفعة الرابعة (حذف وإعادة إنشاء)
-- إضافة SET search_path TO 'public' لجعل الدوال غير قابلة للتغيير

-- حذف الدوال القديمة أولاً
DROP FUNCTION IF EXISTS public.log_user_activity(text, text);
DROP FUNCTION IF EXISTS public.copy_default_company_branding(uuid);
DROP FUNCTION IF EXISTS public.copy_default_cost_centers(uuid);
DROP FUNCTION IF EXISTS public.copy_default_chart_of_accounts(uuid);

-- إصلاح دالة get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    current_user_id uuid;
    tenant_info jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', jsonb_build_object()
        );
    END IF;
    
    -- الحصول على معلومات المؤسسة والدور
    SELECT jsonb_build_object(
        'tenant_id', tu.tenant_id,
        'role', tu.role,
        'status', tu.status
    ) INTO tenant_info
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id
    AND tu.status = 'active'
    LIMIT 1;
    
    -- إذا لم نجد في tenant_users، نحاول tenant_user_roles
    IF tenant_info IS NULL THEN
        SELECT jsonb_build_object(
            'tenant_id', tur.tenant_id,
            'role', tur.role,
            'status', tur.status
        ) INTO tenant_info
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = current_user_id
        AND tur.status = 'active'
        LIMIT 1;
    END IF;
    
    -- بناء الصلاحيات حسب الدور
    user_context := jsonb_build_object(
        'user_id', current_user_id,
        'tenant_id', COALESCE(tenant_info->>'tenant_id', null),
        'role', COALESCE(tenant_info->>'role', 'user'),
        'permissions', CASE 
            WHEN tenant_info->>'role' = 'super_admin' THEN jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_tenants', true
            )
            WHEN tenant_info->>'role' = 'tenant_admin' THEN jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_tenants', false
            )
            WHEN tenant_info->>'role' = 'manager' THEN jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', false,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true,
                'can_manage_tenants', false
            )
            WHEN tenant_info->>'role' = 'accountant' THEN jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', false,
                'can_view_reports', true,
                'can_manage_contracts', false,
                'can_manage_tenants', false
            )
            ELSE jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false,
                'can_manage_tenants', false
            )
        END
    );
    
    RETURN user_context;
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
        RETURN null;
    END IF;
    
    -- محاولة الحصول على tenant_id من tenant_users
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    LIMIT 1;
    
    -- إذا لم نجد، نحاول من tenant_user_roles
    IF tenant_id IS NULL THEN
        SELECT tur.tenant_id INTO tenant_id
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = current_user_id 
        AND tur.status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$function$;

-- إعادة إنشاء دالة log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_user_id IS NOT NULL AND current_tenant_id IS NOT NULL THEN
        INSERT INTO public.user_activity_logs (
            user_id, tenant_id, activity_type, description
        ) VALUES (
            current_user_id, current_tenant_id, activity_type, description
        );
    END IF;
END;
$function$;

-- إعادة إنشاء دالة copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    default_account RECORD;
    new_account_id UUID;
    account_mapping JSONB := '{}';
BEGIN
    -- نسخ الحسابات من المؤسسة الافتراضية
    FOR default_account IN 
        SELECT * FROM public.chart_of_accounts 
        WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1)
        ORDER BY level, account_code
    LOOP
        -- إنشاء الحساب الجديد
        INSERT INTO public.chart_of_accounts (
            tenant_id, account_code, account_name, account_name_en, 
            account_type, account_category, level, parent_account_id,
            allow_posting, is_active, opening_balance, current_balance
        ) VALUES (
            tenant_id_param, 
            default_account.account_code,
            default_account.account_name,
            default_account.account_name_en,
            default_account.account_type,
            default_account.account_category,
            default_account.level,
            CASE 
                WHEN default_account.parent_account_id IS NOT NULL 
                THEN (account_mapping->>default_account.parent_account_id::text)::UUID
                ELSE NULL 
            END,
            default_account.allow_posting,
            default_account.is_active,
            0, -- opening_balance
            0  -- current_balance
        ) RETURNING id INTO new_account_id;
        
        -- حفظ الربط بين الحساب القديم والجديد
        account_mapping := jsonb_set(
            account_mapping, 
            ARRAY[default_account.id::text], 
            to_jsonb(new_account_id::text)
        );
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$function$;

-- إعادة إنشاء دالة copy_default_cost_centers
CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    default_cost_center RECORD;
BEGIN
    -- نسخ مراكز التكلفة من المؤسسة الافتراضية
    FOR default_cost_center IN 
        SELECT cost_center_code, cost_center_name, cost_center_type, 
               budget_amount, is_active
        FROM public.cost_centers 
        WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1)
    LOOP
        INSERT INTO public.cost_centers (
            tenant_id, cost_center_code, cost_center_name, 
            cost_center_type, budget_amount, is_active
        ) VALUES (
            tenant_id_param,
            default_cost_center.cost_center_code,
            default_cost_center.cost_center_name,
            default_cost_center.cost_center_type,
            default_cost_center.budget_amount,
            default_cost_center.is_active
        );
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$function$;

-- إعادة إنشاء دالة copy_default_company_branding
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
    
    IF default_branding IS NOT NULL THEN
        INSERT INTO public.company_branding (
            tenant_id, primary_color, secondary_color, accent_color,
            company_name_ar, company_name_en, logo_url, letterhead_url
        ) VALUES (
            tenant_id_param,
            default_branding.primary_color,
            default_branding.secondary_color,
            default_branding.accent_color,
            default_branding.company_name_ar,
            default_branding.company_name_en,
            default_branding.logo_url,
            default_branding.letterhead_url
        );
    END IF;
END;
$function$;