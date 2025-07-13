-- النظام المحاسبي الكامل حسب الجدول المرفق
-- نظام 7 أرقام مع التسلسل الهرمي الكامل

-- دالة لتطبيق النظام المحاسبي الكامل
CREATE OR REPLACE FUNCTION apply_complete_accounting_system()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    tenant_record RECORD;
    total_inserted INTEGER := 0;
    total_tenants INTEGER := 0;
    success_count INTEGER := 0;
    
    -- متغيرات لتخزين معرفات الحسابات الأساسية
    parent_id UUID;
    current_parent_id UUID;
    account_id UUID;
BEGIN
    -- تطبيق النظام على جميع المؤسسات
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants WHERE status = 'active'
    ) LOOP
        total_tenants := total_tenants + 1;
        
        BEGIN
            -- حذف الحسابات الموجودة
            DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id;
            
            -- ===== 1. الأصول (Assets) =====
            
            -- المستوى الأول: الأصول
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
            VALUES (tenant_record.id, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الثاني: الأصول المتداولة
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true)
            RETURNING id INTO account_id;
            
            -- المستوى الثالث: النقدية وما يعادلها
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '111', 'النقدية و ما يعادلها', 'Cash and Cash Equivalents', 'asset', 'current_asset', account_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الرابع: النقدية
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '11101', 'النقدية', 'Cash', 'asset', 'current_asset', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            -- المستوى الخامس: تفاصيل النقدية
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '1110101', 'الصندوق النقدي الرئيسي', 'Main Cash Box', 'asset', 'current_asset', current_parent_id, 5, true, true),
            (tenant_record.id, '1110102', 'عهدة نقدية دائمة', 'Permanent Cash Custody', 'asset', 'current_asset', current_parent_id, 5, true, true),
            (tenant_record.id, '1110103', 'عهدة نقدية مؤقتة', 'Temporary Cash Custody', 'asset', 'current_asset', current_parent_id, 5, true, true);
            
            -- المستوى الثالث: البنوك
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '112', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 3, false, true)
            RETURNING id INTO current_parent_id;
            
            -- المستوى الرابع: بنوك محلية
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '11201', 'بنوك محلية بالدينار الكويتي', 'Local Banks in KWD', 'asset', 'current_asset', current_parent_id, 4, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الخامس: تفاصيل البنوك
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '1120101', 'حساب البنك التجاري', 'Commercial Bank Account', 'asset', 'current_asset', parent_id, 5, true, true),
            (tenant_record.id, '1120102', 'حساب بنك بيت التمويل', 'Kuwait Finance House Account', 'asset', 'current_asset', parent_id, 5, true, true);
            
            -- المستوى الثالث: العملاء التجاريون
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '113', 'العملاء التجاريون', 'Trade Customers', 'asset', 'current_asset', parent_id, 3, false, true)
            RETURNING id INTO current_parent_id;
            
            -- المستوى الرابع: أنواع العملاء مع التفاصيل
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '11301', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', current_parent_id, 4, false, true),
            (tenant_record.id, '11302', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', current_parent_id, 4, false, true),
            (tenant_record.id, '11303', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', current_parent_id, 4, false, true);
            
            -- المستوى الخامس: تفاصيل العملاء
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11301';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '1130101', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11302';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '1130201', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11303';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '1130301', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', parent_id, 5, true, true);
            
            -- المستوى الثالث: المخزون
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '115', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true)
            RETURNING id INTO current_parent_id;
            
            -- المستوى الرابع: أنواع المخزون مع التفاصيل
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '11501', 'مخازن قطع الغيار', 'Spare Parts Warehouses', 'asset', 'current_asset', current_parent_id, 4, false, true),
            (tenant_record.id, '11502', 'مخازن العدد و الأدوات', 'Tools Warehouses', 'asset', 'current_asset', current_parent_id, 4, false, true),
            (tenant_record.id, '11503', 'مخازن الأدوات المكتبية', 'Office Supplies Warehouses', 'asset', 'current_asset', current_parent_id, 4, false, true);
            
            -- المستوى الخامس: تفاصيل المخزون
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11501';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '1150101', 'مخزن قطع الغيار رقم 1', 'Spare Parts Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11502';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '1150201', 'مخزن عدد و أدوات رقم 1', 'Tools Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '11503';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '1150301', 'مخازن الأدوات المكتبية رقم 1', 'Office Supplies Warehouse No. 1', 'asset', 'current_asset', parent_id, 5, true, true);
            
            -- الأصول الثابتة
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '1';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '12', 'الأصول الغير متداولة', 'Non-Current Assets', 'asset', 'fixed_asset', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '121', 'أصول طويلة الامد', 'Long-term Assets', 'asset', 'fixed_asset', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '12101', 'أصول طويلة الامد مملوكة', 'Owned Long-term Assets', 'asset', 'fixed_asset', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            -- تفاصيل الأصول الثابتة
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '1210101', 'سيارات و باصات', 'Cars and Buses', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
            (tenant_record.id, '1210102', 'مباني و أراضي', 'Buildings and Land', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
            (tenant_record.id, '1210103', 'اثاث', 'Furniture', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
            (tenant_record.id, '1210104', 'معدات صيانة', 'Maintenance Equipment', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
            (tenant_record.id, '1210105', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', current_parent_id, 5, true, true),
            (tenant_record.id, '1210106', 'برامج و تكنولوجيا', 'Software and Technology', 'asset', 'fixed_asset', current_parent_id, 5, true, true);
            
            -- ===== 2. الالتزامات (Liabilities) =====
            
            -- المستوى الأول: الالتزامات
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
            VALUES (tenant_record.id, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الثاني: الالتزامات المتداولة
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            -- المستوى الثالث: الحسابات الدائنة
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '211', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الرابع: أنواع الحسابات الدائنة
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '21101', 'حسابات الموردين التجاريين', 'Trade Suppliers', 'liability', 'current_liability', parent_id, 4, false, true),
            (tenant_record.id, '21102', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers', 'liability', 'current_liability', parent_id, 4, false, true);
            
            -- المستوى الخامس: تفاصيل الحسابات الدائنة
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '21101';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '2110101', 'حسابات موردين تجاريون', 'Trade Suppliers', 'liability', 'current_liability', parent_id, 5, true, true),
            (tenant_record.id, '2110102', 'حسابات موردين قطع غيار', 'Spare Parts Suppliers', 'liability', 'current_liability', parent_id, 5, true, true),
            (tenant_record.id, '2110103', 'حسابات موردين أقساط', 'Installment Suppliers', 'liability', 'current_liability', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '21102';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '2110201', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers', 'liability', 'current_liability', parent_id, 5, true, true);
            
            -- حسابات دائنة أخرى
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '21';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '212', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 3, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '21201', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', current_parent_id, 4, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '2120101', 'مستحقات أجور الموظفين', 'Employee Salaries Payable', 'liability', 'current_liability', parent_id, 5, true, true),
            (tenant_record.id, '2120102', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', parent_id, 5, true, true);
            
            -- ===== 3. حقوق الملكية (Equity) =====
            
            -- المستوى الأول: حقوق الملكية
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
            VALUES (tenant_record.id, '3', 'حقوق الملكيه', 'Equity', 'equity', 'capital', 1, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الثاني: رأس المال
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '31', 'راس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            -- المستوى الثالث: رأس مال الشركاء
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '311', 'رأس مال الشركاء', 'Partners Capital', 'equity', 'capital', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '31101', 'راس المال القائم', 'Existing Capital', 'equity', 'capital', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '3110101', 'راس مال شريك أبو جراح', 'Partner Abu Jarrah Capital', 'equity', 'capital', current_parent_id, 5, true, true),
            (tenant_record.id, '3110102', 'راس مال شريك أبو حسين', 'Partner Abu Hussein Capital', 'equity', 'capital', current_parent_id, 5, true, true);
            
            -- الأرباح المرحلة
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '3';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '32', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '321', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '32101', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '3210101', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', current_parent_id, 5, true, true);
            
            -- الاحتياطيات
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '3';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '33', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '331', 'الاحتياطيات', 'Reserves', 'equity', 'capital', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '33101', 'الاحتياطيات', 'Reserves', 'equity', 'capital', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '3310101', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', current_parent_id, 5, true, true),
            (tenant_record.id, '3310102', 'الاحتياطي العام', 'General Reserve', 'equity', 'capital', current_parent_id, 5, true, true),
            (tenant_record.id, '3310103', 'احتياطي إعادة التقييم', 'Revaluation Reserve', 'equity', 'capital', current_parent_id, 5, true, true);
            
            -- ===== 4. الإيرادات (Revenue) =====
            
            -- المستوى الأول: الإيرادات
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
            VALUES (tenant_record.id, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الثاني: إيرادات التأجير
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            -- المستوى الثالث: ايراد تأجير
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '411', 'ايراد تأجير', 'Rental Revenue', 'revenue', 'operating_revenue', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الرابع: أنواع إيرادات التأجير
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '41101', 'إيرادات تأجير - شركات', 'Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 4, false, true),
            (tenant_record.id, '41102', 'إيرادات تأجير - شركات زميلة', 'Rental Revenue - Sister Companies', 'revenue', 'operating_revenue', parent_id, 4, false, true),
            (tenant_record.id, '41103', 'ايراد تأجير - اشخاص', 'Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 4, false, true);
            
            -- المستوى الخامس: تفاصيل إيرادات التأجير
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '41101';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '4110101', 'ايراد تأجير سيارات و باصات - شركات', 'Car & Bus Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '41102';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '4110201', 'ايراد تأجير سيارات و باصات - شركات زميله', 'Car & Bus Rental Revenue - Sister Companies', 'revenue', 'operating_revenue', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '41103';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '4110301', 'ايراد تأجير سيارات و باصات - اشخاص', 'Car & Bus Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 5, true, true);
            
            -- إيرادات الصيانة
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '4';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '42', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '421', 'إيرادات ورشه الصيانة', 'Maintenance Workshop Revenue', 'revenue', 'operating_revenue', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '42101', 'ايراد ورشه الصيانة', 'Maintenance Workshop Revenue', 'revenue', 'operating_revenue', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '4210101', 'ايراد ورشة الصيانة الداخلية', 'Internal Maintenance Workshop Revenue', 'revenue', 'operating_revenue', current_parent_id, 5, true, true),
            (tenant_record.id, '4210102', 'ايراد ورش صيانة خارجيه', 'External Maintenance Workshop Revenue', 'revenue', 'operating_revenue', current_parent_id, 5, true, true),
            (tenant_record.id, '4210103', 'ايراد بيع قطع غيار', 'Spare Parts Sales Revenue', 'revenue', 'operating_revenue', current_parent_id, 5, true, true);
            
            -- إيرادات خدمات أخرى
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '4';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '43', 'إيرادات خدمات اخري', 'Other Services Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '431', 'ايراد خدمات التوصيل و الاستلام', 'Delivery & Pickup Services Revenue', 'revenue', 'operating_revenue', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '43101', 'ايراد خدمات التوصيل و الاستلام و خدمات اخري', 'Delivery & Pickup and Other Services Revenue', 'revenue', 'operating_revenue', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '4310101', 'ايراد خدمات التوصيل', 'Delivery Services Revenue', 'revenue', 'operating_revenue', current_parent_id, 5, true, true),
            (tenant_record.id, '4310102', 'ايراد خدمات الاستلام', 'Pickup Services Revenue', 'revenue', 'operating_revenue', current_parent_id, 5, true, true),
            (tenant_record.id, '4310103', 'إيرادات بيع سكراب', 'Scrap Sales Revenue', 'revenue', 'operating_revenue', current_parent_id, 5, true, true),
            (tenant_record.id, '4310104', 'إيرادات اخري', 'Other Revenue', 'revenue', 'operating_revenue', current_parent_id, 5, true, true);
            
            -- ===== 5. المصروفات (Expenses) =====
            
            -- المستوى الأول: المصروفات
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active)
            VALUES (tenant_record.id, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الثاني: مصروفات ثابتة
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '51', 'مصروفات ثابتة', 'Fixed Expenses', 'expense', 'operating_expense', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            -- المستوى الثالث: الإيجارات
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '511', 'الإيجارات', 'Rent Expenses', 'expense', 'operating_expense', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            -- المستوى الرابع: أنواع الإيجارات
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '51101', 'ايجارات سيارات و باصات', 'Cars & Buses Rent', 'expense', 'operating_expense', parent_id, 4, false, true),
            (tenant_record.id, '51102', 'ايجارات مكاتب و أراضي', 'Offices & Land Rent', 'expense', 'operating_expense', parent_id, 4, false, true),
            (tenant_record.id, '51103', 'ايجارات شقق و عقارات', 'Apartments & Properties Rent', 'expense', 'operating_expense', parent_id, 4, false, true);
            
            -- المستوى الخامس: تفاصيل الإيجارات
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '51101';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '5110101', 'ايجارات سيارات و باصات من الغير', 'Cars & Buses Rent from Others', 'expense', 'operating_expense', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '51102';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '5110201', 'ايجار مكاتب', 'Office Rent', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5110202', 'ايجار ورشة', 'Workshop Rent', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5110203', 'ايجار أراضي و مخازن', 'Land & Warehouses Rent', 'expense', 'operating_expense', parent_id, 5, true, true);
            
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '51103';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '5110301', 'ايجار شقق سكنية', 'Residential Apartments Rent', 'expense', 'operating_expense', parent_id, 5, true, true);
            
            -- الرواتب والأجور
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '51';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '512', 'الرواتب و الأجور و البدلات للموظفين', 'Employee Salaries & Wages & Allowances', 'expense', 'operating_expense', parent_id, 3, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '51201', 'الرواتب و الأجور و البدلات للموظفين', 'Employee Salaries & Wages & Allowances', 'expense', 'operating_expense', current_parent_id, 4, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '5120101', 'الرواتب الأساسية للموظفين', 'Basic Employee Salaries', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5120102', 'بدلات نقدية للموظفين', 'Employee Cash Allowances', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5120103', 'بدلات خطوط موبيل', 'Mobile Line Allowances', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5120104', 'مصاريف الاجازات', 'Vacation Expenses', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5120105', 'مصاريف نهاية الخدمة', 'End of Service Expenses', 'expense', 'operating_expense', parent_id, 5, true, true);
            
            -- الإهلاكات
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '51';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '513', 'الاهلاكات', 'Depreciation', 'expense', 'operating_expense', parent_id, 3, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '51301', 'اهلاك الأصول الغير متداولة', 'Non-Current Assets Depreciation', 'expense', 'operating_expense', current_parent_id, 4, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '5130101', 'مصروف اهلاك السيارات و الباصات', 'Cars & Buses Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5130102', 'مصروف اهلاك مباني', 'Buildings Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5130103', 'مصروف اهلاك اثاث', 'Furniture Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5130104', 'مصروف اهلاك معدات الصيانة', 'Maintenance Equipment Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5130105', 'مصروف اهلاك أجهزة كمبيوتر', 'Computer Equipment Depreciation Expense', 'expense', 'operating_expense', parent_id, 5, true, true),
            (tenant_record.id, '5130106', 'مصروف إطفاء قيمة برامج و تكنولوجيا', 'Software & Technology Amortization Expense', 'expense', 'operating_expense', parent_id, 5, true, true);
            
            -- مصروفات متغيرة
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '5';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '52', 'مصروفات متغيرة', 'Variable Expenses', 'expense', 'operating_expense', parent_id, 2, false, true)
            RETURNING id INTO current_parent_id;
            
            -- أجور ورواتب مؤقتة
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '521', 'أجور و رواتب مؤقتة', 'Temporary Wages & Salaries', 'expense', 'operating_expense', current_parent_id, 3, false, true)
            RETURNING id INTO parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '52101', 'أجور و رواتب يومية', 'Daily Wages & Salaries', 'expense', 'operating_expense', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '5210101', 'رواتب يوميات للموظفين مؤقتة', 'Temporary Employee Daily Wages', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210102', 'مكافئات', 'Bonuses', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210103', 'اكراميات', 'Tips', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210104', 'أجور ساعات إضافية', 'Overtime Wages', 'expense', 'operating_expense', current_parent_id, 5, true, true);
            
            -- مصروفات صيانة
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '521';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '52102', 'مصروفات صيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '5210201', 'مصروفات قطع غيار', 'Spare Parts Expenses', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210202', 'مصروفات صيانة', 'Maintenance Expenses', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210203', 'مصروفات زيوت و فلاتر', 'Oil & Filters Expenses', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210204', 'مصروفات صبغ و حدادة', 'Painting & Blacksmithing Expenses', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210205', 'تواير و بنشر', 'Tires & Puncture Repair', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210206', 'بطاريات', 'Batteries', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210207', 'مصروفات بنزين', 'Gasoline Expenses', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210208', 'مصروفات ديزل', 'Diesel Expenses', 'expense', 'operating_expense', current_parent_id, 5, true, true);
            
            -- مصاريف أدوات مكتبية
            SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id AND account_code = '521';
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES (tenant_record.id, '52103', 'مصاريف أدوات مكتبية و مطبوعات', 'Office Supplies & Printing Expenses', 'expense', 'operating_expense', parent_id, 4, false, true)
            RETURNING id INTO current_parent_id;
            
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active)
            VALUES 
            (tenant_record.id, '5210301', 'ورق تصوير', 'Copy Paper', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210302', 'أدوات مكتبية', 'Office Supplies', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210303', 'مطبوعات', 'Printing', 'expense', 'operating_expense', current_parent_id, 5, true, true),
            (tenant_record.id, '5210304', 'إعلانات', 'Advertisements', 'expense', 'operating_expense', current_parent_id, 5, true, true);
            
            success_count := success_count + 1;
            
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'خطأ في تطبيق النظام المحاسبي للمؤسسة %: %', tenant_record.name, SQLERRM;
        END;
    END LOOP;
    
    -- إنشاء النتيجة النهائية
    SELECT jsonb_build_object(
        'total_tenants', total_tenants,
        'successful_updates', success_count,
        'failed_updates', total_tenants - success_count,
        'success_rate', CASE 
            WHEN total_tenants > 0 THEN ROUND((success_count::NUMERIC / total_tenants::NUMERIC) * 100, 2)
            ELSE 0 
        END,
        'execution_time', now(),
        'message', 'تم تطبيق النظام المحاسبي الكامل بنجاح'
    ) INTO result;
    
    RETURN result;
END;
$$;

-- تشغيل النظام
SELECT 'بدء تطبيق النظام المحاسبي الكامل...' AS status;
SELECT apply_complete_accounting_system() AS result;

-- دالة للتحقق من النتائج
CREATE OR REPLACE FUNCTION verify_complete_accounting_system()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    tenant_record RECORD;
    total_tenants INTEGER := 0;
    verified_tenants INTEGER := 0;
    sample_accounts TEXT[] := ARRAY[
        '1110101', '1120101', '1130101', '1150101', '1210101',
        '2110101', '2120101', '3110101', '3210101', '3310101',
        '4110101', '4110201', '4110301', '4210101', '4310101',
        '5110101', '5120101', '5130101', '5210101', '5210201'
    ];
    missing_count INTEGER;
    account_code TEXT;
BEGIN
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants WHERE status = 'active'
    ) LOOP
        total_tenants := total_tenants + 1;
        missing_count := 0;
        
        -- فحص عينة من الحسابات الأساسية
        FOREACH account_code IN ARRAY sample_accounts
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM public.chart_of_accounts 
                WHERE tenant_id = tenant_record.id AND account_code = account_code
            ) THEN
                missing_count := missing_count + 1;
            END IF;
        END LOOP;
        
        IF missing_count = 0 THEN
            verified_tenants := verified_tenants + 1;
        END IF;
    END LOOP;
    
    SELECT jsonb_build_object(
        'total_tenants', total_tenants,
        'verified_tenants', verified_tenants,
        'unverified_tenants', total_tenants - verified_tenants,
        'success_rate', CASE 
            WHEN total_tenants > 0 THEN ROUND((verified_tenants::NUMERIC / total_tenants::NUMERIC) * 100, 2)
            ELSE 0 
        END,
        'sample_accounts_checked', array_length(sample_accounts, 1),
        'verification_time', now(),
        'message', 'تم التحقق من النظام المحاسبي بنجاح'
    ) INTO result;
    
    RETURN result;
END;
$$;

-- التحقق من النتائج
SELECT 'التحقق من النتائج...' AS status;
SELECT verify_complete_accounting_system() AS verification_result;

-- عرض عينة من الحسابات المنشأة
SELECT 
    'عينة من الحسابات المنشأة' AS report_title,
    t.name as tenant_name,
    COUNT(coa.id) as total_accounts,
    COUNT(CASE WHEN coa.level = 5 THEN 1 END) as detailed_accounts
FROM tenants t
LEFT JOIN chart_of_accounts coa ON t.id = coa.tenant_id
WHERE t.status = 'active'
GROUP BY t.id, t.name
ORDER BY t.name
LIMIT 5; 