-- حذف الدوال السابقة الخاطئة
DROP FUNCTION IF EXISTS public.setup_comprehensive_chart_of_accounts_v2(UUID);
DROP FUNCTION IF EXISTS public.setup_comprehensive_chart_safe(UUID);
DROP FUNCTION IF EXISTS public.insert_accounts_safely(UUID, JSONB);

-- دالة جديدة تضيف فقط الحسابات الناقصة دون المساس بالحسابات الحالية
CREATE OR REPLACE FUNCTION public.add_missing_accounts_only(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    account_exists BOOLEAN;
    parent_id UUID;
BEGIN
    -- إضافة الحسابات الناقصة فقط مع تجنب التكرار
    
    -- ==================== الأصول المتداولة ====================
    
    -- النقدية وما يعادلها
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111') INTO account_exists;
    IF NOT account_exists THEN
        -- البحث عن الحساب الأب (الأصول المتداولة أو الأصول)
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('11', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '111', 'النقدية وما يعادلها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- النقدية
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1111', 'النقدية', 'Cash', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- الصندوق النقدي الرئيسي
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11111') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '1111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '11111', 'الصندوق النقدي الرئيسي', 'Main Cash Box', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- عهدة نقدية دائمة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11112') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '1111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '11112', 'عهدة نقدية دائمة', 'Permanent Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- عهدة نقدية مؤقتة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11113') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '1111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '11113', 'عهدة نقدية مؤقتة', 'Temporary Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- البنوك
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1112') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '111';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1112', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- بنوك محلية بالدينار الكويتي
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11121') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '1112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '11121', 'بنوك محلية بالدينار الكويتي', 'Local Banks in KWD', 'asset', 'current_asset', parent_id, 5, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حساب البنك التجاري
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111211') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '11121';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '111211', 'حساب البنك التجاري حساب رقم', 'Commercial Bank Account No.', 'asset', 'current_asset', parent_id, 6, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- حساب بنك بيت التمويل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111212') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '11121';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '111212', 'حساب بنك بيت التمويل حساب رقم', 'Kuwait Finance House Account No.', 'asset', 'current_asset', parent_id, 6, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ==================== العملاء التجاريون ====================
    
    -- العملاء التجاريون
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('11', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '112', 'العملاء التجاريون', 'Trade Customers', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- عملاء تجاريون شركات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1121') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1121', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- عملاء تجاريون شركات زميلة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1122') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1122', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Related Companies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- عملاء تجاريون أشخاص
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1123') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '112';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1123', 'عملاء تجاريون أشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ==================== ذمم مدينة أخرى ====================
    
    -- ذمم مدينة أخرى
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('11', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '113', 'ذمم مدينة أخرى', 'Other Receivables', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ذمم موظفين
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1131') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '113';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1131', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ذمم مدينة لا تخص النشاط
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1132') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '113';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1132', 'ذمم مدينة لا تخص النشاط', 'Non-operating Receivables', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ==================== المخزون ====================
    
    -- المخزون
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '114') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('11', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '114', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مخازن قطع الغيار
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1141') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '114';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1141', 'مخازن قطع الغيار', 'Spare Parts Warehouses', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مخزن قطع الغيار رقم 1
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11411') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '1141';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '11411', 'مخزن قطع الغيار رقم 1', 'Spare Parts Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مخازن العدد والأدوات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1142') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '114';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1142', 'مخازن العدد والأدوات', 'Tools and Equipment Warehouses', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مخزن عدد وأدوات رقم 1
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11421') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '1142';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '11421', 'مخزن عدد وأدوات رقم 1', 'Tools and Equipment Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مخازن الأدوات المكتبية والمطبوعات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1143') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '114';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1143', 'مخازن الأدوات المكتبية والمطبوعات', 'Office Supplies and Publications Warehouses', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مخزن الأدوات المكتبية رقم 1
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11431') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '1143';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '11431', 'مخازن الأدوات المكتبية والمطبوعات رقم 1', 'Office Supplies and Publications Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ==================== مصروفات مدفوعة مقدماً ====================
    
    -- مصروفات مدفوعة مقدماً
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '115') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('11', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '115', 'مصروفات مدفوعة مقدماً', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مصروفات مدفوعة مقدماً إيجارات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1151') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '115';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1151', 'مصروفات مدفوعة مقدماً إيجارات', 'Prepaid Rent Expenses', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مصروفات مدفوعة مقدماً صيانة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1152') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '115';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1152', 'مصروفات مدفوعة مقدماً صيانة', 'Prepaid Maintenance Expenses', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مصروفات مدفوعة مقدماً قطع غيار
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1153') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = '115';
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1153', 'مصروفات مدفوعة مقدماً قطع غيار', 'Prepaid Spare Parts Expenses', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- استثمارات قصيرة الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '116') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('11', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '116', 'استثمارات قصيرة الأجل', 'Short-term Investments', 'asset', 'current_asset', parent_id, 3, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- ==================== الأصول غير المتداولة ====================
    
    -- أصول طويلة الأمد مملوكة للشركة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '121', 'أصول طويلة الأمد مملوكة للشركة', 'Long-term Assets Owned by Company', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- سيارات وباصات
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1211') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('121', '12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1211', 'سيارات وباصات', 'Cars and Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- مباني وأراضي
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1212') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('121', '12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1212', 'مباني وأراضي', 'Buildings and Land', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- أثاث
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1213') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('121', '12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1213', 'أثاث', 'Furniture', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- معدات صيانة
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1214') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('121', '12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1214', 'معدات صيانة', 'Maintenance Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- أجهزة كمبيوتر
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1215') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('121', '12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1215', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- برامج وتكنولوجيا
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1216') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('121', '12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '1216', 'برامج وتكنولوجيا', 'Software and Technology', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- عقود إيجار تنتهي بالتملك
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '122') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '122', 'عقود إيجار تنتهي بالتملك', 'Finance Lease Contracts', 'asset', 'fixed_asset', parent_id, 3, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    -- استثمارات طويلة الأجل
    SELECT EXISTS(SELECT 1 FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '123') INTO account_exists;
    IF NOT account_exists THEN
        SELECT id INTO parent_id FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code IN ('12', '1') 
        ORDER BY level DESC LIMIT 1;
        
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES (tenant_id_param, '123', 'استثمارات طويلة الأجل', 'Long-term Investments', 'asset', 'fixed_asset', parent_id, 3, true, true, 0, 0);
        inserted_count := inserted_count + 1;
    END IF;
    
    RETURN inserted_count;
END;
$$;

-- تطبيق إضافة الحسابات الناقصة فقط على جميع المؤسسات النشطة
DO $$
DECLARE
    tenant_record RECORD;
    accounts_added INTEGER;
BEGIN
    FOR tenant_record IN 
        SELECT id, name FROM public.tenants WHERE status IN ('active', 'trial')
    LOOP
        BEGIN
            SELECT public.add_missing_accounts_only(tenant_record.id) INTO accounts_added;
            RAISE NOTICE 'تم إضافة % حساب ناقص للمؤسسة: %', accounts_added, tenant_record.name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في إضافة الحسابات للمؤسسة %: %', tenant_record.name, SQLERRM;
        END;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.add_missing_accounts_only(UUID) IS 'دالة آمنة تضيف فقط الحسابات الناقصة دون المساس بالحسابات الحالية أو البيانات الموجودة'; 