-- Performance Optimization: Creating optimized indexes
-- Phase 1: Essential Indexes for Performance Improvement

-- 1. Contracts table indexes
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_status 
ON contracts(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_contracts_customer_tenant 
ON contracts(customer_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_contracts_vehicle_tenant 
ON contracts(vehicle_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_contracts_end_date_status 
ON contracts(end_date, status);

CREATE INDEX IF NOT EXISTS idx_contracts_start_date_tenant 
ON contracts(start_date, tenant_id);

-- 2. Payments table indexes  
CREATE INDEX IF NOT EXISTS idx_payments_invoice_tenant 
ON payments(invoice_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_payments_contract_tenant 
ON payments(contract_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_payments_customer_tenant 
ON payments(customer_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_payments_date_tenant 
ON payments(payment_date, tenant_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_tenant 
ON payments(status, tenant_id);

-- 3. Invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_tenant 
ON invoices(customer_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_invoices_contract_tenant 
ON invoices(contract_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status_tenant 
ON invoices(status, tenant_id);

CREATE INDEX IF NOT EXISTS idx_invoices_due_date_status 
ON invoices(due_date, status);

CREATE INDEX IF NOT EXISTS idx_invoices_date_tenant 
ON invoices(invoice_date, tenant_id);

-- 4. Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status 
ON vehicles(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate 
ON vehicles(license_plate);

CREATE INDEX IF NOT EXISTS idx_vehicles_make_model 
ON vehicles(make, model);

-- 5. Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_status 
ON customers(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_customers_phone 
ON customers(phone);

CREATE INDEX IF NOT EXISTS idx_customers_email 
ON customers(email);

-- 6. Dashboard performance indexes
CREATE INDEX IF NOT EXISTS idx_contracts_monthly_revenue 
ON contracts(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_vehicles_maintenance_due 
ON vehicles(next_maintenance_due) WHERE next_maintenance_due IS NOT NULL;