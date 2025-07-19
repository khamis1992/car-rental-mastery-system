-- تحديث الحسابات للسماح بالترحيل
UPDATE chart_of_accounts 
SET allow_posting = true 
WHERE tenant_id = '235b2e88-fdfa-44f5-bf78-c000d6899182'::uuid 
AND account_code IN ('111', '41', '53101');