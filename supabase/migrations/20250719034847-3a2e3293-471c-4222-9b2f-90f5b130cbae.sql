
-- إعداد دليل الحسابات المحسن وفقاً للمعايير المحاسبية الكويتية
-- المرحلة الأولى: إعادة هيكلة دليل الحسابات

-- إضافة حقول جديدة لتحسين دليل الحسابات
ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS account_name_arabic TEXT,
ADD COLUMN IF NOT EXISTS account_name_english TEXT,
ADD COLUMN IF NOT EXISTS legal_reference TEXT,
ADD COLUMN IF NOT EXISTS regulatory_code TEXT,
ADD COLUMN IF NOT EXISTS ministry_commerce_code TEXT,
ADD COLUMN IF NOT EXISTS ksaap_compliant BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS zakat_applicable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consolidation_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS report_position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_reconcile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS required_documentation TEXT[] DEFAULT '{}';

-- دالة لإنشاء دليل الحسابات الشامل المحسن
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف الحسابات الموجودة للمؤسسة (إن وجدت)
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- 1. الأصول (Assets) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance, legal_reference, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0, 'قانون الشركات الكويتي - المادة 142', true);
    
    -- 1.1 الأصول المتداولة - المستوى الثاني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '13', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);
    
    -- 1.1.1 النقدية والبنوك - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '111', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '112', 'المدينون', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '114', 'المصروفات المقدمة', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل النقدية والبنوك - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, auto_reconcile)
    VALUES 
    (tenant_id_param, '11101', 'صندوق النقدية الرئيسي', 'Main Cash Fund', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, false),
    (tenant_id_param, '11102', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '11103', 'النقدية بالعملات الأجنبية', 'Foreign Currency Cash', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, false);
    
    -- تفاصيل صندوق النقدية - المستوى الخامس
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1110101', 'صندوق النقدية - الفرع الرئيسي', 'Main Branch Cash Fund', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110102', 'صندوق النقدية الصغيرة', 'Petty Cash Fund', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110103', 'صندوق النقدية - المبيعات', 'Sales Cash Fund', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- تفاصيل البنوك - المستوى الخامس
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, auto_reconcile)
    VALUES 
    (tenant_id_param, '1110201', 'بنك الكويت الوطني - حساب جاري', 'NBK - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110202', 'بنك الخليج - حساب جاري', 'Gulf Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110203', 'بنك برقان - حساب توفير', 'Burgan Bank - Savings Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110204', 'بنك الأهلي - حساب استثماري', 'Ahli Bank - Investment Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true);
    
    -- تفاصيل المدينون - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11201', 'عملاء تأجير السيارات', 'Car Rental Customers', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11202', 'المدينون الآخرون', 'Other Debtors', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11203', 'أوراق القبض', 'Notes Receivable', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11204', 'مخصص الديون المشكوك فيها', 'Allowance for Doubtful Debts', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- تفاصيل عملاء تأجير السيارات - المستوى الخامس
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1120101', 'عملاء تأجير - شركات', 'Corporate Rental Customers', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1120102', 'عملاء تأجير - أفراد', 'Individual Rental Customers', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1120103', 'عملاء تأجير - حكومة', 'Government Rental Customers', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1120104', 'ضمانات مستردة من العملاء', 'Customer Deposits Recoverable', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- الأصول الثابتة - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '13';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '131', 'المركبات والمعدات', 'Vehicles and Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '132', 'مجمع الاستهلاك', 'Accumulated Depreciation', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '133', 'المباني والإنشاءات', 'Buildings and Constructions', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '134', 'الأصول غير الملموسة', 'Intangible Assets', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل المركبات - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '131';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '13101', 'السيارات الصغيرة', 'Small Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '13102', 'السيارات المتوسطة', 'Medium Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '13103', 'السيارات الفاخرة', 'Luxury Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '13104', 'الحافلات والباصات', 'Buses and Coaches', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '13105', 'معدات الورشة', 'Workshop Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- مجمع الاستهلاك - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '132';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '13201', 'مجمع استهلاك السيارات الصغيرة', 'Accumulated Depreciation - Small Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '13202', 'مجمع استهلاك السيارات المتوسطة', 'Accumulated Depreciation - Medium Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '13203', 'مجمع استهلاك السيارات الفاخرة', 'Accumulated Depreciation - Luxury Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '13204', 'مجمع استهلاك الحافلات', 'Accumulated Depreciation - Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '13205', 'مجمع استهلاك معدات الورشة', 'Accumulated Depreciation - Workshop Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    inserted_count := inserted_count + 35;
    
    RETURN inserted_count;
END;
$$;

-- دالة لإكمال باقي دليل الحسابات (الخصوم، حقوق الملكية، الإيرادات، المصروفات)
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
    (tenant_id_param, '211', 'الدائنون', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '212', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '213', 'ضمانات العملاء', 'Customer Deposits', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '214', 'الضرائب المستحقة', 'Taxes Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل الدائنون - المستوى الرابع
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21101', 'موردو قطع الغيار', 'Spare Parts Suppliers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21102', 'موردو الوقود', 'Fuel Suppliers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21103', 'موردو الخدمات', 'Service Providers', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- 3. حقوق الملكية (Equity) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance, legal_reference)
    VALUES 
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0, 'قانون الشركات الكويتي - المادة 85');
    
    -- تفاصيل حقوق الملكية - المستوى الثاني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31', 'رأس المال', 'Share Capital', 'equity', 'capital', parent_id, 2, true, true, 0, 0),
    (tenant_id_param, '32', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '33', 'الأرباح المدورة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, true, true, 0, 0),
    (tenant_id_param, '34', 'أرباح السنة الجارية', 'Current Year Earnings', 'equity', 'capital', parent_id, 2, true, true, 0, 0);
    
    -- 4. الإيرادات (Revenue) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0);
    
    -- تفاصيل الإيرادات - المستوى الثاني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41', 'إيرادات تأجير السيارات', 'Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '42', 'إيرادات الخدمات المساندة', 'Support Services Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- تفاصيل إيرادات تأجير السيارات - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41101', 'إيرادات تأجير يومي', 'Daily Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '41102', 'إيرادات تأجير أسبوعي', 'Weekly Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '41103', 'إيرادات تأجير شهري', 'Monthly Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '41104', 'إيرادات تأجير سنوي', 'Annual Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0);
    
    -- 5. المصروفات (Expenses) - المستوى الأول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    -- تفاصيل المصروفات - المستوى الثاني
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51', 'مصروفات تشغيلية', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '53', 'مصروفات الاستهلاك', 'Depreciation Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
    
    -- تفاصيل المصروفات التشغيلية - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51101', 'مصروفات الوقود', 'Fuel Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '51102', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '51103', 'مصروفات التأمين', 'Insurance Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '51104', 'مصروفات التسجيل والترخيص', 'Registration and Licensing Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0);
    
    -- مصروفات الاستهلاك - المستوى الثالث
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '53';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '53101', 'استهلاك السيارات', 'Vehicle Depreciation', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '53102', 'استهلاك المعدات', 'Equipment Depreciation', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '53103', 'استهلاك المباني', 'Building Depreciation', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0);
    
    inserted_count := inserted_count + 30;
    
    RETURN inserted_count;
END;
$$;

-- دالة شاملة لتطبيق دليل الحسابات على جميع المؤسسات
CREATE OR REPLACE FUNCTION public.apply_comprehensive_default_chart()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- دالة لتنظيف الحسابات المكررة
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_accounts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_record RECORD;
  primary_account_id UUID;
  secondary_account_id UUID;
  affected_count INTEGER := 0;
  cleanup_summary JSONB := '[]'::jsonb;
  cleanup_item JSONB;
BEGIN
  -- التعامل مع حسابات النقدية المكررة أولاً
  FOR duplicate_record IN (
    SELECT 
      account_name,
      account_type,
      ARRAY_AGG(id ORDER BY created_at ASC) as account_ids,
      ARRAY_AGG(account_code ORDER BY created_at ASC) as account_codes
    FROM public.chart_of_accounts 
    WHERE account_name ILIKE '%صندوق%' OR account_name ILIKE '%نقدية%' OR account_name ILIKE '%cash%'
    AND is_active = true
    GROUP BY account_name, account_type
    HAVING COUNT(*) > 1
  ) LOOP
    -- اختيار الحساب الأساسي (الأقدم)
    primary_account_id := duplicate_record.account_ids[1];
    
    -- معالجة الحسابات الثانوية
    FOR i IN 2..array_length(duplicate_record.account_ids, 1) LOOP
      secondary_account_id := duplicate_record.account_ids[i];
      
      -- نقل أي أرصدة من الحساب الثانوي إلى الأساسي
      UPDATE public.chart_of_accounts 
      SET current_balance = current_balance + (
        SELECT COALESCE(current_balance, 0) 
        FROM public.chart_of_accounts 
        WHERE id = secondary_account_id
      )
      WHERE id = primary_account_id;
      
      -- تحديث أي قيود محاسبية تشير للحساب الثانوي
      UPDATE public.journal_entry_lines 
      SET account_id = primary_account_id 
      WHERE account_id = secondary_account_id;
      
      -- إلغاء تفعيل الحساب الثانوي بدلاً من حذفه
      UPDATE public.chart_of_accounts 
      SET 
        is_active = false,
        account_name = account_name || ' (مدمج)',
        notes = COALESCE(notes, '') || ' - تم دمج هذا الحساب مع ' || duplicate_record.account_codes[1],
        updated_at = now()
      WHERE id = secondary_account_id;
      
      affected_count := affected_count + 1;
    END LOOP;
    
    -- إضافة معلومات التنظيف للتقرير
    cleanup_item := jsonb_build_object(
      'account_name', duplicate_record.account_name,
      'primary_account_code', duplicate_record.account_codes[1],
      'merged_accounts', array_length(duplicate_record.account_ids, 1) - 1
    );
    cleanup_summary := cleanup_summary || cleanup_item;
  END LOOP;

  RETURN jsonb_build_object(
    'total_accounts_processed', affected_count,
    'cleanup_details', cleanup_summary,
    'timestamp', now()
  );
END;
$$;

-- دالة لترحيل أرصدة الحسابات من البيانات الموجودة
CREATE OR REPLACE FUNCTION public.migrate_account_balances()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  accounts_updated INTEGER := 0;
  total_revenue NUMERIC := 0;
  total_expenses NUMERIC := 0;
  total_assets NUMERIC := 0;
  cash_balance NUMERIC := 0;
BEGIN
  -- حساب وتحديث أرصدة الحسابات من البيانات الموجودة
  
  -- تحديث أرصدة النقدية من المدفوعات
  UPDATE public.chart_of_accounts 
  SET current_balance = COALESCE(
    (SELECT SUM(amount) 
     FROM public.payments 
     WHERE payment_method = 'cash' 
       AND status = 'completed'), 0
  )
  WHERE account_name ILIKE '%صندوق%' OR account_name ILIKE '%نقدية%';
  
  -- تحديث أرصدة العملاء من العقود والمدفوعات
  UPDATE public.chart_of_accounts 
  SET current_balance = COALESCE(
    (SELECT SUM(c.total_amount) - COALESCE(SUM(p.amount), 0)
     FROM public.contracts c
     LEFT JOIN public.payments p ON c.id = p.contract_id
     WHERE c.status IN ('active', 'completed')), 0
  )
  WHERE account_name ILIKE '%عملاء%' OR account_name ILIKE '%مدين%';
  
  -- تحديث إيرادات التأجير
  UPDATE public.chart_of_accounts 
  SET current_balance = COALESCE(
    (SELECT SUM(total_amount) 
     FROM public.contracts 
     WHERE status = 'completed'), 0
  )
  WHERE account_type = 'revenue' AND account_name ILIKE '%تأجير%';
  
  -- تحديث مصروفات الصيانة
  UPDATE public.chart_of_accounts 
  SET current_balance = COALESCE(
    (SELECT SUM(cost) 
     FROM public.maintenance_records 
     WHERE status = 'completed'), 0
  )
  WHERE account_name ILIKE '%صيانة%';
  
  -- حساب إجمالي الأصول
  SELECT COALESCE(SUM(current_balance), 0) INTO total_assets
  FROM public.chart_of_accounts
  WHERE account_type = 'asset' AND is_active = true;
  
  -- حساب إجمالي الإيرادات
  SELECT COALESCE(SUM(current_balance), 0) INTO total_revenue
  FROM public.chart_of_accounts
  WHERE account_type = 'revenue' AND is_active = true;
  
  -- حساب إجمالي المصروفات
  SELECT COALESCE(SUM(current_balance), 0) INTO total_expenses
  FROM public.chart_of_accounts
  WHERE account_type = 'expense' AND is_active = true;
  
  -- تحديث أرباح السنة الجارية
  UPDATE public.chart_of_accounts 
  SET current_balance = total_revenue - total_expenses
  WHERE account_name ILIKE '%أرباح السنة الجارية%';
  
  -- حساب عدد الحسابات المحدثة
  SELECT COUNT(*) INTO accounts_updated
  FROM public.chart_of_accounts
  WHERE is_active = true;
  
  RETURN jsonb_build_object(
    'affected_accounts', accounts_updated,
    'total_assets', total_assets,
    'total_revenue', total_revenue,
    'total_expenses', total_expenses,
    'net_profit', total_revenue - total_expenses,
    'migration_completed_at', now()
  );
END;
$$;

-- Trigger لتطبيق دليل الحسابات الشامل تلقائياً للمؤسسات الجديدة
CREATE OR REPLACE FUNCTION public.auto_setup_new_tenant_comprehensive_accounting()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- ربط الـ trigger بجدول المؤسسات
DROP TRIGGER IF EXISTS setup_comprehensive_accounting_on_tenant_activation ON public.tenants;
CREATE TRIGGER setup_comprehensive_accounting_on_tenant_activation
    AFTER UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_setup_new_tenant_comprehensive_accounting();

-- إنشاء فهارس محسنة للأداء
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tenant_code ON public.chart_of_accounts(tenant_id, account_code);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_type_active ON public.chart_of_accounts(account_type, is_active);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_parent ON public.chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_level ON public.chart_of_accounts(level);
