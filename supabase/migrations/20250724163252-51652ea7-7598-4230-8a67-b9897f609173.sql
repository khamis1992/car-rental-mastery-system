-- إصلاح مجموعة أخرى من الوظائف المحاسبية
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
BEGIN
    user_context := get_user_tenant_context();
    RETURN (user_context->>'tenant_id')::uuid;
END;
$function$

---

CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    current_user_id uuid;
    tenant_record RECORD;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'tenant_id', null,
            'role', null,
            'permissions', jsonb_build_object(),
            'is_authenticated', false
        );
    END IF;
    
    -- البحث في tenant_user_roles أولاً
    SELECT 
        tur.tenant_id,
        tur.role::text,
        COALESCE(tur.permissions, '{}'::jsonb) as permissions
    INTO tenant_record
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = current_user_id 
    AND tur.status = 'active'
    LIMIT 1;
    
    -- إذا لم نجد، نبحث في tenant_users
    IF NOT FOUND THEN
        SELECT 
            tu.tenant_id,
            tu.role::text,
            COALESCE(tu.permissions, '{}'::jsonb) as permissions
        INTO tenant_record
        FROM public.tenant_users tu
        WHERE tu.user_id = current_user_id 
        AND tu.status = 'active'
        LIMIT 1;
    END IF;
    
    IF FOUND THEN
        result := jsonb_build_object(
            'tenant_id', tenant_record.tenant_id,
            'role', tenant_record.role,
            'permissions', tenant_record.permissions,
            'is_authenticated', true
        );
    ELSE
        result := jsonb_build_object(
            'tenant_id', null,
            'role', null,
            'permissions', jsonb_build_object(),
            'is_authenticated', true
        );
    END IF;
    
    RETURN result;
END;
$function$

---

CREATE OR REPLACE FUNCTION public.log_transaction(transaction_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  transaction_amount NUMERIC;
  transaction_description TEXT;
  debit_account_id UUID;
  credit_account_id UUID;
BEGIN
  -- استخراج البيانات
  transaction_amount := (transaction_data->>'amount')::NUMERIC;
  transaction_description := transaction_data->>'description';
  debit_account_id := (transaction_data->>'debit_account_id')::UUID;
  credit_account_id := (transaction_data->>'credit_account_id')::UUID;
  
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
    transaction_description,
    COALESCE(transaction_data->>'reference_type', 'manual'),
    (transaction_data->>'reference_id')::UUID,
    transaction_amount,
    transaction_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- السطر المدين
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, debit_account_id, transaction_description, transaction_amount, 0, 1
  );
  
  -- السطر الدائن
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, credit_account_id, transaction_description, 0, transaction_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$

---

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    next_number integer;
    formatted_number text;
    current_year text;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- الحصول على آخر رقم قيد للمؤسسة في السنة الحالية
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ '^JE-' || current_year || '-[0-9]+$' 
            THEN (regexp_split_to_array(entry_number, '-'))[3]::integer
            ELSE 0
        END
    ), 0) + 1
    INTO next_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id
    AND EXTRACT(YEAR FROM entry_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- تنسيق الرقم
    formatted_number := 'JE-' || current_year || '-' || LPAD(next_number::text, 6, '0');
    
    RETURN formatted_number;
END;
$function$

---

CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    period_record RECORD;
    result jsonb;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المالية
    SELECT *
    INTO period_record
    FROM public.financial_periods fp
    WHERE fp.tenant_id = current_tenant_id
    AND check_date BETWEEN fp.start_date AND fp.end_date
    LIMIT 1;
    
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'exists', false,
            'can_modify', false,
            'message', 'لا توجد فترة مالية محددة لهذا التاريخ'
        );
    ELSE
        result := jsonb_build_object(
            'exists', true,
            'period_id', period_record.id,
            'period_name', period_record.period_name,
            'status', period_record.status,
            'can_modify', (period_record.status IN ('open', 'active')),
            'message', 
            CASE 
                WHEN period_record.status = 'closed' THEN 'الفترة المالية مقفلة ولا يمكن التعديل عليها'
                WHEN period_record.status IN ('open', 'active') THEN 'الفترة المالية مفتوحة ويمكن التعديل'
                ELSE 'حالة الفترة المالية: ' || period_record.status
            END
        );
    END IF;
    
    RETURN result;
END;
$function$

---

CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, activity_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    INSERT INTO public.user_activity_log (
        user_id,
        tenant_id,
        activity_type,
        activity_description,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        current_tenant_id,
        activity_type,
        activity_description,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent'
    );
END;
$function$

---

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
  SELECT id INTO receivables_account FROM public.chart_of_accounts WHERE account_code = '1121' AND tenant_id = get_current_tenant_id();
  SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '411' AND tenant_id = get_current_tenant_id();
  
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
$function$