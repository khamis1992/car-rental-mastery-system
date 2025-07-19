-- تحديث دالة حذف المؤسسة لحل مشكلة القيود المرجعية
CREATE OR REPLACE FUNCTION public.safe_delete_tenant(tenant_id_param UUID, deletion_reason TEXT DEFAULT NULL) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_record RECORD;
    deletion_result JSONB;
    deleted_tables TEXT[] := '{}';
    records_count INTEGER;
BEGIN
    -- التحقق من وجود المؤسسة
    SELECT * INTO tenant_record FROM public.tenants WHERE id = tenant_id_param;
    
    IF tenant_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'المؤسسة غير موجودة'
        );
    END IF;
    
    -- تسجيل محاولة الحذف
    INSERT INTO public.tenant_deletion_log (
        tenant_id, tenant_name, tenant_slug, deleted_by, reason, deletion_type
    ) VALUES (
        tenant_id_param, tenant_record.name, tenant_record.slug, auth.uid(), 
        deletion_reason, 'hard_delete'
    );
    
    -- حذف البيانات المرتبطة بالترتيب الصحيح
    
    -- 1. حذف المدفوعات أولاً
    DELETE FROM public.payments WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'payments: ' || records_count);
    END IF;
    
    -- 2. حذف بنود الفواتير
    DELETE FROM public.invoice_items WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'invoice_items: ' || records_count);
    END IF;
    
    -- 3. حذف الفواتير (يجب حذفها قبل العقود لأنها تشير إليها)
    DELETE FROM public.invoices WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'invoices: ' || records_count);
    END IF;
    
    -- 4. حذف الرسوم الإضافية
    DELETE FROM public.additional_charges WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'additional_charges: ' || records_count);
    END IF;
    
    -- 5. حذف العقود
    DELETE FROM public.contracts WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'contracts: ' || records_count);
    END IF;
    
    -- 6. حذف العملاء
    DELETE FROM public.customers WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'customers: ' || records_count);
    END IF;
    
    -- 7. حذف المركبات
    DELETE FROM public.vehicles WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'vehicles: ' || records_count);
    END IF;
    
    -- 8. حذف بيانات المحاسبة
    DELETE FROM public.journal_entry_lines WHERE journal_entry_id IN (
        SELECT id FROM public.journal_entries WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'journal_entry_lines: ' || records_count);
    END IF;
    
    DELETE FROM public.journal_entries WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'journal_entries: ' || records_count);
    END IF;
    
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'chart_of_accounts: ' || records_count);
    END IF;
    
    -- 9. حذف الموظفين
    DELETE FROM public.employees WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'employees: ' || records_count);
    END IF;
    
    -- 10. حذف مستخدمي المؤسسة
    DELETE FROM public.tenant_users WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'tenant_users: ' || records_count);
    END IF;
    
    -- 11. حذف المؤسسة نهائياً
    DELETE FROM public.tenants WHERE id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := array_append(deleted_tables, 'tenants: ' || records_count);
    END IF;
    
    -- إرجاع نتيجة النجاح
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم حذف المؤسسة وجميع البيانات المرتبطة بها نهائياً',
        'tenant_id', tenant_id_param,
        'tenant_name', tenant_record.name,
        'deleted_tables', deleted_tables,
        'deleted_at', now()
    );
    
EXCEPTION WHEN OTHERS THEN
    -- في حالة حدوث خطأ
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'tenant_id', tenant_id_param
    );
END;
$$;