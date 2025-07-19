-- إدراج قيود محاسبية تجريبية لدفتر الأستاذ

-- قيد بيع خدمات (إيراد)
INSERT INTO journal_entries (
    entry_number, 
    entry_date, 
    description, 
    total_debit, 
    total_credit, 
    status,
    tenant_id,
    created_by,
    entry_source,
    approval_status
) VALUES 
(
    'JE-2024-001', 
    '2024-01-15', 
    'قيد إيراد خدمات إيجار المركبات - يناير 2024', 
    15000.000, 
    15000.000, 
    'posted',
    '235b2e88-fdfa-44f5-bf78-c000d6899182',
    null,
    'manual',
    'approved'
),
(
    'JE-2024-002', 
    '2024-01-20', 
    'قيد شراء معدات مكتبية جديدة', 
    8500.000, 
    8500.000, 
    'posted',
    '235b2e88-fdfa-44f5-bf78-c000d6899182',
    null,
    'manual',
    'approved'
),
(
    'JE-2024-003', 
    '2024-01-25', 
    'قيد دفع رواتب الموظفين - يناير 2024', 
    12000.000, 
    12000.000, 
    'posted',
    '235b2e88-fdfa-44f5-bf78-c000d6899182',
    null,
    'manual',
    'approved'
),
(
    'JE-2024-004', 
    '2024-02-01', 
    'قيد تحصيل أقساط العملاء', 
    6750.000, 
    6750.000, 
    'posted',
    '235b2e88-fdfa-44f5-bf78-c000d6899182',
    null,
    'manual',
    'approved'
),
(
    'JE-2024-005', 
    '2024-02-05', 
    'قيد مصروفات إدارية وعمومية', 
    3200.000, 
    3200.000, 
    'posted',
    '235b2e88-fdfa-44f5-bf78-c000d6899182',
    null,
    'manual',
    'approved'
);

-- إدراج تفاصيل القيود المحاسبية

-- تفاصيل قيد إيراد الخدمات
INSERT INTO journal_entry_lines (
    journal_entry_id,
    account_id,
    description,
    debit_amount,
    credit_amount,
    line_number,
    tenant_id
)
SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '111001' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'تحصيل نقدي من إيرادات الإيجار',
    15000.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-001'

UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '4000' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'إيراد خدمات إيجار المركبات',
    0,
    15000.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-001'

-- تفاصيل قيد شراء المعدات
UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '1202' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'شراء معدات مكتبية جديدة',
    8500.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-002'

UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '111001' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'دفع نقدي لشراء معدات',
    0,
    8500.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-002'

-- تفاصيل قيد دفع الرواتب
UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '5000' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'رواتب وأجور الموظفين',
    12000.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-003'

UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '111001' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'دفع رواتب نقداً',
    0,
    12000.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-003'

-- تفاصيل قيد تحصيل أقساط العملاء
UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '111001' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'تحصيل أقساط من العملاء',
    6750.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-004'

UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '1130' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'تسديد مستحقات العملاء',
    0,
    6750.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-004'

-- تفاصيل قيد المصروفات الإدارية
UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '5000' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'مصروفات إدارية وعمومية',
    3200.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-005'

UNION ALL

SELECT 
    je.id,
    (SELECT id FROM chart_of_accounts WHERE account_code = '2102' AND tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'),
    'مستحقات مصروفات إدارية',
    0,
    3200.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
FROM journal_entries je WHERE je.entry_number = 'JE-2024-005';