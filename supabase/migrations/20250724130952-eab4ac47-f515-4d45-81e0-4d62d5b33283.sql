-- إكمال إصلاح المجموعة التالية من الدوال

-- إصلاح دالة process_batch_entries
CREATE OR REPLACE FUNCTION public.process_batch_entries(entries_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    batch_id UUID;
    entry_data jsonb;
    result_entries jsonb[] := '{}';
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    total_count INTEGER;
    entry_result jsonb;
BEGIN
    -- إنشاء معرف للدفعة
    batch_id := gen_random_uuid();
    total_count := jsonb_array_length(entries_data);
    
    -- معالجة كل قيد في الدفعة
    FOR entry_data IN SELECT * FROM jsonb_array_elements(entries_data)
    LOOP
        BEGIN
            -- إنشاء القيد المحاسبي
            PERFORM public.create_contract_accounting_entry(entry_data);
            
            entry_result := jsonb_build_object(
                'success', true,
                'entry_data', entry_data,
                'message', 'تم إنشاء القيد بنجاح'
            );
            success_count := success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            entry_result := jsonb_build_object(
                'success', false,
                'entry_data', entry_data,
                'error', SQLERRM
            );
            error_count := error_count + 1;
        END;
        
        result_entries := result_entries || entry_result;
    END LOOP;
    
    RETURN jsonb_build_object(
        'batch_id', batch_id,
        'total_count', total_count,
        'success_count', success_count,
        'error_count', error_count,
        'entries', result_entries
    );
END;
$function$;

-- إصلاح دالة security_audit_report
CREATE OR REPLACE FUNCTION public.security_audit_report()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    rls_enabled_tables INTEGER := 0;
    rls_disabled_tables INTEGER := 0;
    total_tables INTEGER := 0;
    security_functions_count INTEGER := 0;
    multi_tenant_setup BOOLEAN := false;
BEGIN
    -- عد الجداول المفعل عليها RLS
    SELECT COUNT(*) INTO rls_enabled_tables
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;
    
    -- عد إجمالي الجداول في public
    SELECT COUNT(*) INTO total_tables
    FROM pg_tables 
    WHERE schemaname = 'public';
    
    rls_disabled_tables := total_tables - rls_enabled_tables;
    
    -- عد الدوال الأمنية المهمة
    SELECT COUNT(*) INTO security_functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'get_current_tenant_id',
        'has_role',
        'has_any_tenant_role',
        'secure_tenant_operation'
    );
    
    -- فحص إعداد Multi-tenancy
    SELECT EXISTS(
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('tenants', 'tenant_users')
    ) INTO multi_tenant_setup;
    
    result := jsonb_build_object(
        'security_summary', jsonb_build_object(
            'total_tables', total_tables,
            'rls_enabled_tables', rls_enabled_tables,
            'rls_disabled_tables', rls_disabled_tables,
            'rls_coverage_percentage', 
                CASE WHEN total_tables > 0 
                THEN (rls_enabled_tables::DECIMAL / total_tables * 100)::INTEGER 
                ELSE 0 END,
            'security_functions_found', security_functions_count,
            'multi_tenant_setup', multi_tenant_setup
        ),
        'recommendations', ARRAY[
            CASE WHEN rls_disabled_tables > 0 
            THEN 'يوجد ' || rls_disabled_tables || ' جدول بدون RLS - يُنصح بتفعيله'
            ELSE 'جميع الجداول محمية بـ RLS' END,
            
            CASE WHEN security_functions_count < 4
            THEN 'بعض الدوال الأمنية مفقودة - تحقق من الإعداد'
            ELSE 'الدوال الأمنية الأساسية موجودة' END,
            
            CASE WHEN NOT multi_tenant_setup
            THEN 'إعداد Multi-tenancy غير مكتمل'
            ELSE 'إعداد Multi-tenancy مكتمل' END
        ],
        'audit_timestamp', now()
    );
    
    RETURN result;
END;
$function$;

-- إصلاح دالة get_financial_report
CREATE OR REPLACE FUNCTION public.get_financial_report(tenant_id_param uuid, report_type text, start_date date, end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    assets_data jsonb;
    liabilities_data jsonb;
    equity_data jsonb;
    revenue_data jsonb;
    expenses_data jsonb;
BEGIN
    CASE report_type
        WHEN 'balance_sheet' THEN
            -- جلب بيانات الأصول
            SELECT jsonb_agg(
                jsonb_build_object(
                    'account_code', account_code,
                    'account_name', account_name,
                    'balance', current_balance
                )
            ) INTO assets_data
            FROM public.chart_of_accounts
            WHERE tenant_id = tenant_id_param
            AND account_type = 'asset'
            AND is_active = true
            ORDER BY account_code;
            
            -- جلب بيانات الالتزامات
            SELECT jsonb_agg(
                jsonb_build_object(
                    'account_code', account_code,
                    'account_name', account_name,
                    'balance', current_balance
                )
            ) INTO liabilities_data
            FROM public.chart_of_accounts
            WHERE tenant_id = tenant_id_param
            AND account_type = 'liability'
            AND is_active = true
            ORDER BY account_code;
            
            -- جلب بيانات حقوق الملكية
            SELECT jsonb_agg(
                jsonb_build_object(
                    'account_code', account_code,
                    'account_name', account_name,
                    'balance', current_balance
                )
            ) INTO equity_data
            FROM public.chart_of_accounts
            WHERE tenant_id = tenant_id_param
            AND account_type = 'equity'
            AND is_active = true
            ORDER BY account_code;
            
            result := jsonb_build_object(
                'report_type', 'balance_sheet',
                'assets', COALESCE(assets_data, '[]'::jsonb),
                'liabilities', COALESCE(liabilities_data, '[]'::jsonb),
                'equity', COALESCE(equity_data, '[]'::jsonb),
                'generated_at', now()
            );
            
        WHEN 'income_statement' THEN
            -- جلب بيانات الإيرادات
            SELECT jsonb_agg(
                jsonb_build_object(
                    'account_code', account_code,
                    'account_name', account_name,
                    'balance', current_balance
                )
            ) INTO revenue_data
            FROM public.chart_of_accounts
            WHERE tenant_id = tenant_id_param
            AND account_type = 'revenue'
            AND is_active = true
            ORDER BY account_code;
            
            -- جلب بيانات المصروفات
            SELECT jsonb_agg(
                jsonb_build_object(
                    'account_code', account_code,
                    'account_name', account_name,
                    'balance', current_balance
                )
            ) INTO expenses_data
            FROM public.chart_of_accounts
            WHERE tenant_id = tenant_id_param
            AND account_type = 'expense'
            AND is_active = true
            ORDER BY account_code;
            
            result := jsonb_build_object(
                'report_type', 'income_statement',
                'revenue', COALESCE(revenue_data, '[]'::jsonb),
                'expenses', COALESCE(expenses_data, '[]'::jsonb),
                'period', jsonb_build_object(
                    'start_date', start_date,
                    'end_date', end_date
                ),
                'generated_at', now()
            );
            
        ELSE
            RAISE EXCEPTION 'نوع التقرير غير مدعوم: %', report_type;
    END CASE;
    
    RETURN result;
END;
$function$;

-- إصلاح دالة create_vehicle_accounting_entry
CREATE OR REPLACE FUNCTION public.create_vehicle_accounting_entry(vehicle_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  journal_entry_id UUID;
  journal_entry_number TEXT;
  vehicle_cost NUMERIC;
  vehicle_name TEXT;
  
  -- معرفات الحسابات
  vehicles_account UUID;
  cash_account UUID;
BEGIN
  -- استخراج البيانات
  vehicle_cost := (vehicle_data->>'purchase_price')::NUMERIC;
  vehicle_name := vehicle_data->>'vehicle_name';
  
  -- الحصول على معرفات الحسابات
  SELECT id INTO vehicles_account FROM public.chart_of_accounts WHERE account_code = '1211';
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
    'شراء مركبة - ' || vehicle_name,
    'vehicle',
    (vehicle_data->>'vehicle_id')::UUID,
    vehicle_cost,
    vehicle_cost,
    'posted',
    auth.uid()
  ) RETURNING id INTO journal_entry_id;
  
  -- إنشاء سطور القيد
  -- المركبات (مدين)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, vehicles_account, 'شراء مركبة - ' || vehicle_name, vehicle_cost, 0, 1
  );
  
  -- النقدية (دائن)
  INSERT INTO public.journal_entry_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount, line_number
  ) VALUES (
    journal_entry_id, cash_account, 'دفع قيمة مركبة - ' || vehicle_name, 0, vehicle_cost, 2
  );
  
  RETURN journal_entry_id;
END;
$function$;

-- إصلاح دالة get_account_statement
CREATE OR REPLACE FUNCTION public.get_account_statement(account_id_param uuid, start_date_param date, end_date_param date)
 RETURNS TABLE(entry_date date, entry_number text, description text, debit_amount numeric, credit_amount numeric, balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    running_balance numeric := 0;
    opening_balance numeric := 0;
BEGIN
    -- الحصول على الرصيد الافتتاحي
    SELECT COALESCE(coa.opening_balance, 0) INTO opening_balance
    FROM public.chart_of_accounts coa
    WHERE coa.id = account_id_param;
    
    -- حساب الرصيد حتى تاريخ البداية
    SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) INTO running_balance
    FROM public.journal_entry_lines jel
    INNER JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = account_id_param
    AND je.entry_date < start_date_param
    AND je.status = 'posted';
    
    running_balance := opening_balance + running_balance;
    
    -- إرجاع كشف الحساب
    RETURN QUERY
    SELECT 
        je.entry_date,
        je.entry_number,
        jel.description,
        jel.debit_amount,
        jel.credit_amount,
        running_balance + SUM(jel.debit_amount - jel.credit_amount) 
            OVER (ORDER BY je.entry_date, je.entry_number) as balance
    FROM public.journal_entry_lines jel
    INNER JOIN public.journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = account_id_param
    AND je.entry_date BETWEEN start_date_param AND end_date_param
    AND je.status = 'posted'
    ORDER BY je.entry_date, je.entry_number;
END;
$function$;