-- إصلاح المجموعة التالية من الدوال
-- إضافة SET search_path TO 'public' لحل تحذير Function Search Path Mutable

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
  SELECT id INTO receivables_account FROM public.chart_of_accounts WHERE account_code = '1121' AND tenant_id = public.get_current_tenant_id();
  SELECT id INTO revenue_account FROM public.chart_of_accounts WHERE account_code = '411' AND tenant_id = public.get_current_tenant_id();
  
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
    public.get_current_tenant_id()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- الذمم المدينة (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, receivables_account, 'ذمم عميل - ' || customer_name, contract_amount, 0, 1, public.get_current_tenant_id()
  );
  
  -- إيرادات الإيجار (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, revenue_account, 'إيرادات إيجار - ' || customer_name, 0, contract_amount, 2, public.get_current_tenant_id()
  );
  
  -- تحديث أرصدة الحسابات
  PERFORM public.update_account_balances(journal_entry_id);
  
  RETURN journal_entry_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(attendance_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  salary_cost NUMERIC;
  employee_name TEXT;
  
  -- معرفات الحسابات
  salary_expense_account UUID;
  cash_account UUID;
BEGIN
  -- استخراج البيانات
  salary_cost := (attendance_data->>'daily_cost')::NUMERIC;
  employee_name := attendance_data->>'employee_name';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO salary_expense_account FROM public.chart_of_accounts WHERE account_code = '5111' AND tenant_id = public.get_current_tenant_id();
  SELECT id INTO cash_account FROM public.chart_of_accounts WHERE account_code = '1111' AND tenant_id = public.get_current_tenant_id();
  
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
    'تكلفة حضور - ' || employee_name,
    'attendance',
    (attendance_data->>'attendance_id')::UUID,
    salary_cost,
    salary_cost,
    'posted',
    auth.uid(),
    public.get_current_tenant_id()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- مصروف الرواتب (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, salary_expense_account, 'تكلفة راتب - ' || employee_name, salary_cost, 0, 1, public.get_current_tenant_id()
  );
  
  -- النقدية (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number, tenant_id
  ) VALUES (
    journal_entry_id, cash_account, 'دفع راتب - ' || employee_name, 0, salary_cost, 2, public.get_current_tenant_id()
  );
  
  -- تحديث أرصدة الحسابات
  PERFORM public.update_account_balances(journal_entry_id);
  
  RETURN journal_entry_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_account_balances(journal_entry_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    entry_line RECORD;
    account_type_value TEXT;
    balance_change NUMERIC;
BEGIN
    -- تحديث أرصدة الحسابات بناءً على سطور القيد
    FOR entry_line IN 
        SELECT jel.account_id, jel.debit_amount, jel.credit_amount, coa.account_type
        FROM public.journal_entry_lines jel
        INNER JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
        WHERE jel.journal_entry_id = journal_entry_id_param
        AND jel.tenant_id = public.get_current_tenant_id()
    LOOP
        account_type_value := entry_line.account_type;
        
        -- حساب التغيير في الرصيد حسب نوع الحساب
        IF account_type_value IN ('asset', 'expense') THEN
            -- الأصول والمصروفات: مدين يزيد الرصيد، دائن ينقص الرصيد
            balance_change := entry_line.debit_amount - entry_line.credit_amount;
        ELSE
            -- الالتزامات وحقوق الملكية والإيرادات: دائن يزيد الرصيد، مدين ينقص الرصيد
            balance_change := entry_line.credit_amount - entry_line.debit_amount;
        END IF;
        
        -- تحديث الرصيد الحالي
        UPDATE public.chart_of_accounts 
        SET current_balance = current_balance + balance_change,
            updated_at = now()
        WHERE id = entry_line.account_id
        AND tenant_id = public.get_current_tenant_id();
    END LOOP;
END;
$function$;

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
    PERFORM public.complete_liabilities_equity_revenue_expenses(tenant_id_param);
    PERFORM public.add_specialized_rental_accounts(tenant_id_param);
    
    RETURN inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_id uuid;
    user_context jsonb := '{}'::jsonb;
    tenant_record RECORD;
    user_role TEXT;
    permissions jsonb := '{}'::jsonb;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', '{}'::jsonb
        );
    END IF;
    
    -- البحث في tenant_user_roles أولاً
    SELECT tu.tenant_id, tu.role::text INTO tenant_record
    FROM public.tenant_user_roles tu
    WHERE tu.user_id = user_id 
    AND tu.status = 'active'
    LIMIT 1;
    
    -- إذا لم نجد في tenant_user_roles، نبحث في tenant_users
    IF NOT FOUND THEN
        SELECT tu.tenant_id, tu.role::text INTO tenant_record
        FROM public.tenant_users tu
        WHERE tu.user_id = user_id 
        AND tu.status = 'active'
        LIMIT 1;
    END IF;
    
    IF FOUND THEN
        user_role := tenant_record.role;
        
        -- تحديد الصلاحيات حسب الدور
        CASE user_role
            WHEN 'super_admin' THEN
                permissions := jsonb_build_object(
                    'can_manage_users', true,
                    'can_manage_accounting', true,
                    'can_manage_vehicles', true,
                    'can_view_reports', true,
                    'can_manage_contracts', true,
                    'can_manage_tenants', true
                );
            WHEN 'tenant_admin' THEN
                permissions := jsonb_build_object(
                    'can_manage_users', true,
                    'can_manage_accounting', true,
                    'can_manage_vehicles', true,
                    'can_view_reports', true,
                    'can_manage_contracts', true,
                    'can_manage_tenants', false
                );
            WHEN 'manager' THEN
                permissions := jsonb_build_object(
                    'can_manage_users', false,
                    'can_manage_accounting', true,
                    'can_manage_vehicles', true,
                    'can_view_reports', true,
                    'can_manage_contracts', true,
                    'can_manage_tenants', false
                );
            WHEN 'user' THEN
                permissions := jsonb_build_object(
                    'can_manage_users', false,
                    'can_manage_accounting', false,
                    'can_manage_vehicles', false,
                    'can_view_reports', true,
                    'can_manage_contracts', false,
                    'can_manage_tenants', false
                );
            ELSE
                permissions := jsonb_build_object(
                    'can_manage_users', false,
                    'can_manage_accounting', false,
                    'can_manage_vehicles', false,
                    'can_view_reports', false,
                    'can_manage_contracts', false,
                    'can_manage_tenants', false
                );
        END CASE;
        
        user_context := jsonb_build_object(
            'authenticated', true,
            'user_id', user_id,
            'tenant_id', tenant_record.tenant_id,
            'role', user_role,
            'permissions', permissions
        );
    ELSE
        user_context := jsonb_build_object(
            'authenticated', true,
            'user_id', user_id,
            'tenant_id', null,
            'role', null,
            'permissions', '{}'::jsonb
        );
    END IF;
    
    RETURN user_context;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    tenant_id uuid;
    user_id uuid;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- البحث في tenant_user_roles أولاً
    SELECT tur.tenant_id INTO tenant_id
    FROM public.tenant_user_roles tur
    WHERE tur.user_id = user_id 
    AND tur.status = 'active'
    LIMIT 1;
    
    -- إذا لم نجد، نبحث في tenant_users
    IF tenant_id IS NULL THEN
        SELECT tu.tenant_id INTO tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = user_id 
        AND tu.status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$function$;