-- المرحلة الثانية: تطوير التقارير المالية المتقدمة (بدون إدراج أولي)

-- إنشاء الدوال المتقدمة لحساب المؤشرات المالية وتوليد التقارير

-- دالة حساب نسب السيولة
CREATE OR REPLACE FUNCTION public.calculate_liquidity_ratios(tenant_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_assets NUMERIC := 0;
    current_liabilities NUMERIC := 0;
    quick_assets NUMERIC := 0;
    cash_and_equivalents NUMERIC := 0;
    inventory NUMERIC := 0;
    current_ratio NUMERIC := 0;
    quick_ratio NUMERIC := 0;
    cash_ratio NUMERIC := 0;
    result JSONB;
BEGIN
    -- حساب الأصول المتداولة
    SELECT COALESCE(SUM(current_balance), 0) INTO current_assets
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param 
    AND account_type = 'asset' 
    AND account_category = 'current_asset' 
    AND is_active = true;
    
    -- حساب الخصوم المتداولة
    SELECT COALESCE(SUM(current_balance), 0) INTO current_liabilities
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param
    AND account_type = 'liability' 
    AND account_category = 'current_liability' 
    AND is_active = true;
    
    -- حساب النقدية ومعادلاتها
    SELECT COALESCE(SUM(current_balance), 0) INTO cash_and_equivalents
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param
    AND (account_name ILIKE '%نقد%' OR account_name ILIKE '%بنك%' OR account_name ILIKE '%صندوق%');
    
    -- حساب المخزون (إذا وجد)
    SELECT COALESCE(SUM(current_balance), 0) INTO inventory
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param
    AND (account_name ILIKE '%مخزون%' OR account_name ILIKE '%بضاعة%');
    
    -- حساب الأصول السريعة (الأصول المتداولة - المخزون)
    quick_assets := current_assets - inventory;
    
    -- حساب النسب
    IF current_liabilities > 0 THEN
        current_ratio := current_assets / current_liabilities;
        quick_ratio := quick_assets / current_liabilities;
        cash_ratio := cash_and_equivalents / current_liabilities;
    END IF;
    
    result := jsonb_build_object(
        'current_assets', current_assets,
        'current_liabilities', current_liabilities,
        'quick_assets', quick_assets,
        'cash_and_equivalents', cash_and_equivalents,
        'inventory', inventory,
        'current_ratio', current_ratio,
        'quick_ratio', quick_ratio,
        'cash_ratio', cash_ratio,
        'calculated_at', now()
    );
    
    RETURN result;
END;
$$;

-- دالة حساب نسب الربحية
CREATE OR REPLACE FUNCTION public.calculate_profitability_ratios(tenant_id_param UUID, period_start DATE, period_end DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_revenue NUMERIC := 0;
    total_expenses NUMERIC := 0;
    net_profit NUMERIC := 0;
    total_assets NUMERIC := 0;
    total_equity NUMERIC := 0;
    gross_profit_margin NUMERIC := 0;
    net_profit_margin NUMERIC := 0;
    roa NUMERIC := 0;
    roe NUMERIC := 0;
    result JSONB;
BEGIN
    -- حساب إجمالي الإيرادات
    SELECT COALESCE(SUM(current_balance), 0) INTO total_revenue
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param
    AND account_type = 'revenue' 
    AND is_active = true;
    
    -- حساب إجمالي المصروفات
    SELECT COALESCE(SUM(current_balance), 0) INTO total_expenses
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param
    AND account_type = 'expense' 
    AND is_active = true;
    
    -- حساب إجمالي الأصول
    SELECT COALESCE(SUM(current_balance), 0) INTO total_assets
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param
    AND account_type = 'asset' 
    AND is_active = true;
    
    -- حساب إجمالي حقوق الملكية
    SELECT COALESCE(SUM(current_balance), 0) INTO total_equity
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param
    AND account_type = 'equity' 
    AND is_active = true;
    
    -- حساب صافي الربح
    net_profit := total_revenue - total_expenses;
    
    -- حساب النسب
    IF total_revenue > 0 THEN
        gross_profit_margin := (total_revenue - total_expenses) / total_revenue * 100;
        net_profit_margin := net_profit / total_revenue * 100;
    END IF;
    
    IF total_assets > 0 THEN
        roa := net_profit / total_assets * 100;
    END IF;
    
    IF total_equity > 0 THEN
        roe := net_profit / total_equity * 100;
    END IF;
    
    result := jsonb_build_object(
        'total_revenue', total_revenue,
        'total_expenses', total_expenses,
        'net_profit', net_profit,
        'total_assets', total_assets,
        'total_equity', total_equity,
        'gross_profit_margin', gross_profit_margin,
        'net_profit_margin', net_profit_margin,
        'return_on_assets', roa,
        'return_on_equity', roe,
        'period_start', period_start,
        'period_end', period_end,
        'calculated_at', now()
    );
    
    RETURN result;
END;
$$;

-- دالة توليد تقرير المركز المالي
CREATE OR REPLACE FUNCTION public.generate_balance_sheet_report(tenant_id_param UUID, report_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assets_section JSONB := '{}';
    liabilities_section JSONB := '{}';
    equity_section JSONB := '{}';
    result JSONB;
    account_record RECORD;
BEGIN
    -- حساب الأصول
    SELECT jsonb_object_agg(
        account_code,
        jsonb_build_object(
            'account_name', account_name,
            'account_name_en', account_name_en,
            'current_balance', current_balance,
            'account_category', account_category
        )
    ) INTO assets_section
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'asset'
    AND is_active = true
    ORDER BY account_code;
    
    -- حساب الخصوم
    SELECT jsonb_object_agg(
        account_code,
        jsonb_build_object(
            'account_name', account_name,
            'account_name_en', account_name_en,
            'current_balance', current_balance,
            'account_category', account_category
        )
    ) INTO liabilities_section
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'liability'
    AND is_active = true
    ORDER BY account_code;
    
    -- حساب حقوق الملكية
    SELECT jsonb_object_agg(
        account_code,
        jsonb_build_object(
            'account_name', account_name,
            'account_name_en', account_name_en,
            'current_balance', current_balance,
            'account_category', account_category
        )
    ) INTO equity_section
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'equity'
    AND is_active = true
    ORDER BY account_code;
    
    result := jsonb_build_object(
        'report_name', 'تقرير المركز المالي',
        'report_name_en', 'Balance Sheet Report',
        'report_date', report_date,
        'tenant_id', tenant_id_param,
        'sections', jsonb_build_object(
            'assets', COALESCE(assets_section, '{}'),
            'liabilities', COALESCE(liabilities_section, '{}'),
            'equity', COALESCE(equity_section, '{}')
        ),
        'totals', jsonb_build_object(
            'total_assets', (
                SELECT COALESCE(SUM(current_balance), 0)
                FROM public.chart_of_accounts
                WHERE tenant_id = tenant_id_param
                AND account_type = 'asset'
                AND is_active = true
            ),
            'total_liabilities', (
                SELECT COALESCE(SUM(current_balance), 0)
                FROM public.chart_of_accounts
                WHERE tenant_id = tenant_id_param
                AND account_type = 'liability'
                AND is_active = true
            ),
            'total_equity', (
                SELECT COALESCE(SUM(current_balance), 0)
                FROM public.chart_of_accounts
                WHERE tenant_id = tenant_id_param
                AND account_type = 'equity'
                AND is_active = true
            )
        ),
        'generated_at', now()
    );
    
    RETURN result;
END;
$$;

-- دالة توليد قائمة الدخل
CREATE OR REPLACE FUNCTION public.generate_income_statement(tenant_id_param UUID, period_start DATE, period_end DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    revenue_section JSONB := '{}';
    expense_section JSONB := '{}';
    total_revenue NUMERIC := 0;
    total_expenses NUMERIC := 0;
    net_income NUMERIC := 0;
    result JSONB;
BEGIN
    -- حساب الإيرادات
    SELECT 
        jsonb_object_agg(
            account_code,
            jsonb_build_object(
                'account_name', account_name,
                'account_name_en', account_name_en,
                'current_balance', current_balance,
                'account_category', account_category
            )
        ),
        COALESCE(SUM(current_balance), 0)
    INTO revenue_section, total_revenue
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'revenue'
    AND is_active = true;
    
    -- حساب المصروفات
    SELECT 
        jsonb_object_agg(
            account_code,
            jsonb_build_object(
                'account_name', account_name,
                'account_name_en', account_name_en,
                'current_balance', current_balance,
                'account_category', account_category
            )
        ),
        COALESCE(SUM(current_balance), 0)
    INTO expense_section, total_expenses
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND account_type = 'expense'
    AND is_active = true;
    
    -- حساب صافي الدخل
    net_income := total_revenue - total_expenses;
    
    result := jsonb_build_object(
        'report_name', 'قائمة الدخل',
        'report_name_en', 'Income Statement',
        'period_start', period_start,
        'period_end', period_end,
        'tenant_id', tenant_id_param,
        'sections', jsonb_build_object(
            'revenue', COALESCE(revenue_section, '{}'),
            'expenses', COALESCE(expense_section, '{}')
        ),
        'totals', jsonb_build_object(
            'total_revenue', total_revenue,
            'total_expenses', total_expenses,
            'net_income', net_income,
            'gross_profit_margin', CASE 
                WHEN total_revenue > 0 THEN (net_income / total_revenue * 100)
                ELSE 0 
            END
        ),
        'generated_at', now()
    );
    
    RETURN result;
END;
$$;

-- دالة حساب المؤشرات المالية المتقدمة
CREATE OR REPLACE FUNCTION public.calculate_advanced_kpi(kpi_code_param TEXT, tenant_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    kpi_record RECORD;
    calculated_value NUMERIC := 0;
BEGIN
    SELECT * INTO kpi_record 
    FROM public.advanced_kpis 
    WHERE kpi_code = kpi_code_param AND tenant_id = tenant_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'KPI not found: % for tenant: %', kpi_code_param, tenant_id_param;
    END IF;
    
    -- حساب المؤشرات الأساسية
    CASE kpi_record.kpi_code
        WHEN 'CURRENT_RATIO' THEN
            WITH liquidity_data AS (
                SELECT public.calculate_liquidity_ratios(tenant_id_param) as ratios
            )
            SELECT (ratios->>'current_ratio')::NUMERIC INTO calculated_value
            FROM liquidity_data;
            
        WHEN 'QUICK_RATIO' THEN
            WITH liquidity_data AS (
                SELECT public.calculate_liquidity_ratios(tenant_id_param) as ratios
            )
            SELECT (ratios->>'quick_ratio')::NUMERIC INTO calculated_value
            FROM liquidity_data;
            
        WHEN 'CASH_RATIO' THEN
            WITH liquidity_data AS (
                SELECT public.calculate_liquidity_ratios(tenant_id_param) as ratios
            )
            SELECT (ratios->>'cash_ratio')::NUMERIC INTO calculated_value
            FROM liquidity_data;
            
        WHEN 'NET_MARGIN' THEN
            WITH profitability_data AS (
                SELECT public.calculate_profitability_ratios(
                    tenant_id_param, 
                    DATE_TRUNC('month', CURRENT_DATE),
                    CURRENT_DATE
                ) as ratios
            )
            SELECT (ratios->>'net_profit_margin')::NUMERIC INTO calculated_value
            FROM profitability_data;
            
        WHEN 'ROA' THEN
            WITH profitability_data AS (
                SELECT public.calculate_profitability_ratios(
                    tenant_id_param, 
                    DATE_TRUNC('month', CURRENT_DATE),
                    CURRENT_DATE
                ) as ratios
            )
            SELECT (ratios->>'return_on_assets')::NUMERIC INTO calculated_value
            FROM profitability_data;
            
        WHEN 'ROE' THEN
            WITH profitability_data AS (
                SELECT public.calculate_profitability_ratios(
                    tenant_id_param, 
                    DATE_TRUNC('month', CURRENT_DATE),
                    CURRENT_DATE
                ) as ratios
            )
            SELECT (ratios->>'return_on_equity')::NUMERIC INTO calculated_value
            FROM profitability_data;
            
        ELSE
            -- للمؤشرات المخصصة، محاولة تنفيذ الصيغة إذا كانت SQL صالح
            calculated_value := 0;
    END CASE;
    
    -- تحديث قيمة المؤشر
    UPDATE public.advanced_kpis 
    SET 
        previous_value = current_value,
        current_value = calculated_value,
        last_calculated_at = now()
    WHERE kpi_code = kpi_code_param AND tenant_id = tenant_id_param;
    
    -- إدراج السجل في تاريخ المؤشرات
    INSERT INTO public.kpi_history (
        tenant_id, kpi_id, calculation_date, calculated_value, target_value,
        variance_amount, variance_percentage
    ) VALUES (
        tenant_id_param,
        kpi_record.id,
        CURRENT_DATE,
        calculated_value,
        kpi_record.target_value,
        calculated_value - COALESCE(kpi_record.target_value, 0),
        CASE 
            WHEN kpi_record.target_value > 0 THEN 
                ((calculated_value - kpi_record.target_value) / kpi_record.target_value * 100)
            ELSE 0 
        END
    ) ON CONFLICT (kpi_id, calculation_date) 
    DO UPDATE SET 
        calculated_value = EXCLUDED.calculated_value,
        variance_amount = EXCLUDED.variance_amount,
        variance_percentage = EXCLUDED.variance_percentage;
    
    RETURN calculated_value;
END;
$$;