-- إصلاح دوال بدون تغيير أسماء المعاملات
-- إضافة SET search_path TO 'public' للدوال التي تحتاجه

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_account_balance_on_journal_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    account_balance NUMERIC;
BEGIN
    -- تحديث رصيد الحساب للسطر الجديد أو المحدث
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        SELECT get_account_balance_optimized(NEW.account_id) INTO account_balance;
        UPDATE public.chart_of_accounts 
        SET current_balance = account_balance 
        WHERE id = NEW.account_id;
    END IF;
    
    -- تحديث رصيد الحساب للسطر المحذوف
    IF TG_OP = 'DELETE' THEN
        SELECT get_account_balance_optimized(OLD.account_id) INTO account_balance;
        UPDATE public.chart_of_accounts 
        SET current_balance = account_balance 
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_journal_entry_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    total_debits NUMERIC;
    total_credits NUMERIC;
BEGIN
    -- حساب إجمالي المدين والدائن
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debits, total_credits
    FROM journal_entry_lines
    WHERE journal_entry_id = NEW.journal_entry_id;
    
    -- التحقق من توازن القيد
    IF total_debits != total_credits THEN
        RAISE EXCEPTION 'القيد المحاسبي غير متوازن: المدين = %، الدائن = %', total_debits, total_credits;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_account_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO account_audit_log (
            account_id, user_id, tenant_id, action_type,
            old_values, new_values, created_at
        ) VALUES (
            NEW.id, auth.uid(), NEW.tenant_id, 'UPDATE',
            to_jsonb(OLD), to_jsonb(NEW), now()
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO account_audit_log (
            account_id, user_id, tenant_id, action_type,
            new_values, created_at
        ) VALUES (
            NEW.id, auth.uid(), NEW.tenant_id, 'INSERT',
            to_jsonb(NEW), now()
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO account_audit_log (
            account_id, user_id, tenant_id, action_type,
            old_values, created_at
        ) VALUES (
            OLD.id, auth.uid(), OLD.tenant_id, 'DELETE',
            to_jsonb(OLD), now()
        );
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$function$;