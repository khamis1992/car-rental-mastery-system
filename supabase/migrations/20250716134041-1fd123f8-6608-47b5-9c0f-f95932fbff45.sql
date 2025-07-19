-- استكمال دليل الحسابات لمؤسسة البشائر مع القيم الصحيحة
DO $$
DECLARE
    bashaer_tenant_id UUID := '235b2e88-fdfa-44f5-bf78-c000d6899182';
    parent_id UUID;
    accounts_added INTEGER := 0;
BEGIN
    -- استكمال الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '121', 'المباني والإنشاءات', 'Buildings and Constructions', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '122', 'الآلات والمعدات', 'Machinery and Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '123', 'المركبات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '124', 'الأثاث والمعدات المكتبية', 'Furniture and Office Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '125', 'مجمع استهلاك الأصول الثابتة', 'Accumulated Depreciation', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المباني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '12101', 'مباني إدارية', 'Administrative Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '12102', 'مباني تشغيلية', 'Operational Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '12103', 'مستودعات', 'Warehouses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '123';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '12301', 'سيارات ركوب', 'Passenger Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '12302', 'شاحنات وحافلات', 'Trucks and Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '12303', 'معدات ثقيلة', 'Heavy Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- استكمال الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '21101', 'ذمم الموردين - محلي', 'Local Suppliers Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '21102', 'ذمم الموردين - أجنبي', 'Foreign Suppliers Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '21103', 'أوراق الدفع', 'Notes Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- استكمال حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
    (bashaer_tenant_id, '32', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
    (bashaer_tenant_id, '33', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل رأس المال
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '3101', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '3102', 'علاوة إصدار أسهم', 'Share Premium', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- استكمال الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '41', 'إيرادات العمليات الرئيسية', 'Operating Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (bashaer_tenant_id, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل إيرادات العمليات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '4101', 'إيرادات تأجير المركبات', 'Vehicle Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '4102', 'إيرادات الخدمات اللوجستية', 'Logistics Services Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '4103', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل إيرادات تأجير المركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '4101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '410101', 'إيجار مركبات يومي', 'Daily Vehicle Rental', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '410102', 'إيجار مركبات شهري', 'Monthly Vehicle Rental', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '410103', 'إيجار مركبات سنوي', 'Annual Vehicle Rental', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- استكمال المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '51', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
    (bashaer_tenant_id, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
    (bashaer_tenant_id, '53', 'مصروفات تمويلية', 'Financial Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل مصروفات التشغيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '5101', 'مصروفات الوقود', 'Fuel Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5102', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5103', 'مصروفات التأمين', 'Insurance Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5104', 'مصروفات التراخيص', 'License Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5105', 'مصروفات الإطارات', 'Tire Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '5201', 'رواتب وأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5202', 'إيجار المكاتب', 'Office Rent', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5203', 'مصروفات الكهرباء والماء', 'Utilities Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5204', 'مصروفات الاتصالات', 'Communication Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5205', 'مصروفات القرطاسية', 'Stationery Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- إضافة حسابات المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '11301', 'مخزون قطع الغيار', 'Spare Parts Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '11302', 'مخزون الوقود', 'Fuel Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '11303', 'مخزون المواد الاستهلاكية', 'Consumable Materials Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- حساب إجمالي الحسابات المضافة
    SELECT COUNT(*) INTO accounts_added FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id;
    
    RAISE NOTICE 'تم استكمال دليل الحسابات لمؤسسة البشائر - إجمالي الحسابات الآن: %', accounts_added;
    
END $$;