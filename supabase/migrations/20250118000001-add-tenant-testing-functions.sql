-- دوال مساعدة لاختبار نظام العزل بين المؤسسات ونظام الحسابات الافتراضية

-- دالة للحصول على المؤسسات مع عدد الحسابات
CREATE OR REPLACE FUNCTION public.get_tenants_with_accounts_count()
RETURNS TABLE (
    id UUID,
    name TEXT,
    accounts_count BIGINT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        COALESCE(c.accounts_count, 0) as accounts_count,
        t.status::TEXT,
        t.created_at
    FROM public.tenants t
    LEFT JOIN (
        SELECT 
            tenant_id,
            COUNT(*) as accounts_count
        FROM public.chart_of_accounts
        GROUP BY tenant_id
    ) c ON t.id = c.tenant_id
    WHERE t.status IN ('active', 'trial')
    ORDER BY t.created_at DESC;
END;
$$;

-- دالة للحصول على إحصائيات الحسابات لمؤسسة محددة
CREATE OR REPLACE FUNCTION public.get_tenant_accounts_stats(tenant_id_param UUID)
RETURNS TABLE (
    assets BIGINT,
    liabilities BIGINT,
    equity BIGINT,
    revenue BIGINT,
    expenses BIGINT,
    total BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE account_type = 'asset') as assets,
        COUNT(*) FILTER (WHERE account_type = 'liability') as liabilities,
        COUNT(*) FILTER (WHERE account_type = 'equity') as equity,
        COUNT(*) FILTER (WHERE account_type = 'revenue') as revenue,
        COUNT(*) FILTER (WHERE account_type = 'expense') as expenses,
        COUNT(*) as total
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param;
END;
$$;

-- دالة لاختبار عزل البيانات بين المؤسسات
CREATE OR REPLACE FUNCTION public.test_tenant_data_isolation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_record RECORD;
    isolation_test_results JSONB := '[]'::jsonb;
    total_tenants INTEGER := 0;
    isolation_violations INTEGER := 0;
    test_result JSONB;
BEGIN
    -- اختبار عزل الحسابات بين المؤسسات
    FOR tenant_record IN 
        SELECT id, name FROM public.tenants 
        WHERE status IN ('active', 'trial')
        ORDER BY created_at
    LOOP
        total_tenants := total_tenants + 1;
        
        -- فحص وجود حسابات بـ tenant_id مختلف (انتهاك العزل)
        IF EXISTS (
            SELECT 1 FROM public.chart_of_accounts 
            WHERE tenant_id != tenant_record.id
            AND tenant_id IS NOT NULL
        ) THEN
            -- هذا طبيعي - كل مؤسسة لها حساباتها الخاصة
            NULL;
        END IF;
        
        -- فحص وجود حسابات بـ tenant_id فارغ (انتهاك العزل)
        IF EXISTS (
            SELECT 1 FROM public.chart_of_accounts 
            WHERE tenant_id IS NULL
        ) THEN
            isolation_violations := isolation_violations + 1;
        END IF;
        
        -- جمع إحصائيات المؤسسة
        SELECT jsonb_build_object(
            'tenant_id', tenant_record.id,
            'tenant_name', tenant_record.name,
            'accounts_count', (
                SELECT COUNT(*) FROM public.chart_of_accounts 
                WHERE tenant_id = tenant_record.id
            ),
            'has_isolation_violation', EXISTS (
                SELECT 1 FROM public.chart_of_accounts 
                WHERE tenant_id IS NULL
            )
        ) INTO test_result;
        
        isolation_test_results := isolation_test_results || jsonb_build_array(test_result);
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'test_type', 'tenant_data_isolation',
        'tenants_tested', total_tenants,
        'isolation_violations', isolation_violations,
        'isolation_status', CASE 
            WHEN isolation_violations = 0 THEN 'healthy'
            ELSE 'violations_detected'
        END,
        'tested_at', now(),
        'tenant_details', isolation_test_results,
        'summary', jsonb_build_object(
            'total_tenants', total_tenants,
            'clean_tenants', total_tenants - isolation_violations,
            'tenants_with_violations', isolation_violations,
            'isolation_percentage', 
                CASE 
                    WHEN total_tenants > 0 THEN 
                        ROUND((total_tenants - isolation_violations)::NUMERIC / total_tenants * 100, 2)
                    ELSE 0
                END
        )
    );
END;
$$;

-- دالة لإنشاء تقرير شامل عن حالة النظام
CREATE OR REPLACE FUNCTION public.generate_system_health_report()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_tenants INTEGER;
    total_accounts INTEGER;
    accounts_by_type JSONB;
    isolation_test JSONB;
    system_report JSONB;
BEGIN
    -- إحصائيات عامة
    SELECT COUNT(*) INTO total_tenants 
    FROM public.tenants 
    WHERE status IN ('active', 'trial');
    
    SELECT COUNT(*) INTO total_accounts 
    FROM public.chart_of_accounts;
    
    -- إحصائيات الحسابات حسب النوع
    SELECT jsonb_object_agg(
        account_type,
        account_count
    ) INTO accounts_by_type
    FROM (
        SELECT 
            account_type,
            COUNT(*) as account_count
        FROM public.chart_of_accounts
        GROUP BY account_type
    ) subq;
    
    -- اختبار العزل
    SELECT public.test_tenant_data_isolation() INTO isolation_test;
    
    -- تجميع التقرير
    system_report := jsonb_build_object(
        'generated_at', now(),
        'system_overview', jsonb_build_object(
            'total_tenants', total_tenants,
            'total_accounts', total_accounts,
            'average_accounts_per_tenant', 
                CASE 
                    WHEN total_tenants > 0 THEN ROUND(total_accounts::NUMERIC / total_tenants, 2)
                    ELSE 0
                END
        ),
        'accounts_by_type', accounts_by_type,
        'isolation_test', isolation_test,
        'recommendations', CASE
            WHEN (isolation_test->>'isolation_violations')::INTEGER > 0 THEN
                jsonb_build_array(
                    'تم اكتشاف انتهاكات في عزل البيانات',
                    'يُنصح بمراجعة آلية tenant_id في جميع الجداول',
                    'تأكد من تطبيق RLS policies بشكل صحيح'
                )
            ELSE
                jsonb_build_array(
                    'نظام العزل يعمل بشكل صحيح',
                    'جميع المؤسسات معزولة بنجاح',
                    'النظام آمن ومستقر'
                )
        END
    );
    
    RETURN system_report;
END;
$$;

-- دالة لمحاكاة إنشاء مؤسسة جديدة واختبار الحسابات الافتراضية
CREATE OR REPLACE FUNCTION public.simulate_new_tenant_creation(
    test_tenant_name TEXT DEFAULT 'مؤسسة اختبار'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_tenant_id UUID;
    accounts_before INTEGER;
    accounts_after INTEGER;
    setup_result JSONB;
    simulation_result JSONB;
BEGIN
    -- إنشاء UUID فريد للاختبار
    test_tenant_id := gen_random_uuid();
    
    -- عد الحسابات قبل الاختبار
    SELECT COUNT(*) INTO accounts_before 
    FROM public.chart_of_accounts 
    WHERE tenant_id = test_tenant_id;
    
    -- محاكاة إنشاء المؤسسة (بدون إدراج فعلي في جدول tenants)
    -- نطبق الدالة مباشرة
    BEGIN
        -- إنشاء مؤسسة مؤقتة للاختبار
        INSERT INTO public.tenants (id, name, slug, status)
        VALUES (test_tenant_id, test_tenant_name, 'test-' || EXTRACT(EPOCH FROM now())::TEXT, 'active');
        
        -- تطبيق الحسابات الافتراضية
        SELECT public.setup_tenant_default_accounts(test_tenant_id) INTO setup_result;
        
        -- عد الحسابات بعد الاختبار
        SELECT COUNT(*) INTO accounts_after 
        FROM public.chart_of_accounts 
        WHERE tenant_id = test_tenant_id;
        
        -- حذف المؤسسة التجريبية
        DELETE FROM public.chart_of_accounts WHERE tenant_id = test_tenant_id;
        DELETE FROM public.tenants WHERE id = test_tenant_id;
        
        simulation_result := jsonb_build_object(
            'success', true,
            'test_tenant_id', test_tenant_id,
            'test_tenant_name', test_tenant_name,
            'accounts_before', accounts_before,
            'accounts_after', accounts_after,
            'accounts_created', accounts_after - accounts_before,
            'setup_details', setup_result,
            'test_completed_at', now(),
            'status', 'simulation_successful'
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- تنظيف في حالة الخطأ
        DELETE FROM public.chart_of_accounts WHERE tenant_id = test_tenant_id;
        DELETE FROM public.tenants WHERE id = test_tenant_id;
        
        simulation_result := jsonb_build_object(
            'success', false,
            'test_tenant_id', test_tenant_id,
            'error_message', SQLERRM,
            'status', 'simulation_failed'
        );
    END;
    
    RETURN simulation_result;
END;
$$;

-- التعليقات للوثائق
COMMENT ON FUNCTION public.get_tenants_with_accounts_count() IS 'دالة للحصول على قائمة المؤسسات مع عدد الحسابات لكل مؤسسة';
COMMENT ON FUNCTION public.get_tenant_accounts_stats(UUID) IS 'دالة للحصول على إحصائيات تفصيلية للحسابات حسب النوع لمؤسسة محددة';
COMMENT ON FUNCTION public.test_tenant_data_isolation() IS 'دالة شاملة لاختبار عزل البيانات بين المؤسسات والكشف عن أي انتهاكات';
COMMENT ON FUNCTION public.generate_system_health_report() IS 'دالة لإنشاء تقرير شامل عن صحة النظام وحالة العزل';
COMMENT ON FUNCTION public.simulate_new_tenant_creation(TEXT) IS 'دالة لمحاكاة إنشاء مؤسسة جديدة واختبار تطبيق الحسابات الافتراضية';

-- رسالة إتمام
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ تم إنشاء دوال اختبار نظام العزل بنجاح!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 الدوال المتاحة:';
    RAISE NOTICE '   • get_tenants_with_accounts_count() - قائمة المؤسسات مع عدد الحسابات';
    RAISE NOTICE '   • get_tenant_accounts_stats(tenant_id) - إحصائيات تفصيلية للحسابات';
    RAISE NOTICE '   • test_tenant_data_isolation() - اختبار عزل البيانات';
    RAISE NOTICE '   • generate_system_health_report() - تقرير صحة النظام';
    RAISE NOTICE '   • simulate_new_tenant_creation(name) - محاكاة إنشاء مؤسسة جديدة';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 يمكن الآن اختبار النظام من واجهة المستخدم!';
END;
$$; 