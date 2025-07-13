-- تحديث دليل الحسابات ليطابق النظام الموحد الجديد
-- هذا التحديث يضمن استخدام الأرقام الصحيحة في جميع المؤسسات

-- أولاً: إنشاء دالة لتحديث أرقام الحسابات الموجودة
CREATE OR REPLACE FUNCTION public.update_existing_account_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- تحديث الأرقام القديمة إلى الجديدة
    
    -- تحديث حسابات النقدية
    UPDATE public.chart_of_accounts 
    SET account_code = '110101' 
    WHERE account_code IN ('1110', '1101') 
    AND account_name ILIKE '%نقدية%' OR account_name ILIKE '%صندوق%';
    
    -- تحديث حسابات البنوك
    UPDATE public.chart_of_accounts 
    SET account_code = '110103' 
    WHERE account_code IN ('1120', '1102') 
    AND account_name ILIKE '%بنك%';
    
    -- تحديث حسابات العملاء
    UPDATE public.chart_of_accounts 
    SET account_code = '110201' 
    WHERE account_code IN ('1130', '1103') 
    AND (account_name ILIKE '%عملاء%' OR account_name ILIKE '%مدين%');
    
    -- تحديث حسابات المخزون
    UPDATE public.chart_of_accounts 
    SET account_code = '110301' 
    WHERE account_code IN ('1150') 
    AND account_name ILIKE '%مخزون%';
    
    -- تحديث حسابات المركبات
    UPDATE public.chart_of_accounts 
    SET account_code = '120301' 
    WHERE account_code IN ('1310', '1201') 
    AND account_name ILIKE '%مركبات%' OR account_name ILIKE '%سيارات%';
    
    -- تحديث حسابات إهلاك المركبات
    UPDATE public.chart_of_accounts 
    SET account_code = '120304' 
    WHERE account_code IN ('1320') 
    AND account_name ILIKE '%إهلاك%' AND account_name ILIKE '%مركبات%';
    
    -- تحديث حسابات الموردين
    UPDATE public.chart_of_accounts 
    SET account_code = '210101' 
    WHERE account_code IN ('2150', '2101') 
    AND account_name ILIKE '%موردين%' OR account_name ILIKE '%موردون%';
    
    -- تحديث حسابات الرواتب المستحقة
    UPDATE public.chart_of_accounts 
    SET account_code = '210201' 
    WHERE account_code IN ('2110') 
    AND account_name ILIKE '%رواتب%' AND account_name ILIKE '%مستحق%';
    
    -- تحديث حسابات الضرائب المستحقة
    UPDATE public.chart_of_accounts 
    SET account_code = '210203' 
    WHERE account_code IN ('2120') 
    AND account_name ILIKE '%ضرائب%' AND account_name ILIKE '%مستحق%';
    
    -- تحديث حسابات رأس المال
    UPDATE public.chart_of_accounts 
    SET account_code = '3101' 
    WHERE account_code IN ('3110', '3101') 
    AND account_name ILIKE '%رأس المال%';
    
    -- تحديث حسابات الاحتياطيات
    UPDATE public.chart_of_accounts 
    SET account_code = '3201' 
    WHERE account_code IN ('3120') 
    AND account_name ILIKE '%احتياطي%';
    
    -- تحديث حسابات الأرباح المرحلة
    UPDATE public.chart_of_accounts 
    SET account_code = '3301' 
    WHERE account_code IN ('3130') 
    AND account_name ILIKE '%أرباح%' AND account_name ILIKE '%مرحل%';
    
    -- تحديث حسابات إيرادات التأجير
    UPDATE public.chart_of_accounts 
    SET account_code = '410101' 
    WHERE account_code IN ('4110') 
    AND account_name ILIKE '%إيرادات%' AND account_name ILIKE '%تأجير%';
    
    -- تحديث حسابات الخدمات الإضافية
    UPDATE public.chart_of_accounts 
    SET account_code = '4201' 
    WHERE account_code IN ('4120') 
    AND account_name ILIKE '%خدمات%' AND account_name ILIKE '%إضافي%';
    
    -- تحديث حسابات رواتب الموظفين
    UPDATE public.chart_of_accounts 
    SET account_code = '510102' 
    WHERE account_code IN ('5110') 
    AND account_name ILIKE '%رواتب%' AND NOT account_name ILIKE '%مستحق%';
    
    -- تحديث حسابات الوقود
    UPDATE public.chart_of_accounts 
    SET account_code = '510201' 
    WHERE account_code IN ('5150') 
    AND account_name ILIKE '%وقود%';
    
    -- تحديث حسابات الصيانة
    UPDATE public.chart_of_accounts 
    SET account_code = '510202' 
    WHERE account_code IN ('5130', '5101') 
    AND account_name ILIKE '%صيانة%';
    
    -- تحديث حسابات إهلاك المركبات (المصروفات)
    UPDATE public.chart_of_accounts 
    SET account_code = '510402' 
    WHERE account_code IN ('5120') 
    AND account_name ILIKE '%إهلاك%' AND account_name ILIKE '%مركبات%';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$;

-- ثانياً: إنشاء دالة لإضافة الحسابات المفقودة حسب النظام الجديد
CREATE OR REPLACE FUNCTION public.add_missing_unified_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- التأكد من وجود الحسابات الأساسية المطلوبة
    
    -- إضافة حسابات النقدية والبنوك إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '110101', 'النقدية في الصندوق', 'Cash on Hand',
        'asset', 'current_asset', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '110101'
    );
    
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '110103', 'بنك الكويت الوطني', 'National Bank of Kuwait',
        'asset', 'current_asset', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '110103'
    );
    
    -- إضافة حسابات العملاء إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '110201', 'عملاء - أفراد', 'Customers - Individuals',
        'asset', 'current_asset', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '110201'
    );
    
    -- إضافة حسابات المخزون إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '110301', 'قطع الغيار', 'Spare Parts',
        'asset', 'current_asset', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '110301'
    );
    
    -- إضافة حسابات المركبات إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '120301', 'سيارات الأجرة', 'Taxi Vehicles',
        'asset', 'fixed_asset', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '120301'
    );
    
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '120304', 'مجمع إهلاك المركبات', 'Accumulated Depreciation - Vehicles',
        'asset', 'fixed_asset', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '120304'
    );
    
    -- إضافة حسابات الموردين إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '210101', 'موردون', 'Suppliers',
        'liability', 'current_liability', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '210101'
    );
    
    -- إضافة حسابات الرواتب المستحقة إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '210201', 'مستحقات الرواتب', 'Accrued Salaries',
        'liability', 'current_liability', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '210201'
    );
    
    -- إضافة حسابات الضرائب المستحقة إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '210203', 'مستحقات ضريبية', 'Tax Accruals',
        'liability', 'current_liability', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '210203'
    );
    
    -- إضافة حسابات ودائع العملاء إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '210301', 'ودائع العملاء', 'Customer Deposits',
        'liability', 'current_liability', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '210301'
    );
    
    -- إضافة حسابات رأس المال إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '3101', 'رأس المال المدفوع', 'Paid-up Capital',
        'equity', 'capital', 3, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3101'
    );
    
    -- إضافة حسابات الاحتياطي القانوني إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '3201', 'الاحتياطي القانوني', 'Legal Reserve',
        'equity', 'capital', 3, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3201'
    );
    
    -- إضافة حسابات الأرباح المرحلة إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '3301', 'أرباح مرحلة من سنوات سابقة', 'Retained Earnings from Previous Years',
        'equity', 'capital', 3, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '3301'
    );
    
    -- إضافة حسابات إيرادات التأجير إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '410101', 'إيراد تأجير سيارات يومي', 'Daily Car Rental Revenue',
        'revenue', 'operating_revenue', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '410101'
    );
    
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '410102', 'إيراد تأجير سيارات أسبوعي', 'Weekly Car Rental Revenue',
        'revenue', 'operating_revenue', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '410102'
    );
    
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '410103', 'إيراد تأجير سيارات شهري', 'Monthly Car Rental Revenue',
        'revenue', 'operating_revenue', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '410103'
    );
    
    -- إضافة حسابات الخدمات الإضافية إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '4201', 'إيرادات التوصيل والاستلام', 'Delivery and Pickup Revenue',
        'revenue', 'operating_revenue', 3, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '4201'
    );
    
    -- إضافة حسابات رواتب الإدارة إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '510101', 'رواتب الإدارة', 'Management Salaries',
        'expense', 'operating_expense', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '510101'
    );
    
    -- إضافة حسابات رواتب الموظفين إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '510102', 'رواتب الموظفين', 'Employee Salaries',
        'expense', 'operating_expense', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '510102'
    );
    
    -- إضافة حسابات الوقود إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '510201', 'الوقود', 'Fuel',
        'expense', 'operating_expense', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '510201'
    );
    
    -- إضافة حسابات الصيانة إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '510202', 'الصيانة والإصلاح', 'Maintenance and Repairs',
        'expense', 'operating_expense', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '510202'
    );
    
    -- إضافة حسابات قطع الغيار إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '510203', 'قطع الغيار', 'Spare Parts',
        'expense', 'operating_expense', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '510203'
    );
    
    -- إضافة حسابات إهلاك المركبات إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '510402', 'إهلاك المركبات', 'Vehicle Depreciation',
        'expense', 'operating_expense', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '510402'
    );
    
    -- إضافة حسابات إهلاك المعدات إذا لم تكن موجودة
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, level, allow_posting, is_active
    )
    SELECT 
        tenant_id_param, '510403', 'إهلاك المعدات', 'Equipment Depreciation',
        'expense', 'operating_expense', 4, true, true
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '510403'
    );
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$$;

-- ثالثاً: تنفيذ التحديث على جميع المؤسسات
DO $$
DECLARE
    tenant_record RECORD;
    updated_count INTEGER;
    added_count INTEGER;
    total_updated INTEGER := 0;
    total_added INTEGER := 0;
BEGIN
    -- تحديث الأرقام القديمة أولاً
    SELECT public.update_existing_account_codes() INTO updated_count;
    total_updated := updated_count;
    
    RAISE NOTICE 'تم تحديث % حساب بأرقام جديدة', updated_count;
    
    -- تطبيق التحديث على كل مؤسسة
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants 
        WHERE status = 'active'
    ) LOOP
        BEGIN
            -- إضافة الحسابات المفقودة لكل مؤسسة
            SELECT public.add_missing_unified_accounts(tenant_record.id) INTO added_count;
            total_added := total_added + added_count;
            
            IF added_count > 0 THEN
                RAISE NOTICE 'تمت إضافة % حساب جديد للمؤسسة: %', added_count, tenant_record.name;
            END IF;
            
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'خطأ في تحديث المؤسسة %: %', tenant_record.name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'تم الانتهاء من التحديث. إجمالي الحسابات المحدثة: %, إجمالي الحسابات المضافة: %', 
                 total_updated, total_added;
END $$;

-- رابعاً: إنشاء دالة للتحقق من النظام الجديد
CREATE OR REPLACE FUNCTION public.verify_unified_chart_of_accounts(tenant_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    verification_result JSONB;
    accounts_count INTEGER;
    required_accounts TEXT[] := ARRAY[
        '110101', '110103', '110201', '110301', '120301', '120304',
        '210101', '210201', '210203', '210301', '3101', '3201', '3301',
        '410101', '410102', '410103', '4201',
        '510101', '510102', '510201', '510202', '510203', '510402', '510403'
    ];
    missing_accounts TEXT[] := ARRAY[]::TEXT[];
    account_code TEXT;
BEGIN
    -- فحص وجود الحسابات المطلوبة
    FOREACH account_code IN ARRAY required_accounts
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.chart_of_accounts 
            WHERE tenant_id = tenant_id_param AND account_code = account_code
        ) THEN
            missing_accounts := array_append(missing_accounts, account_code);
        END IF;
    END LOOP;
    
    -- حساب إجمالي الحسابات
    SELECT COUNT(*) INTO accounts_count 
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param AND is_active = true;
    
    -- إنشاء نتيجة التحقق
    verification_result := jsonb_build_object(
        'tenant_id', tenant_id_param,
        'total_accounts', accounts_count,
        'required_accounts_count', array_length(required_accounts, 1),
        'missing_accounts_count', array_length(missing_accounts, 1),
        'missing_accounts', to_jsonb(missing_accounts),
        'is_complete', (array_length(missing_accounts, 1) = 0 OR missing_accounts IS NULL),
        'verified_at', now()
    );
    
    RETURN verification_result;
END;
$$;

-- خامساً: التحقق من نجاح التحديث
DO $$
DECLARE
    tenant_record RECORD;
    verification_result JSONB;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'تقرير التحقق من النظام المحاسبي الموحد';
    RAISE NOTICE '==========================================';
    
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants 
        WHERE status = 'active'
        LIMIT 5  -- فحص أول 5 مؤسسات كعينة
    ) LOOP
        SELECT public.verify_unified_chart_of_accounts(tenant_record.id) INTO verification_result;
        
        RAISE NOTICE 'المؤسسة: % | الحسابات: % | مكتمل: %', 
                     tenant_record.name,
                     verification_result->>'total_accounts',
                     verification_result->>'is_complete';
                     
        IF (verification_result->>'is_complete')::BOOLEAN = FALSE THEN
            RAISE NOTICE 'الحسابات المفقودة: %', verification_result->>'missing_accounts';
        END IF;
    END LOOP;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'انتهى تقرير التحقق';
    RAISE NOTICE '==========================================';
END $$;

-- إضافة تعليق على النظام الجديد
COMMENT ON FUNCTION public.verify_unified_chart_of_accounts(UUID) IS 
'دالة للتحقق من اكتمال النظام المحاسبي الموحد لمؤسسة معينة';

COMMENT ON FUNCTION public.update_existing_account_codes() IS 
'دالة لتحديث أرقام الحسابات من النظام القديم إلى النظام الموحد الجديد';

COMMENT ON FUNCTION public.add_missing_unified_accounts(UUID) IS 
'دالة لإضافة الحسابات المطلوبة المفقودة حسب النظام الموحد الجديد'; 