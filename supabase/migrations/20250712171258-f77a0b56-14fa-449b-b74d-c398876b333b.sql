-- حذف الدالة القديمة وإنشاء دالة جديدة مطابقة للقائمة المرسلة
DROP FUNCTION IF EXISTS public.create_default_chart_of_accounts(UUID);
DROP FUNCTION IF EXISTS public.setup_default_accounts_for_tenant(UUID);

-- إنشاء دالة جديدة مطابقة للقائمة التفصيلية المرسلة
CREATE OR REPLACE FUNCTION public.create_correct_chart_of_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف أي حسابات موجودة للمؤسسة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1000', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0),
    (tenant_id_param, '2000', 'الخصوم', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0),
    (tenant_id_param, '3000', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0),
    (tenant_id_param, '4000', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0),
    (tenant_id_param, '5000', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    inserted_count := inserted_count + 5;

    -- المستوى الثاني - الأصول
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1000';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1100', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '1200', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - الخصوم  
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2000';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2100', 'الخصوم المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '2200', 'الخصوم طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3000';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3100', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '3200', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4000';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4100', 'إيرادات التشغيل', 'Operating Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '4200', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5000';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5100', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '5200', 'مصروفات أخرى', 'Other Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0);
    
    inserted_count := inserted_count + 8;

    -- المستوى الثالث - الأصول المتداولة التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1100';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1110', 'النقدية وما في حكمها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1120', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1130', 'عملاء عقود الإيجار', 'Rental Contracts Receivables', 'asset', 'current_asset', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '1140', 'المخالفات المرورية المدينة', 'Traffic Violations Receivable', 'asset', 'current_asset', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '1150', 'ذمم مدينة أخرى', 'Other Receivables', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1160', 'مصروفات مدفوعة مقدماً', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1170', 'مخزون قطع الغيار', 'Spare Parts Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الأصول الثابتة التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1200';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1210', 'السيارات والمركبات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1220', 'المباني والإنشاءات', 'Buildings and Constructions', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1230', 'الأثاث والتجهيزات', 'Furniture and Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1240', 'أجهزة الحاسوب', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1250', 'معدات أخرى', 'Other Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1260', 'مجمع استهلاك السيارات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1270', 'مجمع استهلاك المباني', 'Accumulated Depreciation - Buildings', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '1280', 'مجمع استهلاك الأثاث', 'Accumulated Depreciation - Furniture', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الخصوم المتداولة التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2100';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2110', 'رواتب وأجور مستحقة', 'Accrued Salaries and Wages', 'liability', 'current_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '2120', 'ضرائب مستحقة على الرواتب', 'Accrued Payroll Taxes', 'liability', 'current_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '2121', 'تأمينات اجتماعية مستحقة', 'Accrued Social Insurance', 'liability', 'current_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '2122', 'خصومات أخرى مستحقة', 'Other Accrued Deductions', 'liability', 'current_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '2130', 'عربون عقود الإيجار', 'Rental Deposits Payable', 'liability', 'current_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '2131', 'إيرادات مؤجلة - عقود الإيجار', 'Deferred Revenue - Rentals', 'liability', 'current_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '2140', 'ضرائب مستحقة على العقود', 'Accrued Contract Taxes', 'liability', 'current_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '2150', 'موردون وأرصدة دائنة', 'Suppliers and Creditors', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '2160', 'مستحقات أخرى', 'Other Accruals', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الإيرادات التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4100';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4110', 'إيرادات تأجير المركبات', 'Vehicle Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4111', 'إيرادات التأمين على المركبات', 'Vehicle Insurance Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4112', 'إيرادات العربون', 'Security Deposit Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4113', 'خصومات العقود', 'Contract Discounts', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4120', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '4130', 'إيرادات الغرامات والجزاءات', 'Fines and Penalties Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '4150', 'إيرادات المخالفات المرورية', 'Traffic Violations Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0);
    
    -- المستوى الثالث - المصروفات التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5100';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5110', 'رواتب وأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5111', 'علاوات ومكافآت', 'Allowances and Bonuses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5112', 'ساعات إضافية', 'Overtime', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5120', 'ضرائب على الرواتب', 'Payroll Taxes', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5121', 'تأمينات اجتماعية - حصة الشركة', 'Social Insurance - Company Share', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5130', 'صيانة وإصلاح المركبات', 'Vehicle Maintenance and Repair', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '5140', 'الوقود والزيوت', 'Fuel and Oils', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '5150', 'التأمين على المركبات', 'Vehicle Insurance', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '5160', 'رسوم الترخيص والتجديد', 'License and Renewal Fees', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '5170', 'استهلاك المركبات', 'Vehicle Depreciation', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '5180', 'مصروفات تشغيلية أخرى', 'Other Operating Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    inserted_count := inserted_count + 41;

    -- المستوى الرابع - تفاصيل إضافية للحسابات الفرعية
    -- تفاصيل النقدية والبنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1110';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1111', 'الصندوق الرئيسي', 'Main Cash Fund', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1112', 'عهدة نقدية', 'Cash in Hand', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1120';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1121', 'البنك التجاري الكويتي', 'Commercial Bank of Kuwait', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1122', 'بنك الخليج', 'Gulf Bank', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1123', 'بنك بيت التمويل الكويتي', 'Kuwait Finance House', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل الذمم المدينة الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1150';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1151', 'سلف الموظفين', 'Employee Advances', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1152', 'ذمم موظفين أخرى', 'Other Employee Receivables', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1153', 'تأمينات قابلة للاسترداد', 'Recoverable Deposits', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل السيارات والمركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1210';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1211', 'سيارات صالون', 'Sedan Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1212', 'باصات', 'Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1213', 'سيارات رياضية متعددة الاستخدامات', 'SUVs', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1214', 'سيارات تجارية', 'Commercial Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل الموردين والأرصدة الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2150';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2151', 'موردو قطع الغيار', 'Spare Parts Suppliers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '2152', 'مورو الوقود', 'Fuel Suppliers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '2153', 'موردو الخدمات', 'Service Providers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3100';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3101', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '3102', 'احتياطي قانوني', 'Legal Reserve', 'equity', 'capital', parent_id, 4, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3200';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3201', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '3202', 'أرباح العام الحالي', 'Current Year Profits', 'equity', 'capital', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل إيرادات أخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4200';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4201', 'إيرادات بيع أصول', 'Asset Disposal Revenue', 'revenue', 'other_revenue', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '4202', 'إيرادات أخرى متنوعة', 'Miscellaneous Revenue', 'revenue', 'other_revenue', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل المصروفات الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5200';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5201', 'رواتب الموظفين', 'Employee Salaries', 'expense', 'other_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '5210', 'مصروفات إدارية عامة', 'General Administrative Expenses', 'expense', 'other_expense', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '5220', 'مصروفات تسويق ودعاية', 'Marketing and Advertising Expenses', 'expense', 'other_expense', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '5230', 'مصروفات مالية', 'Financial Expenses', 'expense', 'other_expense', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '5240', 'مصروفات متنوعة', 'Miscellaneous Expenses', 'expense', 'other_expense', parent_id, 4, false, true, 0, 0);
    
    inserted_count := inserted_count + 31;

    RETURN inserted_count;
END;
$$;

-- إنشاء دالة لتطبيق شجرة الحسابات الصحيحة على مؤسسة
CREATE OR REPLACE FUNCTION public.setup_correct_accounts_for_tenant(tenant_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    accounts_count INTEGER;
BEGIN
    -- إنشاء شجرة الحسابات الصحيحة (ستحذف الحسابات القديمة تلقائياً)
    PERFORM public.create_correct_chart_of_accounts(tenant_id_param);
    
    RETURN TRUE;
END;
$$;