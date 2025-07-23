-- Create optimized dashboard stats RPC function
CREATE OR REPLACE FUNCTION public.get_optimized_dashboard_stats(tenant_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    total_contracts_count integer := 0;
    active_contracts_count integer := 0;
    available_vehicles_count integer := 0;
    monthly_revenue_amount numeric := 0;
    pending_payments_count integer := 0;
    expiring_contracts_count integer := 0;
BEGIN
    -- Get total contracts count
    SELECT COUNT(*) INTO total_contracts_count
    FROM contracts 
    WHERE tenant_id = tenant_id_param;

    -- Get active contracts count
    SELECT COUNT(*) INTO active_contracts_count
    FROM contracts 
    WHERE tenant_id = tenant_id_param 
    AND status = 'active';

    -- Get available vehicles count
    SELECT COUNT(*) INTO available_vehicles_count
    FROM vehicles 
    WHERE tenant_id = tenant_id_param 
    AND status = 'available';

    -- Get monthly revenue (current month)
    SELECT COALESCE(SUM(amount), 0) INTO monthly_revenue_amount
    FROM payments 
    WHERE tenant_id = tenant_id_param 
    AND status = 'completed'
    AND payment_date >= date_trunc('month', CURRENT_DATE);

    -- Get pending payments count
    SELECT COUNT(*) INTO pending_payments_count
    FROM invoices 
    WHERE tenant_id = tenant_id_param 
    AND status IN ('pending', 'overdue');

    -- Get expiring contracts count (next 30 days)
    SELECT COUNT(*) INTO expiring_contracts_count
    FROM contracts 
    WHERE tenant_id = tenant_id_param 
    AND status = 'active'
    AND end_date <= CURRENT_DATE + INTERVAL '30 days';

    -- Build result object
    result := jsonb_build_object(
        'totalContracts', total_contracts_count,
        'activeContracts', active_contracts_count,
        'availableVehicles', available_vehicles_count,
        'monthlyRevenue', monthly_revenue_amount,
        'pendingPayments', pending_payments_count,
        'expiringContracts', expiring_contracts_count
    );

    RETURN result;
END;
$function$;