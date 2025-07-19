-- تعطيل التحقق مؤقتاً وإدراج البيانات التجريبية
SET session_replication_role = replica;

-- إدراج قيود محاسبية تجريبية
INSERT INTO journal_entries (
    entry_number, 
    entry_date, 
    description, 
    total_debit, 
    total_credit, 
    status,
    tenant_id,
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
    'manual',
    'approved'
);

-- إدراج تفاصيل القيود
WITH journal_entry_ids AS (
  SELECT id, entry_number FROM journal_entries 
  WHERE entry_number IN ('JE-2024-001', 'JE-2024-002', 'JE-2024-003', 'JE-2024-004', 'JE-2024-005')
),
account_ids AS (
  SELECT id, account_code FROM chart_of_accounts 
  WHERE tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'
  AND account_code IN ('111001', '4000', '1202', '5000', '1130', '2102')
)
INSERT INTO journal_entry_lines (
    journal_entry_id,
    account_id,
    description,
    debit_amount,
    credit_amount,
    line_number,
    tenant_id
) 
-- قيد إيراد الخدمات
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-001'),
    (SELECT id FROM account_ids WHERE account_code = '111001'),
    'تحصيل نقدي من إيرادات الإيجار',
    15000.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-001'),
    (SELECT id FROM account_ids WHERE account_code = '4000'),
    'إيراد خدمات إيجار المركبات',
    0,
    15000.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
-- قيد شراء المعدات
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-002'),
    (SELECT id FROM account_ids WHERE account_code = '1202'),
    'شراء معدات مكتبية جديدة',
    8500.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-002'),
    (SELECT id FROM account_ids WHERE account_code = '111001'),
    'دفع نقدي لشراء معدات',
    0,
    8500.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
-- قيد دفع الرواتب
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-003'),
    (SELECT id FROM account_ids WHERE account_code = '5000'),
    'رواتب وأجور الموظفين',
    12000.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-003'),
    (SELECT id FROM account_ids WHERE account_code = '111001'),
    'دفع رواتب نقداً',
    0,
    12000.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
-- قيد تحصيل أقساط العملاء
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-004'),
    (SELECT id FROM account_ids WHERE account_code = '111001'),
    'تحصيل أقساط من العملاء',
    6750.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-004'),
    (SELECT id FROM account_ids WHERE account_code = '1130'),
    'تسديد مستحقات العملاء',
    0,
    6750.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
-- قيد المصروفات الإدارية
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-005'),
    (SELECT id FROM account_ids WHERE account_code = '5000'),
    'مصروفات إدارية وعمومية',
    3200.000,
    0,
    1,
    '235b2e88-fdfa-44f5-bf78-c000d6899182'
UNION ALL
SELECT 
    (SELECT id FROM journal_entry_ids WHERE entry_number = 'JE-2024-005'),
    (SELECT id FROM account_ids WHERE account_code = '2102'),
    'مستحقات مصروفات إدارية',
    0,
    3200.000,
    2,
    '235b2e88-fdfa-44f5-bf78-c000d6899182';

-- إعادة تفعيل التحقق
SET session_replication_role = DEFAULT;