-- دليل الحسابات الشامل المحسن - يحافظ على البيانات الموجودة
-- إصدار آمن يتجنب انتهاك القيود الخارجية

-- إنشاء دالة آمنة لإضافة دليل الحسابات
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_safe(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    accounts_data JSONB;
BEGIN
    -- تعريف جميع الحسابات في JSON لسهولة الإدارة
    accounts_data := '[
        {"code": "1", "name": "الأصول", "name_en": "Assets", "type": "asset", "category": "current_asset", "level": 1, "posting": false, "parent": null},
        {"code": "2", "name": "الالتزامات", "name_en": "Liabilities", "type": "liability", "category": "current_liability", "level": 1, "posting": false, "parent": null},
        {"code": "3", "name": "حقوق الملكية", "name_en": "Equity", "type": "equity", "category": "capital", "level": 1, "posting": false, "parent": null},
        {"code": "4", "name": "الإيرادات", "name_en": "Revenue", "type": "revenue", "category": "operating_revenue", "level": 1, "posting": false, "parent": null},
        {"code": "5", "name": "المصروفات", "name_en": "Expenses", "type": "expense", "category": "operating_expense", "level": 1, "posting": false, "parent": null},
        
        {"code": "11", "name": "الأصول المتداولة", "name_en": "Current Assets", "type": "asset", "category": "current_asset", "level": 2, "posting": false, "parent": "1"},
        {"code": "12", "name": "الأصول غير المتداولة", "name_en": "Non-Current Assets", "type": "asset", "category": "fixed_asset", "level": 2, "posting": false, "parent": "1"},
        
        {"code": "111", "name": "النقدية وما يعادلها", "name_en": "Cash and Cash Equivalents", "type": "asset", "category": "current_asset", "level": 3, "posting": false, "parent": "11"},
        {"code": "1111", "name": "النقدية", "name_en": "Cash", "type": "asset", "category": "current_asset", "level": 4, "posting": false, "parent": "111"},
        {"code": "11111", "name": "الصندوق النقدي الرئيسي", "name_en": "Main Cash Box", "type": "asset", "category": "current_asset", "level": 5, "posting": true, "parent": "1111"},
        {"code": "11112", "name": "عهدة نقدية دائمة", "name_en": "Permanent Cash Custody", "type": "asset", "category": "current_asset", "level": 5, "posting": true, "parent": "1111"},
        {"code": "11113", "name": "عهدة نقدية مؤقتة", "name_en": "Temporary Cash Custody", "type": "asset", "category": "current_asset", "level": 5, "posting": true, "parent": "1111"},
        
        {"code": "1112", "name": "البنوك", "name_en": "Banks", "type": "asset", "category": "current_asset", "level": 4, "posting": false, "parent": "111"},
        {"code": "11121", "name": "بنوك محلية بالدينار الكويتي", "name_en": "Local Banks in KWD", "type": "asset", "category": "current_asset", "level": 5, "posting": false, "parent": "1112"},
        {"code": "111211", "name": "حساب البنك التجاري", "name_en": "Commercial Bank Account", "type": "asset", "category": "current_asset", "level": 6, "posting": true, "parent": "11121"},
        {"code": "111212", "name": "حساب بنك بيت التمويل", "name_en": "Kuwait Finance House Account", "type": "asset", "category": "current_asset", "level": 6, "posting": true, "parent": "11121"},
        
        {"code": "112", "name": "العملاء التجاريون", "name_en": "Trade Customers", "type": "asset", "category": "current_asset", "level": 3, "posting": false, "parent": "11"},
        {"code": "1121", "name": "عملاء تجاريون شركات", "name_en": "Trade Customers - Companies", "type": "asset", "category": "current_asset", "level": 4, "posting": true, "parent": "112"},
        {"code": "1122", "name": "عملاء تجاريون شركات زميلة", "name_en": "Trade Customers - Related Companies", "type": "asset", "category": "current_asset", "level": 4, "posting": true, "parent": "112"},
        {"code": "1123", "name": "عملاء تجاريون أشخاص", "name_en": "Trade Customers - Individuals", "type": "asset", "category": "current_asset", "level": 4, "posting": true, "parent": "112"},
        
        {"code": "113", "name": "ذمم مدينة أخرى", "name_en": "Other Receivables", "type": "asset", "category": "current_asset", "level": 3, "posting": false, "parent": "11"},
        {"code": "1131", "name": "ذمم موظفين", "name_en": "Employee Receivables", "type": "asset", "category": "current_asset", "level": 4, "posting": true, "parent": "113"},
        {"code": "1132", "name": "ذمم مدينة لا تخص النشاط", "name_en": "Non-operating Receivables", "type": "asset", "category": "current_asset", "level": 4, "posting": true, "parent": "113"},
        
        {"code": "114", "name": "المخزون", "name_en": "Inventory", "type": "asset", "category": "current_asset", "level": 3, "posting": false, "parent": "11"},
        {"code": "1141", "name": "مخازن قطع الغيار", "name_en": "Spare Parts Warehouses", "type": "asset", "category": "current_asset", "level": 4, "posting": false, "parent": "114"},
        {"code": "11411", "name": "مخزن قطع الغيار رقم 1", "name_en": "Spare Parts Warehouse No. 1", "type": "asset", "category": "current_asset", "level": 5, "posting": true, "parent": "1141"},
        {"code": "1142", "name": "مخازن العدد والأدوات", "name_en": "Tools and Equipment Warehouses", "type": "asset", "category": "current_asset", "level": 4, "posting": false, "parent": "114"},
        {"code": "11421", "name": "مخزن عدد وأدوات رقم 1", "name_en": "Tools and Equipment Warehouse No. 1", "type": "asset", "category": "current_asset", "level": 5, "posting": true, "parent": "1142"},
        {"code": "1143", "name": "مخازن الأدوات المكتبية والمطبوعات", "name_en": "Office Supplies Warehouses", "type": "asset", "category": "current_asset", "level": 4, "posting": false, "parent": "114"},
        {"code": "11431", "name": "مخزن الأدوات المكتبية رقم 1", "name_en": "Office Supplies Warehouse No. 1", "type": "asset", "category": "current_asset", "level": 5, "posting": true, "parent": "1143"},
        
        {"code": "115", "name": "مصروفات مدفوعة مقدماً", "name_en": "Prepaid Expenses", "type": "asset", "category": "current_asset", "level": 3, "posting": false, "parent": "11"},
        {"code": "1151", "name": "مصروفات مدفوعة مقدماً إيجارات", "name_en": "Prepaid Rent", "type": "asset", "category": "current_asset", "level": 4, "posting": true, "parent": "115"},
        {"code": "1152", "name": "مصروفات مدفوعة مقدماً صيانة", "name_en": "Prepaid Maintenance", "type": "asset", "category": "current_asset", "level": 4, "posting": true, "parent": "115"},
        {"code": "1153", "name": "مصروفات مدفوعة مقدماً قطع غيار", "name_en": "Prepaid Spare Parts", "type": "asset", "category": "current_asset", "level": 4, "posting": true, "parent": "115"},
        
        {"code": "116", "name": "استثمارات قصيرة الأجل", "name_en": "Short-term Investments", "type": "asset", "category": "current_asset", "level": 3, "posting": true, "parent": "11"},
        
        {"code": "1211", "name": "سيارات وباصات", "name_en": "Cars and Buses", "type": "asset", "category": "fixed_asset", "level": 4, "posting": true, "parent": "12"},
        {"code": "1212", "name": "مباني وأراضي", "name_en": "Buildings and Land", "type": "asset", "category": "fixed_asset", "level": 4, "posting": true, "parent": "12"},
        {"code": "1213", "name": "أثاث", "name_en": "Furniture", "type": "asset", "category": "fixed_asset", "level": 4, "posting": true, "parent": "12"},
        {"code": "1214", "name": "معدات صيانة", "name_en": "Maintenance Equipment", "type": "asset", "category": "fixed_asset", "level": 4, "posting": true, "parent": "12"},
        {"code": "1215", "name": "أجهزة كمبيوتر", "name_en": "Computer Equipment", "type": "asset", "category": "fixed_asset", "level": 4, "posting": true, "parent": "12"},
        {"code": "1216", "name": "برامج وتكنولوجيا", "name_en": "Software and Technology", "type": "asset", "category": "fixed_asset", "level": 4, "posting": true, "parent": "12"},
        {"code": "122", "name": "عقود إيجار تنتهي بالتملك", "name_en": "Finance Lease Contracts", "type": "asset", "category": "fixed_asset", "level": 3, "posting": true, "parent": "12"},
        {"code": "123", "name": "استثمارات طويلة الأجل", "name_en": "Long-term Investments", "type": "asset", "category": "fixed_asset", "level": 3, "posting": true, "parent": "12"},
        
        {"code": "21", "name": "الالتزامات المتداولة", "name_en": "Current Liabilities", "type": "liability", "category": "current_liability", "level": 2, "posting": false, "parent": "2"},
        {"code": "22", "name": "الالتزامات طويلة الأجل", "name_en": "Long-term Liabilities", "type": "liability", "category": "long_term_liability", "level": 2, "posting": false, "parent": "2"},
        
        {"code": "211", "name": "الحسابات الدائنة", "name_en": "Accounts Payable", "type": "liability", "category": "current_liability", "level": 3, "posting": false, "parent": "21"},
        {"code": "21111", "name": "حسابات موردين تجاريون", "name_en": "Trade Suppliers", "type": "liability", "category": "current_liability", "level": 5, "posting": true, "parent": "211"},
        {"code": "21112", "name": "حسابات موردين قطع غيار", "name_en": "Spare Parts Suppliers", "type": "liability", "category": "current_liability", "level": 5, "posting": true, "parent": "211"},
        {"code": "21113", "name": "حسابات موردين أقساط", "name_en": "Installment Suppliers", "type": "liability", "category": "current_liability", "level": 5, "posting": true, "parent": "211"},
        {"code": "21114", "name": "حسابات موردين شركات زميلة", "name_en": "Related Company Suppliers", "type": "liability", "category": "current_liability", "level": 5, "posting": true, "parent": "211"},
        {"code": "21121", "name": "مستحقات أجور الموظفين", "name_en": "Employee Salary Accruals", "type": "liability", "category": "current_liability", "level": 5, "posting": true, "parent": "211"},
        {"code": "21122", "name": "حسابات دائنة أخرى", "name_en": "Other Creditor Accounts", "type": "liability", "category": "current_liability", "level": 5, "posting": true, "parent": "211"},
        
        {"code": "212", "name": "قروض قصيرة الأجل", "name_en": "Short-term Loans", "type": "liability", "category": "current_liability", "level": 3, "posting": false, "parent": "21"},
        {"code": "21211", "name": "قرض بنك التجاري", "name_en": "Commercial Bank Loan", "type": "liability", "category": "current_liability", "level": 5, "posting": true, "parent": "212"},
        {"code": "21212", "name": "قرض بنك بيت التمويل", "name_en": "Kuwait Finance House Loan", "type": "liability", "category": "current_liability", "level": 5, "posting": true, "parent": "212"},
        
        {"code": "22111", "name": "قرض بنك التجاري طويل الأجل", "name_en": "Commercial Bank Long-term Loan", "type": "liability", "category": "long_term_liability", "level": 5, "posting": true, "parent": "22"},
        {"code": "22112", "name": "قرض بنك بيت التمويل طويل الأجل", "name_en": "Kuwait Finance House Long-term Loan", "type": "liability", "category": "long_term_liability", "level": 5, "posting": true, "parent": "22"},
        
        {"code": "31", "name": "رأس المال", "name_en": "Capital", "type": "equity", "category": "capital", "level": 2, "posting": false, "parent": "3"},
        {"code": "31111", "name": "رأس مال شريك أبو جراح", "name_en": "Partner Abu Jarrah Capital", "type": "equity", "category": "capital", "level": 5, "posting": true, "parent": "31"},
        {"code": "31112", "name": "رأس مال شريك أبو حسين", "name_en": "Partner Abu Hussein Capital", "type": "equity", "category": "capital", "level": 5, "posting": true, "parent": "31"},
        
        {"code": "32", "name": "الأرباح المرحلة", "name_en": "Retained Earnings", "type": "equity", "category": "capital", "level": 2, "posting": false, "parent": "3"},
        {"code": "321", "name": "الأرباح المرحلة سنين سابقة", "name_en": "Retained Earnings Previous Years", "type": "equity", "category": "capital", "level": 3, "posting": true, "parent": "32"},
        
        {"code": "33", "name": "الاحتياطيات", "name_en": "Reserves", "type": "equity", "category": "capital", "level": 2, "posting": false, "parent": "3"},
        {"code": "331", "name": "الاحتياطي القانوني", "name_en": "Legal Reserve", "type": "equity", "category": "capital", "level": 3, "posting": true, "parent": "33"},
        {"code": "332", "name": "الاحتياطي العام", "name_en": "General Reserve", "type": "equity", "category": "capital", "level": 3, "posting": true, "parent": "33"},
        {"code": "333", "name": "احتياطي إعادة التقييم", "name_en": "Revaluation Reserve", "type": "equity", "category": "capital", "level": 3, "posting": true, "parent": "33"},
        
        {"code": "41", "name": "إيرادات التأجير", "name_en": "Rental Revenue", "type": "revenue", "category": "operating_revenue", "level": 2, "posting": false, "parent": "4"},
        {"code": "4111", "name": "إيرادات تأجير سيارات شركات", "name_en": "Car Rental Revenue - Companies", "type": "revenue", "category": "operating_revenue", "level": 4, "posting": true, "parent": "41"},
        {"code": "4121", "name": "إيرادات تأجير سيارات شركات زميلة", "name_en": "Car Rental Revenue - Related Companies", "type": "revenue", "category": "operating_revenue", "level": 4, "posting": true, "parent": "41"},
        {"code": "4131", "name": "إيرادات تأجير سيارات أشخاص", "name_en": "Car Rental Revenue - Individuals", "type": "revenue", "category": "operating_revenue", "level": 4, "posting": true, "parent": "41"},
        
        {"code": "42", "name": "إيرادات الصيانة", "name_en": "Maintenance Revenue", "type": "revenue", "category": "operating_revenue", "level": 2, "posting": false, "parent": "4"},
        {"code": "4211", "name": "إيرادات ورشة الصيانة الداخلية", "name_en": "Internal Workshop Revenue", "type": "revenue", "category": "operating_revenue", "level": 4, "posting": true, "parent": "42"},
        {"code": "4212", "name": "إيرادات ورش صيانة خارجية", "name_en": "External Workshop Revenue", "type": "revenue", "category": "operating_revenue", "level": 4, "posting": true, "parent": "42"},
        {"code": "4213", "name": "إيرادات بيع قطع غيار", "name_en": "Spare Parts Sales Revenue", "type": "revenue", "category": "operating_revenue", "level": 4, "posting": true, "parent": "42"},
        
        {"code": "43", "name": "إيرادات خدمات أخرى", "name_en": "Other Services Revenue", "type": "revenue", "category": "operating_revenue", "level": 2, "posting": false, "parent": "4"},
        {"code": "4311", "name": "إيرادات خدمات التوصيل", "name_en": "Delivery Services Revenue", "type": "revenue", "category": "operating_revenue", "level": 4, "posting": true, "parent": "43"},
        {"code": "4312", "name": "إيرادات خدمات الاستلام", "name_en": "Collection Services Revenue", "type": "revenue", "category": "operating_revenue", "level": 4, "posting": true, "parent": "43"},
        {"code": "432", "name": "إيرادات بيع سكراب", "name_en": "Scrap Sales Revenue", "type": "revenue", "category": "other_revenue", "level": 3, "posting": true, "parent": "43"},
        
        {"code": "44", "name": "إيرادات أخرى", "name_en": "Other Revenue", "type": "revenue", "category": "other_revenue", "level": 2, "posting": true, "parent": "4"},
        
        {"code": "51", "name": "مصروفات ثابتة", "name_en": "Fixed Expenses", "type": "expense", "category": "operating_expense", "level": 2, "posting": false, "parent": "5"},
        {"code": "52", "name": "مصروفات متغيرة", "name_en": "Variable Expenses", "type": "expense", "category": "operating_expense", "level": 2, "posting": false, "parent": "5"},
        
        {"code": "5111", "name": "إيجارات سيارات من الغير", "name_en": "Vehicle Rent from Others", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "51121", "name": "إيجار مكاتب", "name_en": "Office Rent", "type": "expense", "category": "operating_expense", "level": 5, "posting": true, "parent": "51"},
        {"code": "51122", "name": "إيجار ورشة", "name_en": "Workshop Rent", "type": "expense", "category": "operating_expense", "level": 5, "posting": true, "parent": "51"},
        {"code": "51123", "name": "إيجار أراضي ومخازن", "name_en": "Land and Warehouse Rent", "type": "expense", "category": "operating_expense", "level": 5, "posting": true, "parent": "51"},
        {"code": "51131", "name": "إيجار شقق سكنية", "name_en": "Residential Rent", "type": "expense", "category": "operating_expense", "level": 5, "posting": true, "parent": "51"},
        
        {"code": "5121", "name": "الرواتب الأساسية", "name_en": "Basic Salaries", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5122", "name": "بدلات نقدية", "name_en": "Cash Allowances", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5123", "name": "بدلات خطوط موبايل", "name_en": "Mobile Allowances", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5124", "name": "مصاريف الإجازات", "name_en": "Vacation Expenses", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5125", "name": "مصاريف نهاية الخدمة", "name_en": "End of Service", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        
        {"code": "5131", "name": "إهلاك السيارات", "name_en": "Vehicle Depreciation", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5132", "name": "إهلاك مباني", "name_en": "Building Depreciation", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5133", "name": "إهلاك أثاث", "name_en": "Furniture Depreciation", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5134", "name": "إهلاك معدات صيانة", "name_en": "Equipment Depreciation", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5135", "name": "إهلاك أجهزة كمبيوتر", "name_en": "Computer Depreciation", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5136", "name": "إطفاء برامج وتكنولوجيا", "name_en": "Software Amortization", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        
        {"code": "5141", "name": "مصاريف حكومية", "name_en": "Government Fees", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5142", "name": "مصاريف قانونية", "name_en": "Legal Expenses", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5143", "name": "تأمين إلزامي", "name_en": "Mandatory Insurance", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5144", "name": "تأمين شامل", "name_en": "Comprehensive Insurance", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5145", "name": "مصاريف تدقيق", "name_en": "Audit Expenses", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5146", "name": "اشتراكات إنترنت", "name_en": "Internet Subscriptions", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5147", "name": "اشتراكات تليفون", "name_en": "Telephone Subscriptions", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5148", "name": "اشتراكات موبايل", "name_en": "Mobile Subscriptions", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        
        {"code": "5151", "name": "رسوم بنكية", "name_en": "Bank Fees", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5152", "name": "فوائد بنوك", "name_en": "Bank Interest", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5153", "name": "إصدار دفاتر شيكات", "name_en": "Checkbook Fees", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        {"code": "5154", "name": "عمولات تحويل", "name_en": "Transfer Commissions", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "51"},
        
        {"code": "52111", "name": "رواتب يومية مؤقتة", "name_en": "Daily Temporary Wages", "type": "expense", "category": "operating_expense", "level": 5, "posting": true, "parent": "52"},
        {"code": "5212", "name": "مكافآت", "name_en": "Bonuses", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5213", "name": "إكراميات", "name_en": "Tips", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5214", "name": "ساعات إضافية", "name_en": "Overtime", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        
        {"code": "5221", "name": "قطع غيار", "name_en": "Spare Parts", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5222", "name": "زيوت وفلاتر", "name_en": "Oil and Filters", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5223", "name": "صبغ وحدادة", "name_en": "Paint and Metal Work", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5224", "name": "تواير وبنشر", "name_en": "Tires and Repair", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5225", "name": "بطاريات", "name_en": "Batteries", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        
        {"code": "5231", "name": "بنزين", "name_en": "Gasoline", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5232", "name": "ديزل", "name_en": "Diesel", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        
        {"code": "5241", "name": "ورق تصوير", "name_en": "Copy Paper", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5242", "name": "أدوات مكتبية", "name_en": "Office Supplies", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "5243", "name": "مطبوعات", "name_en": "Publications", "type": "expense", "category": "operating_expense", "level": 4, "posting": true, "parent": "52"},
        {"code": "525", "name": "إعلانات", "name_en": "Advertisements", "type": "expense", "category": "operating_expense", "level": 3, "posting": true, "parent": "52"}
    ]'::jsonb;
    
    -- إدراج الحسابات بطريقة آمنة مع بناء العلاقات الهرمية
    inserted_count := public.insert_accounts_safely(tenant_id_param, accounts_data);
    
    RETURN inserted_count;
END;
$$;

-- دالة مساعدة لإدراج الحسابات بطريقة آمنة
CREATE OR REPLACE FUNCTION public.insert_accounts_safely(tenant_id_param UUID, accounts_data JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    account_item JSONB;
    parent_account_id UUID;
    inserted_count INTEGER := 0;
    account_count INTEGER;
BEGIN
    -- إدراج الحسابات مستوى بمستوى لضمان وجود الحسابات الأبوية أولاً
    FOR level_num IN 1..6 LOOP
        FOR account_item IN 
            SELECT value FROM jsonb_array_elements(accounts_data) 
            WHERE (value->>'level')::integer = level_num
        LOOP
            -- العثور على معرف الحساب الأبوي إذا وُجد
            parent_account_id := NULL;
            IF account_item->>'parent' IS NOT NULL THEN
                SELECT id INTO parent_account_id 
                FROM public.chart_of_accounts 
                WHERE tenant_id = tenant_id_param 
                AND account_code = account_item->>'parent';
            END IF;
            
            -- إدراج الحساب أو تحديثه
            INSERT INTO public.chart_of_accounts (
                tenant_id, account_code, account_name, account_name_en, 
                account_type, account_category, parent_account_id, level, 
                allow_posting, is_active, opening_balance, current_balance
            )
            VALUES (
                tenant_id_param,
                account_item->>'code',
                account_item->>'name',
                account_item->>'name_en',
                account_item->>'type',
                account_item->>'category',
                parent_account_id,
                (account_item->>'level')::integer,
                (account_item->>'posting')::boolean,
                true,
                0,
                0
            )
            ON CONFLICT (tenant_id, account_code) 
            DO UPDATE SET
                account_name = EXCLUDED.account_name,
                account_name_en = EXCLUDED.account_name_en,
                parent_account_id = EXCLUDED.parent_account_id,
                level = EXCLUDED.level,
                allow_posting = EXCLUDED.allow_posting,
                updated_at = now();
            
            -- التحقق من حدوث الإدراج أو التحديث
            GET DIAGNOSTICS account_count = ROW_COUNT;
            IF account_count > 0 THEN
                inserted_count := inserted_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN inserted_count;
END;
$$;

-- تطبيق دليل الحسابات الآمن على جميع المؤسسات النشطة
DO $$
DECLARE
    tenant_record RECORD;
    accounts_created INTEGER;
BEGIN
    FOR tenant_record IN 
        SELECT id, name FROM public.tenants WHERE status IN ('active', 'trial')
    LOOP
        BEGIN
            SELECT public.setup_comprehensive_chart_safe(tenant_record.id) INTO accounts_created;
            RAISE NOTICE 'تم تطبيق % حساب للمؤسسة: %', accounts_created, tenant_record.name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في تطبيق دليل الحسابات للمؤسسة %: %', tenant_record.name, SQLERRM;
        END;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.setup_comprehensive_chart_safe(UUID) IS 'دالة آمنة لإنشاء دليل الحسابات الشامل - تحافظ على البيانات الموجودة وتتجنب انتهاك القيود الخارجية'; 