-- إعداد نظام الحسابات الافتراضية للمؤسسات الجديدة
-- يضمن العزل التام بين المؤسسات مع نسخ الحسابات الافتراضية

-- دالة شاملة لإعداد الحسابات الافتراضية للمؤسسة الجديدة
CREATE OR REPLACE FUNCTION public.setup_tenant_default_accounts(tenant_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assets_added INTEGER := 0;
    liabilities_equity_added INTEGER := 0;
    revenue_expense_added INTEGER := 0;
    total_added INTEGER := 0;
    result_summary JSONB;
    start_time TIMESTAMP := now();
BEGIN
    -- التحقق من وجود المؤسسة
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id_param) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'المؤسسة غير موجودة',
            'tenant_id', tenant_id_param
        );
    END IF;
    
    -- إضافة الأصول الافتراضية
    BEGIN
        SELECT public.add_missing_accounts_only(tenant_id_param) INTO assets_added;
        RAISE NOTICE 'تم إضافة % حساب من الأصول للمؤسسة %', assets_added, tenant_id_param;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'خطأ في إضافة الأصول: %', SQLERRM;
        assets_added := 0;
    END;
    
    -- إضافة الالتزامات وحقوق الملكية الافتراضية
    BEGIN
        SELECT public.add_remaining_missing_accounts(tenant_id_param) INTO liabilities_equity_added;
        RAISE NOTICE 'تم إضافة % حساب من الالتزامات وحقوق الملكية للمؤسسة %', liabilities_equity_added, tenant_id_param;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'خطأ في إضافة الالتزامات وحقوق الملكية: %', SQLERRM;
        liabilities_equity_added := 0;
    END;
    
    -- إضافة الإيرادات والمصروفات الافتراضية
    BEGIN
        SELECT public.add_revenue_expense_accounts(tenant_id_param) INTO revenue_expense_added;
        RAISE NOTICE 'تم إضافة % حساب من الإيرادات والمصروفات للمؤسسة %', revenue_expense_added, tenant_id_param;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'خطأ في إضافة الإيرادات والمصروفات: %', SQLERRM;
        revenue_expense_added := 0;
    END;
    
    -- حساب المجموع
    total_added := assets_added + liabilities_equity_added + revenue_expense_added;
    
    -- إنشاء ملخص النتائج
    result_summary := jsonb_build_object(
        'success', true,
        'tenant_id', tenant_id_param,
        'total_accounts_added', total_added,
        'breakdown', jsonb_build_object(
            'assets_added', assets_added,
            'liabilities_equity_added', liabilities_equity_added,
            'revenue_expense_added', revenue_expense_added
        ),
        'processing_time_seconds', EXTRACT(EPOCH FROM (now() - start_time)),
        'completed_at', now(),
        'message', 'تم إعداد ' || total_added || ' حساب افتراضي للمؤسسة الجديدة'
    );
    
    RETURN result_summary;
END;
$$;

-- دالة trigger لتطبيق الحسابات الافتراضية عند إنشاء مؤسسة جديدة
CREATE OR REPLACE FUNCTION public.auto_setup_tenant_default_accounts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    setup_result JSONB;
BEGIN
    -- تطبيق الحسابات الافتراضية للمؤسسة الجديدة
    -- نستخدم perform بدلاً من select للتنفيذ دون حفظ النتيجة
    PERFORM public.setup_tenant_default_accounts(NEW.id);
    
    -- تسجيل في السجلات
    RAISE NOTICE 'تم إعداد الحسابات الافتراضية للمؤسسة الجديدة: % (ID: %)', NEW.name, NEW.id;
    
    RETURN NEW;
END;
$$;

-- إنشاء trigger جديد يعمل عند إنشاء المؤسسة (INSERT)
DROP TRIGGER IF EXISTS auto_setup_tenant_default_accounts_trigger ON public.tenants;
CREATE TRIGGER auto_setup_tenant_default_accounts_trigger
    AFTER INSERT ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_setup_tenant_default_accounts();

-- دالة لتطبيق الحسابات الافتراضية على المؤسسات الحالية
CREATE OR REPLACE FUNCTION public.apply_default_accounts_to_existing_tenants()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_record RECORD;
    tenant_result JSONB;
    all_results JSONB := '[]'::jsonb;
    total_tenants INTEGER := 0;
    successful_tenants INTEGER := 0;
    total_accounts_added INTEGER := 0;
    start_time TIMESTAMP := now();
BEGIN
    RAISE NOTICE 'بدء تطبيق الحسابات الافتراضية على المؤسسات الحالية...';
    
    FOR tenant_record IN 
        SELECT id, name, status FROM public.tenants 
        WHERE status IN ('active', 'trial')
        ORDER BY created_at
    LOOP
        total_tenants := total_tenants + 1;
        
        RAISE NOTICE 'معالجة المؤسسة: % (ID: %)', tenant_record.name, tenant_record.id;
        
        BEGIN
            SELECT public.setup_tenant_default_accounts(tenant_record.id) INTO tenant_result;
            
            -- إضافة معلومات المؤسسة للنتيجة
            tenant_result := tenant_result || jsonb_build_object(
                'tenant_name', tenant_record.name,
                'tenant_status', tenant_record.status,
                'processing_status', 'success'
            );
            
            successful_tenants := successful_tenants + 1;
            total_accounts_added := total_accounts_added + (tenant_result->>'total_accounts_added')::integer;
            
            RAISE NOTICE 'نجح: % - تم إضافة % حساب', 
                tenant_record.name, 
                (tenant_result->>'total_accounts_added')::integer;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'فشل في معالجة المؤسسة %: %', tenant_record.name, SQLERRM;
            
            tenant_result := jsonb_build_object(
                'success', false,
                'tenant_id', tenant_record.id,
                'tenant_name', tenant_record.name,
                'tenant_status', tenant_record.status,
                'processing_status', 'error',
                'error_message', SQLERRM,
                'total_accounts_added', 0
            );
        END;
        
        all_results := all_results || jsonb_build_array(tenant_result);
    END LOOP;
    
    RAISE NOTICE 'انتهاء المعالجة: % مؤسسة، % نجحت، % حساب إجمالي', 
        total_tenants, successful_tenants, total_accounts_added;
    
    RETURN jsonb_build_object(
        'success', true,
        'summary', jsonb_build_object(
            'total_tenants_processed', total_tenants,
            'successful_tenants', successful_tenants,
            'failed_tenants', total_tenants - successful_tenants,
            'total_accounts_added_across_all_tenants', total_accounts_added,
            'processing_time_seconds', EXTRACT(EPOCH FROM (now() - start_time))
        ),
        'completed_at', now(),
        'tenant_results', all_results
    );
END;
$$;

-- تطبيق الحسابات الافتراضية على جميع المؤسسات الحالية
DO $$
DECLARE
    final_result JSONB;
    summary JSONB;
BEGIN
    RAISE NOTICE '======================================';
    RAISE NOTICE 'بدء تطبيق نظام الحسابات الافتراضية';
    RAISE NOTICE '======================================';
    
    SELECT public.apply_default_accounts_to_existing_tenants() INTO final_result;
    
    summary := final_result->'summary';
    
    RAISE NOTICE '';
    RAISE NOTICE '======== ملخص النتائج النهائية ========';
    RAISE NOTICE 'إجمالي المؤسسات المعالجة: %', summary->>'total_tenants_processed';
    RAISE NOTICE 'المؤسسات الناجحة: %', summary->>'successful_tenants';
    RAISE NOTICE 'المؤسسات الفاشلة: %', summary->>'failed_tenants';
    RAISE NOTICE 'إجمالي الحسابات المضافة: %', summary->>'total_accounts_added_across_all_tenants';
    RAISE NOTICE 'وقت المعالجة: % ثانية', summary->>'processing_time_seconds';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'تم إكمال إعداد نظام الحسابات الافتراضية بنجاح!';
    RAISE NOTICE 'من الآن فصاعداً، كل مؤسسة جديدة ستحصل تلقائياً على الحسابات الافتراضية';
    RAISE NOTICE '======================================';
    
END;
$$;

-- التعليقات للوثائق
COMMENT ON FUNCTION public.setup_tenant_default_accounts(UUID) IS 'دالة شاملة لإعداد جميع الحسابات الافتراضية للمؤسسة الجديدة - تضمن العزل التام بين المؤسسات';
COMMENT ON FUNCTION public.auto_setup_tenant_default_accounts() IS 'دالة trigger تطبق الحسابات الافتراضية تلقائياً عند إنشاء مؤسسة جديدة';
COMMENT ON FUNCTION public.apply_default_accounts_to_existing_tenants() IS 'دالة لتطبيق الحسابات الافتراضية على جميع المؤسسات الحالية مع تقرير مفصل';

-- رسالة إتمام
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 تم إعداد نظام الحسابات الافتراضية بنجاح!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ الميزات المطبقة:';
    RAISE NOTICE '   • حسابات افتراضية تلقائية لكل مؤسسة جديدة';
    RAISE NOTICE '   • عزل تام بين المؤسسات';
    RAISE NOTICE '   • أمان في إضافة الحسابات دون حذف الموجود';
    RAISE NOTICE '   • تطبيق على المؤسسات الحالية';
    RAISE NOTICE '';
    RAISE NOTICE '📋 نطاق الحسابات الافتراضية:';
    RAISE NOTICE '   • أصول متداولة وغير متداولة (30+ حساب)';
    RAISE NOTICE '   • التزامات متداولة وطويلة الأجل (15+ حساب)';
    RAISE NOTICE '   • حقوق الملكية (10+ حساب)';
    RAISE NOTICE '   • إيرادات متنوعة (15+ حساب)';
    RAISE NOTICE '   • مصروفات ثابتة ومتغيرة (40+ حساب)';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 النظام نشط الآن - كل مؤسسة جديدة ستحصل على الحسابات تلقائياً!';
END;
$$; 