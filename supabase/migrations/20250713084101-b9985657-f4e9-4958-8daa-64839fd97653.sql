-- إعادة هيكلة دليل الحسابات الشامل
-- الخطوة 1: إنشاء جدول مؤقت للحسابات الجديدة
CREATE TEMP TABLE new_chart_structure AS
SELECT 
  tenant_id,
  account_code,
  account_name,
  account_name_en,
  account_type,
  account_category,
  parent_account_id,
  level,
  allow_posting,
  is_active,
  opening_balance,
  current_balance
FROM chart_of_accounts WHERE 1=0;

-- إنشاء فهرس مؤقت لتحسين الأداء
CREATE INDEX idx_temp_account_code ON new_chart_structure(account_code);

-- إنشاء دالة محدثة لإنشاء دليل الحسابات الشامل
CREATE OR REPLACE FUNCTION public.setup_enhanced_chart_of_accounts(tenant_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف الحسابات الموجودة للمؤسسة المحددة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- المستوى الأول - الحسابات الرئيسية
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1', 'الأصول', 'Assets', 'asset', 'current_asset', 1, false, true, 0, 0),
    (tenant_id_param, '2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', 1, false, true, 0, 0),
    (tenant_id_param, '3', 'حقوق الملكية', 'Equity', 'equity', 'capital', 1, false, true, 0, 0),
    (tenant_id_param, '4', 'الإيرادات', 'Revenue', 'revenue', 'operating_revenue', 1, false, true, 0, 0),
    (tenant_id_param, '5', 'المصروفات', 'Expenses', 'expense', 'operating_expense', 1, false, true, 0, 0);
    
    inserted_count := inserted_count + 5;

    -- المستوى الثاني - تصنيفات الأصول
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '12', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '13', 'أصول أخرى', 'Other Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0);

    -- النقدية والبنوك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '111', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11101', 'الصندوق', 'Cash', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11102', 'البنوك المحلية', 'Local Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11103', 'البنوك الأجنبية', 'Foreign Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);

    -- تفاصيل الصندوق
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11101';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1110101', 'صندوق المكتب الرئيسي', 'Main Office Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110102', 'صندوق الفرع الأول', 'Branch 1 Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110103', 'صندوق العملات الأجنبية', 'Foreign Currency Cash', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);

    -- البنوك المحلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11102';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1110201', 'بنك الكويت الوطني - الحساب الجاري', 'NBK - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110202', 'بنك الخليج - الحساب الجاري', 'Gulf Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0),
    (tenant_id_param, '1110203', 'بنك بوبيان - الحساب الجاري', 'Boubyan Bank - Current Account', 'asset', 'current_asset', parent_id, 5, true, true, 0, 0);

    -- الذمم المدينة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '112', 'الذمم المدينة', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11201', 'ذمم العملاء - الشركات', 'Customer Receivables - Companies', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11202', 'ذمم العملاء - الأفراد', 'Customer Receivables - Individuals', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0),
    (tenant_id_param, '11203', 'مخصص الديون المشكوك في تحصيلها', 'Allowance for Doubtful Debts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);

    -- الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '121', 'المركبات والمعدات', 'Vehicles and Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '122', 'المباني والعقارات', 'Buildings and Real Estate', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '123', 'الأثاث والمعدات المكتبية', 'Furniture and Office Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);

    -- المركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '12101', 'السيارات الصغيرة', 'Small Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12102', 'السيارات المتوسطة', 'Medium Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12103', 'السيارات الكبيرة', 'Large Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12104', 'الحافلات', 'Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '12105', 'مجمع إهلاك المركبات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);

    -- الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '22', 'الالتزامات طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);

    -- الذمم الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '211', 'الذمم الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '212', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '213', 'الضرائب المستحقة', 'Accrued Taxes', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);

    -- تفاصيل الذمم الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21101', 'ذمم الموردين', 'Suppliers Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21102', 'أمانات العملاء', 'Customer Deposits', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21103', 'رواتب مستحقة', 'Accrued Salaries', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);

    -- حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '32', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0);

    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '3101', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '3102', 'احتياطي قانوني', 'Legal Reserve', 'equity', 'capital', parent_id, 3, true, true, 0, 0);

    -- الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Income', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '42', 'إيرادات الصيانة', 'Maintenance Income', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات أخرى', 'Other Income', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);

    -- إيرادات التأجير
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '4101', 'إيرادات تأجير السيارات - الشركات', 'Car Rental Revenue - Companies', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4102', 'إيرادات تأجير السيارات - الأفراد', 'Car Rental Revenue - Individuals', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '4103', 'إيرادات تأجير الحافلات', 'Bus Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0);

    -- المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51', 'المصروفات التشغيلية', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '52', 'المصروفات الإدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '53', 'مصروفات أخرى', 'Other Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0);

    -- المصروفات التشغيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5101', 'الوقود والزيوت', 'Fuel and Oil', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5102', 'صيانة المركبات', 'Vehicle Maintenance', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5103', 'التأمين', 'Insurance', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5104', 'الإهلاك', 'Depreciation', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0);

    -- المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5201', 'الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5202', 'الإيجارات', 'Rent Expenses', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5203', 'الكهرباء والماء', 'Utilities', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '5204', 'الاتصالات', 'Communications', 'expense', 'operating_expense', parent_id, 3, true, true, 0, 0);

    inserted_count := inserted_count + 55;
    
    RETURN inserted_count;
END;
$function$;

-- إنشاء دالة لتحديث أرصدة الحسابات
CREATE OR REPLACE FUNCTION public.migrate_account_balances()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    migration_result JSONB := '{}';
    affected_accounts INTEGER := 0;
BEGIN
    -- تحديث أرصدة الحسابات بناءً على القيود المحاسبية
    UPDATE public.chart_of_accounts 
    SET current_balance = (
        SELECT 
            CASE 
                WHEN coa.account_type IN ('asset', 'expense') THEN 
                    coa.opening_balance + COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
                WHEN coa.account_type IN ('liability', 'equity', 'revenue') THEN 
                    coa.opening_balance + COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
                ELSE coa.opening_balance
            END
        FROM public.journal_entry_lines jel
        JOIN public.journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.account_id = chart_of_accounts.id
        AND je.status = 'posted'
    ),
    updated_at = now()
    WHERE allow_posting = true;
    
    GET DIAGNOSTICS affected_accounts = ROW_COUNT;
    
    migration_result := jsonb_build_object(
        'status', 'success',
        'affected_accounts', affected_accounts,
        'updated_at', now()
    );
    
    RETURN migration_result;
END;
$function$;

-- إنشاء دالة للتحقق من تطابق الميزانية
CREATE OR REPLACE FUNCTION public.validate_trial_balance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    total_debits NUMERIC := 0;
    total_credits NUMERIC := 0;
    balance_result JSONB;
BEGIN
    -- حساب إجمالي المدين والدائن
    SELECT 
        COALESCE(SUM(CASE WHEN current_balance > 0 THEN current_balance ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN current_balance < 0 THEN ABS(current_balance) ELSE 0 END), 0)
    INTO total_debits, total_credits
    FROM public.chart_of_accounts
    WHERE allow_posting = true AND is_active = true;
    
    balance_result := jsonb_build_object(
        'total_debits', total_debits,
        'total_credits', total_credits,
        'difference', total_debits - total_credits,
        'is_balanced', (total_debits = total_credits),
        'validation_date', now()
    );
    
    RETURN balance_result;
END;
$function$;