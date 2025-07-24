-- تحديث باقي الدوال لتضمين SET search_path

-- تحديث validate_period_before_journal_entry
CREATE OR REPLACE FUNCTION public.validate_period_before_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    period_status jsonb;
BEGIN
    -- التحقق من حالة الفترة المالية
    SELECT public.check_period_status(NEW.entry_date) INTO period_status;
    
    -- إذا كانت الفترة مقفلة أو غير قابلة للتعديل
    IF NOT (period_status->>'can_modify')::boolean THEN
        RAISE EXCEPTION 'لا يمكن إضافة أو تعديل القيود في هذه الفترة: %', period_status->>'message';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- تحديث auto_setup_new_tenant_comprehensive_accounting
CREATE OR REPLACE FUNCTION public.auto_setup_new_tenant_comprehensive_accounting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    accounts_created INTEGER := 0;
    additional_accounts INTEGER := 0;
BEGIN
    -- تطبيق دليل الحسابات الشامل للمؤسسة الجديدة
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        SELECT public.setup_comprehensive_chart_of_accounts(NEW.id) INTO accounts_created;
        SELECT public.complete_liabilities_equity_revenue_expenses(NEW.id) INTO additional_accounts;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- تحديث auto_setup_new_tenant_accounting
CREATE OR REPLACE FUNCTION public.auto_setup_new_tenant_accounting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- تطبيق البيانات المحاسبية الافتراضية للمؤسسة الجديدة
  IF NEW.status = 'active' AND NEW.name != 'Default Organization' THEN
    PERFORM setup_tenant_default_accounting_data(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- تحديث add_specialized_rental_accounts
CREATE OR REPLACE FUNCTION public.add_specialized_rental_accounts(tenant_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    
    -- إضافة حسابات متخصصة لتأجير السيارات
    
    -- 1. حسابات العمولات والخصومات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '43';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '43101', 'عمولات وسطاء', 'Broker Commissions', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '43102', 'رسوم التأخير', 'Late Fees', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '43103', 'رسوم الإلغاء', 'Cancellation Fees', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0);
    
    -- 2. حسابات مخصصات الصيانة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '215', 'مخصصات الصيانة', 'Maintenance Provisions', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '215';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21501', 'مخصص صيانة سيارات', 'Vehicle Maintenance Provision', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21502', 'مخصص إطارات وبطاريات', 'Tires and Batteries Provision', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- 3. حسابات التقسيط والسداد
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11203', 'أقساط مستحقة القبض', 'Installments Receivable', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    inserted_count := 7;
    
    RETURN inserted_count;
END;
$function$;

-- تحديث calculate_forecast_accuracy
CREATE OR REPLACE FUNCTION public.calculate_forecast_accuracy()
RETURNS TABLE(forecast_type text, avg_accuracy numeric, forecast_count integer)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ff.forecast_type,
    AVG(
      CASE 
        WHEN ff.current_value > 0 THEN 
          100 - ABS(ff.predicted_value - ff.current_value) / ff.current_value * 100
        ELSE 0 
      END
    ) as avg_accuracy,
    COUNT(*)::INTEGER as forecast_count
  FROM public.financial_forecasts ff
  WHERE ff.current_value IS NOT NULL
    AND ff.forecast_period <= CURRENT_DATE
  GROUP BY ff.forecast_type;
END;
$function$;

-- تحديث calculate_financial_variance
CREATE OR REPLACE FUNCTION public.calculate_financial_variance(tenant_id_param uuid, base_start_date date, base_end_date date, comparison_start_date date, comparison_end_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    base_data JSONB;
    comparison_data JSONB;
    variance_result JSONB;
BEGIN
    -- حساب البيانات الأساسية
    SELECT jsonb_build_object(
        'revenue', COALESCE(SUM(CASE WHEN coa.account_type = 'revenue' THEN coa.current_balance ELSE 0 END), 0),
        'expenses', COALESCE(SUM(CASE WHEN coa.account_type = 'expense' THEN coa.current_balance ELSE 0 END), 0),
        'assets', COALESCE(SUM(CASE WHEN coa.account_type = 'asset' THEN coa.current_balance ELSE 0 END), 0),
        'liabilities', COALESCE(SUM(CASE WHEN coa.account_type = 'liability' THEN coa.current_balance ELSE 0 END), 0)
    ) INTO base_data
    FROM public.chart_of_accounts coa
    WHERE coa.tenant_id = tenant_id_param
    AND coa.is_active = true;

    -- حساب بيانات المقارنة (نفس البيانات حالياً - يمكن تطويرها لاحقاً)
    comparison_data := base_data;

    -- حساب التباين
    variance_result := jsonb_build_object(
        'base_period', jsonb_build_object(
            'start_date', base_start_date,
            'end_date', base_end_date,
            'data', base_data
        ),
        'comparison_period', jsonb_build_object(
            'start_date', comparison_start_date,
            'end_date', comparison_end_date,
            'data', comparison_data
        ),
        'variance', jsonb_build_object(
            'revenue', (comparison_data->>'revenue')::NUMERIC - (base_data->>'revenue')::NUMERIC,
            'expenses', (comparison_data->>'expenses')::NUMERIC - (base_data->>'expenses')::NUMERIC,
            'assets', (comparison_data->>'assets')::NUMERIC - (base_data->>'assets')::NUMERIC,
            'liabilities', (comparison_data->>'liabilities')::NUMERIC - (base_data->>'liabilities')::NUMERIC
        )
    );

    RETURN variance_result;
END;
$function$;

-- تحديث save_financial_comparison
CREATE OR REPLACE FUNCTION public.save_financial_comparison(tenant_id_param uuid, comparison_name_param text, base_start date, base_end date, comp_start date, comp_end date, created_by_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    comparison_id UUID;
    comparison_data JSONB;
BEGIN
    -- حساب بيانات المقارنة
    SELECT public.calculate_financial_variance(
        tenant_id_param, base_start, base_end, comp_start, comp_end
    ) INTO comparison_data;

    -- حفظ المقارنة
    INSERT INTO public.financial_comparisons (
        tenant_id, comparison_name, base_period_start, base_period_end,
        comparison_period_start, comparison_period_end, comparison_data, created_by
    ) VALUES (
        tenant_id_param, comparison_name_param, base_start, base_end,
        comp_start, comp_end, comparison_data, created_by_param
    ) RETURNING id INTO comparison_id;

    RETURN comparison_id;
END;
$function$;

-- تحديث check_cost_center_budget_alerts
CREATE OR REPLACE FUNCTION public.check_cost_center_budget_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    budget_usage_percentage DECIMAL(5,2);
    alert_threshold DECIMAL(5,2);
BEGIN
    -- حساب نسبة استخدام الميزانية
    IF NEW.budget_amount > 0 THEN
        budget_usage_percentage := (NEW.actual_spent / NEW.budget_amount) * 100;
        
        -- تحقق من التنبيهات المختلفة
        IF budget_usage_percentage >= 100 THEN
            -- تجاوز الميزانية
            INSERT INTO public.cost_center_budget_alerts (
                cost_center_id, alert_type, threshold_percentage, 
                current_spent, budget_amount, alert_message, tenant_id
            ) VALUES (
                NEW.id, 'budget_exceeded', budget_usage_percentage,
                NEW.actual_spent, NEW.budget_amount,
                'تم تجاوز ميزانية مركز التكلفة: ' || NEW.cost_center_name,
                NEW.tenant_id
            );
        ELSIF budget_usage_percentage >= 90 THEN
            -- تحذير حرج
            INSERT INTO public.cost_center_budget_alerts (
                cost_center_id, alert_type, threshold_percentage, 
                current_spent, budget_amount, alert_message, tenant_id
            ) VALUES (
                NEW.id, 'budget_critical', budget_usage_percentage,
                NEW.actual_spent, NEW.budget_amount,
                'تحذير حرج: وصل مركز التكلفة إلى 90% من الميزانية',
                NEW.tenant_id
            );
        ELSIF budget_usage_percentage >= 75 THEN
            -- تحذير عادي
            INSERT INTO public.cost_center_budget_alerts (
                cost_center_id, alert_type, threshold_percentage, 
                current_spent, budget_amount, alert_message, tenant_id
            ) VALUES (
                NEW.id, 'budget_warning', budget_usage_percentage,
                NEW.actual_spent, NEW.budget_amount,
                'تحذير: وصل مركز التكلفة إلى 75% من الميزانية',
                NEW.tenant_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- تحديث get_safe_default_tenant_id
CREATE OR REPLACE FUNCTION public.get_safe_default_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.tenants WHERE status = 'active' ORDER BY created_at LIMIT 1;
$function$;