-- إضافة بيانات تجريبية مبسطة للمحاسبة
SET session_replication_role = replica;

-- إدراج 3 قيود محاسبية بسيطة
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
    'قيد إيراد خدمات إيجار المركبات', 
    10000.000, 
    10000.000, 
    'posted',
    '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid,
    'manual',
    'approved'
),
(
    'JE-2024-002', 
    '2024-01-20', 
    'قيد مصروفات تشغيلية', 
    5000.000, 
    5000.000, 
    'posted',
    '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid,
    'manual',
    'approved'
);

-- إدراج التفاصيل للقيود باستخدام حسابات موجودة
DO $$
DECLARE
    je1_id uuid;
    je2_id uuid;
    cash_account_id uuid;
    revenue_account_id uuid;
    expense_account_id uuid;
BEGIN
    -- الحصول على معرفات القيود
    SELECT id INTO je1_id FROM journal_entries WHERE entry_number = 'JE-2024-001';
    SELECT id INTO je2_id FROM journal_entries WHERE entry_number = 'JE-2024-002';
    
    -- الحصول على معرفات الحسابات (أول حساب موجود لكل نوع)
    SELECT id INTO cash_account_id FROM chart_of_accounts 
    WHERE tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid 
    AND account_type = 'asset' 
    AND account_category = 'current_asset' 
    LIMIT 1;
    
    SELECT id INTO revenue_account_id FROM chart_of_accounts 
    WHERE tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid 
    AND account_type = 'revenue' 
    LIMIT 1;
    
    SELECT id INTO expense_account_id FROM chart_of_accounts 
    WHERE tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid 
    AND account_type = 'expense' 
    LIMIT 1;
    
    -- إدراج تفاصيل القيد الأول (إيراد)
    IF cash_account_id IS NOT NULL AND revenue_account_id IS NOT NULL THEN
        INSERT INTO journal_entry_lines (
            journal_entry_id, account_id, description, 
            debit_amount, credit_amount, line_number, tenant_id
        ) VALUES 
        (je1_id, cash_account_id, 'تحصيل نقدي', 10000.000, 0, 1, '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid),
        (je1_id, revenue_account_id, 'إيراد خدمات', 0, 10000.000, 2, '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid);
    END IF;
    
    -- إدراج تفاصيل القيد الثاني (مصروف)
    IF cash_account_id IS NOT NULL AND expense_account_id IS NOT NULL THEN
        INSERT INTO journal_entry_lines (
            journal_entry_id, account_id, description, 
            debit_amount, credit_amount, line_number, tenant_id
        ) VALUES 
        (je2_id, expense_account_id, 'مصروفات تشغيلية', 5000.000, 0, 1, '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid),
        (je2_id, cash_account_id, 'دفع نقدي', 0, 5000.000, 2, '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid);
    END IF;
END $$;

SET session_replication_role = DEFAULT;