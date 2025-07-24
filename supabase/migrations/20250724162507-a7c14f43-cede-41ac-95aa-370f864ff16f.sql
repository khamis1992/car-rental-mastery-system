-- حذف الدالة المتضاربة وإعادة إنشائها مع الدوال الأخرى
DROP FUNCTION IF EXISTS public.log_user_activity(text, text);

-- إصلاح الدوال التالية بإضافة SET search_path TO 'public'

-- 1. إعادة إنشاء دالة log_user_activity
CREATE OR REPLACE FUNCTION public.log_user_activity(activity_type text, description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    INSERT INTO public.user_activity_logs (
        user_id,
        tenant_id,
        activity_type,
        description,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        current_tenant_id,
        activity_type,
        description,
        current_setting('request.header.x-real-ip', true),
        current_setting('request.header.user-agent', true)
    );
END;
$function$;

-- 2. إصلاح دالة create_contract_accounting_entry
CREATE OR REPLACE FUNCTION public.create_contract_accounting_entry(contract_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    transaction_entry JSONB;
BEGIN
    -- تحضير بيانات المعاملة للعقد
    transaction_entry := jsonb_build_object(
        'amount', contract_data->>'monthly_amount',
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

-- 3. إصلاح دالة create_attendance_accounting_entry
CREATE OR REPLACE FUNCTION public.create_attendance_accounting_entry(attendance_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    transaction_entry JSONB;
    total_cost NUMERIC;
BEGIN
    -- حساب تكلفة الحضور بناءً على الساعات والراتب
    total_cost := (attendance_data->>'total_hours')::NUMERIC * (attendance_data->>'hourly_rate')::NUMERIC;
    
    -- تحضير بيانات المعاملة للحضور
    transaction_entry := jsonb_build_object(
        'amount', total_cost,
        'description', 'تكلفة حضور - ' || (attendance_data->>'employee_name') || ' - ' || (attendance_data->>'date'),
        'reference_type', 'attendance',
        'reference_id', attendance_data->>'attendance_id',
        'debit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '5111' AND tenant_id = get_current_tenant_id()),
        'credit_account_id', (SELECT id FROM chart_of_accounts WHERE account_code = '2111' AND tenant_id = get_current_tenant_id())
    );
    
    -- إنشاء القيد المحاسبي
    RETURN log_transaction(transaction_entry);
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
    entry_line RECORD;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- تحديث أرصدة الحسابات بناءً على سطور القيد
    FOR entry_line IN 
        SELECT jel.account_id, jel.debit_amount, jel.credit_amount, coa.account_type
        FROM journal_entry_lines jel
        INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
        WHERE jel.journal_entry_id = journal_entry_id_param
        AND jel.tenant_id = current_tenant_id
    LOOP
        -- تحديث الرصيد بناءً على نوع الحساب
        IF entry_line.account_type IN ('asset', 'expense') THEN
            -- الأصول والمصروفات: المدين يزيد والدائن ينقص
            UPDATE chart_of_accounts 
            SET current_balance = current_balance + entry_line.debit_amount - entry_line.credit_amount,
                updated_at = now()
            WHERE id = entry_line.account_id
            AND tenant_id = current_tenant_id;
        ELSE
            -- الالتزامات وحقوق الملكية والإيرادات: الدائن يزيد والمدين ينقص
            UPDATE chart_of_accounts 
            SET current_balance = current_balance + entry_line.credit_amount - entry_line.debit_amount,
                updated_at = now()
            WHERE id = entry_line.account_id
            AND tenant_id = current_tenant_id;
        END IF;
    END LOOP;
END;
$function$;

-- 5. إصلاح دالة calculate_profit_loss
CREATE OR REPLACE FUNCTION public.calculate_profit_loss(start_date date, end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    total_revenue numeric := 0;
    total_expenses numeric := 0;
    net_income numeric := 0;
    current_tenant_id uuid;
    result jsonb;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- حساب إجمالي الإيرادات
    SELECT COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) INTO total_revenue
    FROM journal_entry_lines jel
    INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
    WHERE coa.account_type = 'revenue'
    AND coa.tenant_id = current_tenant_id
    AND je.entry_date BETWEEN start_date AND end_date
    AND je.status = 'posted';
    
    -- حساب إجمالي المصروفات
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) INTO total_expenses
    FROM journal_entry_lines jel
    INNER JOIN chart_of_accounts coa ON jel.account_id = coa.id
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
    WHERE coa.account_type = 'expense'
    AND coa.tenant_id = current_tenant_id
    AND je.entry_date BETWEEN start_date AND end_date
    AND je.status = 'posted';
    
    net_income := total_revenue - total_expenses;
    
    result := jsonb_build_object(
        'total_revenue', total_revenue,
        'total_expenses', total_expenses,
        'net_income', net_income,
        'period_start', start_date,
        'period_end', end_date,
        'calculated_at', now()
    );
    
    RETURN result;
END;
$function$;

-- 6. إصلاح دالة get_balance_sheet_data
CREATE OR REPLACE FUNCTION public.get_balance_sheet_data(as_of_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    assets_data jsonb;
    liabilities_data jsonb;
    equity_data jsonb;
    total_assets numeric := 0;
    total_liabilities numeric := 0;
    total_equity numeric := 0;
    current_tenant_id uuid;
    result jsonb;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- جلب بيانات الأصول
    SELECT jsonb_agg(
        jsonb_build_object(
            'account_code', account_code,
            'account_name', account_name,
            'balance', current_balance,
            'account_type', account_type
        )
    ) INTO assets_data
    FROM chart_of_accounts
    WHERE tenant_id = current_tenant_id
    AND account_type = 'asset'
    AND is_active = true
    ORDER BY account_code;
    
    -- جلب بيانات الالتزامات
    SELECT jsonb_agg(
        jsonb_build_object(
            'account_code', account_code,
            'account_name', account_name,
            'balance', current_balance,
            'account_type', account_type
        )
    ) INTO liabilities_data
    FROM chart_of_accounts
    WHERE tenant_id = current_tenant_id
    AND account_type = 'liability'
    AND is_active = true
    ORDER BY account_code;
    
    -- جلب بيانات حقوق الملكية
    SELECT jsonb_agg(
        jsonb_build_object(
            'account_code', account_code,
            'account_name', account_name,
            'balance', current_balance,
            'account_type', account_type
        )
    ) INTO equity_data
    FROM chart_of_accounts
    WHERE tenant_id = current_tenant_id
    AND account_type = 'equity'
    AND is_active = true
    ORDER BY account_code;
    
    -- حساب الإجماليات
    SELECT COALESCE(SUM(current_balance), 0) INTO total_assets
    FROM chart_of_accounts
    WHERE tenant_id = current_tenant_id AND account_type = 'asset' AND is_active = true;
    
    SELECT COALESCE(SUM(current_balance), 0) INTO total_liabilities
    FROM chart_of_accounts
    WHERE tenant_id = current_tenant_id AND account_type = 'liability' AND is_active = true;
    
    SELECT COALESCE(SUM(current_balance), 0) INTO total_equity
    FROM chart_of_accounts
    WHERE tenant_id = current_tenant_id AND account_type = 'equity' AND is_active = true;
    
    result := jsonb_build_object(
        'as_of_date', as_of_date,
        'assets', COALESCE(assets_data, '[]'::jsonb),
        'liabilities', COALESCE(liabilities_data, '[]'::jsonb),
        'equity', COALESCE(equity_data, '[]'::jsonb),
        'total_assets', total_assets,
        'total_liabilities', total_liabilities,
        'total_equity', total_equity,
        'is_balanced', (total_assets = total_liabilities + total_equity)
    );
    
    RETURN result;
END;
$function$;