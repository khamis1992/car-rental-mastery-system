-- إضافة الحسابات المفقودة الأساسية فقط للبشائر
DO $$
DECLARE
    tenant_uuid UUID := '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid;
    parent_id UUID;
    accounts_added INTEGER := 0;
BEGIN
    RAISE NOTICE 'إضافة الحسابات المفقودة الأساسية لمؤسسة البشائر الخليجية...';

    -- 1. إضافة حسابات الإيرادات المفقودة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '4';
    IF parent_id IS NOT NULL THEN
        -- إضافة التصنيفات الفرعية للإيرادات
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (tenant_uuid, '41', 'إيرادات التشغيل', 'Operating Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
        (tenant_uuid, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;

        -- إضافة الحسابات التفصيلية للإيرادات التشغيلية
        SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '41';
        IF parent_id IS NOT NULL THEN
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
            VALUES 
            (tenant_uuid, '4101', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
            (tenant_uuid, '4102', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
            (tenant_uuid, '4103', 'إيرادات الإيجار', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true)
            ON CONFLICT (tenant_id, account_code) DO NOTHING;
            accounts_added := accounts_added + 3;
        END IF;

        -- إضافة الحسابات التفصيلية للإيرادات الأخرى
        SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '42';
        IF parent_id IS NOT NULL THEN
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
            VALUES 
            (tenant_uuid, '4201', 'إيرادات الفوائد', 'Interest Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0, true),
            (tenant_uuid, '4202', 'إيرادات متنوعة', 'Miscellaneous Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0, true)
            ON CONFLICT (tenant_id, account_code) DO NOTHING;
            accounts_added := accounts_added + 2;
        END IF;
        accounts_added := accounts_added + 2;
    END IF;

    -- 2. إضافة حسابات المصروفات المفقودة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '5';
    IF parent_id IS NOT NULL THEN
        -- إضافة التصنيفات الفرعية للمصروفات
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (tenant_uuid, '51', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', 'expense', 'cost_of_goods_sold', parent_id, 2, false, true, 0, 0, true),
        (tenant_uuid, '52', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
        (tenant_uuid, '53', 'مصروفات أخرى', 'Other Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;

        -- إضافة بعض الحسابات التفصيلية الأساسية للمصروفات التشغيلية
        SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '52';
        IF parent_id IS NOT NULL THEN
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
            VALUES 
            (tenant_uuid, '5201', 'الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
            (tenant_uuid, '5202', 'المصروفات الإدارية والعمومية', 'General and Administrative Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
            (tenant_uuid, '5203', 'مصروفات الاستهلاك', 'Depreciation Expense', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true)
            ON CONFLICT (tenant_id, account_code) DO NOTHING;
            accounts_added := accounts_added + 3;
        END IF;

        -- إضافة بعض الحسابات التفصيلية للمصروفات الأخرى
        SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '53';
        IF parent_id IS NOT NULL THEN
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
            VALUES 
            (tenant_uuid, '5301', 'مصروفات الفوائد', 'Interest Expenses', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0, true),
            (tenant_uuid, '5302', 'مصروفات متنوعة', 'Miscellaneous Expenses', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0, true)
            ON CONFLICT (tenant_id, account_code) DO NOTHING;
            accounts_added := accounts_added + 2;
        END IF;
        accounts_added := accounts_added + 3;
    END IF;

    -- 3. إضافة المخزون للأصول المتداولة إذا لم يكن موجوداً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '11';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (tenant_uuid, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, true, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
        accounts_added := accounts_added + 1;
    END IF;

    -- 4. إضافة تفاصيل الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '121';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (tenant_uuid, '12101', 'الأراضي', 'Land', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
        (tenant_uuid, '12102', 'المباني', 'Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
        (tenant_uuid, '12103', 'الآلات والمعدات', 'Machinery and Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
        (tenant_uuid, '12104', 'السيارات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
        (tenant_uuid, '12105', 'أجهزة الحاسوب', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
        accounts_added := accounts_added + 5;
    END IF;

    RAISE NOTICE 'تم إضافة % حساب جديد بنجاح.', accounts_added;
    RAISE NOTICE 'دليل الحسابات أصبح أكثر تفصيلاً ومتوافق مع المعايير المحاسبية.';
    
END $$;