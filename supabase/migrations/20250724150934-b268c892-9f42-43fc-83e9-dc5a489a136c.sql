-- المجموعة الثانية: إصلاح 10 دالات مع حذف صريح أولاً

-- 1. حذف الدالات الموجودة مع كل التوقيعات المحتملة
DROP FUNCTION IF EXISTS public.calculate_financial_kpis(date);
DROP FUNCTION IF EXISTS public.calculate_financial_kpis();
DROP FUNCTION IF EXISTS public.calculate_monthly_performance(integer, integer);
DROP FUNCTION IF EXISTS public.calculate_monthly_performance();
DROP FUNCTION IF EXISTS public.create_depreciation_entries();
DROP FUNCTION IF EXISTS public.generate_journal_entry_number();
DROP FUNCTION IF EXISTS public.copy_default_chart_of_accounts(uuid);
DROP FUNCTION IF EXISTS public.copy_default_cost_centers(uuid);
DROP FUNCTION IF EXISTS public.copy_default_company_branding(uuid);
DROP FUNCTION IF EXISTS public.create_contract_accounting_entry(jsonb);

-- 2. إعادة إنشاء الدالات مع search_path آمن

-- calculate_monthly_performance
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

-- calculate_financial_kpis
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

-- create_depreciation_entries
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

-- generate_journal_entry_number
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

-- copy_default_chart_of_accounts
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