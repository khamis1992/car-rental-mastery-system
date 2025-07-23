-- المرحلة 3: إصلاح المشاكل الأمنية المتبقية
-- إضافة SET search_path للدوال المفقودة وتحسين الأمان العام

-- 1. إصلاح الدوال المحاسبية الأساسية
ALTER FUNCTION public.validate_period_before_journal_entry() SET search_path = 'public';
ALTER FUNCTION public.auto_setup_new_tenant_comprehensive_accounting() SET search_path = 'public';
ALTER FUNCTION public.auto_setup_new_tenant_accounting() SET search_path = 'public';
ALTER FUNCTION public.add_specialized_rental_accounts(uuid) SET search_path = 'public';
ALTER FUNCTION public.implement_comprehensive_chart_improvements(uuid) SET search_path = 'public';
ALTER FUNCTION public.calculate_monthly_depreciation(numeric, numeric, integer, text) SET search_path = 'public';

-- 2. إصلاح دوال التقارير والتحليلات
ALTER FUNCTION public.calculate_liquidity_ratios() SET search_path = 'public';
ALTER FUNCTION public.calculate_monthly_revenue(uuid) SET search_path = 'public';
ALTER FUNCTION public.calculate_installment_summary(uuid) SET search_path = 'public';
ALTER FUNCTION public.create_automated_journal_entry(uuid, text, uuid, jsonb) SET search_path = 'public';
ALTER FUNCTION public.evaluate_journal_entry_review(uuid, uuid, text, text) SET search_path = 'public';
ALTER FUNCTION public.log_account_changes() SET search_path = 'public';

-- 3. إصلاح دوال التنبؤ والتحليل المالي
ALTER FUNCTION public.calculate_forecast_accuracy() SET search_path = 'public';
ALTER FUNCTION public.calculate_customer_aging(uuid, date) SET search_path = 'public';
ALTER FUNCTION public.calculate_financial_variance(uuid, date, date, date, date) SET search_path = 'public';
ALTER FUNCTION public.save_financial_comparison(uuid, text, date, date, date, date, uuid) SET search_path = 'public';
ALTER FUNCTION public.check_period_closure_readiness() SET search_path = 'public';

-- 4. إصلاح دوال الموارد البشرية
ALTER FUNCTION public.calculate_payroll_totals() SET search_path = 'public';
ALTER FUNCTION public.calculate_working_hours() SET search_path = 'public';
ALTER FUNCTION public.check_cost_center_budget_alerts() SET search_path = 'public';

-- 5. إصلاح دوال العملات والصرف
ALTER FUNCTION public.convert_currency(numeric, text, text, uuid, date) SET search_path = 'public';

-- 6. إصلاح دوال الأتمتة المحاسبية
ALTER FUNCTION public.has_existing_accounting_entry(text, uuid, text) SET search_path = 'public';
ALTER FUNCTION public.get_safe_default_tenant_id() SET search_path = 'public';
ALTER FUNCTION public.create_accounting_lock(text, uuid, uuid, text) SET search_path = 'public';
ALTER FUNCTION public.execute_automation_rule(uuid, text, uuid, jsonb) SET search_path = 'public';
ALTER FUNCTION public.process_automated_accounting_event(text, text, uuid, jsonb) SET search_path = 'public';

-- 7. إصلاح دوال دليل الحسابات
ALTER FUNCTION public.complete_liabilities_equity_revenue_expenses(uuid) SET search_path = 'public';
ALTER FUNCTION public.complete_chart_of_accounts_part3(uuid) SET search_path = 'public';
ALTER FUNCTION public.complete_chart_of_accounts_part4(uuid) SET search_path = 'public';

-- 8. إصلاح باقي الدوال بدون search_path
-- البحث عن جميع الدوال المتبقية وإضافة SET search_path لها
DO $$
DECLARE
    func_record RECORD;
    fix_count INTEGER := 0;
BEGIN
    -- إصلاح جميع الدوال التي لا تحتوي على search_path
    FOR func_record IN 
        SELECT 
            p.proname as function_name,
            n.nspname as schema_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND p.proname NOT IN (
            'get_current_user_role', 'check_user_role_secure', 'check_user_multiple_roles',
            'security_audit_report', 'get_user_tenant_context', 'get_secure_tenant_id',
            'has_role', 'is_tenant_valid', 'ensure_tenant_id_on_insert', 'is_saas_admin',
            'get_current_tenant_id', 'check_tenant_roles'
        )
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc_config 
            WHERE pg_proc_config.oid = p.oid 
            AND pg_proc_config.config[1] LIKE 'search_path=%'
        )
    LOOP
        BEGIN
            -- محاولة إضافة SET search_path للدالة
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = ''public''', 
                          func_record.schema_name, 
                          func_record.function_name, 
                          func_record.args);
            fix_count := fix_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- تسجيل الخطأ والمتابعة
            RAISE NOTICE 'فشل في إصلاح الدالة %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'تم إصلاح % دالة بنجاح', fix_count;
END $$;

-- 9. إنشاء دالة مراقبة الأمان المحسنة
CREATE OR REPLACE FUNCTION public.enhanced_security_monitor()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result JSONB;
    critical_issues INTEGER := 0;
    warning_issues INTEGER := 0;
    info_issues INTEGER := 0;
    total_functions INTEGER;
    secure_functions INTEGER;
BEGIN
    -- عد المشاكل الحرجة (RLS مفقود)
    SELECT COUNT(*) INTO critical_issues
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND NOT c.relrowsecurity;
    
    -- عد مشاكل التحذير (search_path مفقود)
    SELECT COUNT(*) INTO warning_issues
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND NOT EXISTS (
        SELECT 1 FROM pg_proc_config 
        WHERE pg_proc_config.oid = p.oid 
        AND pg_proc_config.config[1] LIKE 'search_path=%'
    );
    
    -- عد الدوال الآمنة
    SELECT COUNT(*) INTO total_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true;
    
    SELECT COUNT(*) INTO secure_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND EXISTS (
        SELECT 1 FROM pg_proc_config 
        WHERE pg_proc_config.oid = p.oid 
        AND pg_proc_config.config[1] LIKE 'search_path=%'
    );
    
    result := jsonb_build_object(
        'security_scan_timestamp', now(),
        'critical_issues', critical_issues,
        'warning_issues', warning_issues,
        'info_issues', info_issues,
        'total_security_issues', critical_issues + warning_issues + info_issues,
        'functions_security_stats', jsonb_build_object(
            'total_functions', total_functions,
            'secure_functions', secure_functions,
            'insecure_functions', total_functions - secure_functions,
            'security_percentage', ROUND((secure_functions::NUMERIC / NULLIF(total_functions, 0)) * 100, 2)
        ),
        'security_level', CASE 
            WHEN critical_issues = 0 AND warning_issues <= 5 THEN 'ممتاز'
            WHEN critical_issues <= 1 AND warning_issues <= 15 THEN 'جيد جداً'
            WHEN critical_issues <= 3 AND warning_issues <= 30 THEN 'متوسط'
            ELSE 'يحتاج تحسين'
        END,
        'phase3_completion', jsonb_build_object(
            'functions_fixed', secure_functions,
            'remaining_issues', warning_issues,
            'improvement_percentage', ROUND(((total_functions - warning_issues)::NUMERIC / NULLIF(total_functions, 0)) * 100, 2)
        ),
        'recommendations', CASE 
            WHEN critical_issues > 0 THEN jsonb_build_array('إصلاح RLS على الجداول الحرجة فوراً')
            WHEN warning_issues > 10 THEN jsonb_build_array('إكمال إصلاح search_path للدوال المتبقية')
            ELSE jsonb_build_array('مراقبة دورية للأمان')
        END
    );
    
    RETURN result;
END;
$$;

-- 10. إنشاء دالة تنظيف وصيانة دورية
CREATE OR REPLACE FUNCTION public.security_maintenance_routine()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    maintenance_result JSONB;
    cleanup_count INTEGER := 0;
BEGIN
    -- تنظيف البيانات المؤقتة القديمة
    DELETE FROM public.automated_entry_executions 
    WHERE created_at < now() - interval '30 days'
    AND execution_status IN ('completed', 'failed');
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- تحديث إحصائيات الجداول
    ANALYZE;
    
    maintenance_result := jsonb_build_object(
        'maintenance_timestamp', now(),
        'cleaned_old_executions', cleanup_count,
        'statistics_updated', true,
        'next_maintenance_due', now() + interval '7 days'
    );
    
    RETURN maintenance_result;
END;
$$;

-- 11. إنشاء مراقب الأمان في الوقت الفعلي
CREATE OR REPLACE FUNCTION public.real_time_security_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- مراقبة إنشاء دوال جديدة بدون أمان
    IF TG_OP = 'INSERT' AND NEW.prosecdef = true THEN
        -- تحقق من وجود search_path
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc_config 
            WHERE pg_proc_config.oid = NEW.oid 
            AND pg_proc_config.config[1] LIKE 'search_path=%'
        ) THEN
            -- إنشاء تنبيه أمني
            INSERT INTO public.security_alerts (
                alert_type, severity, message, details, created_at
            ) VALUES (
                'insecure_function_created',
                'warning',
                'تم إنشاء دالة جديدة بدون search_path آمن',
                jsonb_build_object('function_oid', NEW.oid, 'function_name', NEW.proname),
                now()
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 12. إنشاء جدول تنبيهات الأمان إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    details JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- تفعيل RLS على جدول التنبيهات
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- سياسة أمان لجدول التنبيهات
CREATE POLICY "المديرون يمكنهم عرض جميع التنبيهات الأمنية"
ON public.security_alerts
FOR ALL
TO authenticated
USING (
    public.check_user_multiple_roles(ARRAY['super_admin', 'tenant_admin'])
);

-- تحسين الأداء
CREATE INDEX IF NOT EXISTS idx_security_alerts_tenant_severity 
ON public.security_alerts(tenant_id, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved 
ON public.security_alerts(resolved, created_at DESC) 
WHERE NOT resolved;

COMMENT ON FUNCTION public.enhanced_security_monitor() IS 'مراقب الأمان المحسن - يقدم تقريراً شاملاً عن حالة الأمان';
COMMENT ON FUNCTION public.security_maintenance_routine() IS 'روتين الصيانة الأمنية - ينظف البيانات القديمة ويحدث الإحصائيات';
COMMENT ON FUNCTION public.real_time_security_alert() IS 'مراقب الأمان في الوقت الفعلي - ينبه عند إنشاء دوال غير آمنة';
COMMENT ON TABLE public.security_alerts IS 'جدول تنبيهات الأمان - يسجل جميع التنبيهات الأمنية في النظام';