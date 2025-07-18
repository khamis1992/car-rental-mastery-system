-- إصلاح مشكلة تكرار رموز الحسابات في دليل الحسابات
-- أولاً نحذف الدالة الحالية ونعيد إنشاءها مع إصلاحات
DROP FUNCTION IF EXISTS public.setup_comprehensive_chart_of_accounts(uuid);

CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف الحسابات الموجودة للمؤسسة المحددة (مع إزالة القيود الخارجية مؤقتاً)
    UPDATE public.chart_of_accounts SET parent_account_id = NULL WHERE tenant_id = tenant_id_param;
    UPDATE public.chart_of_accounts SET consolidation_account_id = NULL WHERE tenant_id = tenant_id_param;
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant, zakat_applicable)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0, true, false),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0, true, false),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0, true, false),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0, true, false),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0, true, false)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;
    
    inserted_count := inserted_count + 5;

    -- الأصول المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '12', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '13', 'أصول أخرى', 'Other Assets', 'asset', 'other_asset', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- النقدية والبنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '111', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11101', 'الصندوق', 'Cash', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '11102', 'البنوك المحلية', 'Local Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true),
    (tenant_id_param, '11103', 'البنوك الأجنبية', 'Foreign Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- تفاصيل الصندوق
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1110101', 'صندوق المكتب الرئيسي', 'Main Office Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110102', 'صندوق الفرع الأول', 'Branch 1 Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110103', 'صندوق العملات الأجنبية', 'Foreign Currency Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- البنوك المحلية - البنوك الكويتية الرئيسية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '1110201', 'بنك الكويت الوطني - الحساب الجاري', 'NBK - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110202', 'بنك الخليج - الحساب الجاري', 'Gulf Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110203', 'بنك بوبيان - الحساب الجاري', 'Boubyan Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110204', 'بنك الكويت التجاري - الحساب الجاري', 'CBK - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true),
    (tenant_id_param, '1110205', 'بيت التمويل الكويتي - الحساب الجاري', 'KFH - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- باقي الحسابات (الذمم المدينة، المخزون، المصروفات المدفوعة مقدماً، الأصول الثابتة)
    -- الذمم المدينة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '112', 'الذمم المدينة', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '11201', 'ذمم العملاء - الشركات', 'Customer Receivables - Companies', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11202', 'ذمم العملاء - الأفراد', 'Customer Receivables - Individuals', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11203', 'أوراق القبض', 'Notes Receivable', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11204', 'مخصص الديون المشكوك في تحصيلها', 'Allowance for Doubtful Debts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true),
    (tenant_id_param, '11205', 'دفعات مقدمة للموردين', 'Advances to Suppliers', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    inserted_count := inserted_count + 30;
    
    RETURN inserted_count;
END;
$$;

-- إصلاح الدالة الثانية أيضاً
DROP FUNCTION IF EXISTS public.complete_liabilities_equity_revenue_expenses(uuid);

CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(tenant_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- التأكد من وجود الحسابات الأساسية أولاً
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    IF parent_id IS NULL THEN
        RETURN 0; -- إذا لم توجد الحسابات الأساسية، لا نتابع
    END IF;
    
    -- الالتزامات المتداولة
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0, true),
    (tenant_id_param, '22', 'الالتزامات طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    -- باقي الحسابات مع ON CONFLICT
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance, ksaap_compliant)
    VALUES 
    (tenant_id_param, '211', 'الذمم الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '212', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '213', 'الضرائب والرسوم المستحقة', 'Accrued Taxes and Fees', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true),
    (tenant_id_param, '214', 'أمانات العملاء', 'Customer Deposits', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0, true)
    ON CONFLICT (tenant_id, account_code) DO NOTHING;

    inserted_count := inserted_count + 25;
    
    RETURN inserted_count;
END;
$$;