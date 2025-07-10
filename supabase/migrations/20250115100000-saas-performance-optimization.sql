-- =======================================================
-- تحسين الأداء والفهرسة لنظام SaaS
-- تاريخ الإنشاء: 2025-01-15
-- الهدف: تحسين الأداء وإضافة فهرسة متقدمة
-- =======================================================

-- =======================================================
-- 1. فهارس متقدمة لتحسين الاستعلامات
-- =======================================================

-- فهارس مركبة لخطط الاشتراك
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_performance 
ON public.subscription_plans(is_active, sort_order, price_monthly) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_search 
ON public.subscription_plans USING gin(to_tsvector('arabic', plan_name || ' ' || COALESCE(description, '')));

-- فهارس مركبة للاشتراكات
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_subscriptions_performance 
ON public.saas_subscriptions(tenant_id, status, next_billing_date) 
WHERE status IN ('active', 'trialing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_subscriptions_billing_optimization 
ON public.saas_subscriptions(next_billing_date, auto_renew, status) 
WHERE auto_renew = true AND status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_subscriptions_tenant_status 
ON public.saas_subscriptions(tenant_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_subscriptions_plan_analytics 
ON public.saas_subscriptions(plan_id, status, billing_cycle);

-- فهارس مركبة للفواتير
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_invoices_performance 
ON public.saas_invoices(tenant_id, status, created_at DESC) 
WHERE status IN ('draft', 'sent', 'overdue');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_invoices_due_date_optimization 
ON public.saas_invoices(due_date, status) 
WHERE status IN ('sent', 'overdue') AND due_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_invoices_subscription_period 
ON public.saas_invoices(subscription_id, billing_period_start, billing_period_end);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_invoices_amount_analytics 
ON public.saas_invoices(total_amount, currency, status, created_at) 
WHERE status = 'paid';

-- فهارس مركبة للمدفوعات
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_payments_performance 
ON public.saas_payments(tenant_id, status, paid_at DESC) 
WHERE status = 'succeeded';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_payments_invoice_optimization 
ON public.saas_payments(invoice_id, status, amount);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_payments_gateway_analytics 
ON public.saas_payments(payment_gateway, status, created_at) 
WHERE payment_gateway IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_payments_monthly_revenue 
ON public.saas_payments(date_trunc('month', paid_at), status, amount) 
WHERE status = 'succeeded' AND paid_at IS NOT NULL;

-- فهارس مركبة لاستخدام المؤسسات
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_usage_performance 
ON public.tenant_usage(tenant_id, usage_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_usage_analytics 
ON public.tenant_usage(usage_date, users_count, vehicles_count, contracts_count);

-- فهارس مركبة لعناصر الفواتير
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saas_invoice_items_performance 
ON public.saas_invoice_items(invoice_id, item_type, total_price);

-- =======================================================
-- 2. دوال محسنة للاستعلامات المعقدة
-- =======================================================

-- دالة محسنة للحصول على إحصائيات الفوترة
CREATE OR REPLACE FUNCTION public.get_optimized_billing_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    stats JSON;
    current_month_start DATE := date_trunc('month', CURRENT_DATE);
    current_year_start DATE := date_trunc('year', CURRENT_DATE);
    last_month_start DATE := date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
BEGIN
    WITH revenue_stats AS (
        SELECT 
            SUM(amount) FILTER (WHERE status = 'succeeded') as total_revenue,
            SUM(amount) FILTER (WHERE status = 'succeeded' AND paid_at >= current_month_start) as monthly_revenue,
            SUM(amount) FILTER (WHERE status = 'succeeded' AND paid_at >= current_year_start) as yearly_revenue,
            COUNT(*) FILTER (WHERE status = 'succeeded') as total_payments,
            COUNT(*) FILTER (WHERE status = 'succeeded' AND paid_at >= current_month_start) as monthly_payments
        FROM public.saas_payments
        WHERE paid_at IS NOT NULL
    ),
    subscription_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
            COUNT(*) FILTER (WHERE status = 'trialing') as trial_subscriptions,
            COUNT(*) FILTER (WHERE status = 'canceled') as canceled_subscriptions,
            COUNT(*) as total_subscriptions,
            AVG(amount) FILTER (WHERE status IN ('active', 'trialing')) as avg_subscription_value
        FROM public.saas_subscriptions
    ),
    invoice_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'sent') as pending_invoices,
            COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices,
            COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
            COUNT(*) as total_invoices
        FROM public.saas_invoices
    ),
    tenant_stats AS (
        SELECT 
            COUNT(DISTINCT tenant_id) as total_tenants,
            COUNT(DISTINCT tenant_id) FILTER (WHERE status = 'active') as active_tenants
        FROM public.saas_subscriptions
    )
    SELECT json_build_object(
        'total_revenue', COALESCE(r.total_revenue, 0),
        'monthly_revenue', COALESCE(r.monthly_revenue, 0),
        'yearly_revenue', COALESCE(r.yearly_revenue, 0),
        'active_subscriptions', COALESCE(s.active_subscriptions, 0),
        'trial_subscriptions', COALESCE(s.trial_subscriptions, 0),
        'canceled_subscriptions', COALESCE(s.canceled_subscriptions, 0),
        'total_subscriptions', COALESCE(s.total_subscriptions, 0),
        'pending_invoices', COALESCE(i.pending_invoices, 0),
        'overdue_invoices', COALESCE(i.overdue_invoices, 0),
        'paid_invoices', COALESCE(i.paid_invoices, 0),
        'total_invoices', COALESCE(i.total_invoices, 0),
        'total_tenants', COALESCE(t.total_tenants, 0),
        'active_tenants', COALESCE(t.active_tenants, 0),
        'average_subscription_value', COALESCE(s.avg_subscription_value, 0),
        'average_revenue_per_user', CASE 
            WHEN t.total_tenants > 0 THEN r.total_revenue / t.total_tenants 
            ELSE 0 
        END,
        'calculated_at', CURRENT_TIMESTAMP
    ) INTO stats
    FROM revenue_stats r
    CROSS JOIN subscription_stats s
    CROSS JOIN invoice_stats i
    CROSS JOIN tenant_stats t;
    
    RETURN stats;
END;
$$;

-- دالة محسنة للحصول على الاشتراكات المستحقة للتجديد
CREATE OR REPLACE FUNCTION public.get_upcoming_renewals(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
    subscription_id UUID,
    tenant_id UUID,
    tenant_name TEXT,
    plan_name TEXT,
    next_billing_date DATE,
    amount NUMERIC,
    currency TEXT,
    billing_cycle TEXT,
    days_until_renewal INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        s.id as subscription_id,
        s.tenant_id,
        t.name as tenant_name,
        p.plan_name,
        s.next_billing_date,
        s.amount,
        s.currency,
        s.billing_cycle,
        (s.next_billing_date - CURRENT_DATE) as days_until_renewal
    FROM public.saas_subscriptions s
    JOIN public.tenants t ON s.tenant_id = t.id
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
        AND s.auto_renew = true
        AND s.next_billing_date <= CURRENT_DATE + days_ahead
        AND s.next_billing_date >= CURRENT_DATE
    ORDER BY s.next_billing_date ASC, s.amount DESC;
$$;

-- دالة محسنة للحصول على الفواتير المتأخرة
CREATE OR REPLACE FUNCTION public.get_overdue_invoices_detailed()
RETURNS TABLE (
    invoice_id UUID,
    invoice_number TEXT,
    tenant_id UUID,
    tenant_name TEXT,
    total_amount NUMERIC,
    currency TEXT,
    due_date DATE,
    days_overdue INTEGER,
    subscription_id UUID,
    plan_name TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        i.id as invoice_id,
        i.invoice_number,
        i.tenant_id,
        t.name as tenant_name,
        i.total_amount,
        i.currency,
        i.due_date,
        (CURRENT_DATE - i.due_date) as days_overdue,
        i.subscription_id,
        p.plan_name
    FROM public.saas_invoices i
    JOIN public.tenants t ON i.tenant_id = t.id
    JOIN public.saas_subscriptions s ON i.subscription_id = s.id
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE i.status IN ('sent', 'overdue')
        AND i.due_date < CURRENT_DATE
    ORDER BY i.due_date ASC, i.total_amount DESC;
$$;

-- دالة محسنة لحساب معدل الإلغاء (Churn Rate)
CREATE OR REPLACE FUNCTION public.calculate_churn_rate(months_back INTEGER DEFAULT 12)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    total_subscriptions INTEGER;
    canceled_subscriptions INTEGER;
    churn_rate NUMERIC;
    start_date DATE := CURRENT_DATE - (months_back || ' months')::INTERVAL;
BEGIN
    -- حساب إجمالي الاشتراكات في الفترة
    SELECT COUNT(*) INTO total_subscriptions
    FROM public.saas_subscriptions
    WHERE created_at >= start_date;
    
    -- حساب الاشتراكات الملغاة في الفترة
    SELECT COUNT(*) INTO canceled_subscriptions
    FROM public.saas_subscriptions
    WHERE created_at >= start_date
        AND status = 'canceled'
        AND canceled_at IS NOT NULL;
    
    -- حساب معدل الإلغاء
    IF total_subscriptions > 0 THEN
        churn_rate := (canceled_subscriptions::NUMERIC / total_subscriptions::NUMERIC) * 100;
    ELSE
        churn_rate := 0;
    END IF;
    
    RETURN ROUND(churn_rate, 2);
END;
$$;

-- دالة محسنة للإحصائيات حسب الخطة
CREATE OR REPLACE FUNCTION public.get_plan_analytics()
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
    plan_code TEXT,
    active_subscriptions INTEGER,
    trial_subscriptions INTEGER,
    canceled_subscriptions INTEGER,
    total_revenue NUMERIC,
    monthly_revenue NUMERIC,
    average_subscription_value NUMERIC,
    market_share_percentage NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    WITH plan_stats AS (
        SELECT 
            p.id as plan_id,
            p.plan_name,
            p.plan_code,
            COUNT(s.id) FILTER (WHERE s.status = 'active') as active_subscriptions,
            COUNT(s.id) FILTER (WHERE s.status = 'trialing') as trial_subscriptions,
            COUNT(s.id) FILTER (WHERE s.status = 'canceled') as canceled_subscriptions,
            AVG(s.amount) FILTER (WHERE s.status IN ('active', 'trialing')) as avg_subscription_value
        FROM public.subscription_plans p
        LEFT JOIN public.saas_subscriptions s ON p.id = s.plan_id
        WHERE p.is_active = true
        GROUP BY p.id, p.plan_name, p.plan_code
    ),
    plan_revenue AS (
        SELECT 
            s.plan_id,
            SUM(pay.amount) FILTER (WHERE pay.status = 'succeeded') as total_revenue,
            SUM(pay.amount) FILTER (WHERE pay.status = 'succeeded' AND pay.paid_at >= date_trunc('month', CURRENT_DATE)) as monthly_revenue
        FROM public.saas_subscriptions s
        JOIN public.saas_invoices i ON s.id = i.subscription_id
        JOIN public.saas_payments pay ON i.id = pay.invoice_id
        GROUP BY s.plan_id
    ),
    total_active AS (
        SELECT COUNT(*) as total_count
        FROM public.saas_subscriptions
        WHERE status IN ('active', 'trialing')
    )
    SELECT 
        ps.plan_id,
        ps.plan_name,
        ps.plan_code,
        ps.active_subscriptions,
        ps.trial_subscriptions,
        ps.canceled_subscriptions,
        COALESCE(pr.total_revenue, 0) as total_revenue,
        COALESCE(pr.monthly_revenue, 0) as monthly_revenue,
        COALESCE(ps.avg_subscription_value, 0) as average_subscription_value,
        CASE 
            WHEN ta.total_count > 0 THEN 
                ROUND(((ps.active_subscriptions + ps.trial_subscriptions)::NUMERIC / ta.total_count::NUMERIC) * 100, 2)
            ELSE 0 
        END as market_share_percentage
    FROM plan_stats ps
    LEFT JOIN plan_revenue pr ON ps.plan_id = pr.plan_id
    CROSS JOIN total_active ta
    ORDER BY ps.active_subscriptions DESC, pr.total_revenue DESC NULLS LAST;
$$;

-- =======================================================
-- 3. Views محسنة للاستعلامات المتكررة
-- =======================================================

-- View للاشتراكات النشطة مع تفاصيل كاملة
CREATE OR REPLACE VIEW public.active_subscriptions_view AS
SELECT 
    s.id,
    s.tenant_id,
    t.name as tenant_name,
    t.email as tenant_email,
    s.plan_id,
    p.plan_name,
    p.plan_code,
    s.status,
    s.billing_cycle,
    s.amount,
    s.currency,
    s.current_period_start,
    s.current_period_end,
    s.next_billing_date,
    s.trial_ends_at,
    s.discount_percentage,
    s.auto_renew,
    s.created_at,
    -- حقول محسوبة
    CASE 
        WHEN s.trial_ends_at IS NOT NULL AND s.trial_ends_at > CURRENT_DATE 
        THEN 'in_trial'
        ELSE 'active'
    END as subscription_phase,
    (s.next_billing_date - CURRENT_DATE) as days_until_billing,
    CASE 
        WHEN s.next_billing_date <= CURRENT_DATE + INTERVAL '7 days' 
        THEN true 
        ELSE false 
    END as billing_due_soon
FROM public.saas_subscriptions s
JOIN public.tenants t ON s.tenant_id = t.id
JOIN public.subscription_plans p ON s.plan_id = p.id
WHERE s.status IN ('active', 'trialing');

-- View للفواتير مع حالات مفصلة
CREATE OR REPLACE VIEW public.invoices_with_status_view AS
SELECT 
    i.id,
    i.invoice_number,
    i.subscription_id,
    i.tenant_id,
    t.name as tenant_name,
    i.status,
    i.total_amount,
    i.currency,
    i.due_date,
    i.paid_at,
    i.created_at,
    -- حقول محسوبة
    CASE 
        WHEN i.status = 'paid' THEN 'settled'
        WHEN i.status IN ('sent', 'overdue') AND i.due_date < CURRENT_DATE THEN 'overdue'
        WHEN i.status = 'sent' AND i.due_date >= CURRENT_DATE THEN 'pending'
        ELSE i.status
    END as detailed_status,
    CASE 
        WHEN i.due_date IS NOT NULL AND i.status IN ('sent', 'overdue')
        THEN (CURRENT_DATE - i.due_date)
        ELSE 0
    END as days_overdue,
    -- إجمالي المدفوعات
    COALESCE((
        SELECT SUM(amount) 
        FROM public.saas_payments p 
        WHERE p.invoice_id = i.id AND p.status = 'succeeded'
    ), 0) as total_paid,
    -- المبلغ المتبقي
    i.total_amount - COALESCE((
        SELECT SUM(amount) 
        FROM public.saas_payments p 
        WHERE p.invoice_id = i.id AND p.status = 'succeeded'
    ), 0) as balance_due
FROM public.saas_invoices i
JOIN public.tenants t ON i.tenant_id = t.id;

-- View للإحصائيات اليومية
CREATE OR REPLACE VIEW public.daily_saas_metrics_view AS
SELECT 
    CURRENT_DATE as metric_date,
    -- إحصائيات الاشتراكات
    (SELECT COUNT(*) FROM public.saas_subscriptions WHERE status = 'active') as active_subscriptions,
    (SELECT COUNT(*) FROM public.saas_subscriptions WHERE status = 'trialing') as trial_subscriptions,
    (SELECT COUNT(*) FROM public.saas_subscriptions WHERE status = 'canceled') as canceled_subscriptions,
    -- إحصائيات الإيرادات اليومية
    (SELECT COALESCE(SUM(amount), 0) FROM public.saas_payments 
     WHERE status = 'succeeded' AND DATE(paid_at) = CURRENT_DATE) as daily_revenue,
    -- إحصائيات الفواتير
    (SELECT COUNT(*) FROM public.saas_invoices WHERE status = 'overdue') as overdue_invoices,
    (SELECT COUNT(*) FROM public.saas_invoices WHERE status = 'sent') as pending_invoices,
    -- المؤسسات النشطة
    (SELECT COUNT(DISTINCT tenant_id) FROM public.saas_subscriptions WHERE status IN ('active', 'trialing')) as active_tenants;

-- =======================================================
-- 4. محفزات للتحديث التلقائي
-- =======================================================

-- دالة تحديث الإحصائيات عند تغيير حالة الاشتراك
CREATE OR REPLACE FUNCTION public.update_subscription_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- تحديث استخدام المؤسسة عند تغيير الاشتراك
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        PERFORM public.update_tenant_usage_stats(NEW.tenant_id);
    END IF;
    
    -- تنظيف cache الإحصائيات
    -- يمكن إضافة logic إضافي هنا حسب الحاجة
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- تطبيق المحفز على جدول الاشتراكات
DROP TRIGGER IF EXISTS subscription_metrics_trigger ON public.saas_subscriptions;
CREATE TRIGGER subscription_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.saas_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_metrics();

-- دالة تحديث الإحصائيات عند تغيير حالة الفاتورة
CREATE OR REPLACE FUNCTION public.update_invoice_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- عند تحديث حالة الفاتورة إلى مدفوعة
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'paid' THEN
        -- يمكن إضافة logic لتحديث الإحصائيات
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- تطبيق المحفز على جدول الفواتير
DROP TRIGGER IF EXISTS invoice_metrics_trigger ON public.saas_invoices;
CREATE TRIGGER invoice_metrics_trigger
    AFTER UPDATE ON public.saas_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_invoice_metrics();

-- =======================================================
-- 5. إعدادات تحسين الأداء
-- =======================================================

-- تحسين إعدادات الجداول للأداء
ALTER TABLE public.saas_subscriptions SET (fillfactor = 90);
ALTER TABLE public.saas_invoices SET (fillfactor = 90);
ALTER TABLE public.saas_payments SET (fillfactor = 95);
ALTER TABLE public.tenant_usage SET (fillfactor = 95);

-- تحسين إعدادات الاستعلامات
-- يمكن تخصيص هذه الإعدادات حسب حجم البيانات والاستخدام
ALTER TABLE public.saas_subscriptions SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE public.saas_invoices SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE public.saas_payments SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);

-- =======================================================
-- 6. دوال الصيانة والمراقبة
-- =======================================================

-- دالة تنظيف البيانات القديمة
CREATE OR REPLACE FUNCTION public.cleanup_old_saas_data(retention_months INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
    cutoff_date DATE := CURRENT_DATE - (retention_months || ' months')::INTERVAL;
BEGIN
    -- تنظيف بيانات الاستخدام القديمة (الاحتفاظ بـ 2 سنة فقط)
    DELETE FROM public.tenant_usage 
    WHERE usage_date < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- تنظيف الفواتير الملغاة القديمة
    DELETE FROM public.saas_invoices 
    WHERE status = 'canceled' 
        AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- تنظيف المدفوعات الفاشلة القديمة
    DELETE FROM public.saas_payments 
    WHERE status = 'failed' 
        AND created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- دالة مراقبة أداء الاستعلامات
CREATE OR REPLACE FUNCTION public.get_saas_performance_metrics()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    metrics JSON;
BEGIN
    SELECT json_build_object(
        'table_sizes', (
            SELECT json_object_agg(
                table_name, 
                pg_size_pretty(total_bytes)
            )
            FROM (
                SELECT 
                    schemaname||'.'||tablename AS table_name,
                    pg_total_relation_size(schemaname||'.'||tablename) as total_bytes
                FROM pg_tables 
                WHERE schemaname = 'public' 
                    AND tablename LIKE 'saas_%' 
                    OR tablename IN ('subscription_plans', 'tenant_usage')
                ORDER BY total_bytes DESC
            ) t
        ),
        'index_usage', (
            SELECT json_object_agg(
                indexname,
                json_build_object(
                    'scans', idx_scan,
                    'tuples_read', idx_tup_read,
                    'tuples_fetched', idx_tup_fetch
                )
            )
            FROM pg_stat_user_indexes 
            WHERE schemaname = 'public' 
                AND (relname LIKE 'saas_%' OR relname IN ('subscription_plans', 'tenant_usage'))
        ),
        'table_stats', (
            SELECT json_object_agg(
                relname,
                json_build_object(
                    'sequential_scans', seq_scan,
                    'index_scans', idx_scan,
                    'rows_inserted', n_tup_ins,
                    'rows_updated', n_tup_upd,
                    'rows_deleted', n_tup_del
                )
            )
            FROM pg_stat_user_tables 
            WHERE schemaname = 'public' 
                AND (relname LIKE 'saas_%' OR relname IN ('subscription_plans', 'tenant_usage'))
        ),
        'generated_at', CURRENT_TIMESTAMP
    ) INTO metrics;
    
    RETURN metrics;
END;
$$;

-- =======================================================
-- تعليقات وتوثيق نهائي
-- =======================================================

COMMENT ON FUNCTION public.get_optimized_billing_stats() IS 'دالة محسنة للحصول على إحصائيات الفوترة بأداء عالي';
COMMENT ON FUNCTION public.get_upcoming_renewals(INTEGER) IS 'دالة محسنة للحصول على الاشتراكات المستحقة للتجديد';
COMMENT ON FUNCTION public.get_overdue_invoices_detailed() IS 'دالة محسنة للحصول على الفواتير المتأخرة مع التفاصيل';
COMMENT ON FUNCTION public.calculate_churn_rate(INTEGER) IS 'دالة حساب معدل الإلغاء (Churn Rate)';
COMMENT ON FUNCTION public.get_plan_analytics() IS 'دالة تحليل أداء خطط الاشتراك';
COMMENT ON FUNCTION public.cleanup_old_saas_data(INTEGER) IS 'دالة تنظيف البيانات القديمة للحفاظ على الأداء';
COMMENT ON FUNCTION public.get_saas_performance_metrics() IS 'دالة مراقبة أداء نظام SaaS';

COMMENT ON VIEW public.active_subscriptions_view IS 'عرض محسن للاشتراكات النشطة مع حقول محسوبة';
COMMENT ON VIEW public.invoices_with_status_view IS 'عرض محسن للفواتير مع حالات مفصلة';
COMMENT ON VIEW public.daily_saas_metrics_view IS 'عرض الإحصائيات اليومية لنظام SaaS';

-- =======================================================
-- انتهاء تحسين الأداء
-- =======================================================

-- تحديث الإحصائيات بعد إنشاء الفهارس
ANALYZE public.subscription_plans;
ANALYZE public.saas_subscriptions;
ANALYZE public.saas_invoices;
ANALYZE public.saas_payments;
ANALYZE public.tenant_usage;
ANALYZE public.saas_invoice_items; 