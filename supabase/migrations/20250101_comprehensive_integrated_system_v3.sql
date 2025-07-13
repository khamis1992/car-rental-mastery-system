-- النظام المتكامل الشامل - الإصدار الثالث
-- حل نهائي لمشكلة role_id والجداول الموجودة مسبقاً
-- تاريخ الإنشاء: 2025-01-01 (محسن)

-- ==========================================
-- التحقق من الجداول الموجودة وإصلاحها
-- ==========================================

-- دالة مساعدة للتحقق من وجود العمود
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- دالة مساعدة للتحقق من وجود الجدول
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- إنشاء/تحديث الجداول الأساسية
-- ==========================================

-- 1. جدول ملفات المستخدمين
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

-- 2. جدول الأدوار
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

-- 3. جدول الأذونات
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

-- 4. إنشاء/تحديث جدول ربط المستخدمين بالأدوار
DO $$ 
BEGIN
    -- إذا كان الجدول موجوداً، تحقق من الأعمدة وأضف المفقود
    IF table_exists('user_roles') THEN
        -- إضافة العمود role_id إذا لم يكن موجوداً
        IF NOT column_exists('user_roles', 'role_id') THEN
            ALTER TABLE user_roles ADD COLUMN role_id UUID;
        END IF;
        
        -- إضافة الأعمدة الأخرى إذا لم تكن موجودة
        IF NOT column_exists('user_roles', 'tenant_id') THEN
            ALTER TABLE user_roles ADD COLUMN tenant_id UUID;
        END IF;
        
        IF NOT column_exists('user_roles', 'assigned_by') THEN
            ALTER TABLE user_roles ADD COLUMN assigned_by UUID;
        END IF;
        
        IF NOT column_exists('user_roles', 'assigned_at') THEN
            ALTER TABLE user_roles ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT column_exists('user_roles', 'expires_at') THEN
            ALTER TABLE user_roles ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        END IF;
    ELSE
        -- إنشاء الجدول كاملاً إذا لم يكن موجوداً
        CREATE TABLE user_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            role_id UUID NOT NULL,
            tenant_id UUID NOT NULL,
            assigned_by UUID,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE,
            UNIQUE(user_id, role_id, tenant_id)
        );
    END IF;
END $$;

-- إضافة قيود التفرد إذا لم تكن موجودة
DO $$ 
BEGIN
    -- إضافة قيد التفرد إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_roles' 
        AND constraint_name = 'user_roles_user_id_role_id_tenant_id_key'
    ) THEN
        ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_id_tenant_id_key 
        UNIQUE(user_id, role_id, tenant_id);
    END IF;
END $$;

-- إضافة المراجع الخارجية بأمان
DO $$ 
BEGIN
    -- إضافة مرجع role_id إلى roles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_roles' 
        AND constraint_name = 'user_roles_role_id_fkey'
    ) THEN
        -- تأكد من أن العمود role_id موجود ومن النوع الصحيح
        IF column_exists('user_roles', 'role_id') THEN
            ALTER TABLE user_roles 
            ADD CONSTRAINT user_roles_role_id_fkey 
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ==========================================
-- الجداول المالية والنظام الأساسي
-- ==========================================

-- جدول دليل الحسابات
CREATE TABLE IF NOT EXISTS default_chart_of_accounts (
    account_code TEXT PRIMARY KEY,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    parent_account TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأذونات الافتراضية
CREATE TABLE IF NOT EXISTS default_permissions (
    permission TEXT PRIMARY KEY,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الأدوار الافتراضية
CREATE TABLE IF NOT EXISTS default_roles (
    name TEXT PRIMARY KEY,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول خطط الاشتراك
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

-- ==========================================
-- نظام Event Bus
-- ==========================================

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
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT
);

-- ==========================================
-- نظام API Gateway
-- ==========================================

CREATE TABLE IF NOT EXISTS api_requests_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    query_params JSONB DEFAULT '{}',
    request_body JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    api_key_id TEXT,
    rate_limit_hit BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS api_cache (
    cache_key TEXT PRIMARY KEY,
    cached_value JSONB NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS service_health (
    service_name TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'healthy',
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- ==========================================
-- إدارة المستأجرين
-- ==========================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    subscription_plan TEXT DEFAULT 'starter',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    owner_id UUID
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'KWD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    resource_type TEXT NOT NULL,
    current_usage INTEGER DEFAULT 0,
    max_limit INTEGER NOT NULL,
    unit TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, resource_type)
);

CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    metric_type TEXT NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS tenant_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'KWD',
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS tenant_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'KWD',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    items JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS tenant_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'KWD',
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    used_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- نظام المصادقة المتقدم
-- ==========================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT,
    is_trusted BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    tenant_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mfa_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    method TEXT NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- نظام CRM
-- ==========================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    notes TEXT,
    lifecycle_stage TEXT DEFAULT 'prospect' CHECK (lifecycle_stage IN ('prospect', 'lead', 'customer', 'loyal', 'vip', 'churned')),
    assigned_to UUID,
    last_contact DATE,
    next_followup DATE,
    customer_value DECIMAL(10,2) DEFAULT 0,
    acquisition_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    outcome TEXT,
    next_action TEXT,
    user_id UUID,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    value DECIMAL(10,2) NOT NULL,
    probability INTEGER DEFAULT 50,
    stage TEXT DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    assigned_to UUID,
    expected_close_date DATE,
    actual_close_date DATE,
    loss_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    spent DECIMAL(10,2) DEFAULT 0,
    target_audience JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
    assigned_to UUID,
    category TEXT,
    resolution TEXT,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS customer_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    account_number TEXT NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    payment_terms TEXT DEFAULT 'net_30',
    currency TEXT DEFAULT 'KWD',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- نظام البيانات الموحد
-- ==========================================

CREATE TABLE IF NOT EXISTS unified_data_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    checksum TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS data_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_system TEXT,
    correlation_id TEXT
);

CREATE TABLE IF NOT EXISTS sync_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    source_system TEXT NOT NULL,
    target_system TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS storage_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    storage_type TEXT NOT NULL,
    used_bytes BIGINT DEFAULT 0,
    max_bytes BIGINT NOT NULL,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS database_query_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    query_type TEXT NOT NULL,
    execution_time_ms INTEGER,
    rows_affected INTEGER,
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    query_hash TEXT
);

CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    report_type TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    file_path TEXT,
    file_size BIGINT,
    generated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS email_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS sms_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS database_migrations (
    version TEXT PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- إنشاء الفهارس
-- ==========================================

-- فهارس الجداول الأساسية
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant ON user_permissions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role_id);

-- فهارس Event Bus
CREATE INDEX IF NOT EXISTS idx_business_events_type ON business_events (event_type);
CREATE INDEX IF NOT EXISTS idx_business_events_tenant ON business_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_events_processed ON business_events (processed);
CREATE INDEX IF NOT EXISTS idx_business_events_scheduled ON business_events (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_business_events_priority ON business_events (priority);

-- فهارس API Gateway
CREATE INDEX IF NOT EXISTS idx_api_requests_tenant ON api_requests_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_timestamp ON api_requests_log (timestamp);
CREATE INDEX IF NOT EXISTS idx_api_requests_path ON api_requests_log (path);
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache (expires_at);

-- فهارس إدارة المستأجرين
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants (domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_tenant_resources_tenant ON tenant_resources (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant ON tenant_payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_tenant ON tenant_invoices (tenant_id);

-- فهارس نظام المصادقة
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant ON user_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions (is_active);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history (user_id);

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

-- فهارس البيانات الموحدة
CREATE INDEX IF NOT EXISTS idx_unified_entities_type ON unified_data_entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_unified_entities_tenant ON unified_data_entities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_unified_entities_updated ON unified_data_entities (updated_at);
CREATE INDEX IF NOT EXISTS idx_data_audit_tenant ON data_audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_audit_entity ON data_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_results_tenant ON sync_results (tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_usage_tenant ON storage_usage (tenant_id);

-- فهارس مركبة للأداء
CREATE INDEX IF NOT EXISTS idx_business_events_composite ON business_events (tenant_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_api_requests_composite ON api_requests_log (tenant_id, timestamp, method);
CREATE INDEX IF NOT EXISTS idx_customers_composite ON customers (tenant_id, lifecycle_stage, created_at);
CREATE INDEX IF NOT EXISTS idx_unified_entities_composite ON unified_data_entities (tenant_id, entity_type, updated_at);

-- ==========================================
-- الدوال والمشغلات
-- ==========================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- مشغلات التحديث التلقائي
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
    BEFORE UPDATE ON tenant_subscriptions
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

-- دالة زيادة عدد تسجيلات الدخول
CREATE OR REPLACE FUNCTION increment_login_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET login_count = login_count + 1, 
        last_login = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- دالة تسجيل الأحداث التجارية
CREATE OR REPLACE FUNCTION log_business_event(
    p_event_type TEXT,
    p_source_service TEXT,
    p_tenant_id UUID,
    p_event_data JSONB,
    p_priority TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO business_events (
        event_type, source_service, tenant_id, event_data, priority
    ) VALUES (
        p_event_type, p_source_service, p_tenant_id, p_event_data, p_priority
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- إدراج البيانات الافتراضية
-- ==========================================

-- إدراج دليل الحسابات الافتراضي
INSERT INTO default_chart_of_accounts (account_code, account_name, account_type, parent_account) VALUES
('1000', 'الأصول', 'Assets', NULL),
('1100', 'الأصول المتداولة', 'Current Assets', '1000'),
('1110', 'النقد في الصندوق', 'Cash in Hand', '1100'),
('1120', 'النقد في البنك', 'Cash in Bank', '1100'),
('1130', 'حسابات المدينين', 'Accounts Receivable', '1100'),
('1140', 'المخزون', 'Inventory', '1100'),
('1200', 'الأصول الثابتة', 'Fixed Assets', '1000'),
('1210', 'الأراضي والمباني', 'Land and Buildings', '1200'),
('1220', 'المعدات والآلات', 'Equipment and Machinery', '1200'),
('1230', 'أسطول المركبات', 'Fleet Vehicles', '1200'),
('2000', 'الخصوم', 'Liabilities', NULL),
('2100', 'الخصوم المتداولة', 'Current Liabilities', '2000'),
('2110', 'حسابات الدائنين', 'Accounts Payable', '2100'),
('2120', 'الرواتب المستحقة', 'Accrued Salaries', '2100'),
('2130', 'الضرائب المستحقة', 'Accrued Taxes', '2100'),
('2200', 'الخصوم طويلة الأجل', 'Long-term Liabilities', '2000'),
('2210', 'القروض طويلة الأجل', 'Long-term Loans', '2200'),
('3000', 'حقوق الملكية', 'Equity', NULL),
('3100', 'رأس المال', 'Capital', '3000'),
('3200', 'الأرباح المحتجزة', 'Retained Earnings', '3000'),
('4000', 'الإيرادات', 'Revenue', NULL),
('4100', 'إيرادات تأجير المركبات', 'Vehicle Rental Revenue', '4000'),
('4200', 'إيرادات الخدمات الإضافية', 'Additional Services Revenue', '4000'),
('5000', 'المصروفات', 'Expenses', NULL),
('5100', 'تكلفة الخدمات المباشرة', 'Direct Service Costs', '5000'),
('5200', 'مصروفات التشغيل', 'Operating Expenses', '5000'),
('5210', 'الرواتب والأجور', 'Salaries and Wages', '5200'),
('5220', 'الإيجار', 'Rent', '5200'),
('5230', 'المرافق العامة', 'Utilities', '5200'),
('5240', 'التأمين', 'Insurance', '5200'),
('5250', 'صيانة المركبات', 'Vehicle Maintenance', '5200'),
('5260', 'الوقود', 'Fuel', '5200'),
('5270', 'التسويق والإعلان', 'Marketing and Advertising', '5200'),
('5280', 'المصروفات الإدارية', 'Administrative Expenses', '5200')
ON CONFLICT (account_code) DO NOTHING;

-- إدراج الأذونات الافتراضية
INSERT INTO default_permissions (permission, description, category) VALUES
('users.create', 'إنشاء المستخدمين', 'المستخدمون'),
('users.read', 'عرض المستخدمين', 'المستخدمون'),
('users.update', 'تعديل المستخدمين', 'المستخدمون'),
('users.delete', 'حذف المستخدمين', 'المستخدمون'),
('roles.create', 'إنشاء الأدوار', 'الأدوار'),
('roles.read', 'عرض الأدوار', 'الأدوار'),
('roles.update', 'تعديل الأدوار', 'الأدوار'),
('roles.delete', 'حذف الأدوار', 'الأدوار'),
('customers.create', 'إنشاء العملاء', 'العملاء'),
('customers.read', 'عرض العملاء', 'العملاء'),
('customers.update', 'تعديل العملاء', 'العملاء'),
('customers.delete', 'حذف العملاء', 'العملاء'),
('contracts.create', 'إنشاء العقود', 'العقود'),
('contracts.read', 'عرض العقود', 'العقود'),
('contracts.update', 'تعديل العقود', 'العقود'),
('contracts.delete', 'حذف العقود', 'العقود'),
('vehicles.create', 'إنشاء المركبات', 'الأسطول'),
('vehicles.read', 'عرض المركبات', 'الأسطول'),
('vehicles.update', 'تعديل المركبات', 'الأسطول'),
('vehicles.delete', 'حذف المركبات', 'الأسطول'),
('accounting.create', 'إنشاء القيود المحاسبية', 'المحاسبة'),
('accounting.read', 'عرض التقارير المالية', 'المحاسبة'),
('accounting.update', 'تعديل القيود المحاسبية', 'المحاسبة'),
('accounting.delete', 'حذف القيود المحاسبية', 'المحاسبة'),
('reports.generate', 'إنشاء التقارير', 'التقارير'),
('reports.export', 'تصدير التقارير', 'التقارير'),
('settings.read', 'عرض الإعدادات', 'الإعدادات'),
('settings.update', 'تعديل الإعدادات', 'الإعدادات'),
('admin.full_access', 'الوصول الكامل للنظام', 'الإدارة')
ON CONFLICT (permission) DO NOTHING;

-- إدراج الأدوار الافتراضية
INSERT INTO default_roles (name, description, permissions) VALUES
('super_admin', 'مدير النظام الأعلى', ARRAY['admin.full_access']),
('admin', 'مدير النظام', ARRAY['users.create', 'users.read', 'users.update', 'users.delete', 'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'customers.create', 'customers.read', 'customers.update', 'customers.delete', 'contracts.create', 'contracts.read', 'contracts.update', 'contracts.delete', 'vehicles.create', 'vehicles.read', 'vehicles.update', 'vehicles.delete', 'accounting.create', 'accounting.read', 'accounting.update', 'accounting.delete', 'reports.generate', 'reports.export', 'settings.read', 'settings.update']),
('manager', 'مدير الفرع', ARRAY['users.read', 'customers.create', 'customers.read', 'customers.update', 'contracts.create', 'contracts.read', 'contracts.update', 'vehicles.read', 'vehicles.update', 'accounting.read', 'reports.generate', 'reports.export']),
('employee', 'موظف', ARRAY['customers.read', 'customers.create', 'customers.update', 'contracts.read', 'contracts.create', 'contracts.update', 'vehicles.read', 'reports.generate']),
('accountant', 'محاسب', ARRAY['accounting.create', 'accounting.read', 'accounting.update', 'reports.generate', 'reports.export', 'customers.read', 'contracts.read']),
('viewer', 'عارض فقط', ARRAY['customers.read', 'contracts.read', 'vehicles.read', 'accounting.read', 'reports.generate'])
ON CONFLICT (name) DO NOTHING;

-- إدراج خطط الاشتراك
INSERT INTO subscription_plans (id, name, type, price_per_month, features, limits) VALUES
('starter', 'الخطة الأساسية', 'monthly', 50.00, 
 '{"vehicles": 10, "users": 5, "contracts": 100, "storage": "5GB", "support": "email"}', 
 '{"max_vehicles": 10, "max_users": 5, "max_contracts": 100, "max_storage_gb": 5}'),
('professional', 'الخطة المهنية', 'monthly', 150.00, 
 '{"vehicles": 50, "users": 15, "contracts": 500, "storage": "25GB", "support": "phone_email", "api_access": true}', 
 '{"max_vehicles": 50, "max_users": 15, "max_contracts": 500, "max_storage_gb": 25}'),
('enterprise', 'الخطة التجارية', 'monthly', 500.00, 
 '{"vehicles": "unlimited", "users": "unlimited", "contracts": "unlimited", "storage": "100GB", "support": "24/7", "api_access": true, "custom_reports": true}', 
 '{"max_vehicles": -1, "max_users": -1, "max_contracts": -1, "max_storage_gb": 100}')
ON CONFLICT (id) DO NOTHING;

-- إدراج سجل الهجرة
INSERT INTO database_migrations (version, description) VALUES
('20250101_v3', 'النظام المتكامل الشامل - الإصدار الثالث - حل مشكلة role_id')
ON CONFLICT (version) DO NOTHING;

-- ==========================================
-- تنظيف الدوال المساعدة
-- ==========================================

-- حذف الدوال المساعدة المؤقتة
DROP FUNCTION IF EXISTS column_exists(text, text);
DROP FUNCTION IF EXISTS table_exists(text);

-- ==========================================
-- إنجاز الإعداد
-- ==========================================

-- تحديث الإحصائيات
ANALYZE;

-- رسالة الإنجاز
DO $$ 
BEGIN
    RAISE NOTICE 'تم إنشاء النظام المتكامل الشامل بنجاح! الإصدار الثالث - حل مشكلة role_id - تاريخ: %', NOW();
END $$; 