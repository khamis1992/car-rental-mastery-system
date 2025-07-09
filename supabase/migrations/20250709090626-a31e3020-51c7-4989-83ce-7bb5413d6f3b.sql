-- إنشاء قيد محاسبي لسجل الصيانة الموجود بعد إصلاح رقم الحساب
DO $$
DECLARE
    maintenance_record RECORD;
    journal_entry_result UUID;
BEGIN
    -- البحث عن سجلات الصيانة المكتملة بدون قيود محاسبية
    FOR maintenance_record IN (
        SELECT 
            vm.id,
            vm.cost,
            vm.maintenance_type,
            vm.service_provider,
            vm.completed_date,
            vm.created_at,
            v.make,
            v.model,
            v.license_plate,
            v.vehicle_number
        FROM public.vehicle_maintenance vm
        JOIN public.vehicles v ON vm.vehicle_id = v.id
        WHERE vm.status = 'completed' 
        AND vm.cost > 0
        AND NOT EXISTS (
            SELECT 1 FROM public.journal_entries je 
            WHERE je.reference_type = 'maintenance' 
            AND je.reference_id = vm.id
        )
    ) LOOP
        -- إنشاء القيد المحاسبي لسجل الصيانة
        SELECT public.create_maintenance_accounting_entry(
            maintenance_record.id,
            jsonb_build_object(
                'vehicle_info', maintenance_record.make || ' ' || maintenance_record.model || ' - ' || COALESCE(maintenance_record.license_plate, maintenance_record.vehicle_number),
                'maintenance_type', maintenance_record.maintenance_type,
                'cost', maintenance_record.cost,
                'maintenance_date', COALESCE(maintenance_record.completed_date, maintenance_record.created_at),
                'vendor_name', COALESCE(maintenance_record.service_provider, 'غير محدد')
            )
        ) INTO journal_entry_result;
        
        RAISE NOTICE 'تم إنشاء قيد محاسبي % لسجل الصيانة %', journal_entry_result, maintenance_record.id;
    END LOOP;
    
    -- تحديث أرصدة الحسابات
    PERFORM public.update_account_balances();
    
    RAISE NOTICE 'تم إنشاء القيود المحاسبية لجميع سجلات الصيانة المكتملة وتحديث الأرصدة';
END $$;