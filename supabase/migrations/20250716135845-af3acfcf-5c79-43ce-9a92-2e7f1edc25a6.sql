-- إكمال دليل الحسابات لمؤسسة البشائر مع تصحيح التصنيفات
DO $$
DECLARE
    bashaer_tenant_id UUID := '235b2e88-fdfa-44f5-bf78-c000d6899182';
    parent_id UUID;
    accounts_added INTEGER := 0;
BEGIN
    -- إضافة حسابات الأصول الثابتة التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '12';
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '121', 'المباني والإنشاءات', 'Buildings and Constructions', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '122', 'الآلات والمعدات', 'Machinery and Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '123', 'المركبات ووسائل النقل', 'Vehicles and Transportation', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '124', 'الأثاث والتجهيزات المكتبية', 'Furniture and Office Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '125', 'الحاسوب وتقنية المعلومات', 'Computers and IT Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (bashaer_tenant_id, '126', 'مجمع استهلاك الأصول الثابتة', 'Accumulated Depreciation', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المباني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '12101', 'المباني الإدارية', 'Administrative Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '12102', 'المباني التشغيلية', 'Operational Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '12103', 'المخازن والمستودعات', 'Warehouses and Storage', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '123';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '12301', 'السيارات الخاصة', 'Passenger Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '12302', 'الشاحنات', 'Trucks', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (bashaer_tenant_id, '12303', 'المعدات الثقيلة', 'Heavy Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- إضافة حسابات حقوق الملكية التفصيلية
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
    (bashaer_tenant_id, '3101', 'رأس المال المكتتب به', 'Subscribed Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '3102', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- إضافة حسابات الإيرادات التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '41', 'الإيرادات التشغيلية', 'Operating Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (bashaer_tenant_id, '42', 'الإيرادات الأخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل الإيرادات التشغيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '4101', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '4102', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '4103', 'إيرادات الإيجارات', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- إضافة حسابات المصروفات التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '51', 'المصروفات التشغيلية', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
    (bashaer_tenant_id, '52', 'المصروفات الإدارية', 'Administrative Expenses', 'expense', 'administrative_expense', parent_id, 2, false, true, 0, 0, true),
    (bashaer_tenant_id, '53', 'المصروفات المالية', 'Financial Expenses', 'expense', 'financial_expense', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المصروفات التشغيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '5101', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5102', 'مصروفات الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5103', 'مصروفات الكهرباء والمياه', 'Utilities Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5104', 'مصروفات الوقود والمحروقات', 'Fuel and Gas Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5105', 'مصروفات الصيانة والإصلاح', 'Maintenance and Repair', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = bashaer_tenant_id AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (bashaer_tenant_id, '5201', 'مصروفات إدارية عامة', 'General Administrative Expenses', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5202', 'مصروفات الاتصالات', 'Communication Expenses', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5203', 'مصروفات القرطاسية والمطبوعات', 'Stationery and Printing', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true),
    (bashaer_tenant_id, '5204', 'مصروفات التأمين', 'Insurance Expenses', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0, true)
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
    
    RAISE NOTICE 'تم إكمال دليل الحسابات بنجاح. إجمالي الحسابات: %', accounts_added;
END $$;