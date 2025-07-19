
-- الخطوة الأولى: إنشاء دالة لإعداد دليل الحسابات الشامل للأصول
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    
    -- 1. الأصول (Assets) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance, legal_reference)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0, 'قانون الشركات الكويتي - المادة 142');
    
    -- 1.1 الأصول المتداولة - المستوى الثاني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '12', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);
    
    -- 1.1.1 النقدية وما في حكمها - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '111', 'النقدية وما في حكمها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '112', 'الحسابات المدينة', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '114', 'أصول متداولة أخرى', 'Other Current Assets', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل النقدية - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11101', 'الصندوق', 'Cash on Hand', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11102', 'الحسابات البنكية', 'Bank Accounts', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- تفاصيل الصندوق - المستوى الخامس
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1110101', 'صندوق الفرع الرئيسي', 'Main Branch Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110102', 'صندوق أمانات العملاء', 'Customer Deposits Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- تفاصيل الحسابات البنكية - المستوى الخامس
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1110201', 'البنك التجاري - حساب جاري', 'Commercial Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110202', 'بنك الخليج - حساب جاري', 'Gulf Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110203', 'بيت التمويل الكويتي - حساب استثماري', 'KFH - Investment Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- تفاصيل الحسابات المدينة - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11201', 'العملاء', 'Customers', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11202', 'أوراق القبض', 'Notes Receivable', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- تفاصيل العملاء - المستوى الخامس
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1120101', 'عملاء تأجير شركات', 'Corporate Rental Customers', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1120102', 'عملاء تأجير أفراد', 'Individual Rental Customers', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1120103', 'عملاء مبيعات سيارات', 'Vehicle Sales Customers', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- تفاصيل المخزون - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11301', 'قطع الغيار', 'Spare Parts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '11302', 'الوقود والزيوت', 'Fuel and Oils', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '11303', 'لوازم الصيانة', 'Maintenance Supplies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- الأصول الثابتة - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '121', 'المركبات وأسطول النقل', 'Vehicles and Fleet', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '122', 'العقارات والمباني', 'Real Estate and Buildings', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '123', 'المعدات والأجهزة', 'Equipment and Machinery', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '124', 'الأثاث والتجهيزات', 'Furniture and Fixtures', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل المركبات - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '12101', 'السيارات الصغيرة', 'Small Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12102', 'السيارات المتوسطة', 'Medium Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12103', 'السيارات الكبيرة والفاخرة', 'Large and Luxury Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12104', 'الحافلات والباصات', 'Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12105', 'مجمع إهلاك المركبات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل العقارات - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '122';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '12201', 'مباني المكاتب', 'Office Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12202', 'ورش الصيانة', 'Maintenance Workshops', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12203', 'مواقف السيارات', 'Parking Lots', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12204', 'مجمع إهلاك العقارات', 'Accumulated Depreciation - Real Estate', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    inserted_count := 32;
    
    RETURN inserted_count;
END;
$$;

-- إنشاء دالة لإكمال باقي أقسام دليل الحسابات
CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    
    -- 2. الخصوم (Liabilities) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance, legal_reference)
    VALUES 
    (tenant_id_param, '2', 'الخصوم', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0, 'قانون الشركات الكويتي - المادة 143');
    
    -- 2.1 الخصوم المتداولة - المستوى الثاني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21', 'الخصوم المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '22', 'الخصوم طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);
    
    -- تفاصيل الخصوم المتداولة - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '211', 'الدائنون التجاريون', 'Trade Creditors', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '212', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '213', 'أمانات العملاء', 'Customer Security Deposits', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '214', 'الضرائب والرسوم المستحقة', 'Taxes and Fees Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل الدائنون - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21101', 'موردو المركبات', 'Vehicle Suppliers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21102', 'موردو قطع الغيار', 'Spare Parts Suppliers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21103', 'موردو الوقود', 'Fuel Suppliers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21104', 'موردو خدمات الصيانة', 'Maintenance Service Providers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- 3. حقوق الملكية (Equity) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance, legal_reference)
    VALUES 
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0, 'قانون الشركات الكويتي - المادة 85');
    
    -- تفاصيل حقوق الملكية - المستوى الثاني والثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '32', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '33', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31101', 'رأس المال المدفوع', 'Paid-in Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
    
    -- 4. الإيرادات (Revenue) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0);
    
    -- تفاصيل الإيرادات - المستوى الثاني والثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '42', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- تفاصيل إيرادات التأجير
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41101', 'إيرادات تأجير سيارات يومي', 'Daily Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '41102', 'إيرادات تأجير سيارات شهري', 'Monthly Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '41103', 'إيرادات تأجير حافلات', 'Bus Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0);
    
    -- 5. المصروفات (Expenses) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    -- تفاصيل المصروفات - المستوى الثاني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51', 'المصروفات التشغيلية', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '52', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '53', 'المصروفات الإدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
    
    -- تفاصيل المصروفات التشغيلية - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51101', 'مصروفات الوقود', 'Fuel Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '51102', 'مصروفات التأمين', 'Insurance Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '51103', 'مصروفات التسجيل والترخيص', 'Registration and License Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0);
    
    -- تفاصيل مصروفات الصيانة - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52101', 'صيانة دورية', 'Preventive Maintenance', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '52102', 'إصلاحات طارئة', 'Emergency Repairs', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '52103', 'قطع غيار', 'Spare Parts', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0);
    
    inserted_count := 33;
    
    RETURN inserted_count;
END;
$$;

-- إنشاء دالة لإضافة الحسابات المتخصصة
CREATE OR REPLACE FUNCTION public.add_specialized_rental_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    
    -- إضافة حسابات متخصصة لتأجير السيارات
    
    -- 1. حسابات العمولات والخصومات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '43';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '43101', 'عمولات وسطاء', 'Broker Commissions', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '43102', 'رسوم التأخير', 'Late Fees', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '43103', 'رسوم الإلغاء', 'Cancellation Fees', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0);
    
    -- 2. حسابات مخصصات الصيانة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '215', 'مخصصات الصيانة', 'Maintenance Provisions', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '215';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21501', 'مخصص صيانة سيارات', 'Vehicle Maintenance Provision', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21502', 'مخصص إطارات وبطاريات', 'Tires and Batteries Provision', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- 3. حسابات التقسيط والسداد
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11203', 'أقساط مستحقة القبض', 'Installments Receivable', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    inserted_count := 7;
    
    RETURN inserted_count;
END;
$$;

-- إنشاء دالة رئيسية لتطبيق جميع التحسينات
CREATE OR REPLACE FUNCTION public.implement_comprehensive_chart_improvements(tenant_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assets_created INTEGER := 0;
    liabilities_created INTEGER := 0;
    specialized_created INTEGER := 0;
    total_created INTEGER := 0;
    result_data JSONB;
BEGIN
    -- تطبيق الأصول
    SELECT public.setup_comprehensive_chart_of_accounts(tenant_id_param) INTO assets_created;
    
    -- تطبيق باقي الحسابات
    SELECT public.complete_liabilities_equity_revenue_expenses(tenant_id_param) INTO liabilities_created;
    
    -- تطبيق الحسابات المتخصصة
    SELECT public.add_specialized_rental_accounts(tenant_id_param) INTO specialized_created;
    
    total_created := assets_created + liabilities_created + specialized_created;
    
    result_data := jsonb_build_object(
        'success', true,
        'tenant_id', tenant_id_param,
        'assets_accounts_created', assets_created,
        'other_accounts_created', liabilities_created,
        'specialized_accounts_created', specialized_created,
        'total_accounts_created', total_created,
        'implementation_date', now()
    );
    
    RETURN result_data;
END;
$$;

-- تحديث الحسابات الموجودة لتحسين الهيكل
UPDATE public.chart_of_accounts 
SET 
    account_name = 'مركبات أسطول التأجير',
    account_name_en = 'Rental Fleet Vehicles',
    notes = 'جميع المركبات المخصصة للتأجير'
WHERE account_code ILIKE '%vehicle%' OR account_name ILIKE '%سيار%';

-- إضافة حقول جديدة لربط الحسابات بمراكز التكلفة
ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id),
ADD COLUMN IF NOT EXISTS requires_cost_center BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_cost_center_id UUID REFERENCES public.cost_centers(id);
