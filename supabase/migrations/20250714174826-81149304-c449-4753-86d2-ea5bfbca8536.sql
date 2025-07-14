-- Create comprehensive default chart of accounts system
-- Phase 1: Enhanced setup function with complete Kuwait-compliant structure

CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف الحسابات الموجودة للمؤسسة المحددة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant, zakat_applicable)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0, true, false),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0, true, false),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0, true, false),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0, true, false),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0, true, false);
    
    inserted_count := inserted_count + 5;

    -- الأصول المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '12', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '13', 'أصول أخرى', 'Other Assets', 'asset', 'other_asset', parent_id, 2, false, true, 0, 0, true);

    -- النقدية والبنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '111', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11101', 'الصندوق', 'Cash', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '11102', 'البنوك المحلية', 'Local Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '11103', 'البنوك الأجنبية', 'Foreign Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true);

    -- تفاصيل الصندوق
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1110101', 'صندوق المكتب الرئيسي', 'Main Office Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110102', 'صندوق الفرع الأول', 'Branch 1 Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110103', 'صندوق العملات الأجنبية', 'Foreign Currency Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true);

    -- البنوك المحلية - البنوك الكويتية الرئيسية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1110201', 'بنك الكويت الوطني - الحساب الجاري', 'NBK - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110202', 'بنك الخليج - الحساب الجاري', 'Gulf Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110203', 'بنك بوبيان - الحساب الجاري', 'Boubyan Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110204', 'بنك الكويت التجاري - الحساب الجاري', 'CBK - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110205', 'بيت التمويل الكويتي - الحساب الجاري', 'KFH - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true);

    -- الذمم المدينة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '112', 'الذمم المدينة', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11201', 'ذمم العملاء - الشركات', 'Customer Receivables - Companies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11202', 'ذمم العملاء - الأفراد', 'Customer Receivables - Individuals', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11203', 'أوراق القبض', 'Notes Receivable', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11204', 'مخصص الديون المشكوك في تحصيلها', 'Allowance for Doubtful Debts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11205', 'دفعات مقدمة للموردين', 'Advances to Suppliers', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true);

    -- المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11301', 'مخزون قطع الغيار', 'Spare Parts Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11302', 'مخزون الوقود والزيوت', 'Fuel and Oil Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11303', 'مخزون المواد الاستهلاكية', 'Consumable Materials Inventory', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true);

    -- المصروفات المدفوعة مقدماً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '114', 'المصروفات المدفوعة مقدماً', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '114';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11401', 'إيجارات مدفوعة مقدماً', 'Prepaid Rent', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11402', 'تأمينات مدفوعة مقدماً', 'Prepaid Insurance', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11403', 'رسوم حكومية مدفوعة مقدماً', 'Prepaid Government Fees', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true);

    -- الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '121', 'المركبات والمعدات', 'Vehicles and Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '122', 'المباني والعقارات', 'Buildings and Real Estate', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '123', 'الأثاث والمعدات المكتبية', 'Furniture and Office Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '124', 'مجمع الإهلاك', 'Accumulated Depreciation', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0, true);

    -- المركبات والمعدات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '12101', 'السيارات الصغيرة', 'Small Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '12102', 'السيارات المتوسطة', 'Medium Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '12103', 'السيارات الكبيرة والدفع الرباعي', 'Large Cars and SUVs', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '12104', 'الحافلات والباصات', 'Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '12105', 'معدات الصيانة والورشة', 'Maintenance and Workshop Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true);

    -- مجمع الإهلاك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '124';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '12401', 'مجمع إهلاك السيارات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '12402', 'مجمع إهلاك المباني', 'Accumulated Depreciation - Buildings', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '12403', 'مجمع إهلاك الأثاث والمعدات', 'Accumulated Depreciation - Furniture and Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0, true);

    inserted_count := inserted_count + 35;
    
    RETURN inserted_count;
END;
$function$;

-- إنشاء دالة إضافية لإكمال باقي الحسابات
CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(tenant_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    
    -- الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '22', 'الالتزامات طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0, true);

    -- الذمم الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '211', 'الذمم الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '212', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '213', 'الضرائب والرسوم المستحقة', 'Accrued Taxes and Fees', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '214', 'أمانات العملاء', 'Customer Deposits', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true);

    -- تفاصيل الذمم الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21101', 'ذمم الموردين', 'Suppliers Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21102', 'ذمم شركات التأمين', 'Insurance Companies Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21103', 'ذمم ورش الصيانة الخارجية', 'External Maintenance Workshops Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true);

    -- المصروفات المستحقة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '212';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21201', 'رواتب مستحقة', 'Accrued Salaries', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21202', 'مكافآت نهاية الخدمة مستحقة', 'Accrued End of Service Benefits', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21203', 'فوائد قروض مستحقة', 'Accrued Interest on Loans', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true);

    -- أمانات العملاء
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '214';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21401', 'أمانات التأجير', 'Rental Deposits', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21402', 'أمانات التأمين', 'Insurance Deposits', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '21403', 'دفعات مقدمة من العملاء', 'Customer Advance Payments', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0, true);

    -- حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '32', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '33', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0, true);

    -- رأس المال
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '3101', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '3102', 'رأس المال المصرح به', 'Authorized Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true);

    -- الاحتياطيات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '32';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '3201', 'احتياطي قانوني', 'Legal Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '3202', 'احتياطي عام', 'General Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '3203', 'احتياطي طوارئ', 'Emergency Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0, true);

    -- الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Income', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '42', 'إيرادات الخدمات', 'Service Income', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '43', 'إيرادات أخرى', 'Other Income', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0, true);

    -- إيرادات التأجير
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '4101', 'إيرادات تأجير السيارات - الشركات', 'Car Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4102', 'إيرادات تأجير السيارات - الأفراد', 'Car Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4103', 'إيرادات تأجير الحافلات', 'Bus Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4104', 'إيرادات التأجير اليومي', 'Daily Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4105', 'إيرادات التأجير الشهري', 'Monthly Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true);

    -- إيرادات الخدمات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '4201', 'إيرادات خدمات الصيانة', 'Maintenance Service Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4202', 'إيرادات خدمات التوصيل', 'Delivery Service Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4203', 'إيرادات بيع قطع الغيار', 'Spare Parts Sales Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '4204', 'إيرادات خدمات التأمين', 'Insurance Service Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0, true);

    -- المصروفات التشغيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '51', 'المصروفات التشغيلية', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '52', 'المصروفات الإدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '53', 'المصروفات المالية', 'Financial Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0, true);

    -- المصروفات التشغيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5101', 'الوقود والزيوت', 'Fuel and Oil', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5102', 'صيانة المركبات', 'Vehicle Maintenance', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5103', 'التأمين', 'Insurance', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5104', 'الإهلاك', 'Depreciation', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5105', 'إيجار المركبات', 'Vehicle Rentals', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true);

    -- المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '5201', 'الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5202', 'الإيجارات', 'Rent Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5203', 'الكهرباء والماء', 'Utilities', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5204', 'الاتصالات', 'Communications', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5205', 'القرطاسية والمطبوعات', 'Stationery and Printing', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true),
    (tenant_id_param, '5206', 'الرسوم الحكومية', 'Government Fees', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0, true);

    inserted_count := inserted_count + 52;
    
    RETURN inserted_count;
END;
$function$;

-- تحديث الدالة الرئيسية لتطبيق النظام الكامل
CREATE OR REPLACE FUNCTION public.apply_comprehensive_default_chart()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    tenant_record RECORD;
    total_created INTEGER := 0;
    assets_count INTEGER := 0;
    other_count INTEGER := 0;
    result_data JSONB := '{}';
BEGIN
    -- تطبيق دليل الحسابات الشامل على جميع المؤسسات الموجودة
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants 
        WHERE status = 'active' 
        AND id != '00000000-0000-0000-0000-000000000000'
    ) LOOP
        BEGIN
            -- تطبيق الجزء الأول (الأصول)
            SELECT public.setup_comprehensive_chart_of_accounts(tenant_record.id) INTO assets_count;
            
            -- تطبيق الجزء الثاني (باقي الحسابات)
            SELECT public.complete_liabilities_equity_revenue_expenses(tenant_record.id) INTO other_count;
            
            total_created := total_created + assets_count + other_count;
            
            -- تسجيل النتائج
            result_data := result_data || jsonb_build_object(
                tenant_record.id::text, 
                jsonb_build_object(
                    'tenant_name', tenant_record.name,
                    'accounts_created', assets_count + other_count,
                    'status', 'success'
                )
            );
            
        EXCEPTION WHEN OTHERS THEN
            result_data := result_data || jsonb_build_object(
                tenant_record.id::text,
                jsonb_build_object(
                    'tenant_name', tenant_record.name,
                    'accounts_created', 0,
                    'status', 'error',
                    'error_message', SQLERRM
                )
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'total_accounts_created', total_created,
        'migration_date', now(),
        'results_by_tenant', result_data
    );
END;
$function$;

-- تطبيق دليل الحسابات على مؤسسة جديدة تلقائياً
CREATE OR REPLACE FUNCTION public.auto_setup_new_tenant_comprehensive_accounting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    accounts_created INTEGER := 0;
    additional_accounts INTEGER := 0;
BEGIN
    -- تطبيق دليل الحسابات الشامل للمؤسسة الجديدة
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        SELECT public.setup_comprehensive_chart_of_accounts(NEW.id) INTO accounts_created;
        SELECT public.complete_liabilities_equity_revenue_expenses(NEW.id) INTO additional_accounts;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- تحديث المؤشر (trigger) للمؤسسات الجديدة
DROP TRIGGER IF EXISTS auto_setup_new_tenant_accounting ON public.tenants;
CREATE TRIGGER auto_setup_new_tenant_comprehensive_accounting
    AFTER UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_setup_new_tenant_comprehensive_accounting();