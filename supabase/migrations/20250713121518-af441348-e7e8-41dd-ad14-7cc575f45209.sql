-- إنشاء الهيكل الجديد والمحدث لدليل الحسابات
-- سيتم إضافة الحسابات الجديدة بدون حذف الموجودة

-- إضافة الحسابات المفقودة من المستوى الثاني والثالث والرابع والخامس

-- المخزون (حساب جديد مفقود)
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '113',
  'المخزون',
  'Inventory',
  'asset',
  'current_asset',
  3,
  false,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
WHERE coa.account_code = '11' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '113' AND tenant_id = coa.tenant_id);

-- تفاصيل المخزون
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '11301',
  'مخزون قطع الغيار',
  'Spare Parts Inventory',
  'asset',
  'current_asset',
  inv.id,
  4,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts inv ON inv.account_code = '113' AND inv.tenant_id = coa.tenant_id
WHERE coa.account_code = '11' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '11301' AND tenant_id = coa.tenant_id);

-- أصول أخرى متداولة
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '114',
  'أصول أخرى متداولة',
  'Other Current Assets',
  'asset',
  'current_asset',
  3,
  false,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
WHERE coa.account_code = '11' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '114' AND tenant_id = coa.tenant_id);

-- تفاصيل الأصول الأخرى المتداولة
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '11401',
  'مصروفات مدفوعة مقدماً',
  'Prepaid Expenses',
  'asset',
  'current_asset',
  other_assets.id,
  4,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts other_assets ON other_assets.account_code = '114' AND other_assets.tenant_id = coa.tenant_id
WHERE coa.account_code = '11' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '11401' AND tenant_id = coa.tenant_id);

INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '11402',
  'سلف الموظفين',
  'Employee Advances',
  'asset',
  'current_asset',
  other_assets.id,
  4,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts other_assets ON other_assets.account_code = '114' AND other_assets.tenant_id = coa.tenant_id
WHERE coa.account_code = '11' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '11402' AND tenant_id = coa.tenant_id);

-- إضافة حسابات مفقودة من الأصول الثابتة
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '12201',
  'الأراضي',
  'Land',
  'asset',
  'fixed_asset',
  buildings.id,
  4,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts buildings ON buildings.account_code = '122' AND buildings.tenant_id = coa.tenant_id
WHERE coa.account_code = '12' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '12201' AND tenant_id = coa.tenant_id);

INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '12202',
  'المباني',
  'Buildings',
  'asset',
  'fixed_asset',
  buildings.id,
  4,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts buildings ON buildings.account_code = '122' AND buildings.tenant_id = coa.tenant_id
WHERE coa.account_code = '12' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '12202' AND tenant_id = coa.tenant_id);

-- إضافة المصروفات المتغيرة المفقودة
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '522',
  'الوقود والزيوت',
  'Fuel and Oil',
  'expense',
  'operating_expense',
  3,
  false,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
WHERE coa.account_code = '52' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '522' AND tenant_id = coa.tenant_id);

-- تفاصيل الوقود والزيوت
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '52201',
  'مصاريف الوقود',
  'Fuel Expenses',
  'expense',
  'operating_expense',
  fuel.id,
  4,
  false,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts fuel ON fuel.account_code = '522' AND fuel.tenant_id = coa.tenant_id
WHERE coa.account_code = '52' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '52201' AND tenant_id = coa.tenant_id);

INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '5220101',
  'مصاريف وقود السيارات',
  'Car Fuel Expenses',
  'expense',
  'operating_expense',
  fuel_exp.id,
  5,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts fuel_exp ON fuel_exp.account_code = '52201' AND fuel_exp.tenant_id = coa.tenant_id
WHERE coa.account_code = '52' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '5220101' AND tenant_id = coa.tenant_id);

INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '5220102',
  'مصاريف وقود الحافلات',
  'Bus Fuel Expenses',
  'expense',
  'operating_expense',
  fuel_exp.id,
  5,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts fuel_exp ON fuel_exp.account_code = '52201' AND fuel_exp.tenant_id = coa.tenant_id
WHERE coa.account_code = '52' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '5220102' AND tenant_id = coa.tenant_id);

-- الصيانة والإصلاحات
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '523',
  'مصاريف الصيانة والإصلاحات',
  'Maintenance and Repair Expenses',
  'expense',
  'operating_expense',
  3,
  false,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
WHERE coa.account_code = '52' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '523' AND tenant_id = coa.tenant_id);

-- تفاصيل الصيانة
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '52301',
  'صيانة السيارات والحافلات',
  'Vehicle and Bus Maintenance',
  'expense',
  'operating_expense',
  maint.id,
  4,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts maint ON maint.account_code = '523' AND maint.tenant_id = coa.tenant_id
WHERE coa.account_code = '52' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '52301' AND tenant_id = coa.tenant_id);

-- إضافة حسابات الضرائب والرسوم
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '524',
  'الضرائب والرسوم الحكومية',
  'Taxes and Government Fees',
  'expense',
  'operating_expense',
  3,
  false,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
WHERE coa.account_code = '52' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '524' AND tenant_id = coa.tenant_id);

INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '52401',
  'رسوم التسجيل والترخيص',
  'Registration and Licensing Fees',
  'expense',
  'operating_expense',
  taxes.id,
  4,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts taxes ON taxes.account_code = '524' AND taxes.tenant_id = coa.tenant_id
WHERE coa.account_code = '52' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '52401' AND tenant_id = coa.tenant_id);

-- إضافة إيرادات جديدة مفقودة
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '44',
  'إيرادات استثمارية',
  'Investment Income',
  'revenue',
  'other_revenue',
  2,
  false,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
WHERE coa.account_code = '4' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '44' AND tenant_id = coa.tenant_id);

INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
SELECT 
  coa.tenant_id,
  '44101',
  'إيرادات فوائد بنكية',
  'Bank Interest Income',
  'revenue',
  'other_revenue',
  inv_income.id,
  3,
  true,
  true,
  0,
  0
FROM public.chart_of_accounts coa 
JOIN public.chart_of_accounts inv_income ON inv_income.account_code = '44' AND inv_income.tenant_id = coa.tenant_id
WHERE coa.account_code = '4' 
AND NOT EXISTS (SELECT 1 FROM public.chart_of_accounts WHERE account_code = '44101' AND tenant_id = coa.tenant_id);

-- تحديث الحسابات الموجودة لمطابقة الهيكل الجديد
UPDATE public.chart_of_accounts 
SET 
  account_name = 'مجمع إهلاك السيارات والحافلات',
  account_name_en = 'Accumulated Depreciation - Vehicles and Buses'
WHERE account_code = '12105' AND account_name != 'مجمع إهلاك السيارات والحافلات';

-- تحديث الحسابات المحاسبية لتطابق التصنيفات الجديدة
UPDATE public.chart_of_accounts 
SET account_category = 'operating_revenue'
WHERE account_type = 'revenue' AND account_code LIKE '41%';

UPDATE public.chart_of_accounts 
SET account_category = 'other_revenue'
WHERE account_type = 'revenue' AND account_code LIKE '43%';

UPDATE public.chart_of_accounts 
SET account_category = 'operating_expense'
WHERE account_type = 'expense' AND account_code LIKE '51%';

UPDATE public.chart_of_accounts 
SET account_category = 'operating_expense'
WHERE account_type = 'expense' AND account_code LIKE '52%';

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_chart_accounts_code_tenant 
ON public.chart_of_accounts(account_code, tenant_id);

CREATE INDEX IF NOT EXISTS idx_chart_accounts_parent 
ON public.chart_of_accounts(parent_account_id);

-- إنشاء وظيفة للتحقق من توازن دليل الحسابات
CREATE OR REPLACE FUNCTION public.validate_chart_consistency(tenant_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    validation_result jsonb := '{}';
    orphaned_count integer := 0;
    missing_parents integer := 0;
BEGIN
    -- التحقق من الحسابات اليتيمة (لها parent_account_id لكن الحساب الأب غير موجود)
    SELECT COUNT(*) INTO orphaned_count
    FROM public.chart_of_accounts coa1
    WHERE coa1.tenant_id = tenant_id_param
    AND coa1.parent_account_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts coa2 
        WHERE coa2.id = coa1.parent_account_id 
        AND coa2.tenant_id = tenant_id_param
    );
    
    -- التحقق من الحسابات المفقودة على المستويات العليا
    SELECT COUNT(*) INTO missing_parents
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND level > 1
    AND parent_account_id IS NULL;
    
    validation_result := jsonb_build_object(
        'orphaned_accounts', orphaned_count,
        'missing_parent_links', missing_parents,
        'validation_date', now(),
        'is_valid', (orphaned_count = 0 AND missing_parents = 0)
    );
    
    RETURN validation_result;
END;
$$;