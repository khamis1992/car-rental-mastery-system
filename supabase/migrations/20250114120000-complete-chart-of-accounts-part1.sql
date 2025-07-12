-- تحديث شامل لشجرة الحسابات المحاسبية - الجزء الأول
-- نظام 7 أرقام مع التفصيل الكامل

-- إنشاء دالة شاملة لإنشاء شجرة الحسابات الكاملة
CREATE OR REPLACE FUNCTION create_complete_chart_of_accounts_part1(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
    current_parent_id UUID;
BEGIN
    -- حذف جميع الحسابات الموجودة للمؤسسة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- ==============================
    -- 1. الأصول (Assets)
    -- ==============================
    
    -- المستوى الأول: الأصول
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true);
    
    -- المستوى الثاني: الأصول المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true);
    
    -- المستوى الثالث: النقدية وما يعادلها
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '111', 'النقدية و ما يعادلها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true);
    
    -- المستوى الرابع: النقدية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '11101', 'النقدية', 'Cash', 'asset', 'current_asset', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل النقدية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '1110101', 'الصندوق النقدي الرئيسي', 'Main Cash Box', 'asset', 'current_asset', parent_id, 5, true, true),
    (tenant_id_param, '1110102', 'عهدة نقدية دائمة', 'Permanent Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true),
    (tenant_id_param, '1110103', 'عهدة نقدية مؤقتة', 'Temporary Cash Custody', 'asset', 'current_asset', parent_id, 5, true, true);
    
    -- المستوى الثالث: البنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '112', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 3, false, true);
    
    -- المستوى الرابع: بنوك محلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '11201', 'بنوك محلية بالدينار الكويتي', 'Local Banks in KWD', 'asset', 'current_asset', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل البنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '1120101', 'حساب البنك التجاري', 'Commercial Bank Account', 'asset', 'current_asset', parent_id, 5, true, true),
    (tenant_id_param, '1120102', 'حساب بنك بيت التمويل', 'Kuwait Finance House Account', 'asset', 'current_asset', parent_id, 5, true, true);
    
    -- المستوى الثالث: العملاء التجاريون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '113', 'العملاء التجاريون', 'Trade Customers', 'asset', 'current_asset', parent_id, 3, false, true);
    
    -- المستوى الرابع: أنواع العملاء
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '11301', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', parent_id, 4, false, true),
    (tenant_id_param, '11302', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', parent_id, 4, false, true),
    (tenant_id_param, '11303', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل العملاء
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11301';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1130101', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11302';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1130201', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11303';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1130301', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    -- المستوى الثالث: المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '115', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true);
    
    -- المستوى الرابع: أنواع المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '115';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '11501', 'مخازن قطع الغيار', 'Spare Parts Warehouses', 'asset', 'current_asset', parent_id, 4, false, true),
    (tenant_id_param, '11502', 'مخازن العدد و الأدوات', 'Tools and Equipment Warehouses', 'asset', 'current_asset', parent_id, 4, false, true),
    (tenant_id_param, '11503', 'مخازن الأدوات المكتبية و المطبوعات', 'Office Supplies Warehouses', 'asset', 'current_asset', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل المخزون
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11501';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1150101', 'مخزن قطع الغيار رقم 1', 'Spare Parts Warehouse No. 1', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11502';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1150201', 'مخزن عدد و أدوات رقم 1', 'Tools and Equipment Warehouse No. 1', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11503';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1150301', 'مخازن الأدوات المكتبية و المطبوعات رقم 1', 'Office Supplies Warehouse No. 1', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    -- المستوى الثاني: الأصول الغير متداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '12', 'الأصول الغير متداولة', 'Non-Current Assets', 'asset', 'fixed_asset', parent_id, 2, false, true);
    
    -- المستوى الثالث: أصول طويلة الأمد
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '121', 'أصول طويلة الامد مملوكة للشركة', 'Long-term Assets Owned by Company', 'asset', 'fixed_asset', parent_id, 3, false, true);
    
    -- المستوى الرابع: أصول طويلة الأمد
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '12101', 'أصول طويلة الامد مملوكة للشركة', 'Long-term Assets Owned by Company', 'asset', 'fixed_asset', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل الأصول الثابتة
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '1210101', 'سيارات و باصات', 'Cars and Buses', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
    (tenant_id_param, '1210102', 'مباني و أراضي', 'Buildings and Land', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
    (tenant_id_param, '1210103', 'اثاث', 'Furniture', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
    (tenant_id_param, '1210104', 'معدات صيانة', 'Maintenance Equipment', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
    (tenant_id_param, '1210105', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
    (tenant_id_param, '1210106', 'برامج و تكنولوجيا', 'Software and Technology', 'asset', 'fixed_asset', current_parent_id, 5, true, true);
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$$; 