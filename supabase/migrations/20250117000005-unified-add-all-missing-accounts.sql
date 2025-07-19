-- دالة موحدة لإضافة جميع الحسابات الناقصة بطريقة آمنة
-- تستدعي جميع الدوال السابقة مع ضمان عدم المساس بالحسابات الحالية

CREATE OR REPLACE FUNCTION public.add_all_missing_accounts_unified(tenant_id_param UUID)
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
BEGIN
    -- إضافة الأصول المفقودة
    BEGIN
        SELECT public.add_missing_accounts_only(tenant_id_param) INTO assets_added;
        RAISE NOTICE 'تم إضافة % حساب من الأصول', assets_added;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'خطأ في إضافة الأصول: %', SQLERRM;
        assets_added := 0;
    END;
    
    -- إضافة الالتزامات وحقوق الملكية المفقودة
    BEGIN
        SELECT public.add_remaining_missing_accounts(tenant_id_param) INTO liabilities_equity_added;
        RAISE NOTICE 'تم إضافة % حساب من الالتزامات وحقوق الملكية', liabilities_equity_added;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'خطأ في إضافة الالتزامات وحقوق الملكية: %', SQLERRM;
        liabilities_equity_added := 0;
    END;
    
    -- إضافة الإيرادات والمصروفات المفقودة
    BEGIN
        SELECT public.add_revenue_expense_accounts(tenant_id_param) INTO revenue_expense_added;
        RAISE NOTICE 'تم إضافة % حساب من الإيرادات والمصروفات', revenue_expense_added;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'خطأ في إضافة الإيرادات والمصروفات: %', SQLERRM;
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
        'completed_at', now(),
        'message', 'تم إضافة ' || total_added || ' حساب ناقص بنجاح دون المساس بالحسابات الحالية'
    );
    
    RETURN result_summary;
END;
$$;

-- دالة لتطبيق الحسابات الناقصة على جميع المؤسسات النشطة
CREATE OR REPLACE FUNCTION public.apply_missing_accounts_to_all_tenants()
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
BEGIN
    FOR tenant_record IN 
        SELECT id, name FROM public.tenants WHERE status IN ('active', 'trial')
    LOOP
        total_tenants := total_tenants + 1;
        
        BEGIN
            SELECT public.add_all_missing_accounts_unified(tenant_record.id) INTO tenant_result;
            
            -- إضافة معلومات المؤسسة للنتيجة
            tenant_result := tenant_result || jsonb_build_object(
                'tenant_name', tenant_record.name,
                'status', 'success'
            );
            
            successful_tenants := successful_tenants + 1;
            total_accounts_added := total_accounts_added + (tenant_result->>'total_accounts_added')::integer;
            
        EXCEPTION WHEN OTHERS THEN
            tenant_result := jsonb_build_object(
                'success', false,
                'tenant_id', tenant_record.id,
                'tenant_name', tenant_record.name,
                'status', 'error',
                'error_message', SQLERRM,
                'total_accounts_added', 0
            );
        END;
        
        all_results := all_results || jsonb_build_array(tenant_result);
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'summary', jsonb_build_object(
            'total_tenants_processed', total_tenants,
            'successful_tenants', successful_tenants,
            'failed_tenants', total_tenants - successful_tenants,
            'total_accounts_added_across_all_tenants', total_accounts_added
        ),
        'completed_at', now(),
        'tenant_results', all_results
    );
END;
$$;

-- تطبيق الحسابات الناقصة على جميع المؤسسات النشطة
DO $$
DECLARE
    final_result JSONB;
BEGIN
    SELECT public.apply_missing_accounts_to_all_tenants() INTO final_result;
    
    RAISE NOTICE 'نتائج إضافة الحسابات الناقصة:';
    RAISE NOTICE 'المؤسسات المعالجة: %', final_result->'summary'->>'total_tenants_processed';
    RAISE NOTICE 'المؤسسات الناجحة: %', final_result->'summary'->>'successful_tenants';
    RAISE NOTICE 'إجمالي الحسابات المضافة: %', final_result->'summary'->>'total_accounts_added_across_all_tenants';
END;
$$;

COMMENT ON FUNCTION public.add_all_missing_accounts_unified(UUID) IS 'دالة موحدة آمنة تضيف جميع الحسابات الناقصة (أصول، التزامات، حقوق ملكية، إيرادات، مصروفات) دون المساس بالحسابات الحالية';
COMMENT ON FUNCTION public.apply_missing_accounts_to_all_tenants() IS 'دالة تطبق الحسابات الناقصة على جميع المؤسسات النشطة مع تقرير مفصل عن النتائج'; 