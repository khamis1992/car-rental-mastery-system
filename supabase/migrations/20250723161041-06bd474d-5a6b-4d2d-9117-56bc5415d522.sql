-- الخطة الشاملة لعزل المؤسسات: إضافة tenant_id وتحديث سياسات RLS
-- Phase 1: Add tenant_id to missing tables and create proper isolation

-- 1. Add tenant_id to missing tables with proper constraints
-- Tables identified as missing tenant_id: 59 tables

-- Add tenant_id to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to attendance_settings table  
ALTER TABLE public.attendance_settings
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to asset_categories table
ALTER TABLE public.asset_categories
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to asset_code_hierarchy table
ALTER TABLE public.asset_code_hierarchy
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to asset_disposal_reasons table
ALTER TABLE public.asset_disposal_reasons
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to asset_locations table
ALTER TABLE public.asset_locations
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to account_audit_log table
ALTER TABLE public.account_audit_log
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to account_modification_requests table
ALTER TABLE public.account_modification_requests
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to account_templates table
ALTER TABLE public.account_templates
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to accounting_audit_trail table
ALTER TABLE public.accounting_audit_trail
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to accounting_event_monitor table
ALTER TABLE public.accounting_event_monitor
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to accounting_webhooks table
ALTER TABLE public.accounting_webhooks
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to advanced_kpis table
ALTER TABLE public.advanced_kpis
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to ai_classifications table
ALTER TABLE public.ai_classifications
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to ai_insights table
ALTER TABLE public.ai_insights
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to approvals table
ALTER TABLE public.approvals
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to bank_reconciliation_imports table
ALTER TABLE public.bank_reconciliation_imports
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT get_current_tenant_id()
REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. Update RLS policies for all tables to enforce tenant isolation
-- Drop existing policies and create comprehensive tenant isolation policies

-- Attendance table policies
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة الحضور" ON public.attendance;
DROP POLICY IF EXISTS "الموظفون يمكنهم تسجيل حضورهم" ON public.attendance;
DROP POLICY IF EXISTS "الموظفون يمكنهم رؤية حضورهم" ON public.attendance;

CREATE POLICY "attendance_tenant_isolation" ON public.attendance
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Attendance settings policies
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة إعدادات الح" ON public.attendance_settings;
DROP POLICY IF EXISTS "الموظفون يمكنهم رؤية إعدادات الحض" ON public.attendance_settings;

CREATE POLICY "attendance_settings_tenant_isolation" ON public.attendance_settings
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Asset categories policies
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة" ON public.asset_categories;

CREATE POLICY "asset_categories_tenant_isolation" ON public.asset_categories
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Asset code hierarchy policies
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة التسلسل اله" ON public.asset_code_hierarchy;
DROP POLICY IF EXISTS "الموظفون يمكنهم رؤية التسلسل الهر" ON public.asset_code_hierarchy;

CREATE POLICY "asset_code_hierarchy_tenant_isolation" ON public.asset_code_hierarchy
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Asset disposal reasons policies
DROP POLICY IF EXISTS "Admins can manage asset disposal reasons" ON public.asset_disposal_reasons;
DROP POLICY IF EXISTS "Anyone can view asset disposal reasons" ON public.asset_disposal_reasons;

CREATE POLICY "asset_disposal_reasons_tenant_isolation" ON public.asset_disposal_reasons
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Asset locations policies
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة" ON public.asset_locations;

CREATE POLICY "asset_locations_tenant_isolation" ON public.asset_locations
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Account audit log policies
DROP POLICY IF EXISTS "المحاسبون يمكنهم رؤية سجل التدقيق" ON public.account_audit_log;
DROP POLICY IF EXISTS "النظام يمكنه إدراج سجلات التدقيق" ON public.account_audit_log;

CREATE POLICY "account_audit_log_tenant_isolation" ON public.account_audit_log
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Account modification requests policies
DROP POLICY IF EXISTS "المحاسبون يمكنهم إنشاء طلبات التع" ON public.account_modification_requests;
DROP POLICY IF EXISTS "المحاسبون يمكنهم رؤية طلبات التعد" ON public.account_modification_requests;
DROP POLICY IF EXISTS "المديرون المختصون يمكنهم تحديث طل" ON public.account_modification_requests;

CREATE POLICY "account_modification_requests_tenant_isolation" ON public.account_modification_requests
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Account templates policies
DROP POLICY IF EXISTS "الجميع يمكنهم رؤية قوالب الحسابات" ON public.account_templates;
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة قوالب الحسا" ON public.account_templates;

CREATE POLICY "account_templates_tenant_isolation" ON public.account_templates
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Accounting audit trail policies
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية س" ON public.accounting_audit_trail;
DROP POLICY IF EXISTS "النظام يمكنه إضافة سجلات المراجعة" ON public.accounting_audit_trail;

CREATE POLICY "accounting_audit_trail_tenant_isolation" ON public.accounting_audit_trail
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Accounting event monitor policies
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية م" ON public.accounting_event_monitor;
DROP POLICY IF EXISTS "النظام يمكنه إدارة مراقبة الأحداث" ON public.accounting_event_monitor;

CREATE POLICY "accounting_event_monitor_tenant_isolation" ON public.accounting_event_monitor
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Accounting webhooks policies
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة الـ webhooks" ON public.accounting_webhooks;

CREATE POLICY "accounting_webhooks_tenant_isolation" ON public.accounting_webhooks
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Advanced KPIs policies
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية ا" ON public.advanced_kpis;
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة المؤشرات ال" ON public.advanced_kpis;

CREATE POLICY "advanced_kpis_tenant_isolation" ON public.advanced_kpis
FOR ALL USING (tenant_id = get_current_tenant_id());

-- AI classifications policies
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة" ON public.ai_classifications;

CREATE POLICY "ai_classifications_tenant_isolation" ON public.ai_classifications
FOR ALL USING (tenant_id = get_current_tenant_id());

-- AI insights policies
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة" ON public.ai_insights;
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية ا" ON public.ai_insights;

CREATE POLICY "ai_insights_tenant_isolation" ON public.ai_insights
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Approvals policies
DROP POLICY IF EXISTS "المسؤولون يمكنهم تحديث الموافقات" ON public.approvals;
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية موافقاتهم" ON public.approvals;
DROP POLICY IF EXISTS "الموظفون يمكنهم طلب الموافقات" ON public.approvals;

CREATE POLICY "approvals_tenant_isolation" ON public.approvals
FOR ALL USING (tenant_id = get_current_tenant_id());

-- Bank reconciliation imports policies
CREATE POLICY "bank_reconciliation_imports_tenant_isolation" ON public.bank_reconciliation_imports
FOR ALL USING (tenant_id = get_current_tenant_id());

-- 3. Create triggers to ensure tenant_id is set on insert
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to all tables with tenant_id
CREATE TRIGGER ensure_tenant_id_attendance
  BEFORE INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_attendance_settings
  BEFORE INSERT ON public.attendance_settings
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_asset_categories
  BEFORE INSERT ON public.asset_categories
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_asset_code_hierarchy
  BEFORE INSERT ON public.asset_code_hierarchy
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_asset_disposal_reasons
  BEFORE INSERT ON public.asset_disposal_reasons
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_asset_locations
  BEFORE INSERT ON public.asset_locations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_account_audit_log
  BEFORE INSERT ON public.account_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_account_modification_requests
  BEFORE INSERT ON public.account_modification_requests
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_account_templates
  BEFORE INSERT ON public.account_templates
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_accounting_audit_trail
  BEFORE INSERT ON public.accounting_audit_trail
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_accounting_event_monitor
  BEFORE INSERT ON public.accounting_event_monitor
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_accounting_webhooks
  BEFORE INSERT ON public.accounting_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_advanced_kpis
  BEFORE INSERT ON public.advanced_kpis
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_ai_classifications
  BEFORE INSERT ON public.ai_classifications
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_ai_insights
  BEFORE INSERT ON public.ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_approvals
  BEFORE INSERT ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

CREATE TRIGGER ensure_tenant_id_bank_reconciliation_imports
  BEFORE INSERT ON public.bank_reconciliation_imports
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

-- 4. Create data isolation test functions
CREATE OR REPLACE FUNCTION public.test_tenant_data_isolation(test_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB := '{"status": "success", "tests": [], "violations": []}'::jsonb;
    violation_count INTEGER := 0;
    table_name TEXT;
    query_text TEXT;
    temp_result RECORD;
BEGIN
    -- Test that tenant-specific queries only return data for that tenant
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('tenants', 'tenant_users')
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tablename 
            AND column_name = 'tenant_id'
        )
    LOOP
        -- Execute test query for each table
        query_text := format('SELECT COUNT(*) as count FROM %I WHERE tenant_id != %L', table_name, test_tenant_id);
        
        BEGIN
            EXECUTE query_text INTO temp_result;
            
            IF temp_result.count > 0 THEN
                violation_count := violation_count + 1;
                result := jsonb_set(
                    result, 
                    '{violations}', 
                    result->'violations' || jsonb_build_object(
                        'table', table_name,
                        'cross_tenant_records', temp_result.count
                    )
                );
            END IF;
            
            result := jsonb_set(
                result,
                '{tests}',
                result->'tests' || jsonb_build_object(
                    'table', table_name,
                    'status', CASE WHEN temp_result.count = 0 THEN 'pass' ELSE 'fail' END,
                    'records_tested', temp_result.count
                )
            );
            
        EXCEPTION WHEN OTHERS THEN
            result := jsonb_set(
                result,
                '{tests}',
                result->'tests' || jsonb_build_object(
                    'table', table_name,
                    'status', 'error',
                    'error', SQLERRM
                )
            );
        END;
    END LOOP;
    
    IF violation_count > 0 THEN
        result := jsonb_set(result, '{status}', '"violations_found"');
    END IF;
    
    result := jsonb_set(result, '{total_violations}', violation_count::text::jsonb);
    result := jsonb_set(result, '{tested_at}', to_jsonb(now()));
    
    RETURN result;
END;
$$;

-- 5. Create function to validate RLS policies
CREATE OR REPLACE FUNCTION public.validate_rls_policies()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB := '{"status": "success", "tables_checked": 0, "missing_rls": [], "missing_policies": []}'::jsonb;
    table_record RECORD;
    policy_count INTEGER;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename, rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        result := jsonb_set(result, '{tables_checked}', ((result->>'tables_checked')::integer + 1)::text::jsonb);
        
        -- Check if RLS is enabled
        IF NOT table_record.rowsecurity THEN
            result := jsonb_set(
                result,
                '{missing_rls}',
                result->'missing_rls' || to_jsonb(table_record.tablename)
            );
        END IF;
        
        -- Check if table has policies
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE schemaname = table_record.schemaname 
        AND tablename = table_record.tablename;
        
        IF policy_count = 0 AND table_record.rowsecurity THEN
            result := jsonb_set(
                result,
                '{missing_policies}',
                result->'missing_policies' || to_jsonb(table_record.tablename)
            );
        END IF;
    END LOOP;
    
    result := jsonb_set(result, '{validated_at}', to_jsonb(now()));
    
    RETURN result;
END;
$$;

-- 6. Fix function search paths for security
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() LIMIT 1),
    (SELECT id FROM public.tenants WHERE status = 'active' ORDER BY created_at LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_valid(tenant_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.tenants 
    WHERE id = tenant_id_param 
    AND status IN ('active', 'trial')
    AND (trial_ends_at IS NULL OR trial_ends_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_param user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = user_id_param 
    AND raw_user_meta_data->>'role' = role_param::text
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_tenant_role(roles_param text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = get_current_tenant_id()
    AND role = ANY(roles_param::text[])
  );
$$;

CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.email() = 'admin@admin.com';
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.test_tenant_data_isolation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_valid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_tenant_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_saas_admin() TO authenticated;