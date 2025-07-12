-- إنشاء دليل حسابات شامل ومفصل للشركة

-- حذف جميع الحسابات الموجودة أولاً
CREATE OR REPLACE FUNCTION public.create_comprehensive_chart_of_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف جميع الحسابات الموجودة للمؤسسة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    inserted_count := inserted_count + 5;

    -- المستوى الثاني - الأصول المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0);
    
    -- النقدية والبنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1101', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل النقدية والبنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '110101', 'النقدية في الصندوق', 'Cash on Hand', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110102', 'البنك التجاري الكويتي', 'Commercial Bank of Kuwait', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110103', 'بنك الكويت الوطني', 'National Bank of Kuwait', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110104', 'بيت التمويل الكويتي', 'Kuwait Finance House', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110105', 'بنك الخليج', 'Gulf Bank', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);

    -- الحسابات المدينة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1102', 'الحسابات المدينة', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '110201', 'عملاء - أفراد', 'Customers - Individuals', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110202', 'عملاء - شركات', 'Customers - Companies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110203', 'عملاء - جهات حكومية', 'Customers - Government Entities', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110204', 'أوراق القبض', 'Notes Receivable', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110205', 'مخصص الديون المشكوك فيها', 'Allowance for Doubtful Debts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);

    -- المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1103', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1103';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '110301', 'قطع الغيار', 'Spare Parts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110302', 'المحروقات', 'Fuel', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110303', 'اللوازم المكتبية', 'Office Supplies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110304', 'مواد التنظيف', 'Cleaning Supplies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);

    -- المصروفات المدفوعة مقدماً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1104', 'المصروفات المدفوعة مقدماً', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1104';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '110401', 'إيجارات مدفوعة مقدماً', 'Prepaid Rent', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110402', 'تأمينات مدفوعة مقدماً', 'Prepaid Insurance', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '110403', 'مصروفات أخرى مدفوعة مقدماً', 'Other Prepaid Expenses', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);

    -- الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '12', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);

    -- الأراضي والمباني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1201', 'الأراضي والمباني', 'Land and Buildings', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '120101', 'الأراضي', 'Land', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120102', 'المباني', 'Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120103', 'مجمع إهلاك المباني', 'Accumulated Depreciation - Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);

    -- المعدات والآلات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1202', 'المعدات والآلات', 'Equipment and Machinery', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1202';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '120201', 'معدات الورشة', 'Workshop Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120202', 'معدات الحاسوب', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120203', 'مجمع إهلاك المعدات', 'Accumulated Depreciation - Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);

    -- المركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1203', 'المركبات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1203';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '120301', 'سيارات الأجرة', 'Taxi Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120302', 'الحافلات', 'Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120303', 'الشاحنات', 'Trucks', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120304', 'مجمع إهلاك المركبات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);

    -- الأثاث والمعدات المكتبية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1204', 'الأثاث والمعدات المكتبية', 'Furniture and Office Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1204';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '120401', 'الأثاث المكتبي', 'Office Furniture', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120402', 'المعدات المكتبية', 'Office Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '120403', 'مجمع إهلاك الأثاث والمعدات', 'Accumulated Depreciation - Furniture & Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);

    -- الخصوم المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21', 'الخصوم المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0);

    -- الحسابات الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2101', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '210101', 'موردون', 'Suppliers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '210102', 'أوراق الدفع', 'Notes Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '210103', 'دائنون آخرون', 'Other Creditors', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);

    -- المستحقات والمخصصات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2102', 'المستحقات والمخصصات', 'Accruals and Provisions', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '210201', 'مستحقات الرواتب', 'Accrued Salaries', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '210202', 'مخصص نهاية الخدمة', 'End of Service Provision', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '210203', 'مستحقات ضريبية', 'Tax Accruals', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '210204', 'مستحقات أخرى', 'Other Accruals', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);

    -- الودائع والأمانات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2103', 'الودائع والأمانات', 'Deposits and Security', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2103';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '210301', 'ودائع العملاء', 'Customer Deposits', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '210302', 'أمانات تأمين', 'Security Deposits', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);

    -- القروض طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '22', 'القروض طويلة الأجل', 'Long-term Loans', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2201', 'قروض بنكية طويلة الأجل', 'Long-term Bank Loans', 'liability', 'long_term_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '2202', 'قروض أخرى طويلة الأجل', 'Other Long-term Loans', 'liability', 'long_term_liability', parent_id, 3, true, true, 0, 0);

    -- حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3101', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '3102', 'علاوة الإصدار', 'Share Premium', 'equity', 'capital', parent_id, 3, true, true, 0, 0);

    -- الاحتياطيات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '32', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '32';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3201', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '3202', 'احتياطي طوارئ', 'Emergency Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0);

    -- الأرباح المرحلة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '33', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '33';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3301', 'أرباح مرحلة من سنوات سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '3302', 'أرباح السنة الحالية', 'Current Year Earnings', 'equity', 'capital', parent_id, 3, true, true, 0, 0);

    -- الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0);

    -- إيرادات تأجير السيارات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4101', 'إيرادات تأجير السيارات', 'Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '410101', 'إيراد تأجير سيارات يومي', 'Daily Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '410102', 'إيراد تأجير سيارات أسبوعي', 'Weekly Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '410103', 'إيراد تأجير سيارات شهري', 'Monthly Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '410104', 'إيراد تأجير سيارات سنوي', 'Annual Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);

    -- إيرادات تأجير الحافلات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4102', 'إيرادات تأجير الحافلات', 'Bus Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '410201', 'إيراد تأجير حافلات يومي', 'Daily Bus Rental Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '410202', 'إيراد تأجير حافلات رحلات', 'Bus Trip Rental Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);

    -- إيرادات الخدمات الإضافية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42', 'إيرادات الخدمات الإضافية', 'Additional Services Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4201', 'إيرادات التوصيل والاستلام', 'Delivery and Pickup Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4202', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4203', 'إيرادات التأمين الإضافي', 'Additional Insurance Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0);

    -- إيرادات أخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '43', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '43';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4301', 'إيرادات فوائد', 'Interest Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4302', 'إيرادات بيع أصول', 'Asset Sale Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4303', 'إيرادات متنوعة', 'Miscellaneous Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0);

    -- مصروفات التشغيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);

    -- الرواتب والأجور
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5101', 'الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '510101', 'رواتب الإدارة', 'Management Salaries', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510102', 'رواتب الموظفين', 'Employee Salaries', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510103', 'البدلات', 'Allowances', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510104', 'العمولات', 'Commissions', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510105', 'مكافآت نهاية الخدمة', 'End of Service Benefits', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);

    -- مصروفات المركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5102', 'مصروفات المركبات', 'Vehicle Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '510201', 'الوقود', 'Fuel', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510202', 'الصيانة والإصلاح', 'Maintenance and Repairs', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510203', 'قطع الغيار', 'Spare Parts', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510204', 'التأمين', 'Insurance', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510205', 'رخص المركبات', 'Vehicle Licenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);

    -- المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5103', 'المصروفات الإدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5103';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '510301', 'الإيجارات', 'Rent', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510302', 'الكهرباء والماء', 'Electricity and Water', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510303', 'الهاتف والإنترنت', 'Telephone and Internet', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510304', 'القرطاسية واللوازم المكتبية', 'Stationery and Office Supplies', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510305', 'المصروفات القانونية والمهنية', 'Legal and Professional Fees', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);

    -- الإهلاك والاستهلاك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5104', 'الإهلاك والاستهلاك', 'Depreciation and Amortization', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5104';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '510401', 'إهلاك المباني', 'Building Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510402', 'إهلاك المركبات', 'Vehicle Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510403', 'إهلاك المعدات', 'Equipment Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '510404', 'إهلاك الأثاث', 'Furniture Depreciation', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);

    -- مصروفات أخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52', 'مصروفات أخرى', 'Other Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5201', 'مصروفات فوائد', 'Interest Expenses', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5202', 'مصروفات بنكية', 'Bank Charges', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5203', 'خسائر أصول', 'Asset Losses', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5204', 'مصروفات متنوعة', 'Miscellaneous Expenses', 'expense', 'other_expense', parent_id, 3, true, true, 0, 0);

    -- حساب العدد الإجمالي للحسابات المدرجة
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$$;