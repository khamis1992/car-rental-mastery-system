-- إضافة بيانات موك بأكواد حسابات جديدة ومختلفة
INSERT INTO public.chart_of_accounts (
    tenant_id, account_code, account_name, account_name_en, account_type, 
    account_category, level, allow_posting, is_active, opening_balance, current_balance
) VALUES 
-- أصول متداولة إضافية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1020', 'صندوق فرعي - المكتب الرئيسي', 'Petty Cash - Head Office', 'asset', 'current_asset', 2, true, true, 3000, 3000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1021', 'بنك برقان', 'Burgan Bank', 'asset', 'current_asset', 2, true, true, 125000, 125000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1120', 'مدينون تجاريون - جهات حكومية', 'Government Receivables', 'asset', 'current_asset', 2, true, true, 85000, 85000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1121', 'مدينون تجاريون - القطاع الخاص', 'Private Sector Receivables', 'asset', 'current_asset', 2, true, true, 65000, 65000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1220', 'مخزون معدات السلامة', 'Safety Equipment Inventory', 'asset', 'current_asset', 2, true, true, 12000, 12000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1221', 'مخزون مواد التنظيف', 'Cleaning Supplies Inventory', 'asset', 'current_asset', 2, true, true, 5000, 5000),

-- أصول ثابتة إضافية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1520', 'أجهزة الكمبيوتر والبرمجيات', 'Computers and Software', 'asset', 'fixed_asset', 2, true, true, 35000, 35000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1521', 'مجمع استهلاك الحاسوب', 'Accumulated Depreciation - Computers', 'asset', 'fixed_asset', 2, true, true, -15000, -15000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1530', 'مولدات الكهرباء', 'Electrical Generators', 'asset', 'fixed_asset', 2, true, true, 28000, 28000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '1531', 'مجمع استهلاك المولدات', 'Accumulated Depreciation - Generators', 'asset', 'fixed_asset', 2, true, true, -8000, -8000),

-- خصوم إضافية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2120', 'دائنون تجاريون - شركات التأمين', 'Insurance Companies Payable', 'liability', 'current_liability', 2, true, true, 15000, 15000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2121', 'مستحقات رواتب الموظفين', 'Employee Salaries Payable', 'liability', 'current_liability', 2, true, true, 28000, 28000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2122', 'ضرائب مستحقة الدفع', 'Taxes Payable', 'liability', 'current_liability', 2, true, true, 8500, 8500),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '2210', 'قرض طويل الأجل - بنك الخليج', 'Long Term Loan - Gulf Bank', 'liability', 'long_term_liability', 2, true, true, 180000, 180000),

-- حقوق ملكية إضافية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '3210', 'احتياطي طوارئ', 'Emergency Reserve', 'equity', 'capital', 2, true, true, 25000, 25000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '3310', 'أرباح العام السابق', 'Previous Year Earnings', 'equity', 'capital', 2, true, true, 125000, 125000),

-- إيرادات إضافية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4120', 'إيرادات خدمات النقل السياحي', 'Tourism Transport Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 45000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4121', 'إيرادات تأجير المعدات', 'Equipment Rental Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 22000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4220', 'إيرادات خدمات الغسيل والتلميع', 'Washing and Polishing Services Revenue', 'revenue', 'operating_revenue', 2, true, true, 0, 18000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '4310', 'إيرادات متنوعة', 'Miscellaneous Revenue', 'revenue', 'other_revenue', 2, true, true, 0, 8000),

-- مصروفات إضافية
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5120', 'مصروفات تنظيف وصيانة المرافق', 'Facility Cleaning and Maintenance Expenses', 'expense', 'operating_expense', 2, true, true, 0, 18000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5121', 'مصروفات الأمن والحراسة', 'Security and Guard Expenses', 'expense', 'operating_expense', 2, true, true, 0, 25000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5220', 'مصروفات استشارات قانونية ومحاسبية', 'Legal and Accounting Consultation Expenses', 'expense', 'operating_expense', 2, true, true, 0, 12000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5221', 'مصروفات السفر والانتقال', 'Travel and Transportation Expenses', 'expense', 'operating_expense', 2, true, true, 0, 8500),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5310', 'استهلاك أجهزة الكمبيوتر', 'Computer Equipment Depreciation', 'expense', 'operating_expense', 2, true, true, 0, 8000),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5311', 'استهلاك المولدات', 'Generators Depreciation', 'expense', 'operating_expense', 2, true, true, 0, 4500),
('235b2e88-fdfa-44f5-bf78-c000d6899182', '5420', 'مصروفات تمويلية أخرى', 'Other Financial Expenses', 'expense', 'financial_expense', 2, true, true, 0, 3200);

-- تحديث إحصائيات النظام
UPDATE public.tenants 
SET updated_at = now() 
WHERE id = '235b2e88-fdfa-44f5-bf78-c000d6899182';