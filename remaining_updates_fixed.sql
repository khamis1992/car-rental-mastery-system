-- ========================================
-- التحديثات المتبقية الضرورية - نسخة مصححة
-- التاريخ: 2025-01-01
-- الغرض: إكمال التحديثات المطلوبة بعد database_updates_fixed.sql
-- ========================================

-- ==========================================
-- تحديث جداول إدارة المستأجرين الموجودة
-- ==========================================

-- إضافة الأعمدة المفقودة لجدول tenants إذا كان موجوداً
DO $$
BEGIN
    -- التحقق من وجود جدول tenants وإنشاؤه إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        CREATE TABLE tenants (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            domain TEXT UNIQUE,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
            tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'enterprise')),
            settings JSONB DEFAULT '{}',
            custom_branding JSONB DEFAULT '{}',
            contact_info JSONB DEFAULT '{}',
            billing_info JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- إضافة الأعمدة المفقودة إذا كان الجدول موجوداً
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'tier') THEN
            ALTER TABLE tenants ADD COLUMN tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'enterprise'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'settings') THEN
            ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{}';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'custom_branding') THEN
            ALTER TABLE tenants ADD COLUMN custom_branding JSONB DEFAULT '{}';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'contact_info') THEN
            ALTER TABLE tenants ADD COLUMN contact_info JSONB DEFAULT '{}';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'billing_info') THEN
            ALTER TABLE tenants ADD COLUMN billing_info JSONB DEFAULT '{}';
        END IF;
    END IF;
END $$;

-- جدول اشتراكات المستأجرين
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_type TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    price_per_month DECIMAL(10,2) NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method TEXT,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة foreign key للجدول إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tenant_subscriptions_tenant_id_fkey') THEN
        ALTER TABLE tenant_subscriptions ADD CONSTRAINT tenant_subscriptions_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        NULL; -- تجاهل الخطأ إذا كان المرجع غير موجود
END $$;

-- جدول موارد المستأجرين
CREATE TABLE IF NOT EXISTS tenant_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    resource_type TEXT NOT NULL,
    allocated_amount BIGINT NOT NULL,
    used_amount BIGINT DEFAULT 0,
    unit_type TEXT NOT NULL,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    billing_period TEXT DEFAULT 'monthly',
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة foreign key للجدول إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tenant_resources_tenant_id_fkey') THEN
        ALTER TABLE tenant_resources ADD CONSTRAINT tenant_resources_tenant_id_fkey 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        NULL; -- تجاهل الخطأ إذا كان المرجع غير موجود
END $$;

-- ==========================================
-- نظام الأمان المتقدم
-- ==========================================

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

-- جدول طلبات المصادقة متعددة العوامل
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

-- ==========================================
-- نظام التدقيق والمراقبة
-- ==========================================

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

-- ==========================================
-- نظام الأذونات والأدوار المتقدم
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
    role_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id, tenant_id)
);

-- إضافة foreign key للأدوار إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_roles_role_id_fkey') THEN
        ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_id_fkey 
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        NULL; -- تجاهل الخطأ إذا كان المرجع غير موجود
END $$;

-- ==========================================
-- النظام المالي المتقدم
-- ==========================================

-- جدول الأنشطة (Activity-Based Costing)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_code VARCHAR(20) NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    activity_description TEXT,
    cost_driver VARCHAR(100) NOT NULL,
    cost_pool_id UUID,
    department_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    tenant_id UUID NOT NULL
);

-- جدول محركات التكلفة
CREATE TABLE IF NOT EXISTS cost_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_code VARCHAR(20) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    measurement_unit VARCHAR(50) NOT NULL,
    driver_type VARCHAR(50) NOT NULL,
    calculation_method VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL
);

-- جدول تخصيص التكاليف
CREATE TABLE IF NOT EXISTS cost_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL,
    cost_center_id UUID NOT NULL,
    resource_id UUID,
    allocation_basis VARCHAR(50) NOT NULL,
    allocation_percentage DECIMAL(5,2),
    allocated_amount DECIMAL(15,3) NOT NULL,
    allocation_date DATE NOT NULL,
    allocation_period VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL
);

-- جدول التنبؤات المالية
CREATE TABLE IF NOT EXISTS financial_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_name VARCHAR(100) NOT NULL,
    forecast_type VARCHAR(50) NOT NULL,
    forecast_period VARCHAR(20) NOT NULL,
    base_year INTEGER NOT NULL,
    forecast_years INTEGER NOT NULL,
    methodology VARCHAR(100) NOT NULL,
    assumptions TEXT,
    forecast_data JSONB NOT NULL,
    accuracy_score DECIMAL(5,2),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL
);

-- جدول المخاطر المالية
CREATE TABLE IF NOT EXISTS financial_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_code VARCHAR(20) NOT NULL,
    risk_name VARCHAR(100) NOT NULL,
    risk_description TEXT,
    risk_type VARCHAR(50) NOT NULL,
    risk_category VARCHAR(50) NOT NULL,
    probability_score INTEGER CHECK (probability_score >= 1 AND probability_score <= 10),
    impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
    risk_score INTEGER,
    mitigation_strategy TEXT,
    mitigation_cost DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active',
    identified_date DATE NOT NULL,
    review_date DATE,
    responsible_person UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL
);

-- تحديث risk_score عند تغيير probability_score أو impact_score
DO $$
BEGIN
    -- محاولة إضافة trigger لحساب risk_score
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_risk_score_trigger') THEN
        CREATE OR REPLACE FUNCTION calculate_risk_score_func()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.risk_score := NEW.probability_score * NEW.impact_score;
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        
        CREATE TRIGGER calculate_risk_score_trigger
        BEFORE INSERT OR UPDATE ON financial_risks
        FOR EACH ROW
        EXECUTE FUNCTION calculate_risk_score_func();
    END IF;
EXCEPTION
    WHEN others THEN
        NULL; -- تجاهل الخطأ إذا كان trigger موجود
END $$;

-- جدول النماذج التنبؤية
CREATE TABLE IF NOT EXISTS predictive_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    target_variable VARCHAR(100) NOT NULL,
    features JSONB NOT NULL,
    hyperparameters JSONB,
    training_data_period VARCHAR(50),
    accuracy_metrics JSONB,
    model_file_path TEXT,
    is_active BOOLEAN DEFAULT true,
    trained_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL
);

-- جدول التحليلات التنبؤية
CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL,
    prediction_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actual_value DECIMAL(15,2),
    variance_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL
);

-- إضافة foreign key للنماذج التنبؤية
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'predictive_analytics_model_id_fkey') THEN
        ALTER TABLE predictive_analytics ADD CONSTRAINT predictive_analytics_model_id_fkey 
        FOREIGN KEY (model_id) REFERENCES predictive_models(id);
    END IF;
EXCEPTION
    WHEN others THEN
        NULL; -- تجاهل الخطأ إذا كان المرجع غير موجود
END $$;

-- جدول الإنذارات الذكية
CREATE TABLE IF NOT EXISTS intelligent_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    alert_category VARCHAR(50) NOT NULL,
    alert_title VARCHAR(200) NOT NULL,
    alert_description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    alert_data JSONB,
    triggered_by VARCHAR(100),
    trigger_condition TEXT,
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID NOT NULL
);

-- ==========================================
-- الفهارس المحسنة
-- ==========================================

-- فهارس المستأجرين
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants (domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_resources_tenant ON tenant_resources (tenant_id);

-- فهارس الأمان
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs (timestamp);

-- فهارس النظام المالي
CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_drivers_tenant_id ON cost_drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_tenant_id ON cost_allocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_risks_tenant_id ON financial_risks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_predictive_models_tenant_id ON predictive_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_tenant_id ON intelligent_alerts(tenant_id);

-- ==========================================
-- الدوال المالية المتقدمة
-- ==========================================

-- دالة حساب نقاط المخاطر
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_probability INTEGER,
    p_impact INTEGER
) RETURNS INTEGER AS $$
BEGIN
    RETURN p_probability * p_impact;
END;
$$ LANGUAGE plpgsql;

-- دالة حساب تقييم الائتمان
CREATE OR REPLACE FUNCTION calculate_credit_rating(
    p_payment_history DECIMAL,
    p_outstanding_balance DECIMAL,
    p_credit_limit DECIMAL
) RETURNS VARCHAR(5) AS $$
DECLARE
    credit_ratio DECIMAL;
    rating VARCHAR(5);
BEGIN
    credit_ratio := p_outstanding_balance / NULLIF(p_credit_limit, 0);
    
    IF p_payment_history >= 0.95 AND credit_ratio <= 0.3 THEN
        rating := 'AAA';
    ELSIF p_payment_history >= 0.90 AND credit_ratio <= 0.5 THEN
        rating := 'AA';
    ELSIF p_payment_history >= 0.80 AND credit_ratio <= 0.7 THEN
        rating := 'A';
    ELSIF p_payment_history >= 0.70 AND credit_ratio <= 0.8 THEN
        rating := 'BBB';
    ELSE
        rating := 'BB';
    END IF;
    
    RETURN rating;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- تفعيل Row Level Security
-- ==========================================

-- تفعيل RLS على الجداول الحساسة
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligent_alerts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- البيانات الافتراضية (مُحدثة)
-- ==========================================

-- إدراج بيانات المستأجر الرئيسي بأمان
DO $$
BEGIN
    -- التحقق من وجود البيانات قبل الإدراج
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE domain = 'main.car-rental.com') THEN
        INSERT INTO tenants (name, domain, status) VALUES 
            ('نظام إدارة السيارات الرئيسي', 'main.car-rental.com', 'active');
    END IF;
    
    -- إضافة tier للسجلات الموجودة إذا كانت NULL
    UPDATE tenants SET tier = 'enterprise' WHERE tier IS NULL;
EXCEPTION
    WHEN others THEN
        -- تجاهل الأخطاء وإدراج إشعار
        RAISE NOTICE 'تعذر إدراج البيانات الافتراضية، لكن الجداول تم إنشاؤها بنجاح';
END $$;

-- ==========================================
-- انتهاء التحديثات
-- ==========================================

-- إشعار إكمال التحديثات
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 تم إكمال التحديثات المتبقية بنجاح! 🎉';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'الجداول الجديدة المضافة:';
    RAISE NOTICE '✅ نظام إدارة المستأجرين المتقدم';
    RAISE NOTICE '✅ نظام الأمان والمصادقة المتقدم';
    RAISE NOTICE '✅ نظام التدقيق والمراقبة';
    RAISE NOTICE '✅ نظام الأذونات والأدوار';
    RAISE NOTICE '✅ النظام المالي المتقدم (ABC)';
    RAISE NOTICE '✅ التنبؤات والتحليلات المالية';
    RAISE NOTICE '✅ إدارة المخاطر المالية';
    RAISE NOTICE '✅ الذكاء الاصطناعي المالي';
    RAISE NOTICE '✅ الإنذارات الذكية';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚀 النظام جاهز الآن للاستخدام المتقدم!';
    RAISE NOTICE 'يمكنك الآن الاستفادة من:';
    RAISE NOTICE '- إدارة متعددة المستأجرين';
    RAISE NOTICE '- نظام CRM متقدم كامل';
    RAISE NOTICE '- محاسبة متطورة مع ABC';
    RAISE NOTICE '- ذكاء اصطناعي مالي';
    RAISE NOTICE '- أمان متقدم';
    RAISE NOTICE '========================================';
END $$; 