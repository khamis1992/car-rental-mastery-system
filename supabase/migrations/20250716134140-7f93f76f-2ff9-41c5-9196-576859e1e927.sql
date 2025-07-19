-- إصلاح قيود دليل الحسابات وإكمال الحسابات المفقودة
DO $$
DECLARE
    bashaer_tenant_id UUID := '235b2e88-fdfa-44f5-bf78-c000d6899182';
    parent_id UUID;
    accounts_added INTEGER := 0;
BEGIN
    -- إزالة القيود القديمة إذا وجدت
    BEGIN
        ALTER TABLE public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_account_code_key;
    EXCEPTION WHEN OTHERS THEN
        -- تجاهل الخطأ إذا كان القيد غير موجود
        NULL;
    END;
    
    -- التأكد من وجود القيد الصحيح
    BEGIN
        ALTER TABLE public.chart_of_accounts 
        ADD CONSTRAINT chart_of_accounts_tenant_code_unique 
        UNIQUE (tenant_id, account_code);
    EXCEPTION WHEN duplicate_object THEN
        -- القيد موجود بالفعل
        NULL;
    END;

    -- الآن إضافة الحسابات المفقودة
    -- استكمال الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '12';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (bashaer_tenant_id, '121', 'المباني والإنشاءات', 'Buildings and Constructions', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
        (bashaer_tenant_id, '122', 'الآلات والمعدات', 'Machinery and Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
        (bashaer_tenant_id, '123', 'المركبات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
        (bashaer_tenant_id, '124', 'الأثاث والمعدات المكتبية', 'Furniture and Office Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
        (bashaer_tenant_id, '125', 'مجمع استهلاك الأصول الثابتة', 'Accumulated Depreciation', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- استكمال حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '3';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (bashaer_tenant_id, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
        (bashaer_tenant_id, '32', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
        (bashaer_tenant_id, '33', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- استكمال الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '4';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (bashaer_tenant_id, '41', 'إيرادات العمليات الرئيسية', 'Operating Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
        (bashaer_tenant_id, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- استكمال المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '5';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (bashaer_tenant_id, '51', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
        (bashaer_tenant_id, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
        (bashaer_tenant_id, '53', 'مصروفات تمويلية', 'Financial Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- إضافة حسابات المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '11';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (bashaer_tenant_id, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- حساب إجمالي الحسابات النهائية
    SELECT COUNT(*) INTO accounts_added FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id;
    
    RAISE NOTICE 'تم استكمال دليل الحسابات لمؤسسة البشائر - إجمالي الحسابات الآن: %', accounts_added;
    
END $$;