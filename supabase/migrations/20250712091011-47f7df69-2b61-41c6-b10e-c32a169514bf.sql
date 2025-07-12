-- إنشاء دالة الحذف النهائي للمؤسسات
CREATE OR REPLACE FUNCTION public.hard_delete_tenant(tenant_id_param uuid, deletion_reason text DEFAULT 'حذف نهائي من قبل المدير')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    tenant_record RECORD;
    deleted_counts JSONB := '{}';
    total_deleted INTEGER := 0;
BEGIN
    -- التحقق من وجود المؤسسة
    SELECT name, slug, status INTO tenant_record
    FROM public.tenants 
    WHERE id = tenant_id_param;
    
    IF tenant_record.name IS NULL THEN
        RAISE EXCEPTION 'المؤسسة غير موجودة';
    END IF;
    
    -- منع حذف المؤسسات النشطة
    IF tenant_record.status = 'active' THEN
        RAISE EXCEPTION 'لا يمكن حذف المؤسسات النشطة. يجب إلغاؤها أولاً';
    END IF;
    
    -- تسجيل الحذف النهائي
    INSERT INTO public.tenant_deletion_log (
        tenant_id,
        tenant_name, 
        tenant_slug,
        deletion_type,
        deletion_reason,
        deleted_by
    ) VALUES (
        tenant_id_param,
        tenant_record.name,
        tenant_record.slug,
        'hard_delete',
        deletion_reason,
        auth.uid()
    );
    
    -- حذف المستخدمين المرتبطين بالمؤسسة
    WITH deleted_users AS (
        DELETE FROM public.tenant_users 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_users;
    deleted_counts := deleted_counts || jsonb_build_object('tenant_users', total_deleted);
    
    -- حذف العقود
    WITH deleted_contracts AS (
        DELETE FROM public.contracts 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_contracts;
    deleted_counts := deleted_counts || jsonb_build_object('contracts', total_deleted);
    
    -- حذف العملاء
    WITH deleted_customers AS (
        DELETE FROM public.customers 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_customers;
    deleted_counts := deleted_counts || jsonb_build_object('customers', total_deleted);
    
    -- حذف المركبات
    WITH deleted_vehicles AS (
        DELETE FROM public.vehicles 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_vehicles;
    deleted_counts := deleted_counts || jsonb_build_object('vehicles', total_deleted);
    
    -- حذف الأقسام
    WITH deleted_departments AS (
        DELETE FROM public.departments 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_departments;
    deleted_counts := deleted_counts || jsonb_build_object('departments', total_deleted);
    
    -- حذف الموظفين
    WITH deleted_employees AS (
        DELETE FROM public.employees 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_employees;
    deleted_counts := deleted_counts || jsonb_build_object('employees', total_deleted);
    
    -- حذف دليل الحسابات
    WITH deleted_accounts AS (
        DELETE FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_accounts;
    deleted_counts := deleted_counts || jsonb_build_object('chart_of_accounts', total_deleted);
    
    -- حذف مراكز التكلفة
    WITH deleted_cost_centers AS (
        DELETE FROM public.cost_centers 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_cost_centers;
    deleted_counts := deleted_counts || jsonb_build_object('cost_centers', total_deleted);
    
    -- حذف الفروع
    WITH deleted_branches AS (
        DELETE FROM public.branches 
        WHERE tenant_id = tenant_id_param
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_branches;
    deleted_counts := deleted_counts || jsonb_build_object('branches', total_deleted);
    
    -- حذف المؤسسة نفسها أخيراً
    DELETE FROM public.tenants WHERE id = tenant_id_param;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم حذف المؤسسة وجميع البيانات المرتبطة بها نهائياً',
        'tenant_name', tenant_record.name,
        'deleted_records', deleted_counts,
        'deleted_at', now()
    );
END;
$function$;

-- إنشاء دالة استعادة المؤسسة الملغاة
CREATE OR REPLACE FUNCTION public.restore_cancelled_tenant(tenant_id_param uuid, restore_reason text DEFAULT 'استعادة من قبل المدير')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    tenant_record RECORD;
BEGIN
    -- التحقق من وجود المؤسسة وحالتها
    SELECT name, status INTO tenant_record
    FROM public.tenants 
    WHERE id = tenant_id_param;
    
    IF tenant_record.name IS NULL THEN
        RAISE EXCEPTION 'المؤسسة غير موجودة';
    END IF;
    
    IF tenant_record.status != 'cancelled' THEN
        RAISE EXCEPTION 'يمكن استعادة المؤسسات الملغاة فقط';
    END IF;
    
    -- استعادة المؤسسة
    UPDATE public.tenants 
    SET 
        status = 'active',
        updated_at = now()
    WHERE id = tenant_id_param;
    
    -- إعادة تفعيل المستخدمين
    UPDATE public.tenant_users 
    SET 
        status = 'active',
        updated_at = now()
    WHERE tenant_id = tenant_id_param;
    
    -- تسجيل الاستعادة
    INSERT INTO public.tenant_deletion_log (
        tenant_id,
        tenant_name,
        tenant_slug,
        deletion_type,
        deletion_reason,
        deleted_by
    ) VALUES (
        tenant_id_param,
        tenant_record.name,
        (SELECT slug FROM public.tenants WHERE id = tenant_id_param),
        'restore',
        restore_reason,
        auth.uid()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم استعادة المؤسسة بنجاح',
        'tenant_name', tenant_record.name,
        'restored_at', now()
    );
END;
$function$;