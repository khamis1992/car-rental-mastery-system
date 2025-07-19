-- إكمال دليل الحسابات للبشائر مع جميع الحسابات المطلوبة (مع تصحيح account_category)
DO $$
DECLARE
    tenant_uuid UUID := '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid;
    parent_id UUID;
    accounts_added INTEGER := 0;
BEGIN
    RAISE NOTICE 'بدء إضافة الحسابات المفقودة لمؤسسة البشائر الخليجية...';

    -- 1. إكمال حسابات المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '11';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (tenant_uuid, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
        
        SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '113';
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
        VALUES 
        (tenant_uuid, '11301', 'مخزون المواد الخام', 'Raw Materials Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
        (tenant_uuid, '11302', 'مخزون البضائع الجاهزة', 'Finished Goods Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
        (tenant_uuid, '11303', 'مخزون قطع الغيار', 'Spare Parts Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
        (tenant_uuid, '11304', 'مخزون تحت التشغيل', 'Work in Progress Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true)
        ON CONFLICT (tenant_id, account_code) DO NOTHING;
        accounts_added := accounts_added + 5;
    END IF;

    -- 2. إكمال المصروفات المدفوعة مقدماً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '114', 'المصروفات المدفوعة مقدماً', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '114';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '11401', 'إيجار مدفوع مقدماً', 'Prepaid Rent', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '11402', 'تأمين مدفوع مقدماً', 'Prepaid Insurance', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '11403', 'اشتراكات مدفوعة مقدماً', 'Prepaid Subscriptions', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;
    accounts_added := accounts_added + 4;

    -- 3. إكمال تفاصيل الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '12101', 'الأراضي', 'Land', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12102', 'المباني', 'Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12103', 'مجمع استهلاك المباني', 'Accumulated Depreciation - Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12104', 'الآلات والمعدات', 'Machinery and Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12105', 'مجمع استهلاك الآلات والمعدات', 'Accumulated Depreciation - Machinery', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12106', 'السيارات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12107', 'مجمع استهلاك السيارات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12108', 'الأثاث والتجهيزات', 'Furniture and Fixtures', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12109', 'مجمع استهلاك الأثاث والتجهيزات', 'Accumulated Depreciation - Furniture', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12110', 'أجهزة الحاسوب', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '12111', 'مجمع استهلاك أجهزة الحاسوب', 'Accumulated Depreciation - Computers', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;
    accounts_added := accounts_added + 11;

    -- 4. إكمال الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '21101', 'ذمم الموردين', 'Suppliers Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '21102', 'أوراق الدفع', 'Notes Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '21103', 'مصروفات مستحقة الدفع', 'Accrued Expenses Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '212';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '21201', 'رواتب مستحقة الدفع', 'Accrued Salaries Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '21202', 'مكافآت مستحقة', 'Accrued Bonuses', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '21203', 'إجازات مستحقة', 'Accrued Vacation', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '213';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '21301', 'ضريبة القيمة المضافة', 'VAT Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '21302', 'ضرائب أخرى مستحقة', 'Other Taxes Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '21303', 'رسوم حكومية مستحقة', 'Government Fees Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;
    accounts_added := accounts_added + 9;

    -- 5. إضافة حقوق الملكية (استخدام 'capital' فقط)
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
    (tenant_uuid, '32', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
    (tenant_uuid, '33', 'أرباح السنة الحالية', 'Current Year Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '3101', 'رأس المال المدفوع', 'Paid-in Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '3102', 'علاوة إصدار', 'Share Premium', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '32';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '3201', 'أرباح مرحلة من سنوات سابقة', 'Retained Earnings - Prior Years', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '3202', 'احتياطي قانوني', 'Legal Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '3203', 'احتياطي اختياري', 'Optional Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;
    accounts_added := accounts_added + 8;

    -- 6. إضافة حسابات الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '41', 'إيرادات التشغيل', 'Operating Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (tenant_uuid, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '4101', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '4102', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '4103', 'إيرادات الإيجار', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '4104', 'مردودات ومسموحات المبيعات', 'Sales Returns and Allowances', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '4105', 'خصومات المبيعات', 'Sales Discounts', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '42';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '4201', 'إيرادات الفوائد', 'Interest Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '4202', 'أرباح بيع الأصول', 'Gain on Sale of Assets', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '4203', 'إيرادات متنوعة', 'Miscellaneous Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;
    accounts_added := accounts_added + 10;

    -- 7. إضافة حسابات المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '51', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', 'expense', 'cost_of_goods_sold', parent_id, 2, false, true, 0, 0, true),
    (tenant_uuid, '52', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
    (tenant_uuid, '53', 'مصروفات أخرى', 'Other Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '5101', 'تكلفة المواد المباشرة', 'Direct Materials Cost', 'expense', 'cost_of_goods_sold', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '5102', 'تكلفة العمالة المباشرة', 'Direct Labor Cost', 'expense', 'cost_of_goods_sold', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '5103', 'مصروفات صناعية غير مباشرة', 'Manufacturing Overhead', 'expense', 'cost_of_goods_sold', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '5201', 'الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_uuid, '5202', 'مصروفات المبيعات والتسويق', 'Sales and Marketing Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_uuid, '5203', 'المصروفات الإدارية والعمومية', 'General and Administrative Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true),
    (tenant_uuid, '5204', 'مصروفات الاستهلاك', 'Depreciation Expense', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل الرواتب والأجور
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '5201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '520101', 'الرواتب الأساسية', 'Basic Salaries', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520102', 'البدلات', 'Allowances', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520103', 'العمولات', 'Commissions', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520104', 'المكافآت', 'Bonuses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520105', 'تأمينات اجتماعية', 'Social Insurance', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '5203';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '520301', 'إيجار المكاتب', 'Office Rent', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520302', 'الكهرباء والماء', 'Utilities', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520303', 'الهاتف والإنترنت', 'Telephone and Internet', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520304', 'القرطاسية واللوازم المكتبية', 'Office Supplies', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520305', 'الصيانة والتصليحات', 'Maintenance and Repairs', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520306', 'أتعاب مهنية', 'Professional Fees', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520307', 'التأمين', 'Insurance', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520308', 'البنزين والوقود', 'Fuel and Gas', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل الاستهلاك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '5204';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '520401', 'استهلاك المباني', 'Buildings Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520402', 'استهلاك الآلات والمعدات', 'Machinery Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520403', 'استهلاك السيارات', 'Vehicles Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520404', 'استهلاك الأثاث والتجهيزات', 'Furniture Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true),
    (tenant_uuid, '520405', 'استهلاك أجهزة الحاسوب', 'Computer Equipment Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- المصروفات الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_uuid AND account_code = '53';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_uuid, '5301', 'مصروفات الفوائد', 'Interest Expenses', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '5302', 'خسائر بيع الأصول', 'Loss on Sale of Assets', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '5303', 'مصروفات متنوعة', 'Miscellaneous Expenses', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_uuid, '5304', 'ديون معدومة', 'Bad Debts', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    accounts_added := accounts_added + 33;

    RAISE NOTICE 'تم إكمال دليل الحسابات بنجاح. تم إضافة % حساب جديد.', accounts_added;
    RAISE NOTICE 'دليل الحسابات الآن شامل ومتوافق مع معايير المحاسبة الكويتية KSAAP.';
    
END $$;