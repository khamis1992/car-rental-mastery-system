-- إنشاء دالة لإضافة شجرة الحسابات الافتراضية
CREATE OR REPLACE FUNCTION public.create_default_chart_of_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    account_record RECORD;
    parent_id UUID;
BEGIN
    -- قائمة شجرة الحسابات الافتراضية
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    inserted_count := inserted_count + 5;

    -- المستوى الثاني - الحسابات الفرعية الرئيسية
    -- الأصول
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '12', 'الأصول الغير متداولة', 'Non-Current Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);
    
    -- الالتزامات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '22', 'الالتزامات طويلة الاجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);
    
    -- حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31', 'راس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '32', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '33', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    -- الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '42', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات خدمات اخري', 'Other Service Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51', 'مصروفات ثابتة', 'Fixed Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '52', 'مصروفات متغيرة', 'Variable Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
    
    inserted_count := inserted_count + 9;

    -- المستوى الثالث - النقدية والحسابات التفصيلية
    -- النقدية
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
    
    inserted_count := inserted_count + 7;

    -- الأصول طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '121', 'أصول طويلة الامد مملوكة للشركة', 'Company Owned Fixed Assets', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '122', 'عقود ايجار تنتهي بالتملك', 'Lease to Own Contracts', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '123', 'استثمارات طويلة الاجل', 'Long-term Investments', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    inserted_count := inserted_count + 3;

    -- الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '211', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '212', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '213', 'قروض قصيرة الاجل', 'Short-term Loans', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    inserted_count := inserted_count + 3;

    -- المستوى الرابع - الحسابات التفصيلية الأساسية
    -- النقدية التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11101', 'النقدية', 'Cash', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- البنوك التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11201', 'بنوك محلية بالدينار الكويتي', 'Local Banks KWD', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- العملاء التجاريون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11301', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11302', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11303', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '12101', 'أصول طويلة الامد مملوكة للشركة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 4, false, true, 0, 0);
    
    inserted_count := inserted_count + 6;

    -- المستوى الخامس - الحسابات القابلة للترحيل
    -- النقدية القابلة للترحيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1110101', 'الصندوق النقدي الرئيسي', 'Main Cash Fund', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110102', 'عهدة نقدية دائمة', 'Permanent Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110103', 'عهدة نقدية مؤقتة', 'Temporary Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- البنوك القابلة للترحيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1120101', 'حساب البنك التجاري', 'Commercial Bank Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1120102', 'حساب بنك بيت التمويل', 'Kuwait Finance House Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
    
    -- العملاء القابلين للترحيل
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
    
    -- الأصول الثابتة القابلة للترحيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1210101', 'سيارات و باصات', 'Cars and Buses', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210102', 'مباني و أراضي', 'Buildings and Land', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210103', 'اثاث', 'Furniture', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210104', 'معدات صيانة', 'Maintenance Equipment', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210105', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1210106', 'برامج و تكنولوجيا', 'Software and Technology', 'asset', 'fixed_asset', parent_id, 5, true, true, 0, 0);
    
    -- إيرادات التأجير القابلة للترحيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '411', 'ايراد تأجير', 'Rental Income', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '411';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41101', 'إيرادات تأجير - شركات', 'Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '41102', 'إيرادات تأجير - شركات زميلة', 'Rental Revenue - Sister Companies', 'revenue', 'operating_revenue', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '41103', 'ايراد تأجير - اشخاص', 'Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 4, false, true, 0, 0);
    
    -- إيرادات التأجير القابلة للترحيل بالتفصيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4110101', 'ايراد تأجير سيارات و باصات - شركات', 'Car and Bus Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4110201', 'ايراد تأجير سيارات و باصات - شركات زميله', 'Car and Bus Rental Revenue - Sister Companies', 'revenue', 'operating_revenue', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41103';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4110301', 'ايراد تأجير سيارات و باصات - اشخاص', 'Car and Bus Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 5, true, true, 0, 0);
    
    inserted_count := inserted_count + 19;

    RETURN inserted_count;
END;
$$;

-- إنشاء دالة لتطبيق شجرة الحسابات الافتراضية على مؤسسة جديدة
CREATE OR REPLACE FUNCTION public.setup_default_accounts_for_tenant(tenant_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    accounts_count INTEGER;
BEGIN
    -- التحقق من عدم وجود حسابات مسبقاً
    SELECT COUNT(*) INTO accounts_count 
    FROM public.chart_of_accounts 
    WHERE tenant_id = tenant_id_param;
    
    IF accounts_count > 0 THEN
        RETURN FALSE; -- الحسابات موجودة مسبقاً
    END IF;
    
    -- إنشاء شجرة الحسابات الافتراضية
    PERFORM public.create_default_chart_of_accounts(tenant_id_param);
    
    RETURN TRUE;
END;
$$;