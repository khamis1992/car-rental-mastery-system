-- إنشاء دالة لإكمال حسابات الإيرادات والمصروفات
CREATE OR REPLACE FUNCTION public.complete_chart_of_accounts_part3(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    
    -- إيرادات التأجير
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
    
    -- إيرادات الصيانة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '421', 'إيرادات ورشه الصيانة', 'Maintenance Workshop Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '421';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42101', 'ايراد ورشه الصيانة', 'Maintenance Workshop Revenue', 'revenue', 'operating_revenue', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4210101', 'ايراد ورشة الصيانة الداخلية', 'Internal Maintenance Workshop Revenue', 'revenue', 'operating_revenue', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '4210102', 'ايراد ورش صيانة خارجيه', 'External Maintenance Workshop Revenue', 'revenue', 'operating_revenue', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '4210103', 'ايراد بيع قطع غيار', 'Spare Parts Sales Revenue', 'revenue', 'operating_revenue', parent_id, 5, true, true, 0, 0);
    
    -- إيرادات خدمات أخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '43';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '431', 'ايراد خدمات التوصيل و الاستلام', 'Delivery and Pickup Services Revenue', 'revenue', 'other_revenue', parent_id, 3, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '431';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '43101', 'ايراد خدمات التوصيل و الاستلام و خدمات اخري', 'Delivery, Pickup and Other Services Revenue', 'revenue', 'other_revenue', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '43101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4310101', 'ايراد خدمات التوصيل', 'Delivery Services Revenue', 'revenue', 'other_revenue', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '4310102', 'ايراد خدمات الاستلام', 'Pickup Services Revenue', 'revenue', 'other_revenue', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '4310103', 'إيرادات بيع سكراب', 'Scrap Sales Revenue', 'revenue', 'other_revenue', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '4310104', 'إيرادات اخري', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 5, true, true, 0, 0);
    
    -- مصروفات ثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '511', 'الإيجارات', 'Rent Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '512', 'الرواتب و الأجور و البدلات للموظفين', 'Salaries, Wages and Allowances', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '513', 'الاهلاكات', 'Depreciation', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '514', 'اشتراكات', 'Subscriptions', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '515', 'مصاريف بنكية', 'Banking Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل الإيجارات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '511';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51101', 'ايجارات سيارات و باصات', 'Vehicle and Bus Rentals', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '51102', 'ايجارات مكاتب و أراضي', 'Office and Land Rentals', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '51103', 'ايجارات شقق و عقارات', 'Apartment and Property Rentals', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5110101', 'ايجارات سيارات و باصات من الغير', 'Vehicle and Bus Rentals from Others', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5110201', 'ايجار مكاتب', 'Office Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5110202', 'ايجار ورشة', 'Workshop Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5110203', 'ايجار أراضي و مخازن', 'Land and Warehouse Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51103';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5110301', 'ايجار شقق سكنية', 'Residential Apartment Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    -- تفاصيل الرواتب والأجور
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '512';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51201', 'الرواتب و الأجور و البدلات للموظفين', 'Employee Salaries, Wages and Allowances', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
    
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5120101', 'الرواتب الأساسية للموظفين', 'Basic Employee Salaries', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5120102', 'بدلات نقدية للموظفين', 'Employee Cash Allowances', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5120103', 'بدلات خطوط موبيل', 'Mobile Line Allowances', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5120104', 'مصاريف الاجازات', 'Vacation Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '5120105', 'مصاريف نهاية الخدمة', 'End of Service Expenses', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
    
    inserted_count := inserted_count + 38;
    
    RETURN inserted_count;
END;
$$;