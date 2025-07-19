-- إصلاح قيود جدول دليل الحسابات
-- أولاً نحذف القيد الحالي المسبب للمشكلة
ALTER TABLE public.chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_account_category_check;

-- ثم نضع قيد جديد يتضمن جميع الفئات المطلوبة
ALTER TABLE public.chart_of_accounts 
ADD CONSTRAINT chart_of_accounts_account_category_check 
CHECK (account_category IN (
    'current_asset',
    'fixed_asset', 
    'other_asset',
    'current_liability',
    'long_term_liability',
    'capital',
    'operating_revenue',
    'other_revenue',
    'operating_expense',
    'other_expense',
    'cost_of_goods_sold'
));

-- تحديث أي قيم غير متوافقة إلى قيم صحيحة
UPDATE public.chart_of_accounts 
SET account_category = 'current_asset' 
WHERE account_type = 'asset' AND account_category NOT IN (
    'current_asset', 'fixed_asset', 'other_asset'
);

UPDATE public.chart_of_accounts 
SET account_category = 'current_liability' 
WHERE account_type = 'liability' AND account_category NOT IN (
    'current_liability', 'long_term_liability'
);

UPDATE public.chart_of_accounts 
SET account_category = 'capital' 
WHERE account_type = 'equity' AND account_category NOT IN ('capital');

UPDATE public.chart_of_accounts 
SET account_category = 'operating_revenue' 
WHERE account_type = 'revenue' AND account_category NOT IN (
    'operating_revenue', 'other_revenue'
);

UPDATE public.chart_of_accounts 
SET account_category = 'operating_expense' 
WHERE account_type = 'expense' AND account_category NOT IN (
    'operating_expense', 'other_expense', 'cost_of_goods_sold'
);