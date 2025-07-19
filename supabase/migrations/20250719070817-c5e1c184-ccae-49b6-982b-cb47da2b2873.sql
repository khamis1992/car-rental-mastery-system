-- إدراج بيانات تجريبية إضافية لدليل الحسابات (تجنب التكرار)
INSERT INTO public.chart_of_accounts (
    tenant_id, account_code, account_name, account_name_en, account_type, 
    account_category, level, allow_posting, is_active, opening_balance, current_balance
) VALUES 
-- بيانات تجريبية جديدة بأكواد مختلفة
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1011', 'الصندوق الفرعي', 'Petty Cash', 'asset', 'current_asset', 2, true, true, 5000, 5000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1012', 'بنك الخليج', 'Gulf Bank', 'asset', 'current_asset', 2, true, true, 180000, 180000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1111', 'عملاء تأجير - أفراد', 'Individual Rental Customers', 'asset', 'current_asset', 2, true, true, 45000, 45000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1112', 'عملاء تأجير - حكومة', 'Government Rental Customers', 'asset', 'current_asset', 2, true, true, 95000, 95000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1211', 'مخزون الإطارات', 'Tires Inventory', 'asset', 'current_asset', 2, true, true, 25000, 25000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1212', 'مخزون الزيوت', 'Oil Inventory', 'asset', 'current_asset', 2, true, true, 8000, 8000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1511', 'معدات الورشة', 'Workshop Equipment', 'asset', 'fixed_asset', 2, true, true, 45000, 45000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1512', 'مجمع استهلاك معدات الورشة', 'Accumulated Depreciation - Workshop Equipment', 'asset', 'fixed_asset', 2, true, true, -12000, -12000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2111', 'موردو الوقود', 'Fuel Suppliers', 'liability', 'current_liability', 2, true, true, 18000, 18000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2112', 'موردو قطع الغيار', 'Spare Parts Suppliers', 'liability', 'current_liability', 2, true, true, 22000, 22000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2113', 'أتعاب مهنية مستحقة', 'Professional Fees Payable', 'liability', 'current_liability', 2, true, true, 8000, 8000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4111', 'إيرادات تأجير الباصات', 'Bus Rental Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 65000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4112', 'إيرادات خدمات إضافية', 'Additional Services Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 35000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4211', 'إيرادات بيع قطع غيار', 'Spare Parts Sales Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 18000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5111', 'مصروفات غسيل السيارات', 'Car Washing Expenses', 'expense', 'operating_expense', 2, true, true, 0, 12000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5112', 'مصروفات استهلاك الإطارات', 'Tire Consumption Expenses', 'expense', 'operating_expense', 2, true, true, 0, 28000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5211', 'مصروفات التسويق والإعلان', 'Marketing and Advertising Expenses', 'expense', 'operating_expense', 2, true, true, 0, 15000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5212', 'مصروفات القرطاسية', 'Stationery Expenses', 'expense', 'operating_expense', 2, true, true, 0, 3500),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5213', 'مصروفات التدريب', 'Training Expenses', 'expense', 'operating_expense', 2, true, true, 0, 8500),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5411', 'خصم مسموح به', 'Discount Allowed', 'expense', 'financial_expense', 2, true, true, 0, 4500);

-- تحديث عداد البيانات
UPDATE public.tenants 
SET updated_at = now() 
WHERE id = '235b2e88-fdfa-44f5-bf78-c000d6899182';