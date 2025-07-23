-- Performance Optimization: Creating optimized indexes
-- Phase 1: Essential Indexes for Performance Improvement

-- 1. Contracts table indexes
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_status 
ON contracts(tenant_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_contracts_customer_tenant 
ON contracts(customer_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_contracts_end_date_status 
ON contracts(end_date, status) 
WHERE status = 'active' AND end_date <= CURRENT_DATE + INTERVAL '30 days';

-- 2. Payments table indexes  
CREATE INDEX IF NOT EXISTS idx_payments_invoice_tenant 
ON payments(invoice_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_payments_date_tenant 
ON payments(payment_date, tenant_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_tenant 
ON payments(status, tenant_id);

-- 3. Invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_tenant 
ON invoices(customer_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status_tenant 
ON invoices(status, tenant_id);

CREATE INDEX IF NOT EXISTS idx_invoices_due_date_status 
ON invoices(due_date, status) 
WHERE status IN ('pending', 'overdue');

-- 4. Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status 
ON vehicles(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_vehicles_contract_tenant 
ON vehicles(contract_id, tenant_id);

-- 5. Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_status 
ON customers(tenant_id, status);

-- 6. Dashboard performance indexes
CREATE INDEX IF NOT EXISTS idx_contracts_monthly_revenue 
ON contracts(tenant_id, created_at) 
WHERE status = 'active';

-- 7. Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_customers_search 
ON customers USING GIN(to_tsvector('arabic', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));

CREATE INDEX IF NOT EXISTS idx_vehicles_search 
ON vehicles USING GIN(to_tsvector('arabic', license_plate || ' ' || COALESCE(model, '') || ' ' || COALESCE(make, '')));

-- 8. Performance monitoring view
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  null_frac
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;