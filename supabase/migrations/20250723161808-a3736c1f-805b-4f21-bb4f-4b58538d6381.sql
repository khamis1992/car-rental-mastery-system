-- الخطة الشاملة لعزل المؤسسات - الجزء الثاني: إكمال RLS والأمان
-- Phase 2: Complete RLS policies, triggers, and security functions

-- 1. Update RLS policies for tenant isolation
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

-- 2. Create triggers to ensure tenant_id is set on insert
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to all tables with tenant_id (drop existing first)
DROP TRIGGER IF EXISTS ensure_tenant_id_attendance ON public.attendance;
CREATE TRIGGER ensure_tenant_id_attendance
  BEFORE INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_attendance_settings ON public.attendance_settings;
CREATE TRIGGER ensure_tenant_id_attendance_settings
  BEFORE INSERT ON public.attendance_settings
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_asset_categories ON public.asset_categories;
CREATE TRIGGER ensure_tenant_id_asset_categories
  BEFORE INSERT ON public.asset_categories
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_asset_code_hierarchy ON public.asset_code_hierarchy;
CREATE TRIGGER ensure_tenant_id_asset_code_hierarchy
  BEFORE INSERT ON public.asset_code_hierarchy
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_asset_disposal_reasons ON public.asset_disposal_reasons;
CREATE TRIGGER ensure_tenant_id_asset_disposal_reasons
  BEFORE INSERT ON public.asset_disposal_reasons
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_asset_locations ON public.asset_locations;
CREATE TRIGGER ensure_tenant_id_asset_locations
  BEFORE INSERT ON public.asset_locations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_account_audit_log ON public.account_audit_log;
CREATE TRIGGER ensure_tenant_id_account_audit_log
  BEFORE INSERT ON public.account_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_account_modification_requests ON public.account_modification_requests;
CREATE TRIGGER ensure_tenant_id_account_modification_requests
  BEFORE INSERT ON public.account_modification_requests
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_account_templates ON public.account_templates;
CREATE TRIGGER ensure_tenant_id_account_templates
  BEFORE INSERT ON public.account_templates
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_accounting_audit_trail ON public.accounting_audit_trail;
CREATE TRIGGER ensure_tenant_id_accounting_audit_trail
  BEFORE INSERT ON public.accounting_audit_trail
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_accounting_event_monitor ON public.accounting_event_monitor;
CREATE TRIGGER ensure_tenant_id_accounting_event_monitor
  BEFORE INSERT ON public.accounting_event_monitor
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_accounting_webhooks ON public.accounting_webhooks;
CREATE TRIGGER ensure_tenant_id_accounting_webhooks
  BEFORE INSERT ON public.accounting_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_advanced_kpis ON public.advanced_kpis;
CREATE TRIGGER ensure_tenant_id_advanced_kpis
  BEFORE INSERT ON public.advanced_kpis
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_ai_classifications ON public.ai_classifications;
CREATE TRIGGER ensure_tenant_id_ai_classifications
  BEFORE INSERT ON public.ai_classifications
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_ai_insights ON public.ai_insights;
CREATE TRIGGER ensure_tenant_id_ai_insights
  BEFORE INSERT ON public.ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_approvals ON public.approvals;
CREATE TRIGGER ensure_tenant_id_approvals
  BEFORE INSERT ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_bank_reconciliation_imports ON public.bank_reconciliation_imports;
CREATE TRIGGER ensure_tenant_id_bank_reconciliation_imports
  BEFORE INSERT ON public.bank_reconciliation_imports
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();