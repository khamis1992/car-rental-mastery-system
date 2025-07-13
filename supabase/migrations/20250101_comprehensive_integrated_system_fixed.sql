-- إنشاء قاعدة البيانات الشاملة للنظام المتكامل - نسخة محدثة
-- تاريخ الإنشاء: 2025-01-01
-- الوصف: قاعدة بيانات شاملة لدعم جميع الخدمات المتطورة - مع حل مشكلة الجداول المفقودة

-- ==========================================
-- إنشاء الجداول الأساسية المفقودة أولاً
-- ==========================================

-- إنشاء جدول ملفات المستخدمين
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    position TEXT,
    department TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    bio TEXT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- الحقول الجديدة للأمان المتقدم
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_methods TEXT[] DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    account_locked BOOLEAN DEFAULT FALSE,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    suspension_reason TEXT,
    preferences JSONB DEFAULT '{}',
    security_settings JSONB DEFAULT '{}'
);

-- إنشاء جدول الاشتراكات
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price_per_month DECIMAL(10,2) NOT NULL,
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول دليل الحسابات الافتراضي
CREATE TABLE IF NOT EXISTS default_chart_of_accounts (
    account_code TEXT PRIMARY KEY,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    parent_account TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الأذونات الافتراضية
CREATE TABLE IF NOT EXISTS default_permissions (
    permission TEXT PRIMARY KEY,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الأدوار الافتراضية
CREATE TABLE IF NOT EXISTS default_roles (
    name TEXT PRIMARY KEY,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول هجرة قاعدة البيانات
CREATE TABLE IF NOT EXISTS database_migrations (
    version TEXT PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Event Bus Tables
-- ==========================================

-- جدول الأحداث التجارية
CREATE TABLE IF NOT EXISTS business_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    source_service TEXT NOT NULL,
    source_id TEXT,
    aggregate_id TEXT,
    aggregate_type TEXT,
    event_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    error TEXT,
    failed_at TIMESTAMP WITH TIME ZONE,
    tenant_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس Event Bus
CREATE INDEX IF NOT EXISTS idx_business_events_type ON business_events (event_type);
CREATE INDEX IF NOT EXISTS idx_business_events_tenant ON business_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_events_processed ON business_events (processed);
CREATE INDEX IF NOT EXISTS idx_business_events_scheduled ON business_events (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_business_events_priority ON business_events (priority);

-- ==========================================
-- API Gateway Tables
-- ==========================================

-- جدول طلبات API
CREATE TABLE IF NOT EXISTS api_requests_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    client_id TEXT NOT NULL,
    user_id UUID,
    tenant_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_headers JSONB,
    response_body JSONB,
    response_size INTEGER,
    processing_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول التخزين المؤقت لـ API
CREATE TABLE IF NOT EXISTS api_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT NOT NULL,
    response_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    tenant_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول صحة الخدمات
CREATE TABLE IF NOT EXISTS service_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    response_time INTEGER,
    error_rate DECIMAL(5,4),
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس API Gateway
CREATE INDEX IF NOT EXISTS idx_api_requests_tenant ON api_requests_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_timestamp ON api_requests_log (timestamp);
CREATE INDEX IF NOT EXISTS idx_api_requests_path ON api_requests_log (path);
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache (expires_at);

-- ==========================================
-- Tenant Management Tables
-- ==========================================

-- جدول المستأجرين المحسن
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    business_type TEXT,
    registration_number TEXT,
    tax_id TEXT,
    address JSONB,
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
    suspension_reason TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE,
    reactivated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول اشتراكات المستأجرين
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise', 'custom')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    price_per_month DECIMAL(10,2),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    auto_renewal BOOLEAN DEFAULT TRUE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    upgrade_date TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    amount_due DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول موارد المستأجرين
CREATE TABLE IF NOT EXISTS tenant_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    allocated_cpu_cores INTEGER NOT NULL,
    allocated_memory_gb INTEGER NOT NULL,
    allocated_storage_gb INTEGER NOT NULL,
    allocated_bandwidth_gb INTEGER NOT NULL,
    allocated_db_connections INTEGER NOT NULL,
    used_cpu_percent DECIMAL(5,2) DEFAULT 0,
    used_memory_gb DECIMAL(10,2) DEFAULT 0,
    used_storage_gb DECIMAL(10,2) DEFAULT 0,
    used_bandwidth_gb DECIMAL(10,2) DEFAULT 0,
    used_db_connections INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول استخدام المستأجرين
CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metrics JSONB NOT NULL,
    costs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول مدفوعات المستأجرين
CREATE TABLE IF NOT EXISTS tenant_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'KWD',
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
    invoice_id UUID,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول فواتير المستأجرين
CREATE TABLE IF NOT EXISTS tenant_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    line_items JSONB DEFAULT '[]',
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول أرصدة المستأجرين
CREATE TABLE IF NOT EXISTS tenant_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'KWD',
    reason TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس Tenant Management
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants (domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_tenant_resources_tenant ON tenant_resources (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant ON tenant_payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_tenant ON tenant_invoices (tenant_id);

-- ==========================================
-- Advanced Authentication Tables
-- ==========================================

-- جدول الجلسات المتقدم
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID,
    token TEXT NOT NULL,
    refresh_token TEXT,
    device_fingerprint TEXT,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_trusted_device BOOLEAN DEFAULT FALSE,
    mfa_verified BOOLEAN DEFAULT FALSE,
    session_data JSONB DEFAULT '{}'
);

-- جدول الأجهزة الموثوقة
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT,
    os_info TEXT,
    browser_info TEXT,
    trusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

-- جدول سجل الأمان
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    tenant_id UUID,
    event_type TEXT NOT NULL,
    event_description TEXT,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    risk_score INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    additional_data JSONB DEFAULT '{}'
);

-- جدول تاريخ كلمات المرور
CREATE TABLE IF NOT EXISTS password_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول طلبات MFA
CREATE TABLE IF NOT EXISTS mfa_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    method TEXT NOT NULL,
    code TEXT NOT NULL,
    device_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس Advanced Authentication
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant ON user_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions (is_active);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history (user_id);

-- ==========================================
-- CRM Tables
-- ==========================================

-- جدول العملاء المحسن
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual', 'corporate')),
    full_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    secondary_phone TEXT,
    address JSONB,
    identification JSONB,
    financial_info JSONB,
    preferences JSONB,
    lifecycle_stage TEXT DEFAULT 'prospect' CHECK (lifecycle_stage IN ('prospect', 'lead', 'customer', 'loyal_customer', 'vip_customer', 'churned', 'inactive')),
    segments TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    source TEXT,
    assigned_to UUID,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_code, tenant_id)
);

-- جدول أنشطة العملاء
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    metadata JSONB DEFAULT '{}',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول فرص البيع
CREATE TABLE IF NOT EXISTS sales_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    opportunity_name TEXT NOT NULL,
    description TEXT,
    stage TEXT DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'on_hold')),
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    value DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'KWD',
    expected_close_date TIMESTAMP WITH TIME ZONE,
    actual_close_date TIMESTAMP WITH TIME ZONE,
    source TEXT,
    assigned_to UUID,
    products_services JSONB DEFAULT '[]',
    competitors TEXT[] DEFAULT '{}',
    notes TEXT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الحملات التسويقية
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'cancelled')),
    target_audience TEXT[] DEFAULT '{}',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    budget DECIMAL(10,2) DEFAULT 0,
    spent DECIMAL(10,2) DEFAULT 0,
    channels TEXT[] DEFAULT '{}',
    message TEXT,
    metrics JSONB DEFAULT '{}',
    created_by UUID,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول تذاكر الدعم
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'escalated', 'resolved', 'closed', 'cancelled')),
    assigned_to UUID,
    created_by UUID,
    resolution TEXT,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
    tags TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    resolved_at TIMESTAMP WITH TIME ZONE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول حسابات العملاء
CREATE TABLE IF NOT EXISTS customer_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_code, tenant_id)
);

-- فهارس CRM
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_lifecycle ON customers (lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer ON customer_activities (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_tenant ON customer_activities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_customer ON sales_opportunities (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales_opportunities (stage);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets (customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);

-- ==========================================
-- Unified Data System Tables
-- ==========================================

-- جدول الكيانات الموحدة
CREATE TABLE IF NOT EXISTS unified_data_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT,
    tenant_id UUID NOT NULL,
    source_system TEXT,
    checksum TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE(entity_type, entity_id, tenant_id)
);

-- جدول سجل التدقيق
CREATE TABLE IF NOT EXISTS data_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    field_name TEXT,
    old_value JSONB,
    new_value JSONB,
    changed_by TEXT,
    change_reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    tenant_id UUID NOT NULL
);

-- جدول نتائج المزامنة
CREATE TABLE IF NOT EXISTS sync_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    total_records INTEGER,
    processed_records INTEGER,
    failed_records INTEGER,
    conflicts JSONB DEFAULT '[]',
    errors JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول استخدام التخزين
CREATE TABLE IF NOT EXISTS storage_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    entity_type TEXT,
    total_size_bytes BIGINT DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سجل استعلامات قاعدة البيانات
CREATE TABLE IF NOT EXISTS database_query_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    query_type TEXT,
    table_name TEXT,
    execution_time_ms INTEGER,
    rows_affected INTEGER,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- جدول التقارير المُنشأة
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    report_type TEXT NOT NULL,
    report_name TEXT NOT NULL,
    parameters JSONB,
    file_path TEXT,
    file_size BIGINT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول سجل الإيميلات
CREATE TABLE IF NOT EXISTS email_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT,
    template_name TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

-- جدول سجل الرسائل النصية
CREATE TABLE IF NOT EXISTS sms_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    to_phone TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    gateway_response JSONB
);

-- فهارس Unified Data System
CREATE INDEX IF NOT EXISTS idx_unified_entities_type ON unified_data_entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_unified_entities_tenant ON unified_data_entities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_unified_entities_updated ON unified_data_entities (updated_at);
CREATE INDEX IF NOT EXISTS idx_data_audit_tenant ON data_audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_audit_entity ON data_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_results_tenant ON sync_results (tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_usage_tenant ON storage_usage (tenant_id);

-- ==========================================
-- Enhanced User Management
-- ==========================================

-- جدول الأذونات
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    permission TEXT NOT NULL,
    tenant_id UUID NOT NULL,
    granted_by UUID,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, permission, tenant_id)
);

-- جدول الأدوار
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

-- جدول ربط المستخدمين بالأدوار
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id, tenant_id)
);

-- فهارس User Management
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant ON user_permissions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role_id);

-- ==========================================
-- Functions and Triggers
-- ==========================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
    BEFORE UPDATE ON tenant_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_resources_updated_at
    BEFORE UPDATE ON tenant_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_data_entities_updated_at
    BEFORE UPDATE ON unified_data_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- دالة زيادة عدد مرات الدخول
CREATE OR REPLACE FUNCTION increment_login_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET login_count = COALESCE(login_count, 0) + 1,
        last_login = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- دالة تنفيذ SQL
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة حساب إجمالي الإيرادات
CREATE OR REPLACE FUNCTION calculate_total_revenue(p_tenant_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_revenue DECIMAL := 0;
BEGIN
    -- التحقق من وجود جدول contracts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
        SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue
        FROM contracts
        WHERE tenant_id = p_tenant_id AND status = 'active';
    END IF;
    
    RETURN total_revenue;
END;
$$ LANGUAGE plpgsql;

-- دالة حساب نقاط جودة البيانات
CREATE OR REPLACE FUNCTION calculate_data_quality_score(p_tenant_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_entities INTEGER := 0;
    healthy_entities INTEGER := 0;
    quality_score DECIMAL := 0;
BEGIN
    SELECT COUNT(*) INTO total_entities
    FROM unified_data_entities
    WHERE tenant_id = p_tenant_id;
    
    SELECT COUNT(*) INTO healthy_entities
    FROM unified_data_entities
    WHERE tenant_id = p_tenant_id 
    AND checksum IS NOT NULL 
    AND data IS NOT NULL;
    
    IF total_entities > 0 THEN
        quality_score := (healthy_entities::DECIMAL / total_entities::DECIMAL) * 100;
    END IF;
    
    RETURN quality_score;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- تفعيل RLS على الجداول الرئيسية
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_data_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمستأجرين
CREATE POLICY tenant_isolation_policy ON business_events
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON customers
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON customer_activities
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON unified_data_entities
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON data_audit_log
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_policy ON user_profiles
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- سياسات المستأجرين للمسؤولين
CREATE POLICY tenant_admin_policy ON tenants
    FOR ALL USING (
        id = current_setting('app.current_tenant')::UUID OR
        current_setting('app.user_role') = 'super_admin'
    );

-- ==========================================
-- Views
-- ==========================================

-- عرض إحصائيات المستأجرين
CREATE OR REPLACE VIEW tenant_statistics AS
SELECT 
    t.id,
    t.name,
    t.status,
    ts.plan_type,
    ts.price_per_month,
    ts.expires_at,
    COALESCE(customer_count.count, 0) as total_customers,
    COALESCE(contract_count.count, 0) as total_contracts,
    COALESCE(revenue.total, 0) as total_revenue,
    tr.allocated_storage_gb,
    tr.used_storage_gb,
    t.created_at
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
LEFT JOIN tenant_resources tr ON t.id = tr.tenant_id
LEFT JOIN (
    SELECT tenant_id, COUNT(*) as count
    FROM customers
    GROUP BY tenant_id
) customer_count ON t.id = customer_count.tenant_id
LEFT JOIN (
    SELECT tenant_id, COUNT(*) as count
    FROM contracts
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts')
    GROUP BY tenant_id
) contract_count ON t.id = contract_count.tenant_id
LEFT JOIN (
    SELECT tenant_id, SUM(total_amount) as total
    FROM contracts
    WHERE status = 'active' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts')
    GROUP BY tenant_id
) revenue ON t.id = revenue.tenant_id;

-- عرض نشاط النظام
CREATE OR REPLACE VIEW system_activity AS
SELECT 
    'events' as activity_type,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM business_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
UNION ALL
SELECT 
    'api_requests' as activity_type,
    COUNT(*) as count,
    DATE_TRUNC('day', timestamp) as date
FROM api_requests_log
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
UNION ALL
SELECT 
    'customers' as activity_type,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM customers
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- عرض أداء الخدمات
CREATE OR REPLACE VIEW service_performance AS
SELECT 
    service_name,
    AVG(response_time) as avg_response_time,
    AVG(error_rate) as avg_error_rate,
    COUNT(*) as health_checks,
    MAX(last_check) as last_check
FROM service_health
WHERE last_check >= NOW() - INTERVAL '1 day'
GROUP BY service_name;

-- ==========================================
-- Initial Data
-- ==========================================

-- إدراج خطط الاشتراك الافتراضية
INSERT INTO subscription_plans (id, name, type, price_per_month, features, limits, active)
VALUES 
('starter', 'خطة البداية', 'starter', 50.00, 
 '{"accounting": true, "fleet_management": true, "basic_reports": true}',
 '{"max_users": 5, "max_vehicles": 10, "max_contracts": 50, "max_storage_gb": 10}',
 true),
('professional', 'الخطة المهنية', 'professional', 150.00,
 '{"accounting": true, "fleet_management": true, "crm": true, "advanced_reports": true, "api_access": true}',
 '{"max_users": 25, "max_vehicles": 50, "max_contracts": 250, "max_storage_gb": 100}',
 true),
('enterprise', 'خطة المؤسسات', 'enterprise', 500.00,
 '{"accounting": true, "fleet_management": true, "crm": true, "hr_management": true, "advanced_reports": true, "api_access": true, "white_label": true}',
 '{"max_users": 100, "max_vehicles": 200, "max_contracts": 1000, "max_storage_gb": 500}',
 true)
ON CONFLICT (id) DO NOTHING;

-- إدراج دليل الحسابات الافتراضي
INSERT INTO default_chart_of_accounts (account_code, account_name, account_type, parent_account, is_active)
VALUES 
('1110101', 'صندوق - نقد عام', 'asset', NULL, true),
('1110102', 'صندوق - عملة أجنبية', 'asset', NULL, true),
('1120101', 'البنك الأهلي الكويتي - حساب جاري', 'asset', NULL, true),
('1120102', 'بنك الخليج - حساب جاري', 'asset', NULL, true),
('1130101', 'العملاء - حسابات مدينة', 'asset', NULL, true),
('1130102', 'أوراق القبض', 'asset', NULL, true),
('1140101', 'المخزون - قطع غيار', 'asset', NULL, true),
('1140102', 'المخزون - وقود', 'asset', NULL, true),
('1150101', 'الأصول الثابتة - مركبات', 'asset', NULL, true),
('1150102', 'مجمع إهلاك المركبات', 'asset', NULL, true),
('2110101', 'الموردين - حسابات دائنة', 'liability', NULL, true),
('2110102', 'أوراق الدفع', 'liability', NULL, true),
('2120101', 'مرتبات مستحقة', 'liability', NULL, true),
('2120102', 'ضرائب مستحقة', 'liability', NULL, true),
('3110101', 'رأس المال', 'equity', NULL, true),
('3120101', 'الأرباح المحتجزة', 'equity', NULL, true),
('4110101', 'إيرادات الإيجار - سيارات اقتصادية', 'revenue', NULL, true),
('4110102', 'إيرادات الإيجار - سيارات فاخرة', 'revenue', NULL, true),
('4120101', 'إيرادات خدمات إضافية', 'revenue', NULL, true),
('5110101', 'تكاليف التشغيل المباشرة', 'expense', NULL, true),
('5110102', 'تكاليف الوقود', 'expense', NULL, true),
('5120101', 'المرتبات والأجور', 'expense', NULL, true),
('5120102', 'الإيجارات', 'expense', NULL, true),
('5130101', 'مصروفات التسويق', 'expense', NULL, true),
('5130102', 'مصروفات إدارية', 'expense', NULL, true)
ON CONFLICT (account_code) DO NOTHING;

-- إدراج الأذونات الافتراضية
INSERT INTO default_permissions (permission, description, category)
VALUES 
('accounting:read', 'عرض البيانات المحاسبية', 'accounting'),
('accounting:write', 'تعديل البيانات المحاسبية', 'accounting'),
('contracts:read', 'عرض العقود', 'contracts'),
('contracts:write', 'تعديل العقود', 'contracts'),
('customers:read', 'عرض العملاء', 'customers'),
('customers:write', 'تعديل العملاء', 'customers'),
('fleet:read', 'عرض المركبات', 'fleet'),
('fleet:write', 'تعديل المركبات', 'fleet'),
('reports:read', 'عرض التقارير', 'reports'),
('reports:generate', 'إنشاء التقارير', 'reports'),
('users:read', 'عرض المستخدمين', 'users'),
('users:write', 'إدارة المستخدمين', 'users'),
('system:admin', 'إدارة النظام', 'system')
ON CONFLICT (permission) DO NOTHING;

-- إدراج الأدوار الافتراضية
INSERT INTO default_roles (name, description, permissions)
VALUES 
('admin', 'مدير النظام', ARRAY['accounting:read', 'accounting:write', 'contracts:read', 'contracts:write', 'customers:read', 'customers:write', 'fleet:read', 'fleet:write', 'reports:read', 'reports:generate', 'users:read', 'users:write']),
('accountant', 'محاسب', ARRAY['accounting:read', 'accounting:write', 'reports:read', 'reports:generate']),
('sales', 'مبيعات', ARRAY['customers:read', 'customers:write', 'contracts:read', 'contracts:write']),
('operator', 'مشغل', ARRAY['fleet:read', 'contracts:read', 'customers:read']),
('viewer', 'مشاهد', ARRAY['accounting:read', 'contracts:read', 'customers:read', 'fleet:read', 'reports:read'])
ON CONFLICT (name) DO NOTHING;

-- إنشاء الفهارس النهائية
CREATE INDEX IF NOT EXISTS idx_business_events_composite ON business_events (tenant_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_api_requests_composite ON api_requests_log (tenant_id, timestamp, method);
CREATE INDEX IF NOT EXISTS idx_customers_composite ON customers (tenant_id, lifecycle_stage, created_at);
CREATE INDEX IF NOT EXISTS idx_unified_entities_composite ON unified_data_entities (tenant_id, entity_type, updated_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);

-- تسجيل إكمال الترقية
INSERT INTO database_migrations (version, description, applied_at)
VALUES ('20250101_comprehensive_integrated_system_fixed', 'إنشاء قاعدة البيانات الشاملة للنظام المتكامل - نسخة محدثة', NOW())
ON CONFLICT (version) DO NOTHING;

-- إنشاء وظيفة لتسجيل الأحداث
CREATE OR REPLACE FUNCTION log_business_event(
    p_event_type TEXT,
    p_source_service TEXT,
    p_event_data JSONB,
    p_tenant_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO business_events (
        event_type,
        source_service,
        event_data,
        tenant_id
    ) VALUES (
        p_event_type,
        p_source_service,
        p_event_data,
        p_tenant_id
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- رسالة نجاح
DO $$
BEGIN
    RAISE NOTICE 'تم إنشاء النظام المالي المتكامل بنجاح! 🎉';
    RAISE NOTICE 'الجداول المُنشأة: %', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'business_events', 'api_requests_log', 'tenants', 
            'tenant_subscriptions', 'customers', 'user_profiles',
            'unified_data_entities', 'data_audit_log'
        )
    );
END $$; 