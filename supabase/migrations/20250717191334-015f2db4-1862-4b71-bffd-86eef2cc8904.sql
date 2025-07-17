-- Drop the existing function first
DROP FUNCTION IF EXISTS public.hard_delete_tenant(UUID, TEXT);

-- Create the improved hard_delete_tenant function
CREATE OR REPLACE FUNCTION public.hard_delete_tenant(tenant_id_param UUID, deletion_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_record RECORD;
    deleted_tables TEXT[] := '{}';
    total_records_deleted INTEGER := 0;
    records_count INTEGER;
    error_details TEXT;
BEGIN
    -- Check if tenant exists
    SELECT id, name, slug INTO tenant_record
    FROM public.tenants 
    WHERE id = tenant_id_param;
    
    IF tenant_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tenant not found',
            'tenant_id', tenant_id_param
        );
    END IF;
    
    -- Log deletion attempt (fix column name from deletion_date to deleted_at)
    INSERT INTO public.tenant_deletion_log (
        tenant_id, tenant_name, tenant_slug, deleted_by, 
        deletion_reason, deletion_type, deleted_at
    ) VALUES (
        tenant_record.id, tenant_record.name, tenant_record.slug, 
        auth.uid(), deletion_reason, 'hard_delete', now()
    );
    
    -- Delete data in correct order to avoid foreign key violations
    -- Level 1: Deepest child tables first
    
    -- Invoice items before invoices
    DELETE FROM public.invoice_items WHERE invoice_id IN (
        SELECT id FROM public.invoices WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('invoice_items: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Journal entry lines before journal entries
    DELETE FROM public.journal_entry_lines WHERE journal_entry_id IN (
        SELECT id FROM public.journal_entries WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('journal_entry_lines: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Contract related child tables before contracts
    DELETE FROM public.contract_extensions WHERE contract_id IN (
        SELECT id FROM public.contracts WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contract_extensions: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.contract_evaluations WHERE contract_id IN (
        SELECT id FROM public.contracts WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contract_evaluations: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.contract_incidents WHERE contract_id IN (
        SELECT id FROM public.contracts WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contract_incidents: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.contract_accounting_entries WHERE contract_id IN (
        SELECT id FROM public.contracts WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contract_accounting_entries: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Budget items before budgets
    DELETE FROM public.budget_items WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('budget_items: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Employee-related child tables
    DELETE FROM public.attendance WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('attendance: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Asset-related child tables
    DELETE FROM public.asset_depreciation WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_depreciation: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.asset_assignments WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_assignments: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.asset_maintenance WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_maintenance: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.asset_transfers WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_transfers: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.asset_valuations WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_valuations: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Bank-related child tables
    DELETE FROM public.bank_transactions WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('bank_transactions: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.bank_reconciliation_matches WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('bank_reconciliation_matches: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.bank_reconciliation_reports WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('bank_reconciliation_reports: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.bank_reconciliation_imports WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('bank_reconciliation_imports: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.checkbooks WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('checkbooks: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.checks WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('checks: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.received_checks WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('received_checks: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Customer-related tables
    DELETE FROM public.customer_transaction_log WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('customer_transaction_log: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.customer_subsidiary_ledger WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('customer_subsidiary_ledger: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.customer_history WHERE customer_id IN (
        SELECT id FROM public.customers WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('customer_history: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Vehicle-related tables
    DELETE FROM public.vehicle_costs WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('vehicle_costs: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.maintenance_logs WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('maintenance_logs: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.vehicle_documents WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('vehicle_documents: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Level 2: Delete main transactional tables (in correct order)
    
    -- Payments first (they might reference invoices)
    DELETE FROM public.payments WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('payments: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Additional charges (they reference contracts and customers)
    DELETE FROM public.additional_charges WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('additional_charges: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Invoices (they reference contracts)
    DELETE FROM public.invoices WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('invoices: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Journal entries
    DELETE FROM public.journal_entries WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('journal_entries: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Contracts (after invoices and additional charges)
    DELETE FROM public.contracts WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contracts: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Budgets
    DELETE FROM public.budgets WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('budgets: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Level 3: Master data tables
    DELETE FROM public.customers WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('customers: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.vehicles WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('vehicles: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.employees WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('employees: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.suppliers WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('suppliers: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.fixed_assets WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('fixed_assets: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.cost_centers WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('cost_centers: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.departments WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('departments: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.branches WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('branches: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.bank_accounts WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('bank_accounts: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('chart_of_accounts: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.office_locations WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('office_locations: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Level 4: Configuration and settings tables
    DELETE FROM public.accounting_templates WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('accounting_templates: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.advanced_accounting_settings WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('advanced_accounting_settings: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    DELETE FROM public.company_branding WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('company_branding: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Level 5: User and access tables
    DELETE FROM public.tenant_users WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('tenant_users: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    -- Level 6: Finally delete the tenant itself
    DELETE FROM public.tenants WHERE id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('tenants: ' || records_count::text);
        total_records_deleted := total_records_deleted + records_count;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم حذف المؤسسة وجميع البيانات المرتبطة بها بنجاح',
        'tenant_id', tenant_id_param,
        'tenant_name', tenant_record.name,
        'deleted_tables', deleted_tables,
        'total_records_deleted', total_records_deleted,
        'deletion_timestamp', now()
    );

EXCEPTION WHEN OTHERS THEN
    -- Capture detailed error information
    GET STACKED DIAGNOSTICS error_details = PG_EXCEPTION_DETAIL;
    
    RETURN jsonb_build_object(
        'success', false,
        'error', 'خطأ أثناء حذف المؤسسة: ' || SQLERRM,
        'error_detail', error_details,
        'sql_state', SQLSTATE,
        'tenant_id', tenant_id_param,
        'partial_deletion', deleted_tables
    );
END;
$$;