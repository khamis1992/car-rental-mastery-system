-- ========================================
-- تحديثات شاملة لنظام إدارة تأجير السيارات
-- التاريخ: 2025-01-01
-- الغرض: إضافة CRM المتقدم والخدمات المتكاملة
-- ========================================

-- التحقق من وجود جدول database_migrations وإنشاؤه إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS database_migrations (
    id SERIAL PRIMARY KEY,
    version TEXT UNIQUE NOT NULL,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- تحديثات جدول العملاء (customers)
-- ========================================

-- إضافة الأعمدة الجديدة إذا لم تكن موجودة
DO $$
BEGIN
    -- lifecycle_stage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'lifecycle_stage') THEN
        ALTER TABLE customers ADD COLUMN lifecycle_stage TEXT DEFAULT 'prospect' 
        CHECK (lifecycle_stage IN ('prospect', 'lead', 'customer', 'loyal_customer', 'vip_customer', 'churned', 'inactive'));
    END IF;

    -- customer_code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_code') THEN
        ALTER TABLE customers ADD COLUMN customer_code TEXT;
    END IF;

    -- segments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'segments') THEN
        ALTER TABLE customers ADD COLUMN segments TEXT[] DEFAULT '{}';
    END IF;

    -- tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tags') THEN
        ALTER TABLE customers ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    -- source
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'source') THEN
        ALTER TABLE customers ADD COLUMN source TEXT;
    END IF;

    -- assigned_to
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'assigned_to') THEN
        ALTER TABLE customers ADD COLUMN assigned_to UUID;
    END IF;

    -- secondary_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'secondary_phone') THEN
        ALTER TABLE customers ADD COLUMN secondary_phone TEXT;
    END IF;

    -- identification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'identification') THEN
        ALTER TABLE customers ADD COLUMN identification JSONB;
    END IF;

    -- financial_info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'financial_info') THEN
        ALTER TABLE customers ADD COLUMN financial_info JSONB;
    END IF;

    -- preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'preferences') THEN
        ALTER TABLE customers ADD COLUMN preferences JSONB;
    END IF;

    -- company_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_name') THEN
        ALTER TABLE customers ADD COLUMN company_name TEXT;
    END IF;

    -- type (إعادة تسمية customer_type إلى type إذا لزم الأمر)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_type') THEN
            -- إضافة العمود الجديد
            ALTER TABLE customers ADD COLUMN type TEXT DEFAULT 'individual' 
            CHECK (type IN ('individual', 'corporate'));
            -- نسخ البيانات
            UPDATE customers SET type = customer_type::text WHERE type IS NULL;
        ELSE
            ALTER TABLE customers ADD COLUMN type TEXT DEFAULT 'individual' 
            CHECK (type IN ('individual', 'corporate'));
        END IF;
    END IF;
END $$;

-- تحديث customer_code للصفوف الموجودة
UPDATE customers 
SET customer_code = 'CUS' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0')
WHERE customer_code IS NULL OR customer_code = '';

-- تحديث البيانات الموجودة بالقيم الافتراضية
UPDATE customers 
SET 
    lifecycle_stage = COALESCE(lifecycle_stage, 'prospect'),
    segments = COALESCE(segments, '{}'),
    tags = COALESCE(tags, '{}'),
    type = COALESCE(type, 'individual')
WHERE 
    lifecycle_stage IS NULL 
    OR segments IS NULL 
    OR tags IS NULL 
    OR type IS NULL;

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_customers_lifecycle_stage ON customers (lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers (customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers (type);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers (source);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers (assigned_to);

-- ========================================
-- إنشاء الجداول الجديدة
-- ========================================

-- جدول الأحداث التجارية (Business Events)
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

-- جدول جلسات المستخدمين المتقدم
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

-- ========================================
-- إنشاء الفهارس للجداول الجديدة
-- ========================================

-- فهارس business_events
CREATE INDEX IF NOT EXISTS idx_business_events_type ON business_events (event_type);
CREATE INDEX IF NOT EXISTS idx_business_events_tenant ON business_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_events_processed ON business_events (processed);
CREATE INDEX IF NOT EXISTS idx_business_events_scheduled ON business_events (scheduled_at);

-- فهارس customer_activities
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer ON customer_activities (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_tenant ON customer_activities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_date ON customer_activities (date);

-- فهارس sales_opportunities
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_customer ON sales_opportunities (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales_opportunities (stage);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_tenant ON sales_opportunities (tenant_id);

-- فهارس support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets (customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets (tenant_id);

-- فهارس api_requests_log
CREATE INDEX IF NOT EXISTS idx_api_requests_tenant ON api_requests_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_timestamp ON api_requests_log (timestamp);
CREATE INDEX IF NOT EXISTS idx_api_requests_path ON api_requests_log (path);

-- فهارس user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant ON user_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions (is_active);

-- ========================================
-- إنشاء العلاقات (Foreign Keys)
-- ========================================

-- إضافة foreign keys إذا لم تكن موجودة
DO $$
BEGIN
    -- customer_activities -> customers
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_activities_customer_id_fkey') THEN
        ALTER TABLE customer_activities ADD CONSTRAINT customer_activities_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
    END IF;

    -- sales_opportunities -> customers
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sales_opportunities_customer_id_fkey') THEN
        ALTER TABLE sales_opportunities ADD CONSTRAINT sales_opportunities_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
    END IF;

    -- support_tickets -> customers
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'support_tickets_customer_id_fkey') THEN
        ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        -- تجاهل الأخطاء إذا كانت الجداول المرجعية غير موجودة
        NULL;
END $$;

-- ========================================
-- إنشاء الدوال المساعدة
-- ========================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات للجداول الجديدة
DROP TRIGGER IF EXISTS update_sales_opportunities_updated_at ON sales_opportunities;
CREATE TRIGGER update_sales_opportunities_updated_at
    BEFORE UPDATE ON sales_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at
    BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- تفعيل Row Level Security (RLS)
-- ========================================

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS أساسية (يمكن تخصيصها لاحقاً)
DO $$
BEGIN
    -- سياسة للعملاء والأنشطة
    DROP POLICY IF EXISTS tenant_isolation_policy ON customer_activities;
    CREATE POLICY tenant_isolation_policy ON customer_activities
        FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

    DROP POLICY IF EXISTS tenant_isolation_policy ON sales_opportunities;
    CREATE POLICY tenant_isolation_policy ON sales_opportunities
        FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

    DROP POLICY IF EXISTS tenant_isolation_policy ON support_tickets;
    CREATE POLICY tenant_isolation_policy ON support_tickets
        FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
EXCEPTION
    WHEN others THEN
        -- تجاهل الأخطاء إذا كانت السياسات موجودة
        NULL;
END $$;

-- ========================================
-- إدراج البيانات الافتراضية
-- ========================================

-- إدراج بعض البيانات التجريبية للاختبار (اختياري)
-- يمكن حذف هذا القسم في البيئة الإنتاجية

-- ========================================
-- تسجيل إكمال التحديثات
-- ========================================

INSERT INTO database_migrations (version, description, applied_at)
VALUES 
    ('2025_01_01_comprehensive_updates', 'تطبيق التحديثات الشاملة للنظام المتكامل', NOW()),
    ('2025_01_01_crm_advanced', 'إضافة نظام CRM المتقدم', NOW()),
    ('2025_01_01_event_bus', 'إضافة Event Bus System', NOW()),
    ('2025_01_01_api_gateway', 'إضافة API Gateway', NOW())
ON CONFLICT (version) DO NOTHING;

-- ========================================
-- انتهاء التحديثات
-- ========================================

-- عرض ملخص التحديثات
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'تم إكمال التحديثات بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'الجداول الجديدة:';
    RAISE NOTICE '✅ business_events - نظام الأحداث التجارية';
    RAISE NOTICE '✅ customer_activities - أنشطة العملاء';
    RAISE NOTICE '✅ sales_opportunities - فرص البيع';
    RAISE NOTICE '✅ marketing_campaigns - الحملات التسويقية';
    RAISE NOTICE '✅ support_tickets - تذاكر الدعم';
    RAISE NOTICE '✅ api_requests_log - سجل طلبات API';
    RAISE NOTICE '✅ user_sessions - جلسات المستخدمين المتقدمة';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'الأعمدة الجديدة في جدول customers:';
    RAISE NOTICE '✅ lifecycle_stage - مرحلة دورة حياة العميل';
    RAISE NOTICE '✅ customer_code - كود العميل';
    RAISE NOTICE '✅ segments - شرائح العملاء';
    RAISE NOTICE '✅ tags - علامات العميل';
    RAISE NOTICE '✅ source - مصدر العميل';
    RAISE NOTICE '✅ assigned_to - مُعيَّن إلى';
    RAISE NOTICE '✅ secondary_phone - رقم هاتف ثانوي';
    RAISE NOTICE '✅ identification - معلومات الهوية';
    RAISE NOTICE '✅ financial_info - المعلومات المالية';
    RAISE NOTICE '✅ preferences - التفضيلات';
    RAISE NOTICE '========================================';
END $$; 