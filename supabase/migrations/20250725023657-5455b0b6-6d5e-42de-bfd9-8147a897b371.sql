-- إصلاح الدفعة السادسة من الدوال - إضافة SET search_path TO 'public'

-- create_contract_accounting_entry
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(contract_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    transaction_entry JSONB;
BEGIN
    -- تحضير بيانات المعاملة
    transaction_entry := jsonb_build_object(
        'amount', contract_data->>'total_amount',
        'description', 'عقد إيجار - ' || (contract_data->>'customer_name') || ' - ' || (contract_data->>'contract_number'),
        'reference_type', 'contract',
        'reference_id', contract_data->>'contract_id',
        'debit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '1121' AND tenant_id = get_current_tenant_id()),
        'credit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '411' AND tenant_id = get_current_tenant_id())
    );
    
    -- إنشاء القيد المحاسبي
    RETURN log_transaction(transaction_entry);
END;
$function$;

-- create_attendance_accounting_entry
CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(attendance_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    transaction_entry JSONB;
    employee_name TEXT;
    daily_salary NUMERIC;
BEGIN
    -- استخراج البيانات
    employee_name := attendance_data->>'employee_name';
    daily_salary := (attendance_data->>'daily_salary')::NUMERIC;
    
    -- تحضير بيانات المعاملة
    transaction_entry := jsonb_build_object(
        'amount', daily_salary,
        'description', 'راتب يومي - ' || employee_name || ' - ' || (attendance_data->>'attendance_date'),
        'reference_type', 'attendance',
        'reference_id', attendance_data->>'attendance_id',
        'debit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '5111' AND tenant_id = get_current_tenant_id()),
        'credit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '2111' AND tenant_id = get_current_tenant_id())
    );
    
    -- إنشاء القيد المحاسبي
    RETURN log_transaction(transaction_entry);
END;
$function$;

-- update_account_balances
CREATE OR REPLACE FUNCTION public.update_account_balances(journal_entry_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    line_record RECORD;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- معالجة كل سطر من سطور القيد
    FOR line_record IN 
        SELECT jel.account_id, jel.debit_amount, jel.credit_amount, coa.account_type
        FROM public.journal_entry_lines jel
        INNER JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
        WHERE jel.journal_entry_id = journal_entry_id_param
        AND jel.tenant_id = current_tenant_id
    LOOP
        -- تحديث الرصيد حسب نوع الحساب
        CASE line_record.account_type
            WHEN 'asset', 'expense' THEN
                -- الأصول والمصروفات: مدين يزيد الرصيد، دائن ينقص
                UPDATE public.chart_of_accounts 
                SET current_balance = current_balance + line_record.debit_amount - line_record.credit_amount,
                    updated_at = NOW()
                WHERE id = line_record.account_id
                AND tenant_id = current_tenant_id;
                
            WHEN 'liability', 'equity', 'revenue' THEN
                -- الالتزامات وحقوق الملكية والإيرادات: دائن يزيد الرصيد، مدين ينقص
                UPDATE public.chart_of_accounts 
                SET current_balance = current_balance + line_record.credit_amount - line_record.debit_amount,
                    updated_at = NOW()
                WHERE id = line_record.account_id
                AND tenant_id = current_tenant_id;
        END CASE;
    END LOOP;
END;
$function$;

-- setup_comprehensive_chart_of_accounts
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

    -- المستوى الثالث
    -- الأصول المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '11';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '111', 'النقدية وما في حكمها', 'Cash and Cash Equivalents', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '112', 'الذمم المدينة', 'Accounts Receivable', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '113', 'المخزون', 'Inventory', 'asset', 'current_asset', parent_id, 3, false, true, 0, 0);
    
    -- الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '121', 'السيارات والمركبات', 'Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '122', 'مجمع إهلاك السيارات والمركبات', 'Accumulated Depreciation - Vehicles', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    -- الالتزامات المتداولة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '211', 'الذمم الدائنة', 'Accounts Payable', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '212', 'المصروفات المستحقة', 'Accrued Expenses', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- رأس المال
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '31';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '311', 'رأس المال المدفوع', 'Paid-up Capital', 'equity', 'capital', parent_id, 3, true, true, 0, 0);
    
    -- إيرادات التأجير
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '411', 'إيرادات تأجير السيارات', 'Car Rental Revenue', 'revenue', 'operating_revenue', parent_id, 3, true, true, 0, 0);
    
    -- مصروفات التشغيل
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '511', 'الرواتب والأجور', 'Salaries and Wages', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '512', 'مصروفات الصيانة', 'Maintenance Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '513', 'مصروفات الوقود', 'Fuel Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '514', 'الإهلاك', 'Depreciation', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    inserted_count := inserted_count + 12;

    -- المستوى الرابع 
    -- النقدية وما في حكمها
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '111';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1111', 'الصندوق', 'Cash on Hand', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1112', 'البنوك', 'Banks', 'asset', 'current_asset', parent_id, 4, false, true, 0, 0);
    
    -- الذمم المدينة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '112';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1121', 'ذمم العملاء', 'Customer Receivables', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- المخزون
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '113';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1131', 'قطع غيار', 'Spare Parts', 'asset', 'current_asset', parent_id, 4, true, true, 0, 0);
    
    -- السيارات والمركبات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '121';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1211', 'سيارات صالون', 'Sedan Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1212', 'حافلات', 'Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- مجمع الإهلاك
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '122';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1221', 'مجمع إهلاك السيارات الصالون', 'Accumulated Depreciation - Sedan Cars', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1222', 'مجمع إهلاك الحافلات', 'Accumulated Depreciation - Buses', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    -- الذمم الدائنة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '211';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '2111', 'ذمم الموردين', 'Supplier Payables', 'liability', 'current_liability', parent_id, 4, true, true, 0, 0);
    
    -- الرواتب والأجور
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '511';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '5111', 'رواتب إدارية', 'Administrative Salaries', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '5112', 'أجور عمال', 'Workers Wages', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
    
    inserted_count := inserted_count + 11;
    
    RETURN inserted_count;
END;
$function$;

-- complete_liabilities_equity_revenue_expenses
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
    -- إضافة المزيد من الإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات استثمارية', 'Investment Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- إضافة تفاصيل الإيرادات الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '421', 'رسوم التأخير', 'Late Fees', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '422', 'رسوم الإلغاء', 'Cancellation Fees', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '423', 'رسوم خدمات إضافية', 'Additional Service Fees', 'revenue', 'other_revenue', parent_id, 3, true, true, 0, 0);
    
    -- إضافة المزيد من المصروفات التفصيلية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'administrative_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '53', 'مصروفات عمومية', 'General Expenses', 'expense', 'general_expense', parent_id, 2, false, true, 0, 0);
    
    -- تفاصيل المصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '52';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '521', 'مصروفات مكتبية', 'Office Expenses', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '522', 'مصروفات اتصالات', 'Communication Expenses', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '523', 'رسوم حكومية', 'Government Fees', 'expense', 'administrative_expense', parent_id, 3, true, true, 0, 0);
    
    -- تفاصيل المصروفات العمومية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '53';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '531', 'مصروفات كهرباء وماء', 'Utilities Expenses', 'expense', 'general_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '532', 'مصروفات تأمين', 'Insurance Expenses', 'expense', 'general_expense', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '533', 'مصروفات ضرائب', 'Tax Expenses', 'expense', 'general_expense', parent_id, 3, true, true, 0, 0);
    
    -- إضافة المزيد من الأصول الثابتة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '12';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '123', 'أثاث ومعدات', 'Furniture and Equipment', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '124', 'مباني', 'Buildings', 'asset', 'fixed_asset', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل الأثاث والمعدات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '123';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '1231', 'أثاث مكتبي', 'Office Furniture', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '1232', 'أجهزة كمبيوتر', 'Computer Equipment', 'asset', 'fixed_asset', parent_id, 4, true, true, 0, 0);
    
    inserted_count := 16;
    
    RETURN inserted_count;
END;
$function$;