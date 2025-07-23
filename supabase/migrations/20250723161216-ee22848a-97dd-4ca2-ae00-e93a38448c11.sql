-- الخطة الشاملة لعزل المؤسسات - الإصلاح: معالجة القيم NULL قبل إضافة القيود
-- Phase 1: Fix NULL tenant_id values and add constraints properly

-- First, get the default tenant ID for updating NULL values
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Get the first active tenant as default
    SELECT id INTO default_tenant_id FROM public.tenants WHERE status = 'active' ORDER BY created_at LIMIT 1;
    
    IF default_tenant_id IS NULL THEN
        -- Create a default tenant if none exists
        INSERT INTO public.tenants (
            name, slug, country, timezone, currency, status, 
            subscription_plan, subscription_status, max_users, max_vehicles, max_contracts, settings
        ) VALUES (
            'Default Organization', 'default', 'Kuwait', 'Asia/Kuwait', 'KWD', 'active',
            'basic', 'active', 100, 100, 100, '{}'::jsonb
        ) RETURNING id INTO default_tenant_id;
    END IF;

    -- Update NULL tenant_id values in all tables that might have them
    UPDATE public.attendance SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.attendance_settings SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.asset_categories SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.asset_code_hierarchy SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.asset_disposal_reasons SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.asset_locations SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.account_audit_log SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.account_modification_requests SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.account_templates SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.accounting_audit_trail SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.accounting_event_monitor SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.accounting_webhooks SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.advanced_kpis SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.ai_classifications SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.ai_insights SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.approvals SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.bank_reconciliation_imports SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
END $$;

-- 1. Add tenant_id column to tables that don't have it
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.attendance_settings
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.asset_categories
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.asset_code_hierarchy
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.asset_disposal_reasons
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.asset_locations
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.account_audit_log
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.account_modification_requests
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.account_templates
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.accounting_audit_trail
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.accounting_event_monitor
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.accounting_webhooks
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.advanced_kpis
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.ai_classifications
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.ai_insights
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.approvals
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.bank_reconciliation_imports
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. Now set default values and NOT NULL constraints
ALTER TABLE public.attendance ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.attendance ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.attendance_settings ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.attendance_settings ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.asset_categories ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.asset_categories ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.asset_code_hierarchy ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.asset_code_hierarchy ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.asset_disposal_reasons ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.asset_disposal_reasons ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.asset_locations ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.asset_locations ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.account_audit_log ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.account_audit_log ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.account_modification_requests ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.account_modification_requests ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.account_templates ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.account_templates ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.accounting_audit_trail ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.accounting_audit_trail ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.accounting_event_monitor ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.accounting_event_monitor ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.accounting_webhooks ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.accounting_webhooks ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.advanced_kpis ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.advanced_kpis ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.ai_classifications ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.ai_classifications ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.ai_insights ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.ai_insights ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.approvals ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.approvals ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.bank_reconciliation_imports ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
ALTER TABLE public.bank_reconciliation_imports ALTER COLUMN tenant_id SET NOT NULL;

-- 3. Add foreign key constraints
ALTER TABLE public.attendance ADD CONSTRAINT IF NOT EXISTS fk_attendance_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.attendance_settings ADD CONSTRAINT IF NOT EXISTS fk_attendance_settings_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.asset_categories ADD CONSTRAINT IF NOT EXISTS fk_asset_categories_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.asset_code_hierarchy ADD CONSTRAINT IF NOT EXISTS fk_asset_code_hierarchy_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.asset_disposal_reasons ADD CONSTRAINT IF NOT EXISTS fk_asset_disposal_reasons_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.asset_locations ADD CONSTRAINT IF NOT EXISTS fk_asset_locations_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.account_audit_log ADD CONSTRAINT IF NOT EXISTS fk_account_audit_log_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.account_modification_requests ADD CONSTRAINT IF NOT EXISTS fk_account_modification_requests_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.account_templates ADD CONSTRAINT IF NOT EXISTS fk_account_templates_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.accounting_audit_trail ADD CONSTRAINT IF NOT EXISTS fk_accounting_audit_trail_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.accounting_event_monitor ADD CONSTRAINT IF NOT EXISTS fk_accounting_event_monitor_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.accounting_webhooks ADD CONSTRAINT IF NOT EXISTS fk_accounting_webhooks_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.advanced_kpis ADD CONSTRAINT IF NOT EXISTS fk_advanced_kpis_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.ai_classifications ADD CONSTRAINT IF NOT EXISTS fk_ai_classifications_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.ai_insights ADD CONSTRAINT IF NOT EXISTS fk_ai_insights_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.approvals ADD CONSTRAINT IF NOT EXISTS fk_approvals_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.bank_reconciliation_imports ADD CONSTRAINT IF NOT EXISTS fk_bank_reconciliation_imports_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;