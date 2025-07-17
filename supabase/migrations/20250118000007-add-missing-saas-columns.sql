-- إضافة الأعمدة المفقودة لنظام SaaS
-- التاريخ: 2025-01-18
-- الهدف: إضافة العمودة المفقود next_billing_date وأعمدة أخرى

-- =====================================================
-- 1. إضافة الأعمدة المفقودة لجدول saas_subscriptions
-- =====================================================

-- إضافة العمود المفقود next_billing_date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saas_subscriptions' 
        AND column_name = 'next_billing_date' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.saas_subscriptions 
        ADD COLUMN next_billing_date DATE;
        
        -- تحديث القيم الموجودة
        UPDATE public.saas_subscriptions 
        SET next_billing_date = current_period_end
        WHERE next_billing_date IS NULL;
        
        RAISE NOTICE 'Added next_billing_date column to saas_subscriptions';
    ELSE
        RAISE NOTICE 'next_billing_date column already exists in saas_subscriptions';
    END IF;
END $$;

-- إضافة trial_ends_at إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saas_subscriptions' 
        AND column_name = 'trial_ends_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.saas_subscriptions 
        ADD COLUMN trial_ends_at DATE;
        
        RAISE NOTICE 'Added trial_ends_at column to saas_subscriptions';
    END IF;
END $$;

-- إضافة auto_renew إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saas_subscriptions' 
        AND column_name = 'auto_renew' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.saas_subscriptions 
        ADD COLUMN auto_renew BOOLEAN DEFAULT TRUE;
        
        RAISE NOTICE 'Added auto_renew column to saas_subscriptions';
    END IF;
END $$;

-- =====================================================
-- 2. إضافة أعمدة مفقودة لجدول subscription_plans
-- =====================================================

-- إضافة max_tenants إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'max_tenants' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.subscription_plans 
        ADD COLUMN max_tenants INTEGER DEFAULT 1;
        
        RAISE NOTICE 'Added max_tenants column to subscription_plans';
    END IF;
END $$;

-- إضافة is_popular إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'is_popular' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.subscription_plans 
        ADD COLUMN is_popular BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Added is_popular column to subscription_plans';
    END IF;
END $$;

-- إضافة sort_order إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'sort_order' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.subscription_plans 
        ADD COLUMN sort_order INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added sort_order column to subscription_plans';
    END IF;
END $$;

-- =====================================================
-- 3. إضافة أعمدة مفقودة لجدول saas_payments
-- =====================================================

-- إضافة payment_reference إذا لم يكن موجوداً
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saas_payments' 
        AND column_name = 'payment_reference' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.saas_payments 
        ADD COLUMN payment_reference TEXT;
        
        -- إنشاء payment_reference للسجلات الموجودة
        FOR rec IN (SELECT id FROM public.saas_payments ORDER BY created_at)
        LOOP
            UPDATE public.saas_payments 
            SET payment_reference = 'PAY-' || LPAD(counter::TEXT, 6, '0')
            WHERE id = rec.id;
            
            counter := counter + 1;
        END LOOP;
        
        -- إضافة unique constraint بعد تعبئة البيانات
        ALTER TABLE public.saas_payments 
        ADD CONSTRAINT unique_payment_reference UNIQUE (payment_reference);
        
        RAISE NOTICE 'Added payment_reference column to saas_payments';
    END IF;
END $$;

-- تحديث العملة الافتراضية إلى KWD
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saas_payments' 
        AND column_name = 'currency' 
        AND column_default = '''USD''::text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.saas_payments 
        ALTER COLUMN currency SET DEFAULT 'KWD';
        
        RAISE NOTICE 'Updated currency default to KWD in saas_payments';
    END IF;
END $$;

-- =====================================================
-- 4. إنشاء الفهارس المفقودة (بطريقة آمنة)
-- =====================================================

-- فهرس next_billing_date (المشكلة الأساسية)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saas_subscriptions_billing_date') THEN
        -- التأكد من وجود العمود أولاً
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'saas_subscriptions' 
            AND column_name = 'next_billing_date' 
            AND table_schema = 'public'
        ) THEN
            CREATE INDEX idx_saas_subscriptions_billing_date 
            ON public.saas_subscriptions(next_billing_date) 
            WHERE next_billing_date IS NOT NULL;
            
            RAISE NOTICE 'Created index on next_billing_date';
        END IF;
    END IF;
END $$;

-- فهرس trial_ends_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saas_subscriptions_trial_end') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'saas_subscriptions' 
            AND column_name = 'trial_ends_at' 
            AND table_schema = 'public'
        ) THEN
            CREATE INDEX idx_saas_subscriptions_trial_end 
            ON public.saas_subscriptions(trial_ends_at) 
            WHERE trial_ends_at IS NOT NULL;
            
            RAISE NOTICE 'Created index on trial_ends_at';
        END IF;
    END IF;
END $$;

-- فهارس أخرى
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subscription_plans_active') THEN
        CREATE INDEX idx_subscription_plans_active 
        ON public.subscription_plans(is_active) 
        WHERE is_active = TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saas_subscriptions_tenant') THEN
        CREATE INDEX idx_saas_subscriptions_tenant 
        ON public.saas_subscriptions(tenant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saas_subscriptions_status') THEN
        CREATE INDEX idx_saas_subscriptions_status 
        ON public.saas_subscriptions(status);
    END IF;
END $$;

-- =====================================================
-- 5. إدراج خطط الاشتراك الافتراضية إذا لم تكن موجودة
-- =====================================================

-- التحقق من وجود خطط الاشتراك
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE plan_code = 'basic') THEN
        INSERT INTO public.subscription_plans (
            plan_name, plan_name_en, plan_code, description,
            price_monthly, price_yearly,
            max_users_per_tenant, max_vehicles, max_contracts, storage_limit_gb,
            features, is_active, is_popular, sort_order
        ) VALUES 
                 -- خطة أساسية
        (
            'أساسي', 'Basic', 'basic',
            'خطة مثالية للشركات الصغيرة التي تبدأ في إدارة أسطول السيارات',
            29.999, 299.990,
            10, 50, 100, 5,
            ARRAY['إدارة أساسية للمركبات', 'تقارير بسيطة', 'دعم عبر البريد الإلكتروني', 'إدارة العقود الأساسية', 'تتبع المدفوعات'],
            TRUE, FALSE, 1
        ),
        -- خطة معيارية  
        (
            'معياري', 'Standard', 'standard', 
            'خطة متوازنة للشركات المتوسطة مع ميزات متقدمة',
            49.999, 499.990,
            25, 100, 250, 10,
            ARRAY['جميع مميزات الأساسي', 'تقارير متقدمة', 'إدارة متعددة المستخدمين', 'دعم هاتفي', 'إشعارات SMS', 'تحليلات مالية', 'إدارة الصيانة'],
            TRUE, TRUE, 2
        ),
        -- خطة مميزة
        (
            'مميز', 'Premium', 'premium',
            'خطة شاملة للشركات الكبيرة مع جميع الميزات المتقدمة', 
            79.999, 799.990,
            50, 200, 500, 25,
            ARRAY['جميع مميزات المعياري', 'تحليلات متقدمة', 'API للتكامل', 'دعم أولوي', 'تخصيص التقارير', 'إدارة المخالفات', 'نظام CRM متقدم', 'تكامل مع الأنظمة الخارجية'],
            TRUE, FALSE, 3
        ),
        -- خطة مؤسسية
        (
            'مؤسسي', 'Enterprise', 'enterprise',
            'حل مؤسسي كامل مع دعم مخصص وميزات غير محدودة',
            149.999, 1499.990,
            100, 500, 1000, 100,
            ARRAY['جميع المميزات', 'مستخدمين غير محدود', 'تخصيص كامل', 'دعم مخصص 24/7', 'تدريب مخصص', 'استشارات فنية', 'SLA مضمون', 'تطوير مخصص'],
            TRUE, FALSE, 4
        );
        
        RAISE NOTICE 'Inserted default subscription plans';
    ELSE
        RAISE NOTICE 'Subscription plans already exist';
    END IF;
END $$;

-- =====================================================
-- 6. إنشاء جدول tenant_usage إذا لم يكن موجوداً
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tenant_usage' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.tenant_usage (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            
            -- إحصائيات الاستخدام
            users_count INTEGER NOT NULL DEFAULT 0,
            vehicles_count INTEGER NOT NULL DEFAULT 0,
            contracts_count INTEGER NOT NULL DEFAULT 0,
            storage_used_gb NUMERIC(10,2) NOT NULL DEFAULT 0,
            
            -- إحصائيات إضافية
            active_contracts_count INTEGER DEFAULT 0,
            monthly_revenue NUMERIC(10,2) DEFAULT 0,
            api_calls_count INTEGER DEFAULT 0,
            
            -- فترة الإحصائية
            usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
            usage_month TEXT GENERATED ALWAYS AS (TO_CHAR(usage_date, 'YYYY-MM')) STORED,
            
            -- البيانات الوصفية
            metadata JSONB DEFAULT '{}',
            
            -- التوقيتات
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            
            -- فهرس فريد لكل مؤسسة في كل تاريخ
            UNIQUE(tenant_id, usage_date)
        );
        
        -- تفعيل RLS
        ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Created tenant_usage table';
    ELSE
        RAISE NOTICE 'tenant_usage table already exists';
    END IF;
END $$;

-- إنشاء دالة تحديث استخدام المؤسسة
CREATE OR REPLACE FUNCTION public.update_tenant_usage(tenant_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_data RECORD;
    result JSONB;
BEGIN
    -- حساب الاستخدام الحالي
    SELECT 
        COALESCE((SELECT COUNT(*) FROM public.tenant_users WHERE tenant_id = tenant_id_param), 0) as users_count,
        COALESCE((SELECT COUNT(*) FROM public.vehicles WHERE tenant_id = tenant_id_param), 0) as vehicles_count,
        COALESCE((SELECT COUNT(*) FROM public.contracts WHERE tenant_id = tenant_id_param), 0) as contracts_count,
        COALESCE((SELECT COUNT(*) FROM public.contracts WHERE tenant_id = tenant_id_param AND status = 'active'), 0) as active_contracts_count,
        COALESCE((SELECT SUM(price) FROM public.contracts WHERE tenant_id = tenant_id_param AND status = 'active'), 0) as monthly_revenue
    INTO usage_data;
    
    -- إدراج أو تحديث الاستخدام
    INSERT INTO public.tenant_usage (
        tenant_id, users_count, vehicles_count, contracts_count, 
        active_contracts_count, monthly_revenue, usage_date
    ) VALUES (
        tenant_id_param, usage_data.users_count, usage_data.vehicles_count, 
        usage_data.contracts_count, usage_data.active_contracts_count, 
        usage_data.monthly_revenue, CURRENT_DATE
    )
    ON CONFLICT (tenant_id, usage_date) DO UPDATE SET
        users_count = EXCLUDED.users_count,
        vehicles_count = EXCLUDED.vehicles_count,
        contracts_count = EXCLUDED.contracts_count,
        active_contracts_count = EXCLUDED.active_contracts_count,
        monthly_revenue = EXCLUDED.monthly_revenue,
        updated_at = now();
    
    result := jsonb_build_object(
        'tenant_id', tenant_id_param,
        'users_count', usage_data.users_count,
        'vehicles_count', usage_data.vehicles_count,
        'contracts_count', usage_data.contracts_count,
        'active_contracts_count', usage_data.active_contracts_count,
        'monthly_revenue', usage_data.monthly_revenue,
        'updated_at', now()
    );
    
    RETURN result;
END;
$$;

-- رسالة النجاح
SELECT 'SaaS Missing Columns Added Successfully!' as status; 