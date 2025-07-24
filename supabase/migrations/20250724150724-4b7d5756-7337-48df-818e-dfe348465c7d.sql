-- المجموعة الثانية: إصلاح الدالات من 21 إلى 40 (20 دالة أخرى)

-- 1. get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    user_context jsonb;
    user_tenant_id uuid;
    user_role text;
    user_permissions jsonb;
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
    
    -- الحصول على أحدث معلومات المستخدم والمؤسسة
    SELECT 
        tu.tenant_id,
        tu.role,
        jsonb_build_object(
            'can_manage_users', CASE WHEN tu.role IN ('super_admin', 'tenant_admin') THEN true ELSE false END,
            'can_manage_accounting', CASE WHEN tu.role IN ('super_admin', 'tenant_admin', 'accountant') THEN true ELSE false END,
            'can_manage_vehicles', CASE WHEN tu.role IN ('super_admin', 'tenant_admin', 'manager') THEN true ELSE false END,
            'can_view_reports', CASE WHEN tu.role IN ('super_admin', 'tenant_admin', 'manager', 'accountant') THEN true ELSE false END,
            'can_manage_contracts', CASE WHEN tu.role IN ('super_admin', 'tenant_admin', 'manager') THEN true ELSE false END
        ) as permissions
    INTO user_tenant_id, user_role, user_permissions
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    ORDER BY tu.created_at DESC
    LIMIT 1;
    
    user_context := jsonb_build_object(
        'user_id', current_user_id,
        'tenant_id', user_tenant_id,
        'role', user_role,
        'permissions', COALESCE(user_permissions, '{}'::jsonb)
    );
    
    RETURN user_context;
END;
$function$;

-- 2. get_current_tenant_id
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
    
    -- الحصول على معرف المؤسسة للمستخدم الحالي
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    ORDER BY tu.created_at DESC
    LIMIT 1;
    
    RETURN tenant_id;
END;
$function$;

-- 3. calculate_monthly_performance
CREATE OR REPLACE FUNCTION public.calculate_monthly_performance(target_year integer, target_month integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    performance_id uuid;
    current_tenant_id uuid;
    total_revenue numeric := 0;
    total_expenses numeric := 0;
    active_vehicles integer := 0;
    active_contracts integer := 0;
    occupancy_rate numeric := 0;
    net_profit numeric := 0;
    performance_date date;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    performance_date := make_date(target_year, target_month, 1);
    
    -- حساب إجمالي الإيرادات للشهر
    SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue
    FROM public.invoices
    WHERE tenant_id = current_tenant_id
    AND EXTRACT(YEAR FROM invoice_date) = target_year
    AND EXTRACT(MONTH FROM invoice_date) = target_month
    AND status = 'paid';
    
    -- حساب إجمالي المصروفات للشهر
    SELECT COALESCE(SUM(jel.debit_amount), 0) INTO total_expenses
    FROM public.journal_entry_lines jel
    INNER JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    INNER JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
    WHERE jel.tenant_id = current_tenant_id
    AND coa.account_type = 'expense'
    AND EXTRACT(YEAR FROM je.entry_date) = target_year
    AND EXTRACT(MONTH FROM je.entry_date) = target_month;
    
    -- عدد المركبات النشطة
    SELECT COUNT(*) INTO active_vehicles
    FROM public.vehicles
    WHERE tenant_id = current_tenant_id
    AND status = 'available';
    
    -- عدد العقود النشطة
    SELECT COUNT(*) INTO active_contracts
    FROM public.contracts
    WHERE tenant_id = current_tenant_id
    AND status = 'active';
    
    -- حساب معدل الإشغال
    IF active_vehicles > 0 THEN
        occupancy_rate := (active_contracts::numeric / active_vehicles::numeric) * 100;
    END IF;
    
    -- صافي الربح
    net_profit := total_revenue - total_expenses;
    
    -- إدراج أو تحديث السجل
    INSERT INTO public.monthly_performance (
        tenant_id,
        performance_month,
        total_revenue,
        total_expenses,
        net_profit,
        active_vehicles,
        active_contracts,
        occupancy_rate
    ) VALUES (
        current_tenant_id,
        performance_date,
        total_revenue,
        total_expenses,
        net_profit,
        active_vehicles,
        active_contracts,
        occupancy_rate
    )
    ON CONFLICT (tenant_id, performance_month) 
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        net_profit = EXCLUDED.net_profit,
        active_vehicles = EXCLUDED.active_vehicles,
        active_contracts = EXCLUDED.active_contracts,
        occupancy_rate = EXCLUDED.occupancy_rate,
        updated_at = now()
    RETURNING id INTO performance_id;
    
    RETURN performance_id;
END;
$function$;

-- 4. calculate_financial_kpis
CREATE OR REPLACE FUNCTION public.calculate_financial_kpis(for_date date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    total_revenue numeric := 0;
    total_expenses numeric := 0;
    total_assets numeric := 0;
    total_liabilities numeric := 0;
    kpis_count integer := 0;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- حساب المؤشرات المالية الأساسية
    SELECT 
        COALESCE(SUM(CASE WHEN coa.account_type = 'revenue' THEN coa.current_balance ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coa.account_type = 'expense' THEN coa.current_balance ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coa.account_type = 'asset' THEN coa.current_balance ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coa.account_type = 'liability' THEN coa.current_balance ELSE 0 END), 0)
    INTO total_revenue, total_expenses, total_assets, total_liabilities
    FROM public.chart_of_accounts coa
    WHERE coa.tenant_id = current_tenant_id
    AND coa.is_active = true;
    
    -- إدراج المؤشرات المالية
    INSERT INTO public.financial_kpis (
        tenant_id,
        kpi_date,
        revenue_growth_rate,
        profit_margin,
        return_on_assets,
        debt_to_equity_ratio,
        current_ratio
    ) VALUES (
        current_tenant_id,
        for_date,
        0, -- يتم حسابها لاحقاً بالمقارنة مع الفترة السابقة
        CASE WHEN total_revenue > 0 THEN ((total_revenue - total_expenses) / total_revenue) * 100 ELSE 0 END,
        CASE WHEN total_assets > 0 THEN ((total_revenue - total_expenses) / total_assets) * 100 ELSE 0 END,
        CASE WHEN total_assets > 0 THEN (total_liabilities / total_assets) * 100 ELSE 0 END,
        CASE WHEN total_liabilities > 0 THEN total_assets / total_liabilities ELSE 0 END
    )
    ON CONFLICT (tenant_id, kpi_date) 
    DO UPDATE SET
        profit_margin = EXCLUDED.profit_margin,
        return_on_assets = EXCLUDED.return_on_assets,
        debt_to_equity_ratio = EXCLUDED.debt_to_equity_ratio,
        current_ratio = EXCLUDED.current_ratio,
        updated_at = now();
    
    GET DIAGNOSTICS kpis_count = ROW_COUNT;
    RETURN kpis_count;
END;
$function$;

-- 5. create_depreciation_entries
CREATE OR REPLACE FUNCTION public.create_depreciation_entries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    vehicle_record record;
    monthly_depreciation numeric;
    journal_entry_id uuid;
    journal_entry_number text;
    entries_count integer := 0;
    
    -- معرفات الحسابات
    depreciation_expense_account uuid;
    accumulated_depreciation_account uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على معرفات حسابات الإهلاك
    SELECT id INTO depreciation_expense_account 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '514';
    
    SELECT id INTO accumulated_depreciation_account 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '1221';
    
    -- التحقق من وجود الحسابات
    IF depreciation_expense_account IS NULL OR accumulated_depreciation_account IS NULL THEN
        RAISE EXCEPTION 'حسابات الإهلاك غير موجودة في دليل الحسابات';
    END IF;
    
    -- حلقة على جميع المركبات النشطة
    FOR vehicle_record IN 
        SELECT id, make_model, purchase_price, depreciation_rate
        FROM public.vehicles
        WHERE tenant_id = current_tenant_id
        AND status IN ('available', 'rented')
        AND purchase_price > 0
        AND depreciation_rate > 0
    LOOP
        -- حساب الإهلاك الشهري
        monthly_depreciation := (vehicle_record.purchase_price * vehicle_record.depreciation_rate / 100) / 12;
        
        -- تخطي إذا كان الإهلاك صفر
        IF monthly_depreciation <= 0 THEN
            CONTINUE;
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
            'إهلاك شهري - ' || vehicle_record.make_model,
            'depreciation',
            vehicle_record.id,
            monthly_depreciation,
            monthly_depreciation,
            'posted',
            auth.uid(),
            current_tenant_id
        ) RETURNING id INTO journal_entry_id;
        
        -- سطر الإهلاك (مدين)
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
            depreciation_expense_account,
            'إهلاك شهري - ' || vehicle_record.make_model,
            monthly_depreciation,
            0,
            1,
            current_tenant_id
        );
        
        -- سطر مجمع الإهلاك (دائن)
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
            accumulated_depreciation_account,
            'مجمع إهلاك - ' || vehicle_record.make_model,
            0,
            monthly_depreciation,
            2,
            current_tenant_id
        );
        
        entries_count := entries_count + 1;
    END LOOP;
    
    RETURN entries_count;
END;
$function$;

-- 6. generate_journal_entry_number
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
    
    -- الحصول على الرقم التالي
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ '^JE-' || current_year || '-[0-9]+$' 
            THEN CAST(SUBSTRING(entry_number FROM '[0-9]+$') AS INTEGER)
            ELSE 0 
        END
    ), 0) + 1
    INTO next_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- تنسيق الرقم
    formatted_number := 'JE-' || current_year || '-' || LPAD(next_number::text, 6, '0');
    
    RETURN formatted_number;
END;
$function$;

-- 7. copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- استخدام دليل الحسابات الصحيح والشامل
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    RETURN inserted_count;
END;
$function$;

-- 8. copy_default_cost_centers
CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إنشاء مراكز التكلفة الافتراضية
    INSERT INTO public.cost_centers (
        tenant_id,
        cost_center_code,
        cost_center_name,
        cost_center_type,
        level,
        hierarchy_path,
        budget_amount,
        actual_spent,
        is_active
    ) VALUES
    (tenant_id_param, 'CC001', 'الإدارة العامة', 'administrative', 1, 'CC001', 0, 0, true),
    (tenant_id_param, 'CC002', 'إدارة المركبات', 'operational', 1, 'CC002', 0, 0, true),
    (tenant_id_param, 'CC003', 'المبيعات والتسويق', 'revenue', 1, 'CC003', 0, 0, true),
    (tenant_id_param, 'CC004', 'الصيانة والخدمات', 'support', 1, 'CC004', 0, 0, true);
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

-- 9. copy_default_company_branding
CREATE OR REPLACE FUNCTION public.copy_default_company_branding(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إنشاء العلامة التجارية الافتراضية
    INSERT INTO public.company_branding (
        tenant_id,
        company_name,
        logo_url,
        primary_color,
        secondary_color,
        font_family,
        address,
        phone,
        email,
        website
    ) VALUES (
        tenant_id_param,
        'شركة تأجير السيارات',
        NULL,
        '#2563eb',
        '#64748b',
        'Cairo, sans-serif',
        'الكويت',
        '+965 XXXX XXXX',
        'info@company.com',
        'www.company.com'
    );
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

-- 10. create_contract_accounting_entry
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(contract_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    contract_amount NUMERIC;
    contract_reference TEXT;
    customer_name TEXT;
    
    -- معرفات الحسابات
    receivables_account UUID;
    revenue_account UUID;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- استخراج البيانات
    contract_amount := (contract_data->>'monthly_rate')::NUMERIC;
    contract_reference := contract_data->>'contract_number';
    customer_name := contract_data->>'customer_name';
    
    -- الحصول على معرفات الحسابات
    SELECT id INTO receivables_account 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '1121';
    
    SELECT id INTO revenue_account 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '411';
    
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
        'عقد إيجار - ' || customer_name || ' - ' || contract_reference,
        'contract',
        (contract_data->>'contract_id')::UUID,
        contract_amount,
        contract_amount,
        'posted',
        auth.uid(),
        current_tenant_id
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطور القيد
    -- الذمم المدينة (مدين)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
    ) VALUES (
        journal_entry_id, receivables_account, 'ذمم عميل - ' || customer_name, contract_amount, 0, 1, current_tenant_id
    );
    
    -- إيرادات الإيجار (دائن)
    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
    ) VALUES (
        journal_entry_id, revenue_account, 'إيرادات إيجار - ' || customer_name, 0, contract_amount, 2, current_tenant_id
    );
    
    RETURN journal_entry_id;
END;
$function$;