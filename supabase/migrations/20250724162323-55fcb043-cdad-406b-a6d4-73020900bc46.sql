-- إصلاح المجموعة التالية من الدوال بإضافة SET search_path TO 'public'

-- 1. إصلاح دالة get_current_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    tenant_id uuid;
BEGIN
    -- الحصول على معرف المؤسسة من المستخدم الحالي
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
    AND tu.status = 'active'
    LIMIT 1;
    
    -- إذا لم نجد في tenant_users، جرب tenant_user_roles
    IF tenant_id IS NULL THEN
        SELECT tur.tenant_id INTO tenant_id
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = auth.uid()
        AND tur.status = 'active'
        LIMIT 1;
    END IF;
    
    RETURN tenant_id;
END;
$function$;

-- 2. إصلاح دالة get_user_tenant_context
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_context jsonb;
    current_user_id uuid;
    current_tenant_id uuid;
    user_role text;
    permissions jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'user_id', null,
            'tenant_id', null,
            'role', null,
            'permissions', '{}'::jsonb
        );
    END IF;
    
    -- الحصول على معلومات المستخدم من tenant_users أو tenant_user_roles
    SELECT tu.tenant_id, tu.role::text INTO current_tenant_id, user_role
    FROM public.tenant_users tu
    WHERE tu.user_id = current_user_id 
    AND tu.status = 'active'
    LIMIT 1;
    
    -- إذا لم نجد في tenant_users، جرب tenant_user_roles
    IF current_tenant_id IS NULL THEN
        SELECT tur.tenant_id, tur.role::text INTO current_tenant_id, user_role
        FROM public.tenant_user_roles tur
        WHERE tur.user_id = current_user_id 
        AND tur.status = 'active'
        LIMIT 1;
    END IF;
    
    -- تحديد الصلاحيات بناءً على الدور
    CASE user_role
        WHEN 'super_admin' THEN
            permissions := '{
                "can_manage_users": true,
                "can_manage_accounting": true,
                "can_manage_vehicles": true,
                "can_view_reports": true,
                "can_manage_contracts": true,
                "can_manage_tenants": true
            }'::jsonb;
        WHEN 'tenant_admin' THEN
            permissions := '{
                "can_manage_users": true,
                "can_manage_accounting": true,
                "can_manage_vehicles": true,
                "can_view_reports": true,
                "can_manage_contracts": true
            }'::jsonb;
        WHEN 'manager' THEN
            permissions := '{
                "can_manage_users": false,
                "can_manage_accounting": true,
                "can_manage_vehicles": true,
                "can_view_reports": true,
                "can_manage_contracts": true
            }'::jsonb;
        WHEN 'accountant' THEN
            permissions := '{
                "can_manage_users": false,
                "can_manage_accounting": true,
                "can_manage_vehicles": false,
                "can_view_reports": true,
                "can_manage_contracts": false
            }'::jsonb;
        ELSE
            permissions := '{
                "can_manage_users": false,
                "can_manage_accounting": false,
                "can_manage_vehicles": false,
                "can_view_reports": false,
                "can_manage_contracts": false
            }'::jsonb;
    END CASE;
    
    user_context := jsonb_build_object(
        'user_id', current_user_id,
        'tenant_id', current_tenant_id,
        'role', user_role,
        'permissions', permissions
    );
    
    RETURN user_context;
END;
$function$;

-- 3. إصلاح دالة log_user_activity
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

-- 4. إصلاح دالة generate_journal_entry_number
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    journal_number TEXT;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- الحصول على الرقم التالي للسنة الحالية
    SELECT COALESCE(MAX(
        CASE 
            WHEN entry_number ~ '^JE-[0-9]{4}-[0-9]+$' 
            THEN CAST(SPLIT_PART(entry_number, '-', 3) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO next_number
    FROM public.journal_entries
    WHERE tenant_id = current_tenant_id
    AND EXTRACT(YEAR FROM entry_date) = current_year;
    
    journal_number := 'JE-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN journal_number;
END;
$function$;

-- 5. إصلاح دالة log_transaction
CREATE OR REPLACE FUNCTION public.log_transaction(transaction_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    journal_entry_id UUID;
    journal_entry_number TEXT;
    amount NUMERIC;
    description TEXT;
    reference_type TEXT;
    reference_id UUID;
    debit_account_id UUID;
    credit_account_id UUID;
    current_tenant_id UUID;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- استخراج البيانات من JSON
    amount := (transaction_data->>'amount')::NUMERIC;
    description := transaction_data->>'description';
    reference_type := transaction_data->>'reference_type';
    reference_id := (transaction_data->>'reference_id')::UUID;
    debit_account_id := (transaction_data->>'debit_account_id')::UUID;
    credit_account_id := (transaction_data->>'credit_account_id')::UUID;
    
    -- توليد رقم القيد
    journal_entry_number := public.generate_journal_entry_number();
    
    -- إنشاء القيد المحاسبي
    INSERT INTO public.journal_entries (
        tenant_id,
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
        current_tenant_id,
        journal_entry_number,
        CURRENT_DATE,
        description,
        reference_type,
        reference_id,
        amount,
        amount,
        'posted',
        auth.uid()
    ) RETURNING id INTO journal_entry_id;
    
    -- إنشاء سطر المدين
    INSERT INTO public.journal_entry_lines (
        tenant_id,
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount,
        line_number
    ) VALUES (
        current_tenant_id,
        journal_entry_id,
        debit_account_id,
        description,
        amount,
        0,
        1
    );
    
    -- إنشاء سطر الدائن
    INSERT INTO public.journal_entry_lines (
        tenant_id,
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount,
        line_number
    ) VALUES (
        current_tenant_id,
        journal_entry_id,
        credit_account_id,
        description,
        0,
        amount,
        2
    );
    
    -- تحديث أرصدة الحسابات
    PERFORM public.update_account_balances(journal_entry_id);
    
    RETURN journal_entry_id;
END;
$function$;

-- 6. إصلاح دالة complete_liabilities_equity_revenue_expenses
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
    -- إضافة حسابات الإيرادات الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '4';
    
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0),
    (tenant_id_param, '43', 'إيرادات متنوعة', 'Miscellaneous Revenue', 'revenue', 'other_revenue', parent_id, 2, false, true, 0, 0);
    
    inserted_count := inserted_count + 2;
    
    -- إضافة تفاصيل الإيرادات الأخرى
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '42';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '421', 'إيرادات استثمارية', 'Investment Revenue', 'revenue', 'other_revenue', parent_id, 3, false, true, 0, 0),
    (tenant_id_param, '422', 'أرباح بيع أصول', 'Asset Disposal Gains', 'revenue', 'other_revenue', parent_id, 3, false, true, 0, 0);
    
    -- تفاصيل الإيرادات الاستثمارية
    SELECT id INTO parent_id FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param AND account_code = '421';
    INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_name_en, account_type, account_category, parent_account_id, level, allow_posting, is_active, opening_balance, current_balance)
    VALUES 
    (tenant_id_param, '42101', 'إيرادات فوائد بنكية', 'Bank Interest Revenue', 'revenue', 'other_revenue', parent_id, 4, true, true, 0, 0),
    (tenant_id_param, '42102', 'إيرادات استثمارات', 'Investment Revenue', 'revenue', 'other_revenue', parent_id, 4, true, true, 0, 0);
    
    inserted_count := inserted_count + 4;
    
    RETURN inserted_count;
END;
$function$;

-- 7. إصلاح دالة setup_comprehensive_chart_of_accounts
CREATE OR REPLACE FUNCTION public.setup_comprehensive_chart_of_accounts(tenant_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    total_inserted INTEGER := 0;
    base_accounts INTEGER := 0;
    additional_accounts INTEGER := 0;
BEGIN
    -- إنشاء الحسابات الأساسية
    SELECT public.create_correct_chart_of_accounts(tenant_id_param) INTO base_accounts;
    
    -- إضافة الحسابات المتخصصة
    SELECT public.complete_liabilities_equity_revenue_expenses(tenant_id_param) INTO additional_accounts;
    
    total_inserted := base_accounts + additional_accounts;
    
    RETURN total_inserted;
END;
$function$;

-- 8. إصلاح دالة check_period_status
CREATE OR REPLACE FUNCTION public.check_period_status(check_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    period_record RECORD;
    result jsonb;
    current_tenant_id uuid;
BEGIN
    current_tenant_id := public.get_current_tenant_id();
    
    -- البحث عن الفترة المحاسبية التي تحتوي على التاريخ المحدد
    SELECT * INTO period_record
    FROM public.accounting_periods ap
    WHERE ap.tenant_id = current_tenant_id
    AND check_date BETWEEN ap.start_date AND ap.end_date
    LIMIT 1;
    
    -- إذا لم توجد فترة محاسبية
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'can_modify', false,
            'period_exists', false,
            'message', 'لا توجد فترة محاسبية مفتوحة لهذا التاريخ'
        );
    ELSE
        -- إذا وجدت الفترة، تحقق من حالتها
        CASE period_record.status
            WHEN 'open' THEN
                result := jsonb_build_object(
                    'can_modify', true,
                    'period_exists', true,
                    'period_id', period_record.id,
                    'period_name', period_record.period_name,
                    'status', period_record.status,
                    'message', 'الفترة مفتوحة ويمكن إضافة القيود'
                );
            WHEN 'closed' THEN
                result := jsonb_build_object(
                    'can_modify', false,
                    'period_exists', true,
                    'period_id', period_record.id,
                    'period_name', period_record.period_name,
                    'status', period_record.status,
                    'message', 'الفترة مقفلة ولا يمكن إضافة أو تعديل القيود'
                );
            ELSE
                result := jsonb_build_object(
                    'can_modify', false,
                    'period_exists', true,
                    'period_id', period_record.id,
                    'period_name', period_record.period_name,
                    'status', period_record.status,
                    'message', 'حالة الفترة غير محددة'
                );
        END CASE;
    END IF;
    
    RETURN result;
END;
$function$;