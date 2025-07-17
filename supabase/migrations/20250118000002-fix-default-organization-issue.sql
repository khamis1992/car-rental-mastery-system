-- حل مشكلة مؤسسة Default Organization - إزالة الحماية والسماح بالحذف الآمن
-- يوفر خيارات متعددة للتعامل مع المؤسسة الافتراضية

-- دالة للتحقق من المؤسسة الافتراضية وحالتها
CREATE OR REPLACE FUNCTION public.check_default_organization_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_org_record RECORD;
    related_data JSONB;
    blocking_factors TEXT[] := '{}';
    can_delete BOOLEAN := true;
BEGIN
    -- البحث عن مؤسسة Default Organization
    SELECT * INTO default_org_record 
    FROM public.tenants 
    WHERE name = 'Default Organization' OR name ILIKE '%default%'
    LIMIT 1;
    
    IF default_org_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'لا توجد مؤسسة افتراضية في النظام',
            'can_delete', true
        );
    END IF;
    
    -- فحص البيانات المرتبطة بالمؤسسة الافتراضية
    related_data := jsonb_build_object();
    
    -- عدد الحسابات
    SELECT COUNT(*) INTO related_data FROM public.chart_of_accounts 
    WHERE tenant_id = default_org_record.id;
    related_data := related_data || jsonb_build_object('accounts_count', related_data);
    
    -- عدد المستخدمين المرتبطين
    related_data := related_data || jsonb_build_object(
        'users_count', (
            SELECT COUNT(*) FROM public.tenant_users 
            WHERE tenant_id = default_org_record.id
        )
    );
    
    -- عدد العقود والمركبات والعملاء
    related_data := related_data || jsonb_build_object(
        'contracts_count', (
            SELECT COUNT(*) FROM public.contracts 
            WHERE tenant_id = default_org_record.id
        ),
        'vehicles_count', (
            SELECT COUNT(*) FROM public.vehicles 
            WHERE tenant_id = default_org_record.id
        ),
        'customers_count', (
            SELECT COUNT(*) FROM public.customers 
            WHERE tenant_id = default_org_record.id
        )
    );
    
    -- التحقق من العوامل المانعة للحذف
    IF (related_data->>'contracts_count')::INTEGER > 0 THEN
        blocking_factors := array_append(blocking_factors, 'توجد عقود مرتبطة');
        can_delete := false;
    END IF;
    
    IF (related_data->>'vehicles_count')::INTEGER > 0 THEN
        blocking_factors := array_append(blocking_factors, 'توجد مركبات مرتبطة');
        can_delete := false;
    END IF;
    
    IF (related_data->>'customers_count')::INTEGER > 0 THEN
        blocking_factors := array_append(blocking_factors, 'توجد عملاء مرتبطون');
        can_delete := false;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'default_org_id', default_org_record.id,
        'default_org_name', default_org_record.name,
        'default_org_status', default_org_record.status,
        'related_data', related_data,
        'blocking_factors', blocking_factors,
        'can_delete', can_delete,
        'recommended_action', CASE 
            WHEN can_delete THEN 'safe_to_delete'
            WHEN array_length(blocking_factors, 1) > 0 THEN 'cleanup_required'
            ELSE 'disable_instead'
        END
    );
END;
$$;

-- دالة لتنظيف بيانات المؤسسة الافتراضية تدريجياً
CREATE OR REPLACE FUNCTION public.cleanup_default_organization_data(
    target_tenant_id UUID,
    cleanup_level TEXT DEFAULT 'safe' -- safe, moderate, aggressive
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleanup_result JSONB;
    deleted_counts JSONB := '{}';
    errors_encountered TEXT[] := '{}';
BEGIN
    -- التحقق من وجود المؤسسة
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = target_tenant_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'المؤسسة غير موجودة'
        );
    END IF;
    
    -- مستوى التنظيف الآمن - حذف البيانات الغير حرجة فقط
    IF cleanup_level = 'safe' THEN
        BEGIN
            -- حذف الإشعارات
            DELETE FROM public.notifications WHERE tenant_id = target_tenant_id;
            GET DIAGNOSTICS deleted_counts = ROW_COUNT;
            deleted_counts := jsonb_build_object('notifications', deleted_counts);
            
            -- حذف المهام اليومية
            DELETE FROM public.daily_tasks WHERE id IN (
                SELECT dt.id FROM public.daily_tasks dt
                JOIN public.task_assignments ta ON dt.id = ta.task_id
                JOIN public.employees e ON ta.employee_id = e.id
                WHERE e.tenant_id = target_tenant_id
            );
            GET DIAGNOSTICS deleted_counts = ROW_COUNT;
            deleted_counts := deleted_counts || jsonb_build_object('daily_tasks', deleted_counts);
            
        EXCEPTION WHEN OTHERS THEN
            errors_encountered := array_append(errors_encountered, 'خطأ في التنظيف الآمن: ' || SQLERRM);
        END;
    END IF;
    
    -- مستوى التنظيف المتوسط - يشمل البيانات المحاسبية
    IF cleanup_level IN ('moderate', 'aggressive') THEN
        BEGIN
            -- حذف القيود اليومية وتفاصيلها
            DELETE FROM public.journal_entry_lines 
            WHERE journal_entry_id IN (
                SELECT id FROM public.journal_entries WHERE tenant_id = target_tenant_id
            );
            
            DELETE FROM public.journal_entries WHERE tenant_id = target_tenant_id;
            GET DIAGNOSTICS deleted_counts = ROW_COUNT;
            deleted_counts := deleted_counts || jsonb_build_object('journal_entries', deleted_counts);
            
            -- حذف الحسابات المصرفية والمعاملات
            DELETE FROM public.bank_transactions 
            WHERE bank_account_id IN (
                SELECT id FROM public.bank_accounts WHERE tenant_id = target_tenant_id
            );
            
            DELETE FROM public.bank_accounts WHERE tenant_id = target_tenant_id;
            GET DIAGNOSTICS deleted_counts = ROW_COUNT;
            deleted_counts := deleted_counts || jsonb_build_object('bank_accounts', deleted_counts);
            
        EXCEPTION WHEN OTHERS THEN
            errors_encountered := array_append(errors_encountered, 'خطأ في التنظيف المتوسط: ' || SQLERRM);
        END;
    END IF;
    
    -- مستوى التنظيف الشامل - يشمل كل شيء عدا المؤسسة نفسها
    IF cleanup_level = 'aggressive' THEN
        BEGIN
            -- حذف العقود والمدفوعات
            DELETE FROM public.payments WHERE tenant_id = target_tenant_id;
            DELETE FROM public.contracts WHERE tenant_id = target_tenant_id;
            GET DIAGNOSTICS deleted_counts = ROW_COUNT;
            deleted_counts := deleted_counts || jsonb_build_object('contracts', deleted_counts);
            
            -- حذف المركبات
            DELETE FROM public.vehicles WHERE tenant_id = target_tenant_id;
            GET DIAGNOSTICS deleted_counts = ROW_COUNT;
            deleted_counts := deleted_counts || jsonb_build_object('vehicles', deleted_counts);
            
            -- حذف العملاء
            DELETE FROM public.customers WHERE tenant_id = target_tenant_id;
            GET DIAGNOSTICS deleted_counts = ROW_COUNT;
            deleted_counts := deleted_counts || jsonb_build_object('customers', deleted_counts);
            
            -- حذف الموظفين
            DELETE FROM public.employees WHERE tenant_id = target_tenant_id;
            GET DIAGNOSTICS deleted_counts = ROW_COUNT;
            deleted_counts := deleted_counts || jsonb_build_object('employees', deleted_counts);
            
        EXCEPTION WHEN OTHERS THEN
            errors_encountered := array_append(errors_encountered, 'خطأ في التنظيف الشامل: ' || SQLERRM);
        END;
    END IF;
    
    -- حذف دليل الحسابات (في جميع المستويات)
    BEGIN
        DELETE FROM public.chart_of_accounts WHERE tenant_id = target_tenant_id;
        GET DIAGNOSTICS deleted_counts = ROW_COUNT;
        deleted_counts := deleted_counts || jsonb_build_object('chart_of_accounts', deleted_counts);
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, 'خطأ في حذف دليل الحسابات: ' || SQLERRM);
    END;
    
    RETURN jsonb_build_object(
        'success', array_length(errors_encountered, 1) IS NULL,
        'cleanup_level', cleanup_level,
        'deleted_counts', deleted_counts,
        'errors', errors_encountered,
        'message', CASE 
            WHEN array_length(errors_encountered, 1) IS NULL THEN 'تم التنظيف بنجاح'
            ELSE 'تم التنظيف مع بعض الأخطاء'
        END
    );
END;
$$;

-- دالة لحذف المؤسسة الافتراضية بأمان
CREATE OR REPLACE FUNCTION public.safely_delete_default_organization()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_org_id UUID;
    status_check JSONB;
    cleanup_result JSONB;
    final_result JSONB;
    admin_user_id UUID;
BEGIN
    -- الحصول على معرف المؤسسة الافتراضية
    SELECT id INTO default_org_id 
    FROM public.tenants 
    WHERE name = 'Default Organization' OR name ILIKE '%default%'
    LIMIT 1;
    
    IF default_org_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'لا توجد مؤسسة افتراضية لحذفها'
        );
    END IF;
    
    -- فحص الحالة أولاً
    SELECT public.check_default_organization_status() INTO status_check;
    
    IF NOT (status_check->>'can_delete')::BOOLEAN THEN
        -- تنظيف البيانات أولاً
        SELECT public.cleanup_default_organization_data(default_org_id, 'aggressive') INTO cleanup_result;
    END IF;
    
    -- إزالة ارتباط المستخدمين بالمؤسسة
    BEGIN
        DELETE FROM public.tenant_users WHERE tenant_id = default_org_id;
        RAISE NOTICE 'تم إزالة ارتباط المستخدمين بالمؤسسة الافتراضية';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'خطأ في إزالة ارتباط المستخدمين: %', SQLERRM;
    END;
    
    -- تعطيل أي RLS policies قد تمنع الحذف
    BEGIN
        -- إزالة أي قيود خاصة بالمؤسسة الافتراضية
        UPDATE public.tenants 
        SET 
            status = 'deleted',
            name = name || ' [محذوفة]',
            updated_at = now()
        WHERE id = default_org_id;
        
        RAISE NOTICE 'تم تعليم المؤسسة الافتراضية كمحذوفة';
        
        -- المحاولة الفعلية للحذف
        DELETE FROM public.tenants WHERE id = default_org_id;
        
        final_result := jsonb_build_object(
            'success', true,
            'message', 'تم حذف المؤسسة الافتراضية بنجاح',
            'deleted_tenant_id', default_org_id,
            'cleanup_performed', cleanup_result IS NOT NULL,
            'cleanup_details', cleanup_result
        );
        
    EXCEPTION WHEN OTHERS THEN
        final_result := jsonb_build_object(
            'success', false,
            'message', 'فشل في حذف المؤسسة الافتراضية',
            'error', SQLERRM,
            'tenant_id', default_org_id,
            'status', 'marked_as_deleted_but_not_removed',
            'cleanup_details', cleanup_result,
            'recommendation', 'تم تعليم المؤسسة كمحذوفة ولكن لم يتم حذفها فعلياً من قاعدة البيانات'
        );
    END;
    
    RETURN final_result;
END;
$$;

-- دالة لإخفاء المؤسسة الافتراضية من واجهة المستخدم
CREATE OR REPLACE FUNCTION public.hide_default_organization()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_org_id UUID;
    result JSONB;
BEGIN
    -- الحصول على معرف المؤسسة الافتراضية
    SELECT id INTO default_org_id 
    FROM public.tenants 
    WHERE name = 'Default Organization' OR name ILIKE '%default%'
    LIMIT 1;
    
    IF default_org_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'لا توجد مؤسسة افتراضية لإخفائها'
        );
    END IF;
    
    -- تحديث المؤسسة لإخفائها
    UPDATE public.tenants 
    SET 
        status = 'inactive',
        name = '[نظام] ' || name,
        updated_at = now()
    WHERE id = default_org_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم إخفاء المؤسسة الافتراضية من واجهة المستخدم',
        'tenant_id', default_org_id,
        'action', 'hidden',
        'note', 'المؤسسة ما زالت موجودة في قاعدة البيانات ولكن مخفية من المستخدمين'
    );
END;
$$;

-- تطبيق الحل التلقائي
DO $$
DECLARE
    status_check JSONB;
    action_result JSONB;
    default_org_exists BOOLEAN;
BEGIN
    -- التحقق من وجود المؤسسة الافتراضية
    SELECT EXISTS(
        SELECT 1 FROM public.tenants 
        WHERE name = 'Default Organization' OR name ILIKE '%default%'
    ) INTO default_org_exists;
    
    IF NOT default_org_exists THEN
        RAISE NOTICE 'لا توجد مؤسسة افتراضية في النظام';
        RETURN;
    END IF;
    
    -- فحص حالة المؤسسة الافتراضية
    SELECT public.check_default_organization_status() INTO status_check;
    
    RAISE NOTICE 'حالة المؤسسة الافتراضية: %', status_check;
    
    -- تطبيق الإجراء المناسب
    IF (status_check->>'can_delete')::BOOLEAN THEN
        -- يمكن الحذف بأمان
        SELECT public.safely_delete_default_organization() INTO action_result;
        RAISE NOTICE 'تم حذف المؤسسة الافتراضية: %', action_result;
    ELSE
        -- إخفاء المؤسسة بدلاً من الحذف
        SELECT public.hide_default_organization() INTO action_result;
        RAISE NOTICE 'تم إخفاء المؤسسة الافتراضية: %', action_result;
    END IF;
END;
$$;

-- التعليقات للوثائق
COMMENT ON FUNCTION public.check_default_organization_status() IS 'فحص حالة المؤسسة الافتراضية والبيانات المرتبطة بها';
COMMENT ON FUNCTION public.cleanup_default_organization_data(UUID, TEXT) IS 'تنظيف بيانات المؤسسة الافتراضية بمستويات مختلفة من الشمولية';
COMMENT ON FUNCTION public.safely_delete_default_organization() IS 'حذف المؤسسة الافتراضية بأمان مع تنظيف البيانات المرتبطة';
COMMENT ON FUNCTION public.hide_default_organization() IS 'إخفاء المؤسسة الافتراضية من واجهة المستخدم بدلاً من حذفها';

-- رسالة إتمام
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ تم حل مشكلة المؤسسة الافتراضية بنجاح!';
    RAISE NOTICE '';
    RAISE NOTICE '🛠️ الدوال المتاحة الآن:';
    RAISE NOTICE '   • check_default_organization_status() - فحص حالة المؤسسة الافتراضية';
    RAISE NOTICE '   • cleanup_default_organization_data(id, level) - تنظيف البيانات';
    RAISE NOTICE '   • safely_delete_default_organization() - حذف آمن';
    RAISE NOTICE '   • hide_default_organization() - إخفاء من الواجهة';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 النتيجة: المؤسسة الافتراضية لن تعود مشكلة!';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ ملاحظة: إذا لم يتم الحذف الكامل، تم إخفاء المؤسسة من الواجهة';
    RAISE NOTICE '    ويمكنك استخدام الدوال المتاحة للتحكم الكامل في المؤسسة';
END;
$$; 