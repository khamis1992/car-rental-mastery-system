
-- تحسين جدول مراكز التكلفة لربطه بدليل الحسابات
ALTER TABLE public.cost_centers 
ADD COLUMN IF NOT EXISTS default_account_id uuid REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS expense_account_id uuid REFERENCES public.chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS revenue_account_id uuid REFERENCES public.chart_of_accounts(id);

-- إنشاء جدول إعدادات مراكز التكلفة
CREATE TABLE IF NOT EXISTS public.cost_center_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL DEFAULT get_current_tenant_id(),
    setting_key text NOT NULL,
    setting_value jsonb NOT NULL DEFAULT '{}',
    setting_type text NOT NULL DEFAULT 'general',
    description text,
    is_active boolean DEFAULT true,
    requires_restart boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    UNIQUE(tenant_id, setting_key)
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_cost_centers_accounts ON public.cost_centers(default_account_id, expense_account_id, revenue_account_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_settings_tenant ON public.cost_center_settings(tenant_id, setting_key);

-- إنشاء دالة لتحديث إعداد مركز تكلفة
CREATE OR REPLACE FUNCTION public.update_cost_center_setting(
    setting_key_param text,
    new_value jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id uuid;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    INSERT INTO public.cost_center_settings (tenant_id, setting_key, setting_value, updated_at)
    VALUES (current_tenant_id, setting_key_param, new_value, now())
    ON CONFLICT (tenant_id, setting_key) 
    DO UPDATE SET 
        setting_value = new_value,
        updated_at = now();
    
    RETURN true;
END;
$$;

-- إنشاء دالة للحصول على إعداد مركز تكلفة
CREATE OR REPLACE FUNCTION public.get_cost_center_setting(
    setting_key_param text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id uuid;
    setting_value jsonb;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    SELECT cs.setting_value INTO setting_value
    FROM public.cost_center_settings cs
    WHERE cs.tenant_id = current_tenant_id 
    AND cs.setting_key = setting_key_param
    AND cs.is_active = true;
    
    RETURN COALESCE(setting_value, '{}');
END;
$$;

-- إدراج الإعدادات الافتراضية لمراكز التكلفة
INSERT INTO public.cost_center_settings (setting_key, setting_value, setting_type, description, is_active, requires_restart)
VALUES 
    ('auto_allocation_enabled', 'true', 'automation', 'تفعيل التوزيع التلقائي للتكاليف', true, false),
    ('default_cost_center_type', '"operational"', 'defaults', 'نوع مركز التكلفة الافتراضي', true, false),
    ('budget_alert_threshold', '80', 'alerts', 'حد التنبيه للميزانية (نسبة مئوية)', true, false),
    ('auto_budget_calculation', 'false', 'automation', 'حساب الميزانية تلقائياً', true, false),
    ('cost_update_frequency', '"daily"', 'automation', 'تكرار تحديث التكاليف', true, false),
    ('require_approval_for_budget_changes', 'true', 'approvals', 'يتطلب موافقة لتغيير الميزانية', true, false),
    ('default_currency', '"KWD"', 'defaults', 'العملة الافتراضية', true, false),
    ('enable_hierarchy', 'true', 'structure', 'تفعيل التسلسل الهرمي', true, true),
    ('max_hierarchy_levels', '5', 'structure', 'الحد الأقصى لمستويات التسلسل', true, true),
    ('enable_cost_center_reports', 'true', 'reporting', 'تفعيل تقارير مراكز التكلفة', true, false)
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

-- تطبيق RLS على جدول الإعدادات
ALTER TABLE public.cost_center_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة إعدادات مراكز التكلفة"
ON public.cost_center_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- دالة لحساب مؤشرات الأداء لمراكز التكلفة
CREATE OR REPLACE FUNCTION public.get_cost_center_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id uuid;
    total_cost_centers integer;
    total_budget numeric;
    total_spent numeric;
    over_budget_count integer;
    metrics_data jsonb;
    type_stats jsonb;
    top_spending jsonb;
    worst_variance jsonb;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- الإحصائيات العامة
    SELECT 
        COUNT(*),
        COALESCE(SUM(budget_amount), 0),
        COALESCE(SUM(actual_spent), 0),
        COUNT(CASE WHEN actual_spent > budget_amount AND budget_amount > 0 THEN 1 END)
    INTO total_cost_centers, total_budget, total_spent, over_budget_count
    FROM public.cost_centers
    WHERE tenant_id = current_tenant_id AND is_active = true;
    
    -- إحصائيات حسب النوع
    SELECT jsonb_object_agg(
        cost_center_type,
        jsonb_build_object(
            'count', count,
            'budget', budget,
            'spent', spent
        )
    ) INTO type_stats
    FROM (
        SELECT 
            cost_center_type,
            COUNT(*) as count,
            COALESCE(SUM(budget_amount), 0) as budget,
            COALESCE(SUM(actual_spent), 0) as spent
        FROM public.cost_centers
        WHERE tenant_id = current_tenant_id AND is_active = true
        GROUP BY cost_center_type
    ) t;
    
    -- أعلى المراكز إنفاقاً
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'cost_center_name', cost_center_name,
            'cost_center_type', cost_center_type,
            'actual_spent', actual_spent,
            'budget_utilization_percentage', 
            CASE WHEN budget_amount > 0 THEN (actual_spent / budget_amount) * 100 ELSE 0 END
        )
    ) INTO top_spending
    FROM (
        SELECT id, cost_center_name, cost_center_type, actual_spent, budget_amount
        FROM public.cost_centers
        WHERE tenant_id = current_tenant_id AND is_active = true
        ORDER BY actual_spent DESC
        LIMIT 10
    ) t;
    
    -- أسوأ الانحرافات
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'cost_center_name', cost_center_name,
            'cost_center_type', cost_center_type,
            'variance', budget_amount - actual_spent
        )
    ) INTO worst_variance
    FROM (
        SELECT id, cost_center_name, cost_center_type, budget_amount, actual_spent
        FROM public.cost_centers
        WHERE tenant_id = current_tenant_id 
        AND is_active = true 
        AND budget_amount > 0
        AND actual_spent > budget_amount
        ORDER BY (actual_spent - budget_amount) DESC
        LIMIT 10
    ) t;
    
    metrics_data := jsonb_build_object(
        'total_cost_centers', total_cost_centers,
        'total_budget', total_budget,
        'total_spent', total_spent,
        'over_budget_count', over_budget_count,
        'by_type', COALESCE(type_stats, '{}'),
        'top_spending', COALESCE(top_spending, '[]'),
        'worst_variance', COALESCE(worst_variance, '[]'),
        'calculated_at', now()
    );
    
    RETURN metrics_data;
END;
$$;
