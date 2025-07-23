-- Performance Optimization: Creating optimized indexes
-- Phase 1: Essential Indexes for Performance Improvement

-- 1. Contracts table indexes
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_status 
ON contracts(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_contracts_customer_tenant 
ON contracts(customer_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_contracts_end_date_status 
ON contracts(end_date, status);

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
ON invoices(due_date, status);

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
ON contracts(tenant_id, created_at);