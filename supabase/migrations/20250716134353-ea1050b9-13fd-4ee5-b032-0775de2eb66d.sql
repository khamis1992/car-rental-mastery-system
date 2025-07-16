-- إضافة الحسابات المفقودة لمؤسسة البشائر مباشرة
DO $$
DECLARE
    bashaer_tenant_id UUID := '235b2e88-fdfa-44f5-bf78-c000d6899182';
    parent_id UUID;
    accounts_added INTEGER := 0;
BEGIN
    -- إضافة الحسابات المفقودة واحد تلو الآخر
    
    -- استكمال الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '12';
    IF parent_id IS NOT NULL THEN
        -- المباني والإنشاءات
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '121', 'المباني والإنشاءات', 'Buildings and Constructions', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
        
        -- المركبات
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '123', 'المركبات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- استكمال حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '3';
    IF parent_id IS NOT NULL THEN
        -- رأس المال
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
        
        -- الأرباح المحتجزة
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '33', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- استكمال الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '4';
    IF parent_id IS NOT NULL THEN
        -- إيرادات العمليات الرئيسية
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '41', 'إيرادات العمليات الرئيسية', 'Operating Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- استكمال المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '5';
    IF parent_id IS NOT NULL THEN
        -- مصروفات التشغيل
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '51', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
        
        -- مصروفات إدارية
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- إضافة تفاصيل إيرادات العمليات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '41';
    IF parent_id IS NOT NULL THEN
        -- إيرادات تأجير المركبات
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '4101', 'إيرادات تأجير المركبات', 'Vehicle Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- إضافة تفاصيل مصروفات التشغيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '51';
    IF parent_id IS NOT NULL THEN
        -- مصروفات الوقود
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '5101', 'مصروفات الوقود', 'Fuel Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
        
        -- مصروفات الصيانة
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '5102', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- إضافة تفاصيل المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '52';
    IF parent_id IS NOT NULL THEN
        -- رواتب وأجور
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES (bashaer_tenant_id, '5201', 'رواتب وأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
    END IF;

    -- حساب إجمالي الحسابات النهائية
    SELECT COUNT(*) INTO accounts_added FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id;
    
    RAISE NOTICE 'تم استكمال دليل الحسابات لمؤسسة البشائر - إجمالي الحسابات الآن: %', accounts_added;
    
END $$;