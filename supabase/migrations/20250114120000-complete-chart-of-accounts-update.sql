-- تحديث شامل لشجرة الحسابات المحاسبية
-- نظام 7 أرقام مع التفصيل الكامل

-- حذف الدوال القديمة
DROP FUNCTION IF EXISTS update_to_unified_accounting_system() CASCADE;
DROP FUNCTION IF EXISTS verify_unified_accounting_system() CASCADE;

-- إنشاء دالة شاملة لإنشاء شجرة الحسابات الكاملة
CREATE OR REPLACE FUNCTION create_complete_chart_of_accounts(tenant_id_param UUID)
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
    (tenant_id_param, '1120101', 'حساب البنك التجاري حساب رقم 0000000000000', 'Commercial Bank Account No. 0000000000000', 'asset', 'current_asset', parent_id, 5, true, true),
    (tenant_id_param, '1120102', 'حساب بنك بيت التمويل حساب رقم 0000000000000', 'Kuwait Finance House Account No. 0000000000000', 'asset', 'current_asset', parent_id, 5, true, true);
    
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
    
    -- المستوى الثالث: ذمم مدينة اخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '114', 'ذمم مدينة اخري', 'Other Receivables', 'asset', 'current_asset', parent_id, 3, false, true);
    
    -- المستوى الرابع: أنواع الذمم المدينة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '114';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '11401', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', parent_id, 4, false, true),
    (tenant_id_param, '11402', 'ذمم مدينة لا تخص النشاط', 'Non-Operating Receivables', 'asset', 'current_asset', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل الذمم المدينة
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11401';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1140101', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11402';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1140201', 'ذمم مدينة لا تخص النشاط', 'Non-Operating Receivables', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
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
    (tenant_id_param, '11503', 'مخازن الأدوات المكتبية و المطبوعات', 'Office Supplies and Printing Warehouses', 'asset', 'current_asset', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل المخزون
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11501';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1150101', 'مخزن قطع الغيار رقم 1', 'Spare Parts Warehouse No. 1', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11502';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1150201', 'مخزن عدد و أدوات رقم 1', 'Tools and Equipment Warehouse No. 1', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11503';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '1150301', 'مخازن الأدوات المكتبية و المطبوعات رقم 1', 'Office Supplies and Printing Warehouse No. 1', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    -- المستوى الثالث: مصروفات مدفوعة مقدماً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '116', 'مصروفات مدفوعه مقدما', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 3, false, true);
    
    -- المستوى الرابع: مصروفات مدفوعة مقدماً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '116';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '11601', 'مصروفات مدفوعه مقدما', 'Prepaid Expenses', 'asset', 'current_asset', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل المصروفات المدفوعة مقدماً
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11601';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '1160101', 'مصروفات مدفوعه مقدما ايجارات', 'Prepaid Rent Expenses', 'asset', 'current_asset', current_parent_id, 5, true, true),
    (tenant_id_param, '1160102', 'مصروفات مدفوعه مقدما صيانة', 'Prepaid Maintenance Expenses', 'asset', 'current_asset', current_parent_id, 5, true, true),
    (tenant_id_param, '1160103', 'مصروفات مدفوعه مقدما قطع غيار', 'Prepaid Spare Parts Expenses', 'asset', 'current_asset', current_parent_id, 5, true, true);
    
    -- المستوى الثالث: استثمارات قصيرة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '117', 'استثمارات قصيرة الاجل', 'Short-term Investments', 'asset', 'current_asset', parent_id, 3, true, true);
    
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
    
    -- المستوى الثالث: عقود إيجار تنتهي بالتملك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '122', 'عقود ايجار تنتهي بالتملك', 'Finance Lease Contracts', 'asset', 'fixed_asset', parent_id, 3, false, true);
    
    -- المستوى الرابع: عقود إيجار تنتهي بالتملك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '122';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '12201', 'عقود ايجار تنتهي بالتملك', 'Finance Lease Contracts', 'asset', 'fixed_asset', parent_id, 4, true, true);
    
    -- المستوى الثالث: استثمارات طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '123', 'استثمارات طويلة الاجل', 'Long-term Investments', 'asset', 'fixed_asset', parent_id, 3, true, true);
    
    -- ==============================
    -- 2. الالتزامات (Liabilities)
    -- ==============================
    
    -- المستوى الأول: الالتزامات
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
    VALUES (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true);
    
    -- المستوى الثاني: الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true);
    
    -- المستوى الثالث: الحسابات الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '211', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true);
    
    -- المستوى الرابع: أنواع الحسابات الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '21101', 'حسابات الموردين التجاريين', 'Trade Suppliers Accounts', 'liability', 'current_liability', parent_id, 4, false, true),
    (tenant_id_param, '21102', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers Accounts', 'liability', 'current_liability', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل الحسابات الدائنة
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '2110101', 'حسابات موردين تجاريون', 'Trade Suppliers Accounts', 'liability', 'current_liability', current_parent_id, 5, true, true),
    (tenant_id_param, '2110102', 'حسابات موردين قطع غيار', 'Spare Parts Suppliers Accounts', 'liability', 'current_liability', current_parent_id, 5, true, true),
    (tenant_id_param, '2110103', 'حسابات موردين أقساط', 'Installment Suppliers Accounts', 'liability', 'current_liability', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '2110201', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers Accounts', 'liability', 'current_liability', current_parent_id, 5, true, true);
    
    -- المستوى الثالث: حسابات دائنة أخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '212', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 3, false, true);
    
    -- المستوى الرابع: حسابات دائنة أخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '212';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '21201', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل الحسابات الدائنة الأخرى
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21201';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '2120101', 'مستحقات أجور الموظفين', 'Employee Salaries Payable', 'liability', 'current_liability', current_parent_id, 5, true, true),
    (tenant_id_param, '2120102', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', current_parent_id, 5, true, true);
    
    -- المستوى الثالث: قروض قصيرة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '213', 'قروض قصيرة الاجل', 'Short-term Loans', 'liability', 'current_liability', parent_id, 3, false, true);
    
    -- المستوى الرابع: أنواع القروض قصيرة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '213';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '21301', 'قروض بنوك قصيرة الاجل', 'Short-term Bank Loans', 'liability', 'current_liability', parent_id, 4, false, true),
    (tenant_id_param, '21302', 'قروض شركات التسهيلات قصيرة الاجل', 'Short-term Financing Companies Loans', 'liability', 'current_liability', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل القروض قصيرة الأجل
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21301';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '2130101', 'قرض بنك التجاري حساب رقم 000000000000', 'Commercial Bank Loan Account No. 000000000000', 'liability', 'current_liability', current_parent_id, 5, true, true),
    (tenant_id_param, '2130102', 'قرض بنك بيت التمويل حساب رقم 000000000000', 'Kuwait Finance House Loan Account No. 000000000000', 'liability', 'current_liability', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21302';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '2130201', 'قرض شركة التسهيلات حساب رقم 0000000000000', 'Financing Company Loan Account No. 0000000000000', 'liability', 'current_liability', current_parent_id, 5, true, true);
    
    -- المستوى الثاني: الالتزامات طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '22', 'الالتزامات طويلة الاجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true);
    
    -- المستوى الثالث: الالتزامات طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '221', 'الالتزامات طويلة الاجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 3, false, true);
    
    -- المستوى الرابع: أنواع الالتزامات طويلة الأجل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '221';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '22101', 'قروض بنوك طويلة الاجل', 'Long-term Bank Loans', 'liability', 'long_term_liability', parent_id, 4, false, true),
    (tenant_id_param, '22102', 'قروض شركات التسهيلات طويلة الاجل', 'Long-term Financing Companies Loans', 'liability', 'long_term_liability', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل الالتزامات طويلة الأجل
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '2210101', 'قرض بنك التجاري حساب رقم 000000000000', 'Commercial Bank Long-term Loan Account No. 000000000000', 'liability', 'long_term_liability', current_parent_id, 5, true, true),
    (tenant_id_param, '2210102', 'قرض بنك بيت التمويل حساب رقم 000000000000', 'Kuwait Finance House Long-term Loan Account No. 000000000000', 'liability', 'long_term_liability', current_parent_id, 5, true, true);
    
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '22102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '2210201', 'قرض شركة التسهيلات حساب رقم 0000000000000', 'Financing Company Long-term Loan Account No. 0000000000000', 'liability', 'long_term_liability', current_parent_id, 5, true, true);
    
    -- ==============================
    -- 3. حقوق الملكية (Equity)
    -- ==============================
    
    -- المستوى الأول: حقوق الملكية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
    VALUES (tenant_id_param, '3', 'حقوق الملكيه', 'Equity', 'equity', 'capital', 1, false, true);
    
    -- المستوى الثاني: رأس المال
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '31', 'راس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true);
    
    -- المستوى الثالث: رأس مال الشركاء
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '311', 'رأس مال الشركاء', 'Partners Capital', 'equity', 'capital', parent_id, 3, false, true);
    
    -- المستوى الرابع: رأس المال القائم
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '311';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '31101', 'راس المال القائم', 'Existing Capital', 'equity', 'capital', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل رأس المال
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '3110101', 'راس مال شريك أبو جراح', 'Partner Abu Jarrah Capital', 'equity', 'capital', current_parent_id, 5, true, true),
    (tenant_id_param, '3110102', 'راس مال شريك أبو حسين', 'Partner Abu Hussein Capital', 'equity', 'capital', current_parent_id, 5, true, true);
    
    -- المستوى الثاني: الأرباح المرحلة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '32', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true);
    
    -- المستوى الثالث: الأرباح المرحلة سنين سابقة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '32';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '321', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', parent_id, 3, false, true);
    
    -- المستوى الرابع: الأرباح المرحلة سنين سابقة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '321';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '32101', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل الأرباح المرحلة
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '32101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '3210101', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', current_parent_id, 5, true, true);
    
    -- المستوى الثاني: الاحتياطيات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '33', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true);
    
    -- المستوى الثالث: الاحتياطيات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '33';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '331', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 3, false, true);
    
    -- المستوى الرابع: الاحتياطيات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '331';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES (tenant_id_param, '33101', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 4, false, true);
    
    -- المستوى الخامس: تفاصيل الاحتياطيات
    SELECT id INTO current_parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '33101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
    VALUES 
    (tenant_id_param, '3310101', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', current_parent_id, 5, true, true),
    (tenant_id_param, '3310102', 'الاحتياطي العام', 'General Reserve', 'equity', 'capital', current_parent_id, 5, true, true),
    (tenant_id_param, '3310103', 'احتياطي إعادة التقييم', 'Revaluation Reserve', 'equity', 'capital', current_parent_id, 5, true, true);
    
    -- استمرار في الملف التالي بسبب طول الكود...
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$$; 