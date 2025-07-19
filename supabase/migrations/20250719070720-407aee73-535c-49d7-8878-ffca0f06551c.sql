-- إدراج بيانات تجريبية لدليل الحسابات لمؤسسة البشائر
INSERT INTO public.chart_of_accounts (
    tenant_id, account_code, account_name, account_name_en, account_type, 
    account_category, level, allow_posting, is_active, opening_balance, current_balance
) VALUES 
-- الأصول المتداولة
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1001', 'الصندوق', 'Cash', 'asset', 'current_asset', 2, true, true, 50000, 50000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1002', 'البنك الأهلي الكويتي', 'National Bank of Kuwait', 'asset', 'current_asset', 2, true, true, 250000, 250000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1003', 'بنك الكويت والشرق الأوسط', 'Kuwait and Middle East Bank', 'asset', 'current_asset', 2, true, true, 150000, 150000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1101', 'المدينون - عملاء التأجير', 'Accounts Receivable - Rental Customers', 'asset', 'current_asset', 2, true, true, 75000, 75000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1102', 'المدينون - شركات', 'Accounts Receivable - Companies', 'asset', 'current_asset', 2, true, true, 125000, 125000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1201', 'مخزون قطع الغيار', 'Spare Parts Inventory', 'asset', 'current_asset', 2, true, true, 45000, 45000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1202', 'مخزون الوقود', 'Fuel Inventory', 'asset', 'current_asset', 2, true, true, 15000, 15000),

-- الأصول الثابتة
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1501', 'سيارات التأجير', 'Rental Vehicles', 'asset', 'fixed_asset', 2, true, true, 850000, 850000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1502', 'مجمع استهلاك السيارات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', 2, true, true, -125000, -125000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1601', 'أثاث ومعدات المكتب', 'Office Furniture and Equipment', 'asset', 'fixed_asset', 2, true, true, 25000, 25000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1602', 'مجمع استهلاك الأثاث والمعدات', 'Accumulated Depreciation - Furniture & Equipment', 'asset', 'fixed_asset', 2, true, true, -8000, -8000),

-- الخصوم المتداولة
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2101', 'الدائنون - الموردون', 'Accounts Payable - Suppliers', 'liability', 'current_liability', 2, true, true, 35000, 35000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2102', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', 2, true, true, 12000, 12000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2103', 'ضمانات العملاء', 'Customer Deposits', 'liability', 'current_liability', 2, true, true, 25000, 25000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2201', 'قرض البنك الأهلي الكويتي', 'NBK Bank Loan', 'liability', 'long_term_liability', 2, true, true, 300000, 300000),

-- حقوق الملكية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '3101', 'رأس المال', 'Share Capital', 'equity', 'capital', 2, true, true, 500000, 500000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '3201', 'الاحتياطي القانوني', 'Legal Reserve', 'equity', 'capital', 2, true, true, 50000, 50000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '3301', 'الأرباح المدورة', 'Retained Earnings', 'equity', 'capital', 2, true, true, 275000, 275000),

-- الإيرادات
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4101', 'إيرادات تأجير السيارات - يومي', 'Daily Car Rental Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 185000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4102', 'إيرادات تأجير السيارات - شهري', 'Monthly Car Rental Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 95000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4201', 'إيرادات خدمات الصيانة', 'Maintenance Services Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 25000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4301', 'إيرادات خدمات التوصيل', 'Delivery Services Revenue', 'revenue', 'other_revenue', 2, true, true, 0, 15000),

-- المصروفات التشغيلية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5101', 'مصروفات الوقود', 'Fuel Expenses', 'expense', 'operating_expense', 2, true, true, 0, 45000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5102', 'مصروفات الصيانة والإصلاح', 'Maintenance and Repair Expenses', 'expense', 'operating_expense', 2, true, true, 0, 35000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5103', 'مصروفات التأمين', 'Insurance Expenses', 'expense', 'operating_expense', 2, true, true, 0, 22000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5104', 'مصروفات التسجيل والترخيص', 'Registration and Licensing Expenses', 'expense', 'operating_expense', 2, true, true, 0, 8000),

-- المصروفات الإدارية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5201', 'رواتب ومكافآت الموظفين', 'Salaries and Employee Benefits', 'expense', 'operating_expense', 2, true, true, 0, 65000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5202', 'إيجار المكتب', 'Office Rent', 'expense', 'operating_expense', 2, true, true, 0, 18000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5203', 'مصروفات الكهرباء والماء', 'Utilities Expenses', 'expense', 'operating_expense', 2, true, true, 0, 5000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5204', 'مصروفات الاتصالات', 'Communication Expenses', 'expense', 'operating_expense', 2, true, true, 0, 3000),

-- مصروفات الاستهلاك
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5301', 'استهلاك السيارات', 'Vehicle Depreciation', 'expense', 'operating_expense', 2, true, true, 0, 35000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5302', 'استهلاك الأثاث والمعدات', 'Furniture and Equipment Depreciation', 'expense', 'operating_expense', 2, true, true, 0, 5000),

-- المصروفات المالية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5401', 'فوائد القروض', 'Interest on Loans', 'expense', 'financial_expense', 2, true, true, 0, 12000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5402', 'رسوم بنكية', 'Bank Charges', 'expense', 'financial_expense', 2, true, true, 0, 2500);

-- تحديث إحصائيات الإدراج
UPDATE public.tenants 
SET updated_at = now() 
WHERE id = '235b2e88-fdfa-44f5-bf78-c000d6899182';