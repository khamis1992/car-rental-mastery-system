-- إصلاح 20 دالة أخرى لإضافة SET search_path TO 'public'

-- 1. إصلاح دالة log_transaction
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
  amount NUMERIC;
  description TEXT;
  
  line_counter INTEGER := 1;
  current_line JSONB;
BEGIN
  -- استخراج البيانات الأساسية
  amount := (transaction_data->>'amount')::NUMERIC;
  description := transaction_data->>'description';
  
  -- الحصول على معرفات الحسابات
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
    COALESCE((transaction_data->>'entry_date')::DATE, CURRENT_DATE),
    description,
    COALESCE(transaction_data->>'reference_type', 'manual'),
    (transaction_data->>'reference_id')::UUID,
    amount,
    amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطر الحساب المدين
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, debit_account_id, description, amount, 0, 1
  );
  
  -- إنشاء سطر الحساب الدائن
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, credit_account_id, description, 0, amount, 2
  );
  
  -- تحديث أرصدة الحسابات
  PERFORM public.update_account_balances(journal_entry_id);
  
  RETURN journal_entry_id;
END;
$function$;

-- 2. إصلاح دالة generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- الحصول على الرقم التسلسلي التالي
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ '^JE-[0-9]+$' 
            THEN CAST(SUBSTRING(entry_number FROM 4) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO next_number
    FROM public.journal_entries;
    
    -- تنسيق الرقم
    formatted_number := 'JE-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$function$;

-- 3. إصلاح دالة create_attendance_accounting_entry
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
  attendance_date DATE;
  
  -- معرفات الحسابات
  payroll_expense_account UUID;
  payroll_payable_account UUID;
BEGIN
  -- استخراج البيانات
  attendance_cost := (attendance_data->>'cost_amount')::NUMERIC;
  employee_name := attendance_data->>'employee_name';
  attendance_date := (attendance_data->>'attendance_date')::DATE;
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO payroll_expense_account FROM public.chart_of_accounts WHERE account_code = '5111';
  SELECT id INTO payroll_payable_account FROM public.chart_of_accounts WHERE account_code = '2112';
  
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
    attendance_date,
    'تكلفة حضور موظف - ' || employee_name,
    'attendance',
    (attendance_data->>'attendance_id')::UUID,
    attendance_cost,
    attendance_cost,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- مصروف الرواتب (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, payroll_expense_account, 'تكلفة حضور - ' || employee_name, attendance_cost, 0, 1
  );
  
  -- رواتب مستحقة الدفع (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, payroll_payable_account, 'راتب مستحق - ' || employee_name, 0, attendance_cost, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- 4. إصلاح دالة update_account_balances
CREATE OR REPLACE FUNCTION public.update_account_balances(journal_entry_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    line_record RECORD;
    account_type TEXT;
    new_balance NUMERIC;
BEGIN
    -- معالجة كل سطر في القيد
    FOR line_record IN 
        SELECT jel.account_id, jel.debit_amount, jel.credit_amount
        FROM public.journal_entry_lines jel
        WHERE jel.journal_entry_id = journal_entry_id_param
    LOOP
        -- الحصول على نوع الحساب
        SELECT coa.account_type INTO account_type
        FROM public.chart_of_accounts coa
        WHERE coa.id = line_record.account_id;
        
        -- تحديث الرصيد حسب نوع الحساب
        IF account_type IN ('asset', 'expense') THEN
            -- الأصول والمصروفات تزيد بالمدين وتنقص بالدائن
            UPDATE public.chart_of_accounts 
            SET current_balance = current_balance + line_record.debit_amount - line_record.credit_amount
            WHERE id = line_record.account_id;
        ELSE
            -- الالتزامات وحقوق الملكية والإيرادات تزيد بالدائن وتنقص بالمدين
            UPDATE public.chart_of_accounts 
            SET current_balance = current_balance + line_record.credit_amount - line_record.debit_amount
            WHERE id = line_record.account_id;
        END IF;
    END LOOP;
END;
$function$;

-- 5. إصلاح دالة check_period_status
CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id UUID;
    period_record RECORD;
    result JSONB;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المحاسبية التي تحتوي على التاريخ المحدد
    SELECT * INTO period_record
    FROM public.accounting_periods ap
    WHERE ap.tenant_id = current_tenant_id
    AND check_date BETWEEN ap.start_date AND ap.end_date
    LIMIT 1;
    
    -- إذا لم توجد فترة محاسبية
    IF period_record IS NULL THEN
        result := jsonb_build_object(
            'can_modify', false,
            'message', 'لا توجد فترة محاسبية محددة لهذا التاريخ',
            'period_status', 'not_found'
        );
        RETURN result;
    END IF;
    
    -- فحص حالة الفترة
    CASE period_record.status
        WHEN 'open' THEN
            result := jsonb_build_object(
                'can_modify', true,
                'message', 'الفترة مفتوحة للتعديل',
                'period_status', 'open',
                'period_id', period_record.id
            );
        WHEN 'closed' THEN
            result := jsonb_build_object(
                'can_modify', false,
                'message', 'الفترة مقفلة ولا يمكن التعديل',
                'period_status', 'closed',
                'period_id', period_record.id
            );
        WHEN 'locked' THEN
            result := jsonb_build_object(
                'can_modify', false,
                'message', 'الفترة مقفلة نهائياً',
                'period_status', 'locked',
                'period_id', period_record.id
            );
        ELSE
            result := jsonb_build_object(
                'can_modify', false,
                'message', 'حالة الفترة غير معروفة',
                'period_status', 'unknown',
                'period_id', period_record.id
            );
    END CASE;
    
    RETURN result;
END;
$function$;

-- 6. إصلاح دالة get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    current_user_id uuid;
    tenant_info record;
    user_role text;
    permissions jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'غير مسجل الدخول');
    END IF;
    
    -- جلب معلومات المؤسسة والدور
    SELECT t.id as tenant_id, t.name as tenant_name, tu.role
    INTO tenant_info
    FROM public.tenant_users tu
    JOIN public.tenants t ON tu.tenant_id = t.id
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    AND t.status = 'active'
    LIMIT 1;
    
    IF tenant_info IS NULL THEN
        RETURN jsonb_build_object('error', 'لا توجد مؤسسة نشطة للمستخدم');
    END IF;
    
    user_role := tenant_info.role;
    
    -- تحديد الصلاحيات حسب الدور
    CASE user_role
        WHEN 'super_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        WHEN 'tenant_admin' THEN
            permissions := jsonb_build_object(
                'can_manage_users', true,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        WHEN 'manager' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', true,
                'can_view_reports', true,
                'can_manage_contracts', true
            );
        WHEN 'accountant' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', true,
                'can_manage_vehicles', false,
                'can_view_reports', true,
                'can_manage_contracts', false
            );
        WHEN 'user' THEN
            permissions := jsonb_build_object(
                'can_manage_users', false,
                'can_manage_accounting', false,
                'can_manage_vehicles', false,
                'can_view_reports', false,
                'can_manage_contracts', false
            );
        ELSE
            permissions := jsonb_build_object();
    END CASE;
    
    user_context := jsonb_build_object(
        'user_id', current_user_id,
        'tenant_id', tenant_info.tenant_id,
        'tenant_name', tenant_info.tenant_name,
        'role', user_role,
        'permissions', permissions
    );
    
    RETURN user_context;
END;
$function$;

-- 7. إصلاح دالة get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    tenant_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- البحث في جدول tenant_users أولاً
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    LIMIT 1;
    
    RETURN tenant_id;
END;
$function$;

-- 8. إصلاح دالة log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, activity_description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_tenant_id := public.get_current_tenant_id();
    
    -- تسجيل النشاط
    INSERT INTO public.user_activity_log (
        user_id,
        tenant_id,
        activity_type,
        activity_description,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        current_user_id,
        current_tenant_id,
        activity_type,
        activity_description,
        NULL, -- يمكن إضافة منطق للحصول على IP
        NULL, -- يمكن إضافة منطق للحصول على User Agent
        now()
    );
END;
$function$;

-- 9. إصلاح دالة copy_default_chart_of_accounts
CREATE OR REPLACE FUNCTION public.copy_default_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- نسخ دليل الحسابات الافتراضي للمؤسسة الجديدة
    INSERT INTO public.chart_of_accounts (
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
    )
    SELECT 
        tenant_id_param,
        account_code,
        account_name,
        account_name_en,
        account_type,
        account_category,
        NULL, -- سيتم تحديثه لاحقاً
        level,
        allow_posting,
        is_active,
        0, -- رصيد افتتاحي صفر
        0  -- رصيد حالي صفر
    FROM public.chart_of_accounts
    WHERE tenant_id = (SELECT id FROM public.tenants WHERE name = 'Default Organization' LIMIT 1);
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$function$;

-- 10. إصلاح دالة handle_tenant_creation
CREATE OR REPLACE FUNCTION public.handle_tenant_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- تطبيق البيانات الافتراضية عند إنشاء مؤسسة جديدة
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- إنشاء دليل الحسابات
        PERFORM public.setup_comprehensive_chart_of_accounts(NEW.id);
        
        -- نسخ مراكز التكلفة الافتراضية
        PERFORM public.copy_default_cost_centers(NEW.id);
        
        -- نسخ العلامة التجارية الافتراضية
        PERFORM public.copy_default_company_branding(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 11. إصلاح دالة validate_journal_entry
CREATE OR REPLACE FUNCTION public.validate_journal_entry(entry_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    entry_record RECORD;
    total_debits NUMERIC := 0;
    total_credits NUMERIC := 0;
    line_count INTEGER := 0;
    validation_result JSONB;
    errors TEXT[] := '{}';
BEGIN
    -- جلب معلومات القيد
    SELECT * INTO entry_record
    FROM public.journal_entries
    WHERE id = entry_id;
    
    IF entry_record IS NULL THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'errors', ARRAY['القيد غير موجود']
        );
    END IF;
    
    -- حساب إجماليات المدين والدائن
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0),
        COUNT(*)
    INTO total_debits, total_credits, line_count
    FROM public.journal_entry_lines
    WHERE journal_entry_id = entry_id;
    
    -- فحص التوازن
    IF total_debits != total_credits THEN
        errors := array_append(errors, 'القيد غير متوازن: المدين = ' || total_debits || ', الدائن = ' || total_credits);
    END IF;
    
    -- فحص وجود سطور
    IF line_count < 2 THEN
        errors := array_append(errors, 'القيد يجب أن يحتوي على سطرين على الأقل');
    END IF;
    
    -- فحص أن المبلغ الإجمالي يطابق سطور القيد
    IF entry_record.total_debit != total_debits THEN
        errors := array_append(errors, 'إجمالي المدين في رأس القيد لا يطابق مجموع السطور');
    END IF;
    
    IF entry_record.total_credit != total_credits THEN
        errors := array_append(errors, 'إجمالي الدائن في رأس القيد لا يطابق مجموع السطور');
    END IF;
    
    validation_result := jsonb_build_object(
        'is_valid', array_length(errors, 1) IS NULL,
        'errors', errors,
        'total_debits', total_debits,
        'total_credits', total_credits,
        'line_count', line_count
    );
    
    RETURN validation_result;
END;
$function$;

-- 12. إصلاح دالة create_expense_accounting_entry
CREATE OR REPLACE FUNCTION public.create_expense_accounting_entry(expense_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  expense_amount NUMERIC;
  expense_description TEXT;
  expense_type TEXT;
  
  -- معرفات الحسابات
  expense_account UUID;
  cash_account UUID;
BEGIN
  -- استخراج البيانات
  expense_amount := (expense_data->>'amount')::NUMERIC;
  expense_description := expense_data->>'description';
  expense_type := expense_data->>'expense_type';
  
  -- تحديد الحساب حسب نوع المصروف
  CASE expense_type
    WHEN 'maintenance' THEN
      SELECT id INTO expense_account FROM public.chart_of_accounts WHERE account_code = '512';
    WHEN 'fuel' THEN
      SELECT id INTO expense_account FROM public.chart_of_accounts WHERE account_code = '513';
    WHEN 'salary' THEN
      SELECT id INTO expense_account FROM public.chart_of_accounts WHERE account_code = '5111';
    ELSE
      SELECT id INTO expense_account FROM public.chart_of_accounts WHERE account_code = '51501';
  END CASE;
  
  -- حساب النقدية
  SELECT id INTO cash_account FROM public.chart_of_accounts WHERE account_code = '1111';
  
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
    'مصروف - ' || expense_description,
    'expense',
    (expense_data->>'expense_id')::UUID,
    expense_amount,
    expense_amount,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- المصروف (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, expense_account, expense_description, expense_amount, 0, 1
  );
  
  -- النقدية (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, cash_account, 'دفع مصروف - ' || expense_description, 0, expense_amount, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- 13. إصلاح دالة get_employee_attendance_summary
CREATE OR REPLACE FUNCTION public.get_employee_attendance_summary(employee_id_param uuid, start_date_param date, end_date_param date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    attendance_summary JSONB;
    total_days INTEGER;
    present_days INTEGER;
    absent_days INTEGER;
    late_days INTEGER;
    overtime_hours NUMERIC;
    total_hours NUMERIC;
BEGIN
    -- حساب إجمالي الأيام في الفترة
    total_days := (end_date_param - start_date_param) + 1;
    
    -- حساب أيام الحضور
    SELECT COUNT(*) INTO present_days
    FROM public.attendance
    WHERE employee_id = employee_id_param
    AND date BETWEEN start_date_param AND end_date_param
    AND status = 'present';
    
    -- حساب أيام الغياب
    SELECT COUNT(*) INTO absent_days
    FROM public.attendance
    WHERE employee_id = employee_id_param
    AND date BETWEEN start_date_param AND end_date_param
    AND status = 'absent';
    
    -- حساب أيام التأخير
    SELECT COUNT(*) INTO late_days
    FROM public.attendance
    WHERE employee_id = employee_id_param
    AND date BETWEEN start_date_param AND end_date_param
    AND status = 'late';
    
    -- حساب ساعات العمل الإضافي
    SELECT COALESCE(SUM(overtime_hours), 0) INTO overtime_hours
    FROM public.attendance
    WHERE employee_id = employee_id_param
    AND date BETWEEN start_date_param AND end_date_param;
    
    -- حساب إجمالي ساعات العمل
    SELECT COALESCE(SUM(total_hours), 0) INTO total_hours
    FROM public.attendance
    WHERE employee_id = employee_id_param
    AND date BETWEEN start_date_param AND end_date_param;
    
    attendance_summary := jsonb_build_object(
        'employee_id', employee_id_param,
        'period_start', start_date_param,
        'period_end', end_date_param,
        'total_days', total_days,
        'present_days', present_days,
        'absent_days', absent_days,
        'late_days', late_days,
        'overtime_hours', overtime_hours,
        'total_hours', total_hours,
        'attendance_rate', CASE WHEN total_days > 0 THEN (present_days::NUMERIC / total_days * 100) ELSE 0 END
    );
    
    RETURN attendance_summary;
END;
$function$;

-- 14. إصلاح دالة validate_accounting_period
CREATE OR REPLACE FUNCTION public.validate_accounting_period(period_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record RECORD;
    validation_result JSONB;
    errors TEXT[] := '{}';
    entry_count INTEGER;
    unbalanced_entries INTEGER;
BEGIN
    -- جلب معلومات الفترة
    SELECT * INTO period_record
    FROM public.accounting_periods
    WHERE id = period_id;
    
    IF period_record IS NULL THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'errors', ARRAY['الفترة المحاسبية غير موجودة']
        );
    END IF;
    
    -- فحص القيود في الفترة
    SELECT COUNT(*) INTO entry_count
    FROM public.journal_entries
    WHERE entry_date BETWEEN period_record.start_date AND period_record.end_date
    AND tenant_id = period_record.tenant_id;
    
    -- فحص القيود غير المتوازنة
    SELECT COUNT(*) INTO unbalanced_entries
    FROM public.journal_entries je
    WHERE je.entry_date BETWEEN period_record.start_date AND period_record.end_date
    AND je.tenant_id = period_record.tenant_id
    AND je.total_debit != je.total_credit;
    
    IF unbalanced_entries > 0 THEN
        errors := array_append(errors, 'توجد ' || unbalanced_entries || ' قيود غير متوازنة في الفترة');
    END IF;
    
    -- فحص التواريخ
    IF period_record.start_date >= period_record.end_date THEN
        errors := array_append(errors, 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
    END IF;
    
    validation_result := jsonb_build_object(
        'is_valid', array_length(errors, 1) IS NULL,
        'errors', errors,
        'period_id', period_id,
        'entry_count', entry_count,
        'unbalanced_entries', unbalanced_entries,
        'period_status', period_record.status
    );
    
    RETURN validation_result;
END;
$function$;

-- 15. إصلاح دالة get_contract_financial_summary
CREATE OR REPLACE FUNCTION public.get_contract_financial_summary(contract_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    contract_summary JSONB;
    contract_info RECORD;
    total_invoiced NUMERIC := 0;
    total_paid NUMERIC := 0;
    outstanding_amount NUMERIC := 0;
    invoice_count INTEGER := 0;
    payment_count INTEGER := 0;
BEGIN
    -- جلب معلومات العقد
    SELECT * INTO contract_info
    FROM public.contracts
    WHERE id = contract_id_param;
    
    IF contract_info IS NULL THEN
        RETURN jsonb_build_object('error', 'العقد غير موجود');
    END IF;
    
    -- حساب إجمالي الفواتير
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COUNT(*)
    INTO total_invoiced, invoice_count
    FROM public.invoices
    WHERE contract_id = contract_id_param;
    
    -- حساب إجمالي المدفوعات
    SELECT 
        COALESCE(SUM(p.amount), 0),
        COUNT(*)
    INTO total_paid, payment_count
    FROM public.payments p
    JOIN public.invoices i ON p.invoice_id = i.id
    WHERE i.contract_id = contract_id_param
    AND p.status = 'completed';
    
    -- حساب المبلغ المستحق
    outstanding_amount := total_invoiced - total_paid;
    
    contract_summary := jsonb_build_object(
        'contract_id', contract_id_param,
        'contract_number', contract_info.contract_number,
        'customer_name', contract_info.customer_name,
        'contract_amount', contract_info.total_amount,
        'total_invoiced', total_invoiced,
        'total_paid', total_paid,
        'outstanding_amount', outstanding_amount,
        'invoice_count', invoice_count,
        'payment_count', payment_count,
        'payment_percentage', CASE WHEN total_invoiced > 0 THEN (total_paid / total_invoiced * 100) ELSE 0 END,
        'contract_status', contract_info.status
    );
    
    RETURN contract_summary;
END;
$function$;

-- 16. إصلاح دالة calculate_vehicle_depreciation
CREATE OR REPLACE FUNCTION public.calculate_vehicle_depreciation(vehicle_id_param uuid, calculation_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    vehicle_info RECORD;
    depreciation_result JSONB;
    months_used INTEGER;
    annual_depreciation NUMERIC;
    monthly_depreciation NUMERIC;
    accumulated_depreciation NUMERIC;
    book_value NUMERIC;
BEGIN
    -- جلب معلومات المركبة
    SELECT * INTO vehicle_info
    FROM public.vehicles
    WHERE id = vehicle_id_param;
    
    IF vehicle_info IS NULL THEN
        RETURN jsonb_build_object('error', 'المركبة غير موجودة');
    END IF;
    
    -- حساب عدد الأشهر منذ الشراء
    months_used := EXTRACT(YEAR FROM AGE(calculation_date, vehicle_info.purchase_date)) * 12 +
                   EXTRACT(MONTH FROM AGE(calculation_date, vehicle_info.purchase_date));
    
    -- حساب الإهلاك السنوي والشهري
    annual_depreciation := (vehicle_info.purchase_price * COALESCE(vehicle_info.depreciation_rate, 20) / 100);
    monthly_depreciation := annual_depreciation / 12;
    
    -- حساب الإهلاك المتراكم
    accumulated_depreciation := monthly_depreciation * months_used;
    
    -- التأكد من أن الإهلاك المتراكم لا يتجاوز قيمة الشراء
    IF accumulated_depreciation > vehicle_info.purchase_price THEN
        accumulated_depreciation := vehicle_info.purchase_price;
    END IF;
    
    -- حساب القيمة الدفترية
    book_value := vehicle_info.purchase_price - accumulated_depreciation;
    
    depreciation_result := jsonb_build_object(
        'vehicle_id', vehicle_id_param,
        'calculation_date', calculation_date,
        'purchase_price', vehicle_info.purchase_price,
        'purchase_date', vehicle_info.purchase_date,
        'depreciation_rate', COALESCE(vehicle_info.depreciation_rate, 20),
        'months_used', months_used,
        'annual_depreciation', annual_depreciation,
        'monthly_depreciation', monthly_depreciation,
        'accumulated_depreciation', accumulated_depreciation,
        'book_value', book_value
    );
    
    RETURN depreciation_result;
END;
$function$;

-- 17. إصلاح دالة get_account_hierarchy
CREATE OR REPLACE FUNCTION public.get_account_hierarchy(tenant_id_param uuid)
 RETURNS TABLE(id uuid, account_code text, account_name text, account_type text, level integer, parent_account_id uuid, current_balance numeric, has_children boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH RECURSIVE account_tree AS (
        -- الحسابات الجذر (المستوى الأول)
        SELECT 
            coa.id,
            coa.account_code,
            coa.account_name,
            coa.account_type,
            coa.level,
            coa.parent_account_id,
            coa.current_balance,
            EXISTS(
                SELECT 1 FROM public.chart_of_accounts child 
                WHERE child.parent_account_id = coa.id 
                AND child.tenant_id = tenant_id_param
            ) as has_children
        FROM public.chart_of_accounts coa
        WHERE coa.tenant_id = tenant_id_param
        AND coa.parent_account_id IS NULL
        AND coa.is_active = true
        
        UNION ALL
        
        -- الحسابات الفرعية
        SELECT 
            coa.id,
            coa.account_code,
            coa.account_name,
            coa.account_type,
            coa.level,
            coa.parent_account_id,
            coa.current_balance,
            EXISTS(
                SELECT 1 FROM public.chart_of_accounts child 
                WHERE child.parent_account_id = coa.id 
                AND child.tenant_id = tenant_id_param
            ) as has_children
        FROM public.chart_of_accounts coa
        INNER JOIN account_tree at ON coa.parent_account_id = at.id
        WHERE coa.tenant_id = tenant_id_param
        AND coa.is_active = true
    )
    SELECT 
        at.id,
        at.account_code,
        at.account_name,
        at.account_type,
        at.level,
        at.parent_account_id,
        at.current_balance,
        at.has_children
    FROM account_tree at
    ORDER BY at.account_code;
END;
$function$;

-- 18. إصلاح دالة create_budget_variance_report
CREATE OR REPLACE FUNCTION public.create_budget_variance_report(budget_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    budget_info RECORD;
    variance_report JSONB;
    budget_items JSONB[] := '{}';
    item_record RECORD;
    total_budget NUMERIC := 0;
    total_actual NUMERIC := 0;
    total_variance NUMERIC := 0;
BEGIN
    -- جلب معلومات الميزانية
    SELECT * INTO budget_info
    FROM public.budgets
    WHERE id = budget_id_param;
    
    IF budget_info IS NULL THEN
        RETURN jsonb_build_object('error', 'الميزانية غير موجودة');
    END IF;
    
    -- جلب بنود الميزانية مع حساب التباين
    FOR item_record IN 
        SELECT 
            bi.*,
            coa.account_name,
            coa.account_code,
            (bi.actual_amount - bi.budgeted_amount) as variance_amount,
            CASE 
                WHEN bi.budgeted_amount != 0 THEN ((bi.actual_amount - bi.budgeted_amount) / bi.budgeted_amount * 100)
                ELSE 0 
            END as variance_percentage
        FROM public.budget_items bi
        JOIN public.chart_of_accounts coa ON bi.account_id = coa.id
        WHERE bi.budget_id = budget_id_param
        ORDER BY coa.account_code
    LOOP
        budget_items := budget_items || jsonb_build_object(
            'account_code', item_record.account_code,
            'account_name', item_record.account_name,
            'budgeted_amount', item_record.budgeted_amount,
            'actual_amount', item_record.actual_amount,
            'variance_amount', item_record.variance_amount,
            'variance_percentage', item_record.variance_percentage,
            'item_type', item_record.item_type
        );
        
        total_budget := total_budget + item_record.budgeted_amount;
        total_actual := total_actual + item_record.actual_amount;
    END LOOP;
    
    total_variance := total_actual - total_budget;
    
    variance_report := jsonb_build_object(
        'budget_id', budget_id_param,
        'budget_name', budget_info.budget_name,
        'budget_year', budget_info.budget_year,
        'report_date', CURRENT_DATE,
        'total_budget', total_budget,
        'total_actual', total_actual,
        'total_variance', total_variance,
        'variance_percentage', CASE WHEN total_budget != 0 THEN (total_variance / total_budget * 100) ELSE 0 END,
        'budget_items', budget_items
    );
    
    RETURN variance_report;
END;
$function$;

-- 19. إصلاح دالة get_monthly_revenue_report
CREATE OR REPLACE FUNCTION public.get_monthly_revenue_report(tenant_id_param uuid, report_year integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    revenue_report JSONB;
    monthly_data JSONB[] := '{}';
    month_record RECORD;
    total_year_revenue NUMERIC := 0;
BEGIN
    -- جلب البيانات الشهرية للإيرادات
    FOR month_record IN 
        SELECT 
            EXTRACT(MONTH FROM je.entry_date) as month_number,
            TO_CHAR(je.entry_date, 'Month') as month_name,
            SUM(jel.credit_amount) as revenue_amount
        FROM public.journal_entries je
        JOIN public.journal_entry_lines jel ON je.id = jel.journal_entry_id
        JOIN public.chart_of_accounts coa ON jel.account_id = coa.id
        WHERE je.tenant_id = tenant_id_param
        AND EXTRACT(YEAR FROM je.entry_date) = report_year
        AND coa.account_type = 'revenue'
        AND je.status = 'posted'
        GROUP BY EXTRACT(MONTH FROM je.entry_date), TO_CHAR(je.entry_date, 'Month')
        ORDER BY EXTRACT(MONTH FROM je.entry_date)
    LOOP
        monthly_data := monthly_data || jsonb_build_object(
            'month_number', month_record.month_number,
            'month_name', TRIM(month_record.month_name),
            'revenue_amount', month_record.revenue_amount
        );
        
        total_year_revenue := total_year_revenue + month_record.revenue_amount;
    END LOOP;
    
    -- إضافة الأشهر المفقودة بقيم صفر
    FOR i IN 1..12 LOOP
        IF NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(monthly_data) as item 
            WHERE (item->>'month_number')::INTEGER = i
        ) THEN
            monthly_data := monthly_data || jsonb_build_object(
                'month_number', i,
                'month_name', TO_CHAR(make_date(report_year, i, 1), 'Month'),
                'revenue_amount', 0
            );
        END IF;
    END LOOP;
    
    -- ترتيب البيانات حسب رقم الشهر
    SELECT array_agg(item ORDER BY (item->>'month_number')::INTEGER) INTO monthly_data
    FROM jsonb_array_elements(monthly_data) as item;
    
    revenue_report := jsonb_build_object(
        'report_year', report_year,
        'tenant_id', tenant_id_param,
        'total_year_revenue', total_year_revenue,
        'average_monthly_revenue', total_year_revenue / 12,
        'monthly_data', monthly_data,
        'generated_at', CURRENT_TIMESTAMP
    );
    
    RETURN revenue_report;
END;
$function$;

-- 20. إصلاح دالة validate_tenant_data_integrity
CREATE OR REPLACE FUNCTION public.validate_tenant_data_integrity(tenant_id_param uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    validation_result JSONB;
    errors TEXT[] := '{}';
    warnings TEXT[] := '{}';
    orphaned_records INTEGER;
    unbalanced_entries INTEGER;
    missing_accounts INTEGER;
BEGIN
    -- فحص الحسابات اليتيمة (بدون مؤسسة)
    SELECT COUNT(*) INTO orphaned_records
    FROM public.chart_of_accounts
    WHERE tenant_id = tenant_id_param
    AND NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id_param);
    
    IF orphaned_records > 0 THEN
        errors := array_append(errors, 'توجد ' || orphaned_records || ' حسابات يتيمة');
    END IF;
    
    -- فحص القيود غير المتوازنة
    SELECT COUNT(*) INTO unbalanced_entries
    FROM public.journal_entries
    WHERE tenant_id = tenant_id_param
    AND total_debit != total_credit;
    
    IF unbalanced_entries > 0 THEN
        errors := array_append(errors, 'توجد ' || unbalanced_entries || ' قيود غير متوازنة');
    END IF;
    
    -- فحص الحسابات المفقودة الأساسية
    SELECT COUNT(*) INTO missing_accounts
    FROM (VALUES ('1111'), ('1121'), ('411'), ('5111')) AS required_accounts(code)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.chart_of_accounts 
        WHERE tenant_id = tenant_id_param AND account_code = required_accounts.code
    );
    
    IF missing_accounts > 0 THEN
        warnings := array_append(warnings, 'تفتقد ' || missing_accounts || ' حسابات أساسية');
    END IF;
    
    -- فحص العقود بدون فواتير
    SELECT COUNT(*) INTO orphaned_records
    FROM public.contracts
    WHERE tenant_id = tenant_id_param
    AND status = 'active'
    AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE contract_id = contracts.id);
    
    IF orphaned_records > 0 THEN
        warnings := array_append(warnings, 'توجد ' || orphaned_records || ' عقود نشطة بدون فواتير');
    END IF;
    
    validation_result := jsonb_build_object(
        'tenant_id', tenant_id_param,
        'validation_date', CURRENT_TIMESTAMP,
        'is_valid', array_length(errors, 1) IS NULL,
        'has_warnings', array_length(warnings, 1) IS NOT NULL,
        'errors', errors,
        'warnings', warnings,
        'summary', jsonb_build_object(
            'total_errors', COALESCE(array_length(errors, 1), 0),
            'total_warnings', COALESCE(array_length(warnings, 1), 0)
        )
    );
    
    RETURN validation_result;
END;
$function$;