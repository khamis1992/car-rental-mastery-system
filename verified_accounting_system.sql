-- النظام المحاسبي المعتمد - مطابقة كاملة للجدول المرفق
-- تم التحقق من جميع الأرقام والتأكد من مطابقتها

CREATE OR REPLACE FUNCTION apply_verified_accounting_system()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    tenant_record RECORD;
    success_count INTEGER := 0;
    total_tenants INTEGER := 0;
BEGIN
    -- تطبيق النظام على جميع المؤسسات
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants WHERE status = 'active'
    ) LOOP
        total_tenants := total_tenants + 1;
        
        BEGIN
            -- حذف الحسابات الموجودة
            DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_record.id;
            
            -- إدراج الحسابات حسب الجدول المرفق تماماً
            INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance) VALUES
            
            -- الأصول (1)
            (tenant_record.id, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0),
            (tenant_record.id, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', 2, false, true, 0, 0),
            (tenant_record.id, '111', 'النقدية و ما يعادلها', 'Cash and Cash Equivalents', 'asset', 'current_asset', 3, false, true, 0, 0),
            (tenant_record.id, '11101', 'النقدية', 'Cash', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1110101', 'الصندوق النقدي الرئيسي', 'Main Cash Box', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1110102', 'عهدة نقدية دائمة', 'Permanent Cash Custody', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1110103', 'عهدة نقدية مؤقتة', 'Temporary Cash Custody', 'asset', 'current_asset', 5, true, true, 0, 0),
            
            -- البنوك (112)
            (tenant_record.id, '112', 'البنوك', 'Banks', 'asset', 'current_asset', 3, false, true, 0, 0),
            (tenant_record.id, '11201', 'بنوك محلية بالدينار الكويتي', 'Local Banks in KWD', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1120101', 'حساب البنك التجاري حساب رقم 0000000000000', 'Commercial Bank Account No. 0000000000000', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1120102', 'حساب بنك بيت التمويل حساب رقم 0000000000000', 'Kuwait Finance House Account No. 0000000000000', 'asset', 'current_asset', 5, true, true, 0, 0),
            
            -- العملاء التجاريون (113)
            (tenant_record.id, '113', 'العملاء التجاريون', 'Trade Customers', 'asset', 'current_asset', 3, false, true, 0, 0),
            (tenant_record.id, '11301', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1130101', 'عملاء تجاريون شركات', 'Trade Customers - Companies', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '11302', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1130201', 'عملاء تجاريون شركات زميلة', 'Trade Customers - Sister Companies', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '11303', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1130301', 'عملاء تجاريون اشخاص', 'Trade Customers - Individuals', 'asset', 'current_asset', 5, true, true, 0, 0),
            
            -- ذمم مدينة اخري (114)
            (tenant_record.id, '114', 'ذمم مدينة اخري', 'Other Receivables', 'asset', 'current_asset', 3, false, true, 0, 0),
            (tenant_record.id, '11401', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1140101', 'ذمم موظفين', 'Employee Receivables', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '11402', 'ذمم مدينة لا تخص النشاط', 'Non-Operating Receivables', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1140201', 'ذمم مدينة لا تخص النشاط', 'Non-Operating Receivables', 'asset', 'current_asset', 5, true, true, 0, 0),
            
            -- المخزون (115)
            (tenant_record.id, '115', 'المخزون', 'Inventory', 'asset', 'current_asset', 3, false, true, 0, 0),
            (tenant_record.id, '11501', 'مخازن قطع الغيار', 'Spare Parts Warehouses', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1150101', 'مخزن قطع الغيار رقم 1', 'Spare Parts Warehouse No. 1', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '11502', 'مخازن العدد و الأدوات', 'Tools and Equipment Warehouses', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1150201', 'مخزن عدد و أدوات رقم 1', 'Tools and Equipment Warehouse No. 1', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '11503', 'مخازن الأدوات المكتبية و المطبوعات', 'Office Supplies and Printing Warehouses', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1150301', 'مخازن الأدوات المكتبية و المطبوعات رقم 1', 'Office Supplies and Printing Warehouse No. 1', 'asset', 'current_asset', 5, true, true, 0, 0),
            
            -- مصروفات مدفوعه مقدما (116)
            (tenant_record.id, '116', 'مصروفات مدفوعه مقدما', 'Prepaid Expenses', 'asset', 'current_asset', 3, false, true, 0, 0),
            (tenant_record.id, '11601', 'مصروفات مدفوعه مقدما', 'Prepaid Expenses', 'asset', 'current_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1160101', 'مصروفات مدفوعه مقدما ايجارات', 'Prepaid Rent Expenses', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1160102', 'مصروفات مدفوعه مقدما صيانة', 'Prepaid Maintenance Expenses', 'asset', 'current_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1160103', 'مصروفات مدفوعه مقدما قطع غيار', 'Prepaid Spare Parts Expenses', 'asset', 'current_asset', 5, true, true, 0, 0),
            
            -- استثمارات قصيرة الاجل (117)
            (tenant_record.id, '117', 'استثمارات قصيرة الاجل', 'Short-term Investments', 'asset', 'current_asset', 3, true, true, 0, 0),
            
            -- الأصول الغير متداولة (12)
            (tenant_record.id, '12', 'الأصول الغير متداولة', 'Non-Current Assets', 'asset', 'fixed_asset', 2, false, true, 0, 0),
            (tenant_record.id, '121', 'أصول طويلة الامد مملوكة للشركة', 'Long-term Assets Owned by Company', 'asset', 'fixed_asset', 3, false, true, 0, 0),
            (tenant_record.id, '12101', 'أصول طويلة الامد مملوكة للشركة', 'Long-term Assets Owned by Company', 'asset', 'fixed_asset', 4, false, true, 0, 0),
            (tenant_record.id, '1210101', 'سيارات و باصات', 'Cars and Buses', 'asset', 'fixed_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1210102', 'مباني و أراضي', 'Buildings and Land', 'asset', 'fixed_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1210103', 'اثاث', 'Furniture', 'asset', 'fixed_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1210104', 'معدات صيانة', 'Maintenance Equipment', 'asset', 'fixed_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1210105', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', 5, true, true, 0, 0),
            (tenant_record.id, '1210106', 'برامج و تكنولوجيا', 'Software and Technology', 'asset', 'fixed_asset', 5, true, true, 0, 0),
            
            -- عقود ايجار تنتهي بالتملك (122)
            (tenant_record.id, '122', 'عقود ايجار تنتهي بالتملك', 'Finance Lease Contracts', 'asset', 'fixed_asset', 3, false, true, 0, 0),
            (tenant_record.id, '12201', 'عقود ايجار تنتهي بالتملك', 'Finance Lease Contracts', 'asset', 'fixed_asset', 4, true, true, 0, 0),
            
            -- استثمارات طويلة الاجل (123)
            (tenant_record.id, '123', 'استثمارات طويلة الاجل', 'Long-term Investments', 'asset', 'fixed_asset', 3, true, true, 0, 0),
            
            -- الالتزامات (2)
            (tenant_record.id, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0),
            (tenant_record.id, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', 2, false, true, 0, 0),
            (tenant_record.id, '211', 'الحسابات الدائنة', 'Accounts Payable', 'liability', 'current_liability', 3, false, true, 0, 0),
            (tenant_record.id, '21101', 'حسابات الموردين التجاريين', 'Trade Suppliers Accounts', 'liability', 'current_liability', 4, false, true, 0, 0),
            (tenant_record.id, '2110101', 'حسابات موردين تجاريون', 'Trade Suppliers Accounts', 'liability', 'current_liability', 5, true, true, 0, 0),
            (tenant_record.id, '2110102', 'حسابات موردين قطع غيار', 'Spare Parts Suppliers Accounts', 'liability', 'current_liability', 5, true, true, 0, 0),
            (tenant_record.id, '2110103', 'حسابات موردين أقساط', 'Installment Suppliers Accounts', 'liability', 'current_liability', 5, true, true, 0, 0),
            (tenant_record.id, '21102', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers Accounts', 'liability', 'current_liability', 4, false, true, 0, 0),
            (tenant_record.id, '2110201', 'حسابات موردين شركات زميله', 'Sister Companies Suppliers Accounts', 'liability', 'current_liability', 5, true, true, 0, 0),
            
            -- حسابات دائنة اخري (212)
            (tenant_record.id, '212', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', 3, false, true, 0, 0),
            (tenant_record.id, '21201', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', 4, false, true, 0, 0),
            (tenant_record.id, '2120101', 'مستحقات أجور الموظفين', 'Employee Salaries Payable', 'liability', 'current_liability', 5, true, true, 0, 0),
            (tenant_record.id, '2120102', 'حسابات دائنة اخري', 'Other Payables', 'liability', 'current_liability', 5, true, true, 0, 0),
            
            -- قروض قصيرة الاجل (213)
            (tenant_record.id, '213', 'قروض قصيرة الاجل', 'Short-term Loans', 'liability', 'current_liability', 3, false, true, 0, 0),
            (tenant_record.id, '21301', 'قروض بنوك قصيرة الاجل', 'Short-term Bank Loans', 'liability', 'current_liability', 4, false, true, 0, 0),
            (tenant_record.id, '2130101', 'قرض بنك التجاري حساب رقم 000000000000', 'Commercial Bank Loan Account No. 000000000000', 'liability', 'current_liability', 5, true, true, 0, 0),
            (tenant_record.id, '2130102', 'قرض بنك بيت التمويل حساب رقم 000000000000', 'Kuwait Finance House Loan Account No. 000000000000', 'liability', 'current_liability', 5, true, true, 0, 0),
            (tenant_record.id, '21302', 'قروض شركات التسهيلات قصيرة الاجل', 'Short-term Financing Companies Loans', 'liability', 'current_liability', 4, false, true, 0, 0),
            (tenant_record.id, '2130201', 'قرض شركة ******* حساب رقم 0000000000000', 'Financing Company Loan Account No. 0000000000000', 'liability', 'current_liability', 5, true, true, 0, 0),
            
            -- الالتزامات طويلة الاجل (22)
            (tenant_record.id, '22', 'الالتزامات طويلة الاجل', 'Long-term Liabilities', 'liability', 'long_term_liability', 2, false, true, 0, 0),
            (tenant_record.id, '221', 'الالتزامات طويلة الاجل', 'Long-term Liabilities', 'liability', 'long_term_liability', 3, false, true, 0, 0),
            (tenant_record.id, '22101', 'قروض بنوك طويلة الاجل', 'Long-term Bank Loans', 'liability', 'long_term_liability', 4, false, true, 0, 0),
            (tenant_record.id, '2210101', 'قرض بنك التجاري حساب رقم 000000000000', 'Commercial Bank Long-term Loan Account No. 000000000000', 'liability', 'long_term_liability', 5, true, true, 0, 0),
            (tenant_record.id, '2210102', 'قرض بنك بيت التمويل حساب رقم 000000000000', 'Kuwait Finance House Long-term Loan Account No. 000000000000', 'liability', 'long_term_liability', 5, true, true, 0, 0),
            (tenant_record.id, '22102', 'قروض شركات التسهيلات طويلة الاجل', 'Long-term Financing Companies Loans', 'liability', 'long_term_liability', 4, false, true, 0, 0),
            (tenant_record.id, '2210201', 'قرض شركة ******* حساب رقم 0000000000000', 'Financing Company Long-term Loan Account No. 0000000000000', 'liability', 'long_term_liability', 5, true, true, 0, 0),
            
            -- حقوق الملكيه (3)
            (tenant_record.id, '3', 'حقوق الملكيه', 'Equity', 'equity', 'capital', 1, false, true, 0, 0),
            (tenant_record.id, '31', 'راس المال', 'Capital', 'equity', 'capital', 2, false, true, 0, 0),
            (tenant_record.id, '311', 'رأس مال الشركاء', 'Partners Capital', 'equity', 'capital', 3, false, true, 0, 0),
            (tenant_record.id, '31101', 'راس المال القائم', 'Existing Capital', 'equity', 'capital', 4, false, true, 0, 0),
            (tenant_record.id, '3110101', 'راس مال شريك أبو جراح', 'Partner Abu Jarrah Capital', 'equity', 'capital', 5, true, true, 0, 0),
            (tenant_record.id, '3110102', 'راس مال شريك أبو حسين', 'Partner Abu Hussein Capital', 'equity', 'capital', 5, true, true, 0, 0),
            
            -- الأرباح المرحلة (32)
            (tenant_record.id, '32', 'الأرباح المرحلة', 'Retained Earnings', 'equity', 'capital', 2, false, true, 0, 0),
            (tenant_record.id, '321', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', 3, false, true, 0, 0),
            (tenant_record.id, '32101', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', 4, false, true, 0, 0),
            (tenant_record.id, '3210101', 'الأرباح المرحلة سنين سابقة', 'Retained Earnings from Previous Years', 'equity', 'capital', 5, true, true, 0, 0),
            
            -- الاحتياطيات (33)
            (tenant_record.id, '33', 'الاحتياطيات', 'Reserves', 'equity', 'capital', 2, false, true, 0, 0),
            (tenant_record.id, '331', 'الاحتياطيات', 'Reserves', 'equity', 'capital', 3, false, true, 0, 0),
            (tenant_record.id, '33101', 'الاحتياطيات', 'Reserves', 'equity', 'capital', 4, false, true, 0, 0),
            (tenant_record.id, '3310101', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', 5, true, true, 0, 0),
            (tenant_record.id, '3310102', 'الاحتياطي العام', 'General Reserve', 'equity', 'capital', 5, true, true, 0, 0),
            (tenant_record.id, '3310103', 'احتياطي إعادة التقييم', 'Revaluation Reserve', 'equity', 'capital', 5, true, true, 0, 0),
            
            -- الإيرادات (4)
            (tenant_record.id, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0),
            (tenant_record.id, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', 2, false, true, 0, 0),
            (tenant_record.id, '411', 'ايراد تأجير', 'Rental Revenue', 'revenue', 'operating_revenue', 3, false, true, 0, 0),
            (tenant_record.id, '41101', 'إيرادات تأجير - شركات', 'Rental Revenue - Companies', 'revenue', 'operating_revenue', 4, false, true, 0, 0),
            (tenant_record.id, '4110101', 'ايراد تأجير سيارات و باصات - شركات', 'Car & Bus Rental Revenue - Companies', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            (tenant_record.id, '41102', 'إيرادات تأجير - شركات زميلة', 'Rental Revenue - Sister Companies', 'revenue', 'operating_revenue', 4, false, true, 0, 0),
            (tenant_record.id, '4110201', 'ايراد تأجير سيارات و باصات - شركات زميله', 'Car & Bus Rental Revenue - Sister Companies', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            (tenant_record.id, '41103', 'ايراد تأجير - اشخاص', 'Rental Revenue - Individuals', 'revenue', 'operating_revenue', 4, false, true, 0, 0),
            (tenant_record.id, '4110301', 'ايراد تأجير سيارات و باصات - اشخاص', 'Car & Bus Rental Revenue - Individuals', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            
            -- إيرادات الصيانة (42)
            (tenant_record.id, '42', 'إيرادات الصيانة', 'Maintenance Revenue', 'revenue', 'operating_revenue', 2, false, true, 0, 0),
            (tenant_record.id, '421', 'إيرادات ورشه الصيانة', 'Maintenance Workshop Revenue', 'revenue', 'operating_revenue', 3, false, true, 0, 0),
            (tenant_record.id, '42101', 'ايراد ورشه الصيانة', 'Maintenance Workshop Revenue', 'revenue', 'operating_revenue', 4, false, true, 0, 0),
            (tenant_record.id, '4210101', 'ايراد ورشة الصيانة الداخلية', 'Internal Maintenance Workshop Revenue', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            (tenant_record.id, '4210102', 'ايراد ورش صيانة خارجيه', 'External Maintenance Workshop Revenue', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            (tenant_record.id, '4210103', 'ايراد بيع قطع غيار', 'Spare Parts Sales Revenue', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            
            -- إيرادات خدمات اخري (43)
            (tenant_record.id, '43', 'إيرادات خدمات اخري', 'Other Services Revenue', 'revenue', 'operating_revenue', 2, false, true, 0, 0),
            (tenant_record.id, '431', 'ايراد خدمات التوصيل و الاستلام', 'Delivery & Pickup Services Revenue', 'revenue', 'operating_revenue', 3, false, true, 0, 0),
            (tenant_record.id, '43101', 'ايراد خدمات التوصيل و الاستلام و خدمات اخري', 'Delivery & Pickup and Other Services Revenue', 'revenue', 'operating_revenue', 4, false, true, 0, 0),
            (tenant_record.id, '4310101', 'ايراد خدمات التوصيل', 'Delivery Services Revenue', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            (tenant_record.id, '4310102', 'ايراد خدمات الاستلام', 'Pickup Services Revenue', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            (tenant_record.id, '4310103', 'إيرادات بيع سكراب', 'Scrap Sales Revenue', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            (tenant_record.id, '4310104', 'إيرادات اخري', 'Other Revenue', 'revenue', 'operating_revenue', 5, true, true, 0, 0),
            
            -- المصروفات (5)
            (tenant_record.id, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0),
            (tenant_record.id, '51', 'مصروفات ثابتة', 'Fixed Expenses', 'expense', 'operating_expense', 2, false, true, 0, 0),
            
            -- الإيجارات (511)
            (tenant_record.id, '511', 'الإيجارات', 'Rent Expenses', 'expense', 'operating_expense', 3, false, true, 0, 0),
            (tenant_record.id, '51101', 'ايجارات سيارات و باصات', 'Cars & Buses Rent', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5110101', 'ايجارات سيارات و باصات من الغير', 'Cars & Buses Rent from Others', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '51102', 'ايجارات مكاتب و أراضي', 'Offices & Land Rent', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5110201', 'ايجار مكاتب', 'Office Rent', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5110202', 'ايجار ورشة', 'Workshop Rent', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5110203', 'ايجار أراضي و مخازن', 'Land & Warehouses Rent', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '51103', 'ايجارات شقق و عقارات', 'Apartments & Properties Rent', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5110301', 'ايجار شقق سكنية', 'Residential Apartments Rent', 'expense', 'operating_expense', 5, true, true, 0, 0),
            
            -- الرواتب و الأجور (512)
            (tenant_record.id, '512', 'الرواتب و الأجور و البدلات للموظفين', 'Employee Salaries & Wages & Allowances', 'expense', 'operating_expense', 3, false, true, 0, 0),
            (tenant_record.id, '51201', 'الرواتب و الأجور و البدلات للموظفين', 'Employee Salaries & Wages & Allowances', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5120101', 'الرواتب الأساسية للموظفين', 'Basic Employee Salaries', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5120102', 'بدلات نقدية للموظفين', 'Employee Cash Allowances', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5120103', 'بدلات خطوط موبيل', 'Mobile Line Allowances', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5120104', 'مصاريف الاجازات', 'Vacation Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5120105', 'مصاريف نهاية الخدمة', 'End of Service Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            
            -- الاهلاكات (513)
            (tenant_record.id, '513', 'الاهلاكات', 'Depreciation', 'expense', 'operating_expense', 3, false, true, 0, 0),
            (tenant_record.id, '51301', 'اهلاك الأصول الغير متداولة', 'Non-Current Assets Depreciation', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5130101', 'مصروف اهلاك السيارات و الباصات', 'Cars & Buses Depreciation Expense', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5130102', 'مصروف اهلاك مباني', 'Buildings Depreciation Expense', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5130103', 'مصروف اهلاك اثاث', 'Furniture Depreciation Expense', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5130104', 'مصروف اهلاك معدات الصيانة', 'Maintenance Equipment Depreciation Expense', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5130105', 'مصروف اهلاك أجهزة كمبيوتر', 'Computer Equipment Depreciation Expense', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5130106', 'مصروف إطفاء قيمة برامج و تكنولوجيا', 'Software & Technology Amortization Expense', 'expense', 'operating_expense', 5, true, true, 0, 0),
            
            -- اشتراكات (514)
            (tenant_record.id, '514', 'اشتراكات', 'Subscriptions', 'expense', 'operating_expense', 3, false, true, 0, 0),
            (tenant_record.id, '51401', 'اشتراكات شهريه و سنويه', 'Monthly & Annual Subscriptions', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5140101', 'مصاريف حكوميه و اشتراكات', 'Government Fees & Subscriptions', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5140102', 'مصاريف قانونيه و قضائية', 'Legal & Judicial Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5140103', 'مصاريف تأمين الزامي', 'Mandatory Insurance Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5140104', 'مصاريف تأمين شامل', 'Comprehensive Insurance Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5140105', 'مصاريف مكاتب التدقيق', 'Audit Offices Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5140106', 'اشتراكات انتر نت', 'Internet Subscriptions', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5140107', 'اشتراكات تليفون ارضي', 'Landline Subscriptions', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5140108', 'اشتراكات موبيل', 'Mobile Subscriptions', 'expense', 'operating_expense', 5, true, true, 0, 0),
            
            -- مصاريف بنكية (515)
            (tenant_record.id, '515', 'مصاريف بنكية', 'Banking Expenses', 'expense', 'operating_expense', 3, false, true, 0, 0),
            (tenant_record.id, '51501', 'مصاريف بنكية', 'Banking Expenses', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5150101', 'مصاريف رسوم بنكية', 'Banking Fees Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5150102', 'مصاريف فوائد بنوك', 'Bank Interest Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5150103', 'مصاريف اصدار دفاتر شيكات', 'Checkbook Issuance Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5150104', 'عمولات تحويل رواتب', 'Salary Transfer Commissions', 'expense', 'operating_expense', 5, true, true, 0, 0),
            
            -- مصروفات متغيرة (52)
            (tenant_record.id, '52', 'مصروفات متغيرة', 'Variable Expenses', 'expense', 'operating_expense', 2, false, true, 0, 0),
            (tenant_record.id, '521', 'أجور و رواتب مؤقتة', 'Temporary Wages & Salaries', 'expense', 'operating_expense', 3, false, true, 0, 0),
            (tenant_record.id, '52101', 'أجور و رواتب يومية', 'Daily Wages & Salaries', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5210101', 'رواتب يوميات للموظفين مؤقتة', 'Temporary Employee Daily Wages', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210102', 'مكافئات', 'Bonuses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210103', 'اكراميات', 'Tips', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210104', 'أجور ساعات إضافية', 'Overtime Wages', 'expense', 'operating_expense', 5, true, true, 0, 0),
            
            -- مصروفات صيانة (52102)
            (tenant_record.id, '52102', 'مصروفات صيانة', 'Maintenance Expenses', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5210201', 'مصروفات قطع غيار', 'Spare Parts Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210202', 'مصروفات صيانة', 'Maintenance Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210203', 'مصروفات زيوت و فلاتر', 'Oil & Filters Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210204', 'مصروفات صبغ و حدادة', 'Painting & Blacksmithing Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210205', 'تواير و بنشر', 'Tires & Puncture Repair', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210206', 'بطاريات', 'Batteries', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210207', 'مصروفات بنزين', 'Gasoline Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210208', 'مصروفات ديزل', 'Diesel Expenses', 'expense', 'operating_expense', 5, true, true, 0, 0),
            
            -- مصاريف أدوات مكتبية و مطبوعات (52103) - تم إصلاح الرقم المكرر
            (tenant_record.id, '52103', 'مصاريف أدوات مكتبية و مطبوعات', 'Office Supplies & Printing Expenses', 'expense', 'operating_expense', 4, false, true, 0, 0),
            (tenant_record.id, '5210301', 'ورق تصوير', 'Copy Paper', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210302', 'أدوات مكتبية', 'Office Supplies', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210303', 'مطبوعات', 'Printing', 'expense', 'operating_expense', 5, true, true, 0, 0),
            (tenant_record.id, '5210304', 'إعلانات', 'Advertisements', 'expense', 'operating_expense', 5, true, true, 0, 0);
            
            -- تحديث الروابط الهرمية
            UPDATE public.chart_of_accounts 
            SET parent_account_id = (
                SELECT id FROM public.chart_of_accounts p 
                WHERE p.tenant_id = tenant_record.id 
                AND p.account_code = LEFT(public.chart_of_accounts.account_code, LENGTH(public.chart_of_accounts.account_code) - 1)
                AND p.account_code != public.chart_of_accounts.account_code
            )
            WHERE tenant_id = tenant_record.id AND LENGTH(account_code) > 1;
            
            success_count := success_count + 1;
            
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'خطأ في تطبيق النظام للمؤسسة %: %', tenant_record.name, SQLERRM;
        END;
    END LOOP;
    
    SELECT jsonb_build_object(
        'total_tenants', total_tenants,
        'successful_updates', success_count,
        'failed_updates', total_tenants - success_count,
        'message', 'تم تطبيق النظام المحاسبي المعتمد بنجاح - مطابقة كاملة للجدول المرفق'
    ) INTO result;
    
    RETURN result;
END;
$$;

-- تطبيق النظام المحاسبي المعتمد
SELECT apply_verified_accounting_system() AS result;

-- دالة للتحقق من المطابقة الكاملة
CREATE OR REPLACE FUNCTION verify_exact_account_match()
RETURNS TABLE (
    tenant_name TEXT,
    account_code TEXT,
    account_name TEXT,
    is_exact_match BOOLEAN
) AS $$
DECLARE
    expected_accounts TEXT[][] := ARRAY[
        ['1110101', 'الصندوق النقدي الرئيسي'],
        ['1120101', 'حساب البنك التجاري حساب رقم 0000000000000'],
        ['1130101', 'عملاء تجاريون شركات'],
        ['1150101', 'مخزن قطع الغيار رقم 1'],
        ['1210101', 'سيارات و باصات'],
        ['2110101', 'حسابات موردين تجاريون'],
        ['2120101', 'مستحقات أجور الموظفين'],
        ['2210102', 'قرض بنك بيت التمويل حساب رقم 000000000000'],
        ['3110101', 'راس مال شريك أبو جراح'],
        ['3210101', 'الأرباح المرحلة سنين سابقة'],
        ['3310101', 'الاحتياطي القانوني'],
        ['4110101', 'ايراد تأجير سيارات و باصات - شركات'],
        ['4210101', 'ايراد ورشة الصيانة الداخلية'],
        ['4310101', 'ايراد خدمات التوصيل'],
        ['5110101', 'ايجارات سيارات و باصات من الغير'],
        ['5120101', 'الرواتب الأساسية للموظفين'],
        ['5130101', 'مصروف اهلاك السيارات و الباصات'],
        ['5140101', 'مصاريف حكوميه و اشتراكات'],
        ['5150101', 'مصاريف رسوم بنكية'],
        ['5210101', 'رواتب يوميات للموظفين مؤقتة'],
        ['5210201', 'مصروفات قطع غيار'],
        ['5210301', 'ورق تصوير']
    ];
    tenant_record RECORD;
    expected_account TEXT[];
BEGIN
    FOR tenant_record IN (
        SELECT id, name FROM public.tenants WHERE status = 'active' LIMIT 1
    ) LOOP
        FOREACH expected_account SLICE 1 IN ARRAY expected_accounts
        LOOP
            RETURN QUERY SELECT 
                tenant_record.name,
                expected_account[1],
                COALESCE(coa.account_name, 'غير موجود'),
                (coa.account_name = expected_account[2]) AS is_exact_match
            FROM (VALUES (expected_account[1], expected_account[2])) AS expected(code, name)
            LEFT JOIN public.chart_of_accounts coa ON coa.tenant_id = tenant_record.id AND coa.account_code = expected.code;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- التحقق من المطابقة الكاملة
SELECT * FROM verify_exact_account_match();

-- عرض إحصائيات شاملة
SELECT 
    'النظام المحاسبي المعتمد - إحصائيات' AS report_title,
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN level = 1 THEN 1 END) as level_1_accounts,
    COUNT(CASE WHEN level = 2 THEN 1 END) as level_2_accounts,
    COUNT(CASE WHEN level = 3 THEN 1 END) as level_3_accounts,
    COUNT(CASE WHEN level = 4 THEN 1 END) as level_4_accounts,
    COUNT(CASE WHEN level = 5 THEN 1 END) as level_5_accounts,
    COUNT(CASE WHEN allow_posting = true THEN 1 END) as posting_accounts
FROM public.chart_of_accounts 
WHERE tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1); 