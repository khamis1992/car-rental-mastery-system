-- إصلاح المجموعة الثانية من الدوال بإضافة SET search_path TO 'public'

-- إصلاح دالة get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    current_user_id uuid;
    tenant_info record;
    user_permissions jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', jsonb_build_object()
        );
    END IF;
    
    -- جلب معلومات المؤسسة والدور
    SELECT 
        tu.tenant_id,
        tu.role,
        t.name as tenant_name,
        t.status as tenant_status
    INTO tenant_info
    FROM public.tenant_users tu
    JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    AND t.status = 'active'
    LIMIT 1;
    
    -- جلب الصلاحيات حسب الدور
    user_permissions := CASE tenant_info.role
        WHEN 'super_admin' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_manage_accounting', true,
            'can_manage_vehicles', true,
            'can_view_reports', true,
            'can_manage_contracts', true,
            'can_manage_tenants', true
        )
        WHEN 'tenant_admin' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_manage_accounting', true,
            'can_manage_vehicles', true,
            'can_view_reports', true,
            'can_manage_contracts', true,
            'can_manage_tenants', false
        )
        WHEN 'manager' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_manage_accounting', true,
            'can_manage_vehicles', true,
            'can_view_reports', true,
            'can_manage_contracts', true,
            'can_manage_tenants', false
        )
        WHEN 'accountant' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_manage_accounting', true,
            'can_manage_vehicles', false,
            'can_view_reports', true,
            'can_manage_contracts', false,
            'can_manage_tenants', false
        )
        ELSE jsonb_build_object(
            'can_manage_users', false,
            'can_manage_accounting', false,
            'can_manage_vehicles', false,
            'can_view_reports', false,
            'can_manage_contracts', false,
            'can_manage_tenants', false
        )
    END;
    
    RETURN jsonb_build_object(
        'authenticated', true,
        'user_id', current_user_id,
        'tenant_id', tenant_info.tenant_id,
        'tenant_name', tenant_info.tenant_name,
        'tenant_status', tenant_info.tenant_status,
        'role', tenant_info.role,
        'permissions', user_permissions
    );
END;
$function$;

-- إصلاح دالة setup_tenant_default_accounting_data
CREATE OR REPLACE FUNCTION public.setup_tenant_default_accounting_data(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ دليل الحسابات الافتراضي
    SELECT public.copy_default_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
    -- نسخ مراكز التكلفة الافتراضية
    PERFORM public.copy_default_cost_centers(tenant_id_param);
    
    -- نسخ العلامة التجارية الافتراضية
    PERFORM public.copy_default_company_branding(tenant_id_param);
    
    RETURN inserted_count;
END;
$function$;

-- إصلاح دالة validate_journal_entry_balance
CREATE OR REPLACE FUNCTION public.validate_journal_entry_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    total_debit NUMERIC := 0;
    total_credit NUMERIC := 0;
BEGIN
    -- حساب إجمالي المدين والدائن
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debit, total_credit
    FROM public.journal_entry_lines
    WHERE journal_entry_id = NEW.id;
    
    -- التحقق من التوازن
    IF total_debit != total_credit THEN
        RAISE EXCEPTION 'القيد المحاسبي غير متوازن: المدين = %, الدائن = %', total_debit, total_credit;
    END IF;
    
    -- تحديث إجمالي القيد
    UPDATE public.journal_entries 
    SET 
        total_debit = total_debit,
        total_credit = total_credit
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$function$;

-- إصلاح دالة update_account_balance_on_posting
CREATE OR REPLACE FUNCTION public.update_account_balance_on_posting()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    je_record RECORD;
    line_record RECORD;
BEGIN
    -- التحقق من تغيير الحالة إلى posted
    IF NEW.status = 'posted' AND OLD.status != 'posted' THEN
        -- جلب جميع سطور القيد
        FOR line_record IN (
            SELECT account_id, debit_amount, credit_amount 
            FROM public.journal_entry_lines 
            WHERE journal_entry_id = NEW.id
        ) LOOP
            -- تحديث رصيد الحساب
            UPDATE public.chart_of_accounts 
            SET current_balance = current_balance + line_record.debit_amount - line_record.credit_amount
            WHERE id = line_record.account_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- إصلاح دالة generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- الحصول على آخر رقم قيد للسنة الحالية
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ '^JE-' || current_year || '-[0-9]+$' 
            THEN CAST(SUBSTRING(entry_number FROM '[0-9]+$') AS INTEGER)
            ELSE 0 
        END
    ), 0) + 1
    INTO next_number
    FROM public.journal_entries;
    
    formatted_number := 'JE-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$function$;

-- إصلاح دالة check_period_status
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
    SELECT *
    INTO period_record
    FROM public.accounting_periods
    WHERE check_date >= start_date 
    AND check_date <= end_date
    AND tenant_id = public.get_current_tenant_id()
    LIMIT 1;
    
    IF period_record.id IS NULL THEN
        -- لا توجد فترة مالية محددة - السماح بالتعديل
        result := jsonb_build_object(
            'period_exists', false,
            'can_modify', true,
            'message', 'لا توجد فترة مالية محددة لهذا التاريخ'
        );
    ELSE
        -- توجد فترة مالية - فحص الحالة
        result := jsonb_build_object(
            'period_exists', true,
            'period_id', period_record.id,
            'period_name', period_record.period_name,
            'status', period_record.status,
            'can_modify', (period_record.status = 'open'),
            'message', CASE 
                WHEN period_record.status = 'open' THEN 'الفترة مفتوحة للتعديل'
                WHEN period_record.status = 'closed' THEN 'الفترة مقفلة - لا يمكن التعديل'
                ELSE 'حالة الفترة غير معروفة'
            END
        );
    END IF;
    
    RETURN result;
END;
$function$;

-- إصلاح دالة log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type_param text, description_param text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    -- تسجيل النشاط
    INSERT INTO public.user_activity_logs (
        user_id,
        tenant_id,
        activity_type,
        description,
        timestamp,
        ip_address,
        user_agent
    ) VALUES (
        current_user_id,
        current_tenant_id,
        activity_type_param,
        description_param,
        now(),
        inet_client_addr()::text,
        current_setting('request.header.user-agent', true)
    );
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
    -- حذف أي حسابات موجودة للمؤسسة
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    
    -- إنشاء دليل حسابات شامل
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO inserted_count;
    
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
    -- إضافة حسابات إضافية للالتزامات وحقوق الملكية والإيرادات والمصروفات
    
    -- حسابات إيرادات أخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES 
        (tenant_id_param, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0),
        (tenant_id_param, '43', 'إيرادات استثمارية', 'Investment Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
        
        inserted_count := inserted_count + 2;
    END IF;
    
    -- حسابات مصروفات إضافية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '5';
    IF parent_id IS NOT NULL THEN
        INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
        VALUES 
        (tenant_id_param, '52', 'مصروفات إدارية', 'Administrative Expenses', 'expense', 'operating_expense', parent_id, 2, false, true, 0, 0),
        (tenant_id_param, '53', 'مصروفات أخرى', 'Other Expenses', 'expense', 'other_expense', parent_id, 2, false, true, 0, 0);
        
        inserted_count := inserted_count + 2;
    END IF;
    
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
    journal_entry_id, receivables_account, 'ذمم عميل - ' || customer_name, contract_amount, 0, 1
  );
  
  -- إيرادات الإيجار (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, revenue_account, 'إيرادات إيجار - ' || customer_name, 0, contract_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;