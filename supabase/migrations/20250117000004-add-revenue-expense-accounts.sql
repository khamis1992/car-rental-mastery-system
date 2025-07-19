-- إضافة حسابات الإيرادات والمصروفات الناقصة دون المساس بالحسابات الحالية

CREATE OR REPLACE FUNCTION public.add_revenue_expense_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    account_exists BOOLEAN;
    parent_id UUID;
BEGIN
    
    -- ==================== الإيرادات ====================
    
    -- إيرادات التأجير
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '4';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات تأجير شركات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '411') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '41';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '411', 'إيرادات تأجير شركات', 'Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات تأجير سيارات وباصات شركات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '411';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '4111', 'ايراد تأجير سيارات و باصات - شركات', 'Car & Bus Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات تأجير شركات زميلة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '412') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '41';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '412', 'إيرادات تأجير شركات زميلة', 'Rental Revenue - Related Companies', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات تأجير سيارات وباصات شركات زميلة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4121') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '412';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '4121', 'ايراد تأجير سيارات و باصات - شركات زميله', 'Car & Bus Rental Revenue - Related Companies', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات تأجير أشخاص
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '413') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '41';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '413', 'ايراد تأجير - اشخاص', 'Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات تأجير سيارات وباصات أشخاص
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4131') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '413';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '4131', 'ايراد تأجير سيارات و باصات - اشخاص', 'Car & Bus Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات الصيانة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '4';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '42', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات ورشة الصيانة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '421') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '42';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '421', 'إيرادات ورشه الصيانة', 'Workshop Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات ورشة الصيانة الداخلية
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4211') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '421';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '4211', 'ايراد ورشة الصيانة الداخلية', 'Internal Workshop Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات ورش صيانة خارجية
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4212') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '421';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '4212', 'ايراد ورش صيانة خارجيه', 'External Workshop Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات بيع قطع غيار
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4213') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '421';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '4213', 'ايراد بيع قطع غيار', 'Spare Parts Sales Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات خدمات أخرى
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '43') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '4';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '43', 'إيرادات خدمات اخري', 'Other Services Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات خدمات التوصيل والاستلام
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '431') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '43';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '431', 'ايراد خدمات التوصيل و الاستلام', 'Delivery and Collection Services Revenue', 'revenue', 'operating_revenue', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات خدمات التوصيل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4311') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '431';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '4311', 'ايراد خدمات التوصيل', 'Delivery Services Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات خدمات الاستلام
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4312') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '431';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '4312', 'ايراد خدمات الاستلام', 'Collection Services Revenue', 'revenue', 'operating_revenue', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات بيع سكراب
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '432') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '43';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '432', 'إيرادات بيع سكراب', 'Scrap Sales Revenue', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيرادات أخرى
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '44') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '4';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '44', 'إيرادات اخري', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ==================== المصروفات ====================
    
    -- مصروفات ثابتة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '5';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '51', 'مصروفات ثابتة', 'Fixed Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مصروفات متغيرة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '5';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '52', 'مصروفات متغيرة', 'Variable Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الإيجارات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '511') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '51';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '511', 'الإيجارات', 'Rent Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيجارات سيارات وباصات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '511';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '5111', 'ايجارات سيارات و باصات من الغير', 'Vehicle and Bus Rent from Others', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيجارات مكاتب وأراضي
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5112') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '511';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '5112', 'ايجارات مكاتب و أراضي', 'Office and Land Rent', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيجار مكاتب
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51121') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '5112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '51121', 'ايجار مكاتب', 'Office Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيجار ورشة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51122') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '5112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '51122', 'ايجار ورشة', 'Workshop Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيجار أراضي ومخازن
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51123') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '5112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '51123', 'ايجار أراضي و مخازن', 'Land and Warehouse Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيجارات شقق وعقارات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5113') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '511';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '5113', 'ايجارات شقق و عقارات', 'Apartment and Property Rent', 'expense', 'operating_expense', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- إيجار شقق سكنية
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51131') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '5113';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '51131', 'ايجار شقق سكنية', 'Residential Apartment Rent', 'expense', 'operating_expense', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    RETURN inserted_count;
END;
$$;

-- تطبيق إضافة حسابات الإيرادات والمصروفات على جميع المؤسسات النشطة
DO $$
DECLARE
    tenant_record RECORD;
    accounts_added INTEGER;
BEGIN
    FOR tenant_record IN 
        SELECT id, name FROM public.tenants WHERE status IN ('active', 'trial')
    LOOP
        BEGIN
            SELECT public.add_revenue_expense_accounts(tenant_record.id) INTO accounts_added;
            RAISE NOTICE 'تم إضافة % من حسابات الإيرادات والمصروفات للمؤسسة: %', accounts_added, tenant_record.name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في إضافة حسابات الإيرادات والمصروفات للمؤسسة %: %', tenant_record.name, SQLERRM;
        END;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.add_revenue_expense_accounts(UUID) IS 'دالة آمنة تضيف حسابات الإيرادات والمصروفات الناقصة دون المساس بالحسابات الحالية'; 