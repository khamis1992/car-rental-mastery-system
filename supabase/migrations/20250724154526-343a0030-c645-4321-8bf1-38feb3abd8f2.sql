-- إصلاح الدوال المتبقية - المجموعة التالية
-- إضافة SET search_path TO 'public' لحل تحذير Function Search Path Mutable

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
    -- إضافة حسابات الالتزامات المتقدمة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '21';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '213', 'رواتب مستحقة الدفع', 'Accrued Salaries', 'liability', 'current_liability', parent_id, 3, true, true, 0, 0),
    (tenant_id_param, '214', 'مستحقات حكومية', 'Government Dues', 'liability', 'current_liability', parent_id, 3, false, true, 0, 0);
    
    -- إضافة حسابات الإيرادات المتقدمة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42', 'إيرادات أخرى', 'Other Income', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات استثمارية', 'Investment Income', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    -- إضافة حسابات المصروفات المتقدمة
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '53', 'مصروفات تسويقية', 'Marketing Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0);
    
    inserted_count := 6;
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ دليل الحسابات الافتراضي
    INSERT INTO public.chart_of_accounts (
        tenant_id, account_code, account_name, account_name_en, 
        account_type, account_category, parent_account_id, level,
        allow_posting, is_active, opening_balance, current_balance
    )
    SELECT 
        tenant_id_param, account_code, account_name, account_name_en,
        account_type, account_category, 
        CASE 
            WHEN parent_account_id IS NOT NULL THEN 
                (SELECT id FROM public.chart_of_accounts 
                 WHERE tenant_id = tenant_id_param 
                 AND account_code = (
                     SELECT account_code FROM public.chart_of_accounts default_parent 
                     WHERE default_parent.id = default_accounts.parent_account_id
                 ))
            ELSE NULL
        END,
        level, allow_posting, is_active, opening_balance, current_balance
    FROM public.chart_of_accounts default_accounts
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
    ORDER BY level, account_code;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

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
        tenant_id, cost_center_code, cost_center_name, cost_center_name_en,
        cost_center_type, parent_cost_center_id, level, hierarchy_path,
        is_active, budget_amount, actual_spent
    )
    SELECT 
        tenant_id_param, cost_center_code, cost_center_name, cost_center_name_en,
        cost_center_type, 
        CASE 
            WHEN parent_cost_center_id IS NOT NULL THEN 
                (SELECT id FROM public.cost_centers 
                 WHERE tenant_id = tenant_id_param 
                 AND cost_center_code = (
                     SELECT cost_center_code FROM public.cost_centers default_parent 
                     WHERE default_parent.id = default_centers.parent_cost_center_id
                 ))
            ELSE NULL
        END,
        level, hierarchy_path, is_active, budget_amount, actual_spent
    FROM public.cost_centers default_centers
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
    ORDER BY level, cost_center_code;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

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
        tenant_id, logo_url, primary_color, secondary_color,
        font_family, letter_head_template, invoice_template,
        report_template, created_by
    )
    SELECT 
        tenant_id_param, logo_url, primary_color, secondary_color,
        font_family, letter_head_template, invoice_template,
        report_template, auth.uid()
    FROM public.company_branding
    WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
    LIMIT 1;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record RECORD;
    result jsonb;
BEGIN
    -- البحث عن الفترة المالية المناسبة
    SELECT * INTO period_record
    FROM public.accounting_periods
    WHERE check_date BETWEEN start_date AND end_date
    AND tenant_id = public.get_current_tenant_id()
    LIMIT 1;
    
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'can_modify', false,
            'message', 'لا توجد فترة مالية محددة لهذا التاريخ',
            'period_id', null,
            'period_status', 'not_found'
        );
    ELSE
        CASE period_record.status
            WHEN 'open' THEN
                result := jsonb_build_object(
                    'can_modify', true,
                    'message', 'الفترة مفتوحة للتعديل',
                    'period_id', period_record.id,
                    'period_status', 'open'
                );
            WHEN 'closed' THEN
                result := jsonb_build_object(
                    'can_modify', false,
                    'message', 'الفترة مقفلة ولا يمكن التعديل عليها',
                    'period_id', period_record.id,
                    'period_status', 'closed'
                );
            WHEN 'locked' THEN
                result := jsonb_build_object(
                    'can_modify', false,
                    'message', 'الفترة مؤمنة ولا يمكن التعديل عليها',
                    'period_id', period_record.id,
                    'period_status', 'locked'
                );
            ELSE
                result := jsonb_build_object(
                    'can_modify', false,
                    'message', 'حالة الفترة غير معروفة',
                    'period_id', period_record.id,
                    'period_status', period_record.status
                );
        END CASE;
    END IF;
    
    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    next_number integer;
    journal_number text;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- الحصول على الرقم التالي لهذه المؤسسة
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ '^JE-[0-9]+$' THEN 
                CAST(SUBSTRING(entry_number FROM 4) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO next_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id;
    
    -- تنسيق الرقم
    journal_number := 'JE-' || LPAD(next_number::text, 6, '0');
    
    RETURN journal_number;
END;
$function$;

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
  reference_type TEXT;
  reference_id UUID;
  line_number INTEGER := 1;
BEGIN
  -- استخراج البيانات من JSON
  transaction_amount := (transaction_data->>'amount')::NUMERIC;
  transaction_description := transaction_data->>'description';
  reference_type := transaction_data->>'reference_type';
  reference_id := (transaction_data->>'reference_id')::UUID;
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO debit_account_id 
  FROM public.chart_of_accounts 
  WHERE account_code = transaction_data->>'debit_account_code'
  AND tenant_id = public.get_current_tenant_id();
  
  SELECT id INTO credit_account_id 
  FROM public.chart_of_accounts 
  WHERE account_code = transaction_data->>'credit_account_code'
  AND tenant_id = public.get_current_tenant_id();
  
  -- التحقق من وجود الحسابات
  IF debit_account_id IS NULL OR credit_account_id IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على الحسابات المطلوبة';
  END IF;
  
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
    created_by,
    tenant_id
  ) VALUES (
    journal_entry_number,
    COALESCE((transaction_data->>'transaction_date')::DATE, CURRENT_DATE),
    transaction_description,
    reference_type,
    reference_id,
    transaction_amount,
    transaction_amount,
    'posted',
    auth.uid(),
    public.get_current_tenant_id()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطر المدين
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
    line_number,
    public.get_current_tenant_id()
  );
  
  line_number := line_number + 1;
  
  -- إنشاء سطر الدائن
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
    line_number,
    public.get_current_tenant_id()
  );
  
  -- تحديث أرصدة الحسابات
  PERFORM public.update_account_balances(journal_entry_id);
  
  RETURN journal_entry_id;
END;
$function$;