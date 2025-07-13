-- سكريبت تحديث النظام المحاسبي إلى النظام الموحد الجديد
-- يمكن تشغيله مباشرة على قاعدة البيانات

-- إنشاء دالة لتحديث حسابات النظام المحاسبي
CREATE OR REPLACE FUNCTION update_to_unified_accounting_system()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    tenant_record RECORD;
    updated_accounts INTEGER := 0;
    added_accounts INTEGER := 0;
    error_count INTEGER := 0;
    total_tenants INTEGER := 0;
BEGIN
    -- إنشاء جدول مؤقت للنتائج
    CREATE TEMP TABLE IF NOT EXISTS update_results (
        tenant_id UUID,
        tenant_name TEXT,
        updated_accounts INTEGER,
        added_accounts INTEGER,
        status TEXT,
        error_message TEXT
    );
    
    -- تحديث الأرقام القديمة في جميع المؤسسات
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants 
        WHERE status = 'active'
    ) LOOP
        total_tenants := total_tenants + 1;
        
        BEGIN
            -- تحديث الحسابات الموجودة
            WITH updated_rows AS (
                UPDATE public.chart_of_accounts 
                SET account_code = CASE 
                    WHEN account_code IN ('1110', '1101') AND (account_name ILIKE '%نقدية%' OR account_name ILIKE '%صندوق%') THEN '110101'
                    WHEN account_code IN ('1120', '1102') AND account_name ILIKE '%بنك%' THEN '110103'
                    WHEN account_code IN ('1130', '1103') AND (account_name ILIKE '%عملاء%' OR account_name ILIKE '%مدين%') THEN '110201'
                    WHEN account_code IN ('1150') AND account_name ILIKE '%مخزون%' THEN '110301'
                    WHEN account_code IN ('1310', '1201') AND (account_name ILIKE '%مركبات%' OR account_name ILIKE '%سيارات%') THEN '120301'
                    WHEN account_code IN ('1320') AND account_name ILIKE '%إهلاك%' AND account_name ILIKE '%مركبات%' THEN '120304'
                    WHEN account_code IN ('2150', '2101') AND (account_name ILIKE '%موردين%' OR account_name ILIKE '%موردون%') THEN '210101'
                    WHEN account_code IN ('2110') AND account_name ILIKE '%رواتب%' AND account_name ILIKE '%مستحق%' THEN '210201'
                    WHEN account_code IN ('2120') AND account_name ILIKE '%ضرائب%' AND account_name ILIKE '%مستحق%' THEN '210203'
                    WHEN account_code IN ('3110', '3101') AND account_name ILIKE '%رأس المال%' THEN '3101'
                    WHEN account_code IN ('3120') AND account_name ILIKE '%احتياطي%' THEN '3201'
                    WHEN account_code IN ('3130') AND account_name ILIKE '%أرباح%' AND account_name ILIKE '%مرحل%' THEN '3301'
                    WHEN account_code IN ('4110') AND account_name ILIKE '%إيرادات%' AND account_name ILIKE '%تأجير%' THEN '410101'
                    WHEN account_code IN ('4120') AND account_name ILIKE '%خدمات%' AND account_name ILIKE '%إضافي%' THEN '4201'
                    WHEN account_code IN ('5110') AND account_name ILIKE '%رواتب%' AND NOT account_name ILIKE '%مستحق%' THEN '510102'
                    WHEN account_code IN ('5150') AND account_name ILIKE '%وقود%' THEN '510201'
                    WHEN account_code IN ('5130', '5101') AND account_name ILIKE '%صيانة%' THEN '510202'
                    WHEN account_code IN ('5120') AND account_name ILIKE '%إهلاك%' AND account_name ILIKE '%مركبات%' THEN '510402'
                    ELSE account_code
                END,
                updated_at = now()
                WHERE tenant_id = tenant_record.id
                AND account_code IN ('1110', '1101', '1120', '1102', '1130', '1103', '1150', '1310', '1201', '1320', '2150', '2101', '2110', '2120', '3110', '3101', '3120', '3130', '4110', '4120', '5110', '5150', '5130', '5101', '5120')
                RETURNING *
            )
            SELECT COUNT(*) INTO updated_accounts FROM updated_rows;
            
            -- إضافة الحسابات الأساسية المطلوبة
            INSERT INTO public.chart_of_accounts (
                tenant_id, account_code, account_name, account_name_en, 
                account_type, account_category, level, allow_posting, is_active
            )
            SELECT * FROM (VALUES
                (tenant_record.id, '110101', 'النقدية في الصندوق', 'Cash on Hand', 'asset', 'current_asset', 4, true, true),
                (tenant_record.id, '110103', 'بنك الكويت الوطني', 'National Bank of Kuwait', 'asset', 'current_asset', 4, true, true),
                (tenant_record.id, '110201', 'عملاء - أفراد', 'Customers - Individuals', 'asset', 'current_asset', 4, true, true),
                (tenant_record.id, '110301', 'قطع الغيار', 'Spare Parts', 'asset', 'current_asset', 4, true, true),
                (tenant_record.id, '120301', 'سيارات الأجرة', 'Taxi Vehicles', 'asset', 'fixed_asset', 4, true, true),
                (tenant_record.id, '120304', 'مجمع إهلاك المركبات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', 4, true, true),
                (tenant_record.id, '210101', 'موردون', 'Suppliers', 'liability', 'current_liability', 4, true, true),
                (tenant_record.id, '210201', 'مستحقات الرواتب', 'Accrued Salaries', 'liability', 'current_liability', 4, true, true),
                (tenant_record.id, '210203', 'مستحقات ضريبية', 'Tax Accruals', 'liability', 'current_liability', 4, true, true),
                (tenant_record.id, '210301', 'ودائع العملاء', 'Customer Deposits', 'liability', 'current_liability', 4, true, true),
                (tenant_record.id, '3101', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', 3, true, true),
                (tenant_record.id, '3201', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', 3, true, true),
                (tenant_record.id, '3301', 'أرباح مرحلة من سنوات سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', 3, true, true),
                (tenant_record.id, '410101', 'إيراد تأجير سيارات يومي', 'Daily Car Rental Revenue', 'revenue', 'operating_revenue', 4, true, true),
                (tenant_record.id, '410102', 'إيراد تأجير سيارات أسبوعي', 'Weekly Car Rental Revenue', 'revenue', 'operating_revenue', 4, true, true),
                (tenant_record.id, '410103', 'إيراد تأجير سيارات شهري', 'Monthly Car Rental Revenue', 'revenue', 'operating_revenue', 4, true, true),
                (tenant_record.id, '4201', 'إيرادات التوصيل والاستلام', 'Delivery and Pickup Revenue', 'revenue', 'operating_revenue', 3, true, true),
                (tenant_record.id, '510101', 'رواتب الإدارة', 'Management Salaries', 'expense', 'operating_expense', 4, true, true),
                (tenant_record.id, '510102', 'رواتب الموظفين', 'Employee Salaries', 'expense', 'operating_expense', 4, true, true),
                (tenant_record.id, '510201', 'الوقود', 'Fuel', 'expense', 'operating_expense', 4, true, true),
                (tenant_record.id, '510202', 'الصيانة والإصلاح', 'Maintenance and Repairs', 'expense', 'operating_expense', 4, true, true),
                (tenant_record.id, '510203', 'قطع الغيار', 'Spare Parts', 'expense', 'operating_expense', 4, true, true),
                (tenant_record.id, '510402', 'إهلاك المركبات', 'Vehicle Depreciation', 'expense', 'operating_expense', 4, true, true),
                (tenant_record.id, '510403', 'إهلاك المعدات', 'Equipment Depreciation', 'expense', 'operating_expense', 4, true, true)
            ) AS new_accounts(tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
            WHERE NOT EXISTS (
                SELECT 1 FROM public.chart_of_accounts 
                WHERE tenant_id = tenant_record.id AND account_code = new_accounts.account_code
            );
            
            GET DIAGNOSTICS added_accounts = ROW_COUNT;
            
            INSERT INTO update_results VALUES (
                tenant_record.id, 
                tenant_record.name, 
                updated_accounts, 
                added_accounts, 
                'success', 
                NULL
            );
            
        EXCEPTION WHEN others THEN
            error_count := error_count + 1;
            INSERT INTO update_results VALUES (
                tenant_record.id, 
                tenant_record.name, 
                0, 
                0, 
                'error', 
                SQLERRM
            );
        END;
    END LOOP;
    
    -- إنشاء النتيجة النهائية
    SELECT jsonb_build_object(
        'total_tenants', total_tenants,
        'successful_updates', total_tenants - error_count,
        'failed_updates', error_count,
        'total_updated_accounts', (SELECT SUM(updated_accounts) FROM update_results),
        'total_added_accounts', (SELECT SUM(added_accounts) FROM update_results),
        'detailed_results', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'tenant_name', tenant_name,
                    'updated_accounts', updated_accounts,
                    'added_accounts', added_accounts,
                    'status', status,
                    'error_message', error_message
                )
            ) FROM update_results
        ),
        'execution_time', now()
    ) INTO result;
    
    DROP TABLE IF EXISTS update_results;
    
    RETURN result;
END;
$$;

-- إنشاء دالة للتحقق من النظام الجديد
CREATE OR REPLACE FUNCTION verify_unified_accounting_system()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    tenant_record RECORD;
    required_accounts TEXT[] := ARRAY[
        '110101', '110103', '110201', '110301', '120301', '120304',
        '210101', '210201', '210203', '210301', '3101', '3201', '3301',
        '410101', '410102', '410103', '4201',
        '510101', '510102', '510201', '510202', '510203', '510402', '510403'
    ];
    missing_accounts TEXT[];
    account_code TEXT;
    total_tenants INTEGER := 0;
    verified_tenants INTEGER := 0;
BEGIN
    -- إنشاء جدول مؤقت للنتائج
    CREATE TEMP TABLE IF NOT EXISTS verification_results (
        tenant_id UUID,
        tenant_name TEXT,
        total_accounts INTEGER,
        missing_accounts TEXT[],
        is_complete BOOLEAN
    );
    
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants 
        WHERE status = 'active'
    ) LOOP
        total_tenants := total_tenants + 1;
        missing_accounts := ARRAY[]::TEXT[];
        
        -- فحص وجود الحسابات المطلوبة
        FOREACH account_code IN ARRAY required_accounts
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM public.chart_of_accounts 
                WHERE tenant_id = tenant_record.id AND account_code = account_code
            ) THEN
                missing_accounts := array_append(missing_accounts, account_code);
            END IF;
        END LOOP;
        
        INSERT INTO verification_results 
        SELECT 
            tenant_record.id,
            tenant_record.name,
            (SELECT COUNT(*) FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND is_active = true),
            missing_accounts,
            (array_length(missing_accounts, 1) IS NULL OR array_length(missing_accounts, 1) = 0);
            
        IF (array_length(missing_accounts, 1) IS NULL OR array_length(missing_accounts, 1) = 0) THEN
            verified_tenants := verified_tenants + 1;
        END IF;
    END LOOP;
    
    -- إنشاء النتيجة النهائية
    SELECT jsonb_build_object(
        'total_tenants', total_tenants,
        'verified_tenants', verified_tenants,
        'unverified_tenants', total_tenants - verified_tenants,
        'success_rate', CASE 
            WHEN total_tenants > 0 THEN ROUND((verified_tenants::NUMERIC / total_tenants::NUMERIC) * 100, 2)
            ELSE 0 
        END,
        'required_accounts_count', array_length(required_accounts, 1),
        'detailed_results', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'tenant_name', tenant_name,
                    'total_accounts', total_accounts,
                    'missing_accounts', missing_accounts,
                    'is_complete', is_complete
                )
            ) FROM verification_results
        ),
        'verification_time', now()
    ) INTO result;
    
    DROP TABLE IF EXISTS verification_results;
    
    RETURN result;
END;
$$;

-- تشغيل التحديث
SELECT 'بدء تحديث النظام المحاسبي...' AS status;
SELECT update_to_unified_accounting_system() AS update_result;

-- التحقق من النتائج
SELECT 'التحقق من النتائج...' AS status;
SELECT verify_unified_accounting_system() AS verification_result;

-- عرض تقرير سريع
SELECT 
    'تقرير سريع: الحسابات المطلوبة' AS report_type,
    jsonb_pretty(
        jsonb_build_object(
            'الحسابات_المطلوبة', ARRAY[
                '110101 - النقدية في الصندوق',
                '110103 - بنك الكويت الوطني', 
                '110201 - عملاء - أفراد',
                '110301 - قطع الغيار',
                '120301 - سيارات الأجرة',
                '120304 - مجمع إهلاك المركبات',
                '210101 - موردون',
                '210201 - مستحقات الرواتب',
                '210203 - مستحقات ضريبية',
                '210301 - ودائع العملاء',
                '3101 - رأس المال المدفوع',
                '3201 - الاحتياطي القانوني',
                '3301 - أرباح مرحلة من سنوات سابقة',
                '410101 - إيراد تأجير سيارات يومي',
                '410102 - إيراد تأجير سيارات أسبوعي',
                '410103 - إيراد تأجير سيارات شهري',
                '4201 - إيرادات التوصيل والاستلام',
                '510101 - رواتب الإدارة',
                '510102 - رواتب الموظفين',
                '510201 - الوقود',
                '510202 - الصيانة والإصلاح',
                '510203 - قطع الغيار',
                '510402 - إهلاك المركبات',
                '510403 - إهلاك المعدات'
            ]
        )
    ) AS required_accounts_list; 