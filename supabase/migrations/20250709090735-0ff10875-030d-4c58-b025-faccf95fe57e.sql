-- إنشاء قيد محاسبي لسجل الصيانة الموجود بعد إصلاح أرقام الحسابات
DO $$
DECLARE
    maintenance_record RECORD;
    journal_entry_result UUID;
    records_processed INTEGER := 0;
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
        BEGIN
            -- إنشاء القيد المحاسبي لسجل الصيانة
            SELECT public.create_maintenance_accounting_entry(
                maintenance_record.id,
                jsonb_build_object(
                    'vehicle_info', maintenance_record.make || ' ' || maintenance_record.model || ' - ' || COALESCE(maintenance_record.license_plate, maintenance_record.vehicle_number),
                    'maintenance_type', maintenance_record.maintenance_type,
                    'cost', maintenance_record.cost,
                    'maintenance_date', COALESCE(maintenance_record.completed_date::text, maintenance_record.created_at::text),
                    'vendor_name', COALESCE(maintenance_record.service_provider, 'غير محدد')
                )
            ) INTO journal_entry_result;
            
            records_processed := records_processed + 1;
            RAISE NOTICE 'تم إنشاء قيد محاسبي % لسجل الصيانة %', journal_entry_result, maintenance_record.id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في إنشاء قيد محاسبي لسجل الصيانة %: %', maintenance_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- تحديث أرصدة الحسابات
    PERFORM public.update_account_balances();
    
    RAISE NOTICE 'تم معالجة % سجل صيانة وتحديث الأرصدة', records_processed;
END $$;