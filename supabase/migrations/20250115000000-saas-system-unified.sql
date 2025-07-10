-- =======================================================
-- نظام SaaS الموحد - تنظيف شامل للتضارب
-- تاريخ الإنشاء: 2025-01-15
-- الهدف: توحيد جميع جداول SaaS وحل التضارب
-- =======================================================

-- تنظيف الجداول المتضاربة أولاً
DROP TABLE IF EXISTS public.saas_payments CASCADE;
DROP TABLE IF EXISTS public.saas_invoice_items CASCADE;
DROP TABLE IF EXISTS public.saas_invoices CASCADE;
DROP TABLE IF EXISTS public.saas_subscriptions CASCADE;
DROP TABLE IF EXISTS public.tenant_usage CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.billing_history CASCADE;

-- إنشاء دالة تحديث الوقت إذا لم تكن موجودة
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- 1. جدول خطط الاشتراك (Subscription Plans)
-- =======================================================
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL,
    plan_name_en TEXT,
    plan_code TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- الحدود والمواصفات
    max_tenants INTEGER DEFAULT 1,
    max_users_per_tenant INTEGER DEFAULT 10,
    max_vehicles INTEGER DEFAULT 50,
    max_contracts INTEGER DEFAULT 100,
    storage_limit_gb INTEGER DEFAULT 5,
    
    -- الميزات
    features JSONB DEFAULT '[]'::jsonb,
    
    -- إعدادات الخطة
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- التوقيتات
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- =======================================================
-- 2. جدول الاشتراكات (SaaS Subscriptions)
-- =======================================================
CREATE TABLE public.saas_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    
    -- معلومات الاشتراك
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    
    -- فترات الاشتراك
    current_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
    current_period_end DATE NOT NULL,
    next_billing_date DATE NOT NULL,
    trial_ends_at DATE,
    
    -- معلومات الدفع
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'KWD',
    discount_percentage NUMERIC(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    
    -- إعدادات الاشتراك
    auto_renew BOOLEAN DEFAULT true,
    
    -- معلومات الإلغاء
    canceled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- معلومات Stripe (إذا كان مطلوباً)
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    
    -- التوقيتات
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- =======================================================
-- 3. دالة توليد رقم الفاتورة
-- =======================================================
CREATE OR REPLACE FUNCTION public.generate_saas_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.saas_invoices
    WHERE invoice_number ~ '^SAAS-[0-9]+$';
    
    invoice_number := 'SAAS-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$$;

-- =======================================================
-- 4. جدول الفواتير (SaaS Invoices)
-- =======================================================
CREATE TABLE public.saas_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- معلومات الفاتورة
    invoice_number TEXT UNIQUE NOT NULL DEFAULT generate_saas_invoice_number(),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'canceled', 'void')),
    
    -- المبالغ
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'KWD',
    
    -- فترة الفوترة
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- تواريخ مهمة
    due_date DATE,
    paid_at TIMESTAMPTZ,
    
    -- معلومات إضافية
    description TEXT,
    invoice_pdf_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- معلومات Stripe
    stripe_invoice_id TEXT UNIQUE,
    
    -- التوقيتات
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- =======================================================
-- 5. جدول عناصر الفواتير (Invoice Items)
-- =======================================================
CREATE TABLE public.saas_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
    
    -- معلومات العنصر
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- نوع العنصر
    item_type TEXT NOT NULL DEFAULT 'subscription' CHECK (item_type IN ('subscription', 'usage', 'addon', 'discount', 'tax')),
    
    -- فترة العنصر
    period_start DATE,
    period_end DATE,
    
    -- التوقيتات
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =======================================================
-- 6. جدول المدفوعات (SaaS Payments)
-- =======================================================
CREATE TABLE public.saas_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.saas_invoices(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.saas_subscriptions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- معلومات الدفع
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'KWD',
    
    -- طريقة الدفع
    payment_method TEXT NOT NULL,
    payment_gateway TEXT CHECK (payment_gateway IN ('stripe', 'sadad', 'manual')),
    
    -- الحالة
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')),
    
    -- معلومات الدفع الخارجي
    external_payment_id TEXT,
    payment_reference TEXT,
    
    -- تواريخ مهمة
    paid_at TIMESTAMPTZ,
    
    -- معلومات إضافية
    failure_reason TEXT,
    gateway_response JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- معلومات Stripe
    stripe_payment_intent_id TEXT UNIQUE,
    
    -- التوقيتات
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- =======================================================
-- 7. جدول استخدام المؤسسات (Tenant Usage)
-- =======================================================
CREATE TABLE public.tenant_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- تاريخ الاستخدام
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- معلومات الاستخدام
    users_count INTEGER DEFAULT 0,
    vehicles_count INTEGER DEFAULT 0,
    contracts_count INTEGER DEFAULT 0,
    storage_used_gb NUMERIC(10,2) DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    
    -- التوقيتات
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- فهرس فريد لكل مؤسسة وتاريخ
    UNIQUE(tenant_id, usage_date)
);

-- =======================================================
-- 8. إنشاء الفهارس لتحسين الأداء
-- =======================================================

-- فهارس خطط الاشتراك
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active, sort_order);
CREATE INDEX idx_subscription_plans_code ON public.subscription_plans(plan_code);

-- فهارس الاشتراكات
CREATE INDEX idx_saas_subscriptions_tenant ON public.saas_subscriptions(tenant_id, status);
CREATE INDEX idx_saas_subscriptions_plan ON public.saas_subscriptions(plan_id);
CREATE INDEX idx_saas_subscriptions_billing_date ON public.saas_subscriptions(next_billing_date) WHERE status = 'active';
CREATE INDEX idx_saas_subscriptions_stripe ON public.saas_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- فهارس الفواتير
CREATE INDEX idx_saas_invoices_subscription ON public.saas_invoices(subscription_id);
CREATE INDEX idx_saas_invoices_tenant ON public.saas_invoices(tenant_id, status);
CREATE INDEX idx_saas_invoices_due_date ON public.saas_invoices(due_date) WHERE status IN ('sent', 'overdue');
CREATE INDEX idx_saas_invoices_number ON public.saas_invoices(invoice_number);

-- فهارس عناصر الفواتير
CREATE INDEX idx_saas_invoice_items_invoice ON public.saas_invoice_items(invoice_id);
CREATE INDEX idx_saas_invoice_items_type ON public.saas_invoice_items(item_type);

-- فهارس المدفوعات
CREATE INDEX idx_saas_payments_invoice ON public.saas_payments(invoice_id);
CREATE INDEX idx_saas_payments_subscription ON public.saas_payments(subscription_id);
CREATE INDEX idx_saas_payments_tenant ON public.saas_payments(tenant_id, status);
CREATE INDEX idx_saas_payments_gateway ON public.saas_payments(payment_gateway, status);

-- فهارس استخدام المؤسسات
CREATE INDEX idx_tenant_usage_tenant_date ON public.tenant_usage(tenant_id, usage_date);
CREATE INDEX idx_tenant_usage_date ON public.tenant_usage(usage_date);

-- =======================================================
-- 9. إنشاء Triggers لتحديث updated_at
-- =======================================================

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saas_subscriptions_updated_at
    BEFORE UPDATE ON public.saas_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saas_invoices_updated_at
    BEFORE UPDATE ON public.saas_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saas_payments_updated_at
    BEFORE UPDATE ON public.saas_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_usage_updated_at
    BEFORE UPDATE ON public.tenant_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =======================================================
-- 10. تفعيل Row Level Security
-- =======================================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- =======================================================
-- 11. إنشاء RLS Policies
-- =======================================================

-- خطط الاشتراك - الجميع يمكنه رؤية الخطط النشطة
CREATE POLICY "public_view_active_plans" ON public.subscription_plans
    FOR SELECT
    USING (is_active = true);

-- خطط الاشتراك - المدراء يمكنهم إدارة الخطط
CREATE POLICY "super_admin_manage_plans" ON public.subscription_plans
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- الاشتراكات - المؤسسات يمكنها رؤية اشتراكاتها
CREATE POLICY "tenants_view_own_subscriptions" ON public.saas_subscriptions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- الاشتراكات - المدراء يمكنهم إدارة الاشتراكات
CREATE POLICY "super_admin_manage_subscriptions" ON public.saas_subscriptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- الفواتير - المؤسسات يمكنها رؤية فواتيرها
CREATE POLICY "tenants_view_own_invoices" ON public.saas_invoices
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- الفواتير - المدراء يمكنهم إدارة الفواتير
CREATE POLICY "super_admin_manage_invoices" ON public.saas_invoices
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- عناصر الفواتير - نفس صلاحيات الفواتير
CREATE POLICY "tenants_view_own_invoice_items" ON public.saas_invoice_items
    FOR SELECT
    USING (
        invoice_id IN (
            SELECT id FROM public.saas_invoices 
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.tenant_users 
                WHERE user_id = auth.uid() 
                AND status = 'active'
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- المدفوعات - المؤسسات يمكنها رؤية مدفوعاتها
CREATE POLICY "tenants_view_own_payments" ON public.saas_payments
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- المدفوعات - المدراء يمكنهم إدارة المدفوعات
CREATE POLICY "super_admin_manage_payments" ON public.saas_payments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- استخدام المؤسسات - المؤسسات يمكنها رؤية استخدامها
CREATE POLICY "tenants_view_own_usage" ON public.tenant_usage
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
        OR EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- استخدام المؤسسات - المدراء يمكنهم إدارة الاستخدام
CREATE POLICY "super_admin_manage_usage" ON public.tenant_usage
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND status = 'active'
        )
    );

-- =======================================================
-- 12. إدراج البيانات التجريبية
-- =======================================================

INSERT INTO public.subscription_plans (
    plan_name, plan_name_en, plan_code, description, 
    price_monthly, price_yearly, 
    max_users_per_tenant, max_vehicles, max_contracts, storage_limit_gb,
    features, is_popular, sort_order
) VALUES 
(
    'الخطة الأساسية', 'Basic Plan', 'BASIC',
    'خطة مناسبة للشركات الصغيرة - تشمل الميزات الأساسية لإدارة الأسطول',
    49.99, 499.99,
    10, 25, 100, 5,
    '["إدارة الأسطول", "العقود الأساسية", "التقارير البسيطة", "دعم فني أساسي", "تطبيق جوال"]'::jsonb,
    false, 1
),
(
    'الخطة المتقدمة', 'Professional Plan', 'PROFESSIONAL',
    'خطة مناسبة للشركات المتوسطة - تشمل ميزات متقدمة وتقارير تحليلية',
    99.99, 999.99,
    50, 100, 500, 25,
    '["جميع ميزات الخطة الأساسية", "تقارير متقدمة", "إدارة المخالفات", "المحاسبة المتقدمة", "تكامل APIs", "دعم فني متقدم"]'::jsonb,
    true, 2
),
(
    'خطة المؤسسات', 'Enterprise Plan', 'ENTERPRISE',
    'خطة مناسبة للشركات الكبيرة - حلول شاملة ومخصصة',
    199.99, 1999.99,
    999, 999, 9999, 100,
    '["جميع الميزات", "مستأجرين متعددين", "تخصيص كامل", "API مخصص", "دعم مخصص 24/7", "تدريب شامل", "استشارة مجانية"]'::jsonb,
    false, 3
);

-- =======================================================
-- 13. إنشاء دوال مساعدة
-- =======================================================

-- دالة للحصول على معلومات الاشتراك الحالي للمؤسسة
CREATE OR REPLACE FUNCTION public.get_tenant_current_subscription(tenant_id_param UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    plan_code TEXT,
    status TEXT,
    current_period_end DATE,
    next_billing_date DATE,
    amount NUMERIC,
    currency TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        s.id,
        p.plan_name,
        p.plan_code,
        s.status,
        s.current_period_end,
        s.next_billing_date,
        s.amount,
        s.currency
    FROM public.saas_subscriptions s
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.tenant_id = tenant_id_param
    AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;
$$;

-- دالة لحساب الاستخدام الحالي للمؤسسة
CREATE OR REPLACE FUNCTION public.calculate_tenant_usage(tenant_id_param UUID)
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'users_count', (
            SELECT COUNT(*) FROM public.tenant_users 
            WHERE tenant_id = tenant_id_param AND status = 'active'
        ),
        'vehicles_count', (
            SELECT COUNT(*) FROM public.vehicles 
            WHERE tenant_id = tenant_id_param AND status != 'deleted'
        ),
        'contracts_count', (
            SELECT COUNT(*) FROM public.contracts 
            WHERE tenant_id = tenant_id_param AND status != 'deleted'
        ),
        'storage_used_gb', 0.0,
        'api_calls_count', 0
    );
$$;

-- دالة لتحديث استخدام المؤسسة
CREATE OR REPLACE FUNCTION public.update_tenant_usage_stats(tenant_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_data JSON;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- حساب الاستخدام الحالي
    SELECT public.calculate_tenant_usage(tenant_id_param) INTO usage_data;
    
    -- تحديث أو إدراج بيانات الاستخدام لليوم الحالي
    INSERT INTO public.tenant_usage (
        tenant_id, usage_date, 
        users_count, vehicles_count, contracts_count, 
        storage_used_gb, api_calls_count
    )
    VALUES (
        tenant_id_param, today_date,
        (usage_data->>'users_count')::INTEGER,
        (usage_data->>'vehicles_count')::INTEGER,
        (usage_data->>'contracts_count')::INTEGER,
        (usage_data->>'storage_used_gb')::NUMERIC,
        (usage_data->>'api_calls_count')::INTEGER
    )
    ON CONFLICT (tenant_id, usage_date) 
    DO UPDATE SET
        users_count = (usage_data->>'users_count')::INTEGER,
        vehicles_count = (usage_data->>'vehicles_count')::INTEGER,
        contracts_count = (usage_data->>'contracts_count')::INTEGER,
        storage_used_gb = (usage_data->>'storage_used_gb')::NUMERIC,
        api_calls_count = (usage_data->>'api_calls_count')::INTEGER,
        updated_at = now();
END;
$$;

-- =======================================================
-- تنظيف مكتمل - النظام جاهز للاستخدام
-- =======================================================

-- تعليق نهائي
COMMENT ON TABLE public.subscription_plans IS 'جدول خطط الاشتراك - يحتوي على جميع الخطط المتاحة للمؤسسات';
COMMENT ON TABLE public.saas_subscriptions IS 'جدول الاشتراكات - يحتوي على اشتراكات المؤسسات الحالية';
COMMENT ON TABLE public.saas_invoices IS 'جدول الفواتير - يحتوي على جميع فواتير الاشتراكات';
COMMENT ON TABLE public.saas_payments IS 'جدول المدفوعات - يحتوي على جميع المدفوعات المسجلة';
COMMENT ON TABLE public.tenant_usage IS 'جدول استخدام المؤسسات - يتتبع استخدام الموارد يومياً'; 