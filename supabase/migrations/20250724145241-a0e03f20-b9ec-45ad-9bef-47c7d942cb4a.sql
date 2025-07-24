-- الدفعة الثالثة: إصلاح 6 دوال أخرى لإضافة SET search_path TO 'public'

-- إصلاح دالة copy_default_cost_centers
CREATE OR REPLACE FUNCTION public.copy_default_cost_centers(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ مراكز التكلفة الافتراضية
    INSERT INTO public.cost_centers (
        tenant_id,
        cost_center_code,
        cost_center_name,
        cost_center_type,
        level,
        hierarchy_path,
        is_active,
        budget_amount,
        actual_spent
    )
    SELECT 
        tenant_id_param,
        cost_center_code,
        cost_center_name,
        cost_center_type,
        level,
        hierarchy_path,
        is_active,
        0,
        0
    FROM public.cost_centers
    WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1);
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

-- إصلاح دالة copy_default_company_branding
CREATE OR REPLACE FUNCTION public.copy_default_company_branding(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ العلامة التجارية الافتراضية
    INSERT INTO public.company_branding (
        tenant_id,
        company_name,
        company_name_en,
        company_address,
        company_phone,
        company_email,
        company_website,
        tax_number,
        commercial_register,
        show_header,
        show_footer,
        header_height,
        footer_height
    )
    SELECT 
        tenant_id_param,
        company_name,
        company_name_en,
        company_address,
        company_phone,
        company_email,
        company_website,
        tax_number,
        commercial_register,
        show_header,
        show_footer,
        header_height,
        footer_height
    FROM public.company_branding
    WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1)
    LIMIT 1;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

-- إصلاح دالة create_contract_accounting_entry
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(contract_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  contract_amount NUMERIC;
  contract_reference TEXT;
  customer_name TEXT;
  
  -- معرفات الحسابات
  receivables_account UUID;
  revenue_account UUID;
BEGIN
  -- استخراج البيانات
  contract_amount := (contract_data->>'total_amount')::NUMERIC;
  contract_reference := contract_data->>'contract_number';
  customer_name := contract_data->>'customer_name';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO receivables_account FROM public.chart_of_accounts WHERE account_code = '1121';
  SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '411';
  
  -- توليد رقم القيد
  journal_entry_number := public.generate_journal_entry_number();
  
  -- إنشاء القيد المحاسبي
  INSERT INTO public.journal_entries (
    entry_number,
    entry_date,
    description,
    reference_type,
    reference_id,
    total_debit,
    total_credit,
    status,
    created_by
  ) VALUES (
    journal_entry_number,
    CURRENT_DATE,
    'عقد إيجار - ' || customer_name || ' - ' || contract_reference,
    'contract',
    (contract_data->>'contract_id')::UUID,
    contract_amount,
    contract_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- الذمم المدينة (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, receivables_account, 'ذمم عقد إيجار - ' || customer_name, contract_amount, 0, 1
  );
  
  -- إيرادات الإيجار (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, revenue_account, 'إيرادات عقد إيجار - ' || customer_name, 0, contract_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- إصلاح دالة setup_comprehensive_chart_of_accounts
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- إنشاء دليل حسابات شامل للمؤسسة
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    -- إضافة حسابات متخصصة إضافية
    PERFORM public.add_specialized_rental_accounts(tenant_id_param);
    
    RETURN inserted_count;
END;
$function$;

-- إصلاح دالة complete_liabilities_equity_revenue_expenses
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
    -- إضافة المزيد من حسابات الالتزامات والإيرادات والمصروفات
    
    -- حسابات إضافية للإيرادات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '41';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '412', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '413', 'إيرادات استثمارية', 'Investment Revenue', 'revenue', 'other_revenue', parent_id, 3, false, true, 0, 0);
    
    -- حسابات فرعية للإيرادات الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '412';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '41201', 'غرامات تأخير', 'Late Fees', 'revenue', 'other_revenue', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '41202', 'إيرادات خدمات إضافية', 'Additional Services Revenue', 'revenue', 'other_revenue', parent_id, 4, true, true, 0, 0);
    
    -- حسابات إضافية للمصروفات
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '51';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '515', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '516', 'مصروفات تسويقية', 'Marketing Expenses', 'expense', 'operating_expense', parent_id, 3, false, true, 0, 0);
    
    -- حسابات فرعية للمصروفات الإدارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '515';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '51501', 'مصروفات مكتبية', 'Office Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '51502', 'مصروفات اتصالات', 'Communication Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '51503', 'مصروفات قانونية', 'Legal Expenses', 'expense', 'operating_expense', parent_id, 4, true, true, 0, 0);
    
    inserted_count := 9;
    
    RETURN inserted_count;
END;
$function$;

-- إصلاح دالة create_depreciation_entries
CREATE OR REPLACE FUNCTION public.create_depreciation_entries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    vehicle_record RECORD;
    monthly_depreciation NUMERIC;
    journal_entry_id UUID;
    journal_entry_number TEXT;
    current_tenant_id UUID;
    depreciation_account UUID;
    accumulated_depreciation_account UUID;
    entries_created INTEGER := 0;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على حسابات الإهلاك
    SELECT id INTO depreciation_account 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '514';
    
    SELECT id INTO accumulated_depreciation_account 
    FROM public.chart_of_accounts 
    WHERE tenant_id = current_tenant_id AND account_code = '1221';
    
    -- معالجة كل مركبة تحتاج إهلاك
    FOR vehicle_record IN 
        SELECT v.*, 
               COALESCE(v.depreciation_rate, 20) as depreciation_rate,
               COALESCE(v.purchase_price, 0) as purchase_price
        FROM public.vehicles v
        WHERE v.tenant_id = current_tenant_id
        AND v.status = 'active'
        AND v.purchase_price > 0
    LOOP
        -- حساب الإهلاك الشهري
        monthly_depreciation := (vehicle_record.purchase_price * vehicle_record.depreciation_rate / 100) / 12;
        
        -- إنشاء قيد الإهلاك إذا كان المبلغ معقول
        IF monthly_depreciation > 0 THEN
            journal_entry_number := public.generate_journal_entry_number();
            
            INSERT INTO public.journal_entries (
                entry_number,
                entry_date,
                description,
                reference_type,
                reference_id,
                total_debit,
                total_credit,
                status,
                created_by
            ) VALUES (
                journal_entry_number,
                CURRENT_DATE,
                'إهلاك شهري - ' || vehicle_record.make || ' ' || vehicle_record.model,
                'depreciation',
                vehicle_record.id,
                monthly_depreciation,
                monthly_depreciation,
                'posted',
                auth.uid()
            ) RETURNING id INTO journal_entry_id;
            
            -- سطر الإهلاك (مدين)
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
            ) VALUES (
                journal_entry_id, depreciation_account, 'إهلاك شهري - ' || vehicle_record.make, monthly_depreciation, 0, 1
            );
            
            -- سطر مجمع الإهلاك (دائن)
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
            ) VALUES (
                journal_entry_id, accumulated_depreciation_account, 'مجمع إهلاك - ' || vehicle_record.make, 0, monthly_depreciation, 2
            );
            
            entries_created := entries_created + 1;
        END IF;
    END LOOP;
    
    RETURN entries_created;
END;
$function$;