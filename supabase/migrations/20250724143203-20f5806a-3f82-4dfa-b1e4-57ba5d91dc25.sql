-- إصلاح المزيد من دوال النظام
-- إضافة SET search_path TO 'public' لدوال أخرى

CREATE OR REPLACE FUNCTION public.notify_accounting_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO accounting_event_monitor (
        event_type, entity_id, status
    ) VALUES (
        TG_OP, NEW.id, 'pending'
    );
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_system_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    tenant_count INTEGER;
    user_count INTEGER;
    pending_events INTEGER;
BEGIN
    -- إحصائيات النظام
    SELECT COUNT(*) INTO tenant_count FROM tenants WHERE status = 'active';
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO pending_events FROM accounting_event_monitor WHERE status = 'pending';
    
    result := jsonb_build_object(
        'system_status', 'healthy',
        'active_tenants', tenant_count,
        'total_users', user_count,
        'pending_events', pending_events,
        'timestamp', now()
    );
    
    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_automated_accounting_entries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    processed_count INTEGER := 0;
    event_record RECORD;
BEGIN
    FOR event_record IN 
        SELECT * FROM accounting_event_monitor 
        WHERE status = 'pending' 
        LIMIT 10
    LOOP
        BEGIN
            -- معالجة الحدث
            UPDATE accounting_event_monitor 
            SET 
                status = 'processed',
                processing_completed_at = now(),
                processing_duration_ms = EXTRACT(EPOCH FROM now() - processing_started_at) * 1000
            WHERE id = event_record.id;
            
            processed_count := processed_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            UPDATE accounting_event_monitor 
            SET 
                status = 'failed',
                error_message = SQLERRM,
                processing_completed_at = now()
            WHERE id = event_record.id;
        END;
    END LOOP;
    
    RETURN processed_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- حذف سجلات التدقيق الأقدم من 365 يوم
    DELETE FROM accounting_audit_trail 
    WHERE created_at < NOW() - INTERVAL '365 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM account_audit_log 
    WHERE created_at < NOW() - INTERVAL '365 days';
    
    RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_tenant_data_integrity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    orphaned_records INTEGER := 0;
    duplicates INTEGER := 0;
    missing_references INTEGER := 0;
BEGIN
    -- فحص السجلات المعزولة
    SELECT COUNT(*) INTO orphaned_records
    FROM chart_of_accounts 
    WHERE tenant_id IS NULL;
    
    -- فحص التكرارات
    SELECT COUNT(*) INTO duplicates
    FROM (
        SELECT tenant_id, account_code, COUNT(*) 
        FROM chart_of_accounts 
        GROUP BY tenant_id, account_code 
        HAVING COUNT(*) > 1
    ) duplicates_query;
    
    -- فحص المراجع المفقودة
    SELECT COUNT(*) INTO missing_references
    FROM chart_of_accounts 
    WHERE parent_account_id IS NOT NULL 
    AND parent_account_id NOT IN (SELECT id FROM chart_of_accounts);
    
    result := jsonb_build_object(
        'status', CASE 
            WHEN orphaned_records + duplicates + missing_references = 0 THEN 'healthy'
            ELSE 'issues_detected'
        END,
        'orphaned_records', orphaned_records,
        'duplicate_accounts', duplicates,
        'missing_references', missing_references,
        'checked_at', now()
    );
    
    RETURN result;
END;
$function$;