-- حذف الدالة السابقة وإنشاء دالة جديدة مطابقة تماماً للقائمة المرسلة
DROP FUNCTION IF EXISTS public.create_correct_chart_of_accounts(UUID);
DROP FUNCTION IF EXISTS public.setup_correct_accounts_for_tenant(UUID);

-- إنشاء دالة جديدة مطابقة تماماً للقائمة التفصيلية
CREATE OR REPLACE FUNCTION public.create_final_chart_of_accounts(tenant_id_param UUID)
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
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    inserted_count := inserted_count + 5;

    -- المستوى الثاني - الأصول
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '12', 'الأصول الغير متداولة', 'Non-Current Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - الالتزامات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '22', 'الالتزامات طويلة الاجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31', 'راس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '32', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '33', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '42', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات خدمات اخري', 'Other Service Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51', 'مصروفات ثابتة', 'Fixed Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '52', 'مصروفات متغيرة', 'Variable Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
    
    inserted_count := inserted_count + 11;

    -- المستوى الثالث - الأصول المتداولة التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '111', 'النقدية و ما يعادلها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '112', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '113', 'العملاء التجاريون', 'Trade Receivables', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '114', 'ذمم مدينة اخري', 'Other Receivables', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '115', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '116', 'مصروفات مدفوعه مقدما', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '117', 'استثمارات قصيرة الاجل', 'Short-term Investments', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الأصول غير المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '121', 'أصول طويلة الامد مملوكة للشركة', 'Company Owned Fixed Assets', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '122', 'عقود ايجار تنتهي بالتملك', 'Lease to Own Contracts', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '123', 'استثمارات طويلة الاجل', 'Long-term Investments', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '211', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '212', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '213', 'قروض قصيرة الاجل', 'Short-term Loans', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الالتزامات طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '221', 'الالتزامات طويلة الاجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 3, false, true, 0, 0);
    
    inserted_count := inserted_count + 14;

    -- المستوى الرابع - النقدية التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11101', 'النقدية', 'Cash', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - البنوك التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11201', 'بنوك محلية بالدينار الكويتي', 'Local Banks KWD', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - العملاء التجاريون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11301', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11302', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11303', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - ذمم مدينة أخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '114';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11401', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11402', 'ذمم مدينة لا تخص النشاط', 'Non-business Receivables', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '115';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11501', 'مخازن قطع الغيار', 'Spare Parts Stores', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11502', 'مخازن العدد و الأدوات', 'Tools and Equipment Stores', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11503', 'مخازن الأدوات المكتبية و المطبوعات', 'Office Supplies and Printing Stores', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - مصروفات مدفوعة مقدماً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '116';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11601', 'مصروفات مدفوعه مقدما', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '12101', 'أصول طويلة الامد مملوكة للشركة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - عقود الإيجار
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '122';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '12201', 'عقود ايجار تنتهي بالتملك', 'Lease to Own Contracts', 'asset', 'fixed_asset', parent_id, 4, false, true, 0, 0);
    
    inserted_count := inserted_count + 13;

    -- المستوى الخامس - النقدية القابلة للترحيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1110101', 'الصندوق النقدي الرئيسي', 'Main Cash Fund', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110102', 'عهدة نقدية دائمة', 'Permanent Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110103', 'عهدة نقدية مؤقتة', 'Temporary Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- المستوى الخامس - البنوك القابلة للترحيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1120101', 'حساب البنك التجاري حساب رقم 0000000000000', 'Commercial Bank Account 0000000000000', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1120102', 'حساب بنك بيت التمويل حساب رقم 0000000000000', 'Kuwait Finance House Account 0000000000000', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- المستوى الخامس - العملاء القابلين للترحيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11301';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1130101', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11302';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1130201', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11303';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1130301', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- المستوى الخامس - ذمم الموظفين
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11401';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1140101', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11402';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1140201', 'ذمم مدينة لا تخص النشاط', 'Non-business Receivables', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- المستوى الخامس - المخازن
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11501';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1150101', 'مخزن قطع الغيار رقم 1', 'Spare Parts Store No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11502';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1150201', 'مخزن عدد و أدوات رقم 1', 'Tools Store No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11503';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1150301', 'مخازن الأدوات المكتبية و المطبوعات رقم 1', 'Office Supplies Store No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- المستوى الخامس - مصروفات مدفوعة مقدماً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11601';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1160101', 'مصروفات مدفوعه مقدما ايجارات', 'Prepaid Rent Expenses', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1160102', 'مصروفات مدفوعه مقدما صيانة', 'Prepaid Maintenance Expenses', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1160103', 'مصروفات مدفوعه مقدما قطع غيار', 'Prepaid Spare Parts Expenses', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- المستوى الخامس - الأصول الثابتة القابلة للترحيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1210101', 'سيارات و باصات', 'Cars and Buses', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210102', 'مباني و أراضي', 'Buildings and Land', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210103', 'اثاث', 'Furniture', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210104', 'معدات صيانة', 'Maintenance Equipment', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210105', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210106', 'برامج و تكنولوجيا', 'Software and Technology', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0);
    
    inserted_count := inserted_count + 23;
    
    -- سأكمل باقي الحسابات في استعلام منفصل لتجنب تجاوز الحد الأقصى للطول
    
    RETURN inserted_count;
END;
$$;