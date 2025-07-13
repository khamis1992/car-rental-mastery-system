-- إنشاء الجداول الجديدة للخدمات المتقدمة
-- تاريخ الإنشاء: 2025-01-01
-- الغرض: إنشاء الجداول اللازمة لـ Event Bus, API Gateway, CRM, وغيرها

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
-- CRM Tables
-- ==========================================

-- جدول أنشطة العملاء
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
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
    customer_id UUID NOT NULL,
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
    customer_id UUID NOT NULL,
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

-- فهارس CRM
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer ON customer_activities (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_tenant ON customer_activities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_customer ON sales_opportunities (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales_opportunities (stage);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets (customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);

-- ==========================================
-- Authentication Tables
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

-- فهارس Authentication
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant ON user_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions (is_active);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs (timestamp);

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

-- فهارس Unified Data System
CREATE INDEX IF NOT EXISTS idx_unified_entities_type ON unified_data_entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_unified_entities_tenant ON unified_data_entities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_unified_entities_updated ON unified_data_entities (updated_at);
CREATE INDEX IF NOT EXISTS idx_data_audit_tenant ON data_audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_audit_entity ON data_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_results_tenant ON sync_results (tenant_id);

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

-- إنشاء المحفزات للجداول الجديدة
CREATE TRIGGER update_sales_opportunities_updated_at
    BEFORE UPDATE ON sales_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
    BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_data_entities_updated_at
    BEFORE UPDATE ON unified_data_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- دالة تنفيذ SQL
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Row Level Security (RLS) للجداول الجديدة
-- ==========================================

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_data_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_audit_log ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للجداول الجديدة
CREATE POLICY IF NOT EXISTS tenant_isolation_policy ON business_events
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_policy ON customer_activities
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_policy ON sales_opportunities
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_policy ON marketing_campaigns
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_policy ON support_tickets
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_policy ON unified_data_entities
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_policy ON data_audit_log
    FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));

-- تسجيل إكمال التحديث
INSERT INTO database_migrations (version, description, applied_at)
VALUES ('20250101_create_advanced_tables', 'إنشاء الجداول الجديدة للخدمات المتقدمة', NOW())
ON CONFLICT (version) DO NOTHING; 