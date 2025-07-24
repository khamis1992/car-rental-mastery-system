-- إصلاح الدفعة التالية من الدوال - إضافة SET search_path TO 'public'

-- 1. إصلاح دالة setup_comprehensive_chart_of_accounts
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- حذف أي حسابات موجودة للمؤسسة
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

    -- المستوى الثاني - الأصول
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '1';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '12', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'fixed_asset', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - الالتزامات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '2';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '22', 'الالتزامات طويلة الأجل', 'Long-term Liabilities', 'liability', 'long_term_liability', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - حقوق الملكية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '3';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '31', 'رأس المال', 'Capital', 'equity', 'capital', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '32', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'capital', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - الإيرادات  
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41', 'إيرادات التأجير', 'Rental Revenue', 'revenue', 'operating_revenue', parent_id, 2, false, true, 0, 0);
    
    -- المستوى الثاني - المصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
    
    inserted_count := inserted_count + 8;

    -- المستوى الثالث - الأصول المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '111', 'النقدية وما في حكمها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '112', 'الذمم المدينة', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '121', 'السيارات والمركبات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '122', 'مجمع إهلاك السيارات والمركبات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '211', 'الذمم الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '212', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- المستوى الثالث - رأس المال
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '311', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
    
    -- المستوى الثالث - إيرادات التأجير
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '411', 'إيرادات تأجير السيارات', 'Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0);
    
    -- المستوى الثالث - مصروفات التشغيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '511', 'الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '512', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '513', 'مصروفات الوقود', 'Fuel Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '514', 'الإهلاك', 'Depreciation', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    inserted_count := inserted_count + 12;

    -- المستوى الرابع - النقدية وما في حكمها
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1111', 'الصندوق', 'Cash on Hand', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1112', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- المستوى الرابع - الذمم المدينة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1121', 'ذمم العملاء', 'Customer Receivables', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1131', 'قطع غيار', 'Spare Parts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - السيارات والمركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1211', 'سيارات صالون', 'Sedan Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1212', 'حافلات', 'Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - مجمع الإهلاك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '122';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1221', 'مجمع إهلاك السيارات الصالون', 'Accumulated Depreciation - Sedan Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1222', 'مجمع إهلاك الحافلات', 'Accumulated Depreciation - Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - الذمم الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2111', 'ذمم الموردين', 'Supplier Payables', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- المستوى الرابع - الرواتب والأجور
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '511';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5111', 'رواتب إدارية', 'Administrative Salaries', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '5112', 'أجور عمال', 'Workers Wages', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
    
    inserted_count := inserted_count + 11;
    
    RETURN inserted_count;
END;
$function$;

-- 2. إصلاح دالة complete_liabilities_equity_revenue_expenses
CREATE OR REPLACE FUNCTION public.complete_liabilities_equity_revenue_expenses(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
    parent_id UUID;
BEGIN
    -- إضافة حسابات الالتزامات المتخصصة
    
    -- 1. حسابات الضرائب والرسوم
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '213', 'الضرائب والرسوم', 'Taxes and Fees', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '214', 'مستحقات الموظفين', 'Employee Accruals', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل الضرائب والرسوم
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '213';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21301', 'ضريبة القيمة المضافة', 'VAT Payable', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21302', 'رسوم الترخيص', 'License Fees', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل مستحقات الموظفين
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '214';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '21401', 'مستحقات الرواتب', 'Salary Accruals', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '21402', 'مستحقات المكافآت', 'Bonus Accruals', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- 2. إضافة حسابات الإيرادات المتخصصة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات استثمارية', 'Investment Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- تفاصيل الإيرادات الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42101', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 'other_revenue', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '42102', 'إيرادات الرسوم', 'Fee Revenue', 'revenue', 'other_revenue', parent_id, 4, true, true, 0, 0);
    
    -- 3. إضافة حسابات المصروفات المتخصصة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52', 'المصروفات الإدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '53', 'المصروفات التسويقية', 'Marketing Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
    
    -- تفاصيل المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52101', 'مصروفات الإيجار', 'Rent Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '52102', 'مصروفات الكهرباء', 'Electricity Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '52103', 'مصروفات الاتصالات', 'Communication Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
    
    -- تفاصيل المصروفات التسويقية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '53';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '53101', 'مصروفات الإعلان', 'Advertising Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '53102', 'مصروفات العمولات', 'Commission Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
    
    inserted_count := 15;
    
    RETURN inserted_count;
END;
$function$;

-- 3. إصلاح دالة copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- تطبيق دليل الحسابات الشامل
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    RETURN inserted_count;
END;
$function$;

-- 4. إصلاح دالة copy_default_cost_centers
CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إنشاء مراكز التكلفة الافتراضية
    INSERT INTO public.cost_centers (
        tenant_id, 
        cost_center_code, 
        cost_center_name, 
        cost_center_type, 
        level, 
        hierarchy_path, 
        budget_amount, 
        is_active
    ) VALUES 
    (tenant_id_param, 'CC001', 'الإدارة العامة', 'operational', 1, 'CC001', 0, true),
    (tenant_id_param, 'CC002', 'قسم التأجير', 'operational', 1, 'CC002', 0, true),
    (tenant_id_param, 'CC003', 'قسم الصيانة', 'operational', 1, 'CC003', 0, true),
    (tenant_id_param, 'CC004', 'قسم المالية', 'operational', 1, 'CC004', 0, true);
    
    inserted_count := 4;
    
    RETURN inserted_count;
END;
$function$;

-- 5. إصلاح دالة copy_default_company_branding
CREATE OR REPLACE FUNCTION public.copy_default_company_branding(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إنشاء العلامة التجارية الافتراضية
    INSERT INTO public.company_branding (
        tenant_id,
        company_name_ar,
        company_name_en,
        address_ar,
        address_en,
        phone,
        email,
        website,
        cr_number,
        vat_number,
        currency,
        language,
        created_at,
        updated_at
    ) VALUES (
        tenant_id_param,
        'شركة تأجير السيارات',
        'Car Rental Company',
        'الكويت',
        'Kuwait',
        '+965 12345678',
        'info@company.com',
        'www.company.com',
        '12345678',
        '123456789012345',
        'KWD',
        'ar',
        NOW(),
        NOW()
    );
    
    inserted_count := 1;
    
    RETURN inserted_count;
END;
$function$;

-- 6. إصلاح دالة generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    next_number INTEGER;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرقم التالي
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 4) AS INTEGER)), 0) + 1 
    INTO next_number
    FROM public.journal_entries 
    WHERE tenant_id = current_tenant_id
    AND entry_number ~ '^JE-[0-9]+$';
    
    -- إرجاع الرقم بالتنسيق المطلوب
    RETURN 'JE-' || LPAD(next_number::TEXT, 6, '0');
END;
$function$;

-- 7. إصلاح دالة log_transaction
CREATE OR REPLACE FUNCTION public.log_transaction(transaction_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    debit_account_id UUID;
    credit_account_id UUID;
    transaction_amount NUMERIC;
    transaction_description TEXT;
    line_counter INTEGER := 1;
    current_tenant_id UUID;
    entry_line RECORD;
    entries_data JSONB;
    entry_data JSONB;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- استخراج البيانات الأساسية
    transaction_amount := (transaction_data->>'amount')::NUMERIC;
    transaction_description := transaction_data->>'description';
    
    -- توليد رقم القيد
    journal_entry_number := public.generate_journal_entry_number();
    
    -- إنشاء القيد الرئيسي
    INSERT INTO public.journal_entries (
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        status,
        created_by,
        tenant_id
    ) VALUES (
        journal_entry_number,
        COALESCE((transaction_data->>'entry_date')::DATE, CURRENT_DATE),
        transaction_description,
        COALESCE(transaction_data->>'reference_type', 'manual'),
        COALESCE((transaction_data->>'reference_id')::UUID, NULL),
        transaction_amount,
        transaction_amount,
        COALESCE(transaction_data->>'status', 'posted'),
        COALESCE((transaction_data->>'created_by')::UUID, auth.uid()),
        current_tenant_id
    ) RETURNING id INTO journal_entry_id;
    
    -- معالجة سطور القيد
    entries_data := transaction_data->'entries';
    
    IF entries_data IS NOT NULL THEN
        -- معالجة سطور متعددة
        FOR entry_data IN SELECT * FROM jsonb_array_elements(entries_data)
        LOOP
            INSERT INTO public.journal_entry_lines (
                journal_entry_id,
                account_id,
                description,
                debit_amount,
                credit_amount,
                line_number,
                tenant_id
            ) VALUES (
                journal_entry_id,
                (entry_data->>'account_id')::UUID,
                entry_data->>'description',
                COALESCE((entry_data->>'debit_amount')::NUMERIC, 0),
                COALESCE((entry_data->>'credit_amount')::NUMERIC, 0),
                line_counter,
                current_tenant_id
            );
            
            line_counter := line_counter + 1;
        END LOOP;
    ELSE
        -- معالجة سطرين بسيطين (مدين/دائن)
        -- الحصول على معرفات الحسابات
        debit_account_id := (transaction_data->>'debit_account_id')::UUID;
        credit_account_id := (transaction_data->>'credit_account_id')::UUID;
        
        -- إنشاء السطر المدين
        INSERT INTO public.journal_entry_lines (
            journal_entry_id,
            account_id,
            description,
            debit_amount,
            credit_amount,
            line_number,
            tenant_id
        ) VALUES (
            journal_entry_id,
            debit_account_id,
            transaction_description,
            transaction_amount,
            0,
            1,
            current_tenant_id
        );
        
        -- إنشاء السطر الدائن
        INSERT INTO public.journal_entry_lines (
            journal_entry_id,
            account_id,
            description,
            debit_amount,
            credit_amount,
            line_number,
            tenant_id
        ) VALUES (
            journal_entry_id,
            credit_account_id,
            transaction_description,
            0,
            transaction_amount,
            2,
            current_tenant_id
        );
    END IF;
    
    -- تحديث أرصدة الحسابات
    PERFORM public.update_account_balances(journal_entry_id);
    
    RETURN journal_entry_id;
END;
$function$;