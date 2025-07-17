-- Drop and recreate the hard_delete_tenant function with comprehensive deletion order
DROP FUNCTION IF EXISTS public.hard_delete_tenant(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.hard_delete_tenant(tenant_id_param UUID, deletion_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_record RECORD;
    deleted_tables TEXT[] := '{}';
    records_count INTEGER;
    total_deleted INTEGER := 0;
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
    
    -- Log the deletion attempt
    INSERT INTO public.tenant_deletion_log (
        tenant_id, tenant_name, tenant_slug, deleted_by, deletion_reason, deletion_type
    ) VALUES (
        tenant_id_param, tenant_record.name, tenant_record.slug, 
        auth.uid(), deletion_reason, 'hard_delete'
    );
    
    -- Delete in correct order to avoid foreign key constraints
    
    -- 1. Delete payment-related data first
    DELETE FROM public.payments WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('payments: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 2. Delete invoice items before invoices
    DELETE FROM public.invoice_items WHERE invoice_id IN (
        SELECT id FROM public.invoices WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('invoice_items: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 3. Delete invoices
    DELETE FROM public.invoices WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('invoices: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 4. Delete additional charges
    DELETE FROM public.additional_charges WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('additional_charges: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 5. Delete contract-related data
    DELETE FROM public.contract_extensions WHERE contract_id IN (
        SELECT id FROM public.contracts WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contract_extensions: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.contract_incidents WHERE contract_id IN (
        SELECT id FROM public.contracts WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contract_incidents: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.contract_accounting_entries WHERE contract_id IN (
        SELECT id FROM public.contracts WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contract_accounting_entries: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 6. Delete contracts
    DELETE FROM public.contracts WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('contracts: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 7. Delete quotations
    DELETE FROM public.quotations WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('quotations: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 8. Delete customer-related data
    DELETE FROM public.customers WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('customers: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 9. Delete vehicle-related data
    DELETE FROM public.vehicles WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('vehicles: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 10. Delete accounting data
    DELETE FROM public.journal_entry_lines WHERE journal_entry_id IN (
        SELECT id FROM public.journal_entries WHERE tenant_id = tenant_id_param
    );
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('journal_entry_lines: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.journal_entries WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('journal_entries: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.chart_of_accounts WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('chart_of_accounts: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 11. Delete bank-related data
    DELETE FROM public.bank_transactions WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('bank_transactions: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.bank_accounts WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('bank_accounts: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 12. Delete employee-related data
    DELETE FROM public.attendance WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('attendance: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.employees WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('employees: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 13. Delete user-tenant relationships
    DELETE FROM public.tenant_users WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('tenant_users: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 14. Delete budget-related data
    DELETE FROM public.budget_items WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('budget_items: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.budgets WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('budgets: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 15. Delete asset-related data
    DELETE FROM public.asset_depreciation WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_depreciation: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.asset_assignments WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_assignments: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.asset_maintenance WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_maintenance: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.asset_transfers WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_transfers: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.asset_valuations WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('asset_valuations: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.fixed_assets WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('fixed_assets: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 16. Delete other tenant-specific data
    DELETE FROM public.branches WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('branches: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.advanced_accounting_settings WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('advanced_accounting_settings: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.accounting_templates WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('accounting_templates: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    DELETE FROM public.company_branding WHERE tenant_id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('company_branding: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- 17. Finally, delete the tenant itself
    DELETE FROM public.tenants WHERE id = tenant_id_param;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    IF records_count > 0 THEN
        deleted_tables := deleted_tables || ('tenants: ' || records_count::TEXT);
        total_deleted := total_deleted + records_count;
    END IF;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Tenant and all related data deleted successfully',
        'tenant_id', tenant_id_param,
        'tenant_name', tenant_record.name,
        'deleted_tables', deleted_tables,
        'total_records_deleted', total_deleted,
        'deleted_at', now()
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Return error details
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'tenant_id', tenant_id_param,
        'partially_deleted_tables', deleted_tables
    );
END;
$$;