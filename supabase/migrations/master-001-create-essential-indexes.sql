-- Master Migration 001: Essential Database Indexes
-- This consolidates all performance optimization indexes into one file
-- Replaces multiple separate index creation migrations

-- ============================================
-- CONTRACTS TABLE INDEXES
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_tenant_status 
ON contracts(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_customer_tenant 
ON contracts(customer_id, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_vehicle_tenant 
ON contracts(vehicle_id, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_end_date_status 
ON contracts(end_date, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_start_date_tenant 
ON contracts(start_date, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_monthly_revenue 
ON contracts(tenant_id, created_at);

-- ============================================
-- PAYMENTS TABLE INDEXES
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_invoice_tenant 
ON payments(invoice_id, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_contract_tenant 
ON payments(contract_id, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_customer_tenant 
ON payments(customer_id, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_date_tenant 
ON payments(payment_date, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_tenant 
ON payments(status, tenant_id);

-- ============================================
-- INVOICES TABLE INDEXES
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_customer_tenant 
ON invoices(customer_id, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_contract_tenant 
ON invoices(contract_id, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_status_tenant 
ON invoices(status, tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_due_date_status 
ON invoices(due_date, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_date_tenant 
ON invoices(invoice_date, tenant_id);

-- ============================================
-- VEHICLES TABLE INDEXES
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_status 
ON vehicles(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_license_plate 
ON vehicles(license_plate);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_make_model 
ON vehicles(make, model);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_maintenance_due 
ON vehicles(next_maintenance_due) WHERE next_maintenance_due IS NOT NULL;

-- ============================================
-- CUSTOMERS TABLE INDEXES
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tenant_status 
ON customers(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone 
ON customers(phone);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email 
ON customers(email);

-- ============================================
-- EMPLOYEES TABLE INDEXES
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_tenant_status 
ON employees(tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_user_id 
ON employees(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department 
ON employees(department_id);

-- ============================================
-- PERFORMANCE MONITORING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.get_query_performance_stats()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_size text,
  usage_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    schemaname||'.'||tablename as table_name,
    indexname as index_name,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    idx_scan as usage_count
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
$$;