-- إنشاء الدالة الأخيرة لإكمال باقي المصروفات
CREATE OR REPLACE FUNCTION public.complete_chart_of_accounts_part4(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    
    -- الاهلاكات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '513';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51301', 'اهلاك الأصول الغير متداولة', 'Depreciation of Non-Current Assets', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51301';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5130101', 'مصروف اهلاك السيارات و الباصات', 'Vehicle and Bus Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5130102', 'مصروف اهلاك مباني', 'Building Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5130103', 'مصروف اهلاك اثاث', 'Furniture Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5130104', 'مصروف اهلاك معدات الصيانة', 'Maintenance Equipment Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5130105', 'مصروف اهلاك أجهزة كمبيوتر', 'Computer Equipment Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5130106', 'مصروف إطفاء قيمة برامج و تكنولوجيا', 'Software and Technology Amortization Expense', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    -- الاشتراكات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '514';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51401', 'اشتراكات شهريه و سنويه', 'Monthly and Annual Subscriptions', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51401';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5140101', 'مصاريف حكوميه و اشتراكات', 'Government Fees and Subscriptions', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5140102', 'مصاريف قانونيه و قضائية', 'Legal and Judicial Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5140103', 'مصاريف تأمين الزامي', 'Mandatory Insurance Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5140104', 'مصاريف تأمين شامل', 'Comprehensive Insurance Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5140105', 'مصاريف مكاتب التدقيق', 'Audit Office Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5140106', 'اشتراكات انتر نت', 'Internet Subscriptions', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5140107', 'اشتراكات تليفون ارضي', 'Landline Telephone Subscriptions', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5140108', 'اشتراكات موبيل', 'Mobile Subscriptions', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    -- المصاريف البنكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '515';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51501', 'مصاريف بنكية', 'Banking Expenses', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51501';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5150101', 'مصاريف رسوم بنكية', 'Bank Fee Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5150102', 'مصاريف فوائد بنوك', 'Bank Interest Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5150103', 'مصاريف اصدار دفاتر شيكات', 'Checkbook Issuance Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5150104', 'عمولات تحويل رواتب', 'Salary Transfer Commissions', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    -- المصروفات المتغيرة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '521', 'أجور و رواتب مؤقتة', 'Temporary Wages and Salaries', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '521';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52101', 'أجور و رواتب يومية', 'Daily Wages and Salaries', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '52102', 'مصروفات صيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5210101', 'رواتب يوميات للموظفين مؤقتة', 'Temporary Employee Daily Wages', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210102', 'مكافئات', 'Bonuses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210103', 'اكراميات', 'Tips', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210104', 'أجور ساعات إضافية', 'Overtime Wages', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5210201', 'مصروفات قطع غيار', 'Spare Parts Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210202', 'مصروفات صيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210203', 'مصروفات زيوت و فلاتر', 'Oil and Filter Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210204', 'مصروفات صبغ و حدادة', 'Paint and Ironwork Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210205', 'تواير و بنشر', 'Tires and Tire Repair', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210206', 'بطاريات', 'Batteries', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210207', 'مصروفات بنزين', 'Gasoline Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5210208', 'مصروفات ديزل', 'Diesel Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    -- أدوات مكتبية ومطبوعات 
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5211', 'مصاريف أدوات مكتبية و مطبوعات', 'Office Supplies and Printing Expenses', 'expense', 'operating_expense', (SELECT id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52'), 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52110', 'مصاريف أدوات مكتبية و مطبوعات', 'Office Supplies and Printing Expenses', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52110';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5211001', 'ورق تصوير', 'Copy Paper', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5211002', 'أدوات مكتبية', 'Office Supplies', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5211003', 'مطبوعات', 'Printing', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5211004', 'إعلانات', 'Advertisements', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    inserted_count := inserted_count + 47;
    
    RETURN inserted_count;
END;
$$;

-- إنشاء الدالة الرئيسية النهائية التي تجمع كل الأجزاء
CREATE OR REPLACE FUNCTION public.setup_complete_chart_of_accounts(tenant_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_accounts INTEGER := 0;
BEGIN
    -- تشغيل جميع أجزاء إنشاء شجرة الحسابات
    total_accounts := total_accounts + public.create_final_chart_of_accounts(tenant_id_param);
    total_accounts := total_accounts + public.complete_chart_of_accounts_part2(tenant_id_param);
    total_accounts := total_accounts + public.complete_chart_of_accounts_part3(tenant_id_param);
    total_accounts := total_accounts + public.complete_chart_of_accounts_part4(tenant_id_param);
    
    -- يمكن إضافة رسالة إعلامية أو logging هنا
    -- RAISE NOTICE 'تم إنشاء % حساب بنجاح', total_accounts;
    
    RETURN TRUE;
END;
$$;