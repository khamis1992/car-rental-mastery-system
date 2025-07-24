-- إصلاح الدفعة التالية من الدوال - إضافة SET search_path TO 'public'

-- 8. إصلاح دالة create_contract_accounting_entry
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
  current_tenant_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  -- استخراج البيانات
  contract_amount := (contract_data->>'total_amount')::NUMERIC;
  contract_reference := contract_data->>'contract_number';
  customer_name := contract_data->>'customer_name';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO receivables_account FROM public.chart_of_accounts 
  WHERE account_code = '1121' AND tenant_id = current_tenant_id LIMIT 1;
  
  SELECT id INTO revenue_account FROM public.chart_of_accounts 
  WHERE account_code = '411' AND tenant_id = current_tenant_id LIMIT 1;
  
  -- التحقق من وجود الحسابات
  IF receivables_account IS NULL OR revenue_account IS NULL THEN
    RAISE EXCEPTION 'لا يمكن العثور على الحسابات المطلوبة للمعاملة';
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
    CURRENT_DATE,
    'عقد إيجار - ' || customer_name || ' - ' || contract_reference,
    'contract',
    (contract_data->>'contract_id')::UUID,
    contract_amount,
    contract_amount,
    'posted',
    auth.uid(),
    current_tenant_id
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- الذمم المدينة (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, receivables_account, 'ذمم عميل - ' || customer_name, contract_amount, 0, 1, current_tenant_id
  );
  
  -- إيرادات الإيجار (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, revenue_account, 'إيرادات إيجار - ' || customer_name, 0, contract_amount, 2, current_tenant_id
  );
  
  -- تحديث أرصدة الحسابات
  PERFORM public.update_account_balances(journal_entry_id);
  
  RETURN journal_entry_id;
END;
$function$;

-- 9. إصلاح دالة create_attendance_accounting_entry
CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(attendance_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  attendance_cost NUMERIC;
  employee_name TEXT;
  
  -- معرفات الحسابات
  salary_expense_account UUID;
  accrued_salaries_account UUID;
  current_tenant_id UUID;
BEGIN
  current_tenant_id := public.get_current_tenant_id();
  
  -- استخراج البيانات
  attendance_cost := (attendance_data->>'cost_amount')::NUMERIC;
  employee_name := attendance_data->>'employee_name';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO salary_expense_account FROM public.chart_of_accounts 
  WHERE account_code = '5111' AND tenant_id = current_tenant_id LIMIT 1;
  
  SELECT id INTO accrued_salaries_account FROM public.chart_of_accounts 
  WHERE account_code = '21401' AND tenant_id = current_tenant_id LIMIT 1;
  
  -- التحقق من وجود الحسابات
  IF salary_expense_account IS NULL OR accrued_salaries_account IS NULL THEN
    RAISE EXCEPTION 'لا يمكن العثور على الحسابات المطلوبة للمعاملة';
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
    CURRENT_DATE,
    'مصروف حضور - ' || employee_name,
    'attendance',
    (attendance_data->>'attendance_id')::UUID,
    attendance_cost,
    attendance_cost,
    'posted',
    auth.uid(),
    current_tenant_id
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- مصروف الراتب (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, salary_expense_account, 'مصروف راتب - ' || employee_name, attendance_cost, 0, 1, current_tenant_id
  );
  
  -- مستحق الرواتب (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, accrued_salaries_account, 'مستحق راتب - ' || employee_name, 0, attendance_cost, 2, current_tenant_id
  );
  
  -- تحديث أرصدة الحسابات
  PERFORM public.update_account_balances(journal_entry_id);
  
  RETURN journal_entry_id;
END;
$function$;

-- 10. إصلاح دالة update_account_balances
CREATE OR REPLACE FUNCTION public.update_account_balances(journal_entry_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    entry_line RECORD;
    account_record RECORD;
    balance_change NUMERIC;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- معالجة كل سطر في القيد
    FOR entry_line IN 
        SELECT jel.account_id, jel.debit_amount, jel.credit_amount
        FROM public.journal_entry_lines jel
        INNER JOIN public.journal_entries je ON jel.journal_entry_id = je.id
        WHERE jel.journal_entry_id = journal_entry_id_param
        AND jel.tenant_id = current_tenant_id
    LOOP
        -- الحصول على نوع الحساب
        SELECT account_type INTO account_record
        FROM public.chart_of_accounts 
        WHERE id = entry_line.account_id 
        AND tenant_id = current_tenant_id;
        
        -- حساب التغيير في الرصيد حسب نوع الحساب
        IF account_record.account_type IN ('asset', 'expense') THEN
            -- الأصول والمصروفات: مدين موجب، دائن سالب
            balance_change := entry_line.debit_amount - entry_line.credit_amount;
        ELSE
            -- الالتزامات وحقوق الملكية والإيرادات: دائن موجب، مدين سالب
            balance_change := entry_line.credit_amount - entry_line.debit_amount;
        END IF;
        
        -- تحديث رصيد الحساب
        UPDATE public.chart_of_accounts 
        SET current_balance = current_balance + balance_change,
            updated_at = NOW()
        WHERE id = entry_line.account_id 
        AND tenant_id = current_tenant_id;
    END LOOP;
END;
$function$;

-- 11. إصلاح دالة check_period_status
CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record RECORD;
    result jsonb;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المالية
    SELECT * INTO period_record 
    FROM public.accounting_periods 
    WHERE tenant_id = current_tenant_id
    AND check_date BETWEEN start_date AND end_date
    LIMIT 1;
    
    -- إذا لم توجد فترة
    IF period_record IS NULL THEN
        result := jsonb_build_object(
            'period_exists', false,
            'can_modify', false,
            'message', 'لا توجد فترة محاسبية محددة لهذا التاريخ'
        );
    -- إذا كانت الفترة مقفلة
    ELSIF period_record.is_closed THEN
        result := jsonb_build_object(
            'period_exists', true,
            'period_id', period_record.id,
            'period_name', period_record.period_name,
            'can_modify', false,
            'message', 'الفترة المحاسبية مقفلة ولا يمكن التعديل عليها'
        );
    -- إذا كانت الفترة مفتوحة
    ELSE
        result := jsonb_build_object(
            'period_exists', true,
            'period_id', period_record.id,
            'period_name', period_record.period_name,
            'can_modify', true,
            'message', 'يمكن إجراء معاملات في هذه الفترة'
        );
    END IF;
    
    RETURN result;
END;
$function$;

-- 12. إصلاح دالة get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    current_user_id uuid;
    tenant_record RECORD;
    user_role_record RECORD;
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
    
    -- البحث عن بيانات المستخدم والمؤسسة
    SELECT 
        tu.tenant_id,
        tu.role,
        t.name as tenant_name,
        t.status as tenant_status
    INTO tenant_record
    FROM public.tenant_users tu
    INNER JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    AND t.status = 'active'
    LIMIT 1;
    
    -- إذا لم توجد بيانات مؤسسة
    IF tenant_record IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'user_id', current_user_id,
            'tenant_id', null,
            'role', null,
            'permissions', jsonb_build_object()
        );
    END IF;
    
    -- تحديد الصلاحيات حسب الدور
    user_context := jsonb_build_object(
        'authenticated', true,
        'user_id', current_user_id,
        'tenant_id', tenant_record.tenant_id,
        'tenant_name', tenant_record.tenant_name,
        'role', tenant_record.role,
        'permissions', CASE tenant_record.role
            WHEN 'super_admin' THEN jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            )
            WHEN 'tenant_admin' THEN jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            )
            WHEN 'manager' THEN jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            )
            WHEN 'accountant' THEN jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', false,
                'can_view_reports', true,
                'can_manage_contracts', false
            )
            ELSE jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false
            )
        END
    );
    
    RETURN user_context;
END;
$function$;

-- 13. إصلاح دالة get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    tenant_id uuid;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- البحث عن معرف المؤسسة للمستخدم الحالي
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    INNER JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    AND t.status = 'active'
    LIMIT 1;
    
    RETURN tenant_id;
END;
$function$;

-- 14. إصلاح دالة log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, activity_description text, additional_data jsonb DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    activity_id uuid;
    current_user_id uuid;
    current_tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    -- إدراج سجل النشاط
    INSERT INTO public.user_activity_logs (
        user_id,
        tenant_id,
        activity_type,
        activity_description,
        additional_data,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        current_user_id,
        current_tenant_id,
        activity_type,
        activity_description,
        additional_data,
        NULL, -- يمكن إضافة IP من التطبيق
        NULL, -- يمكن إضافة User Agent من التطبيق
        NOW()
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$function$;