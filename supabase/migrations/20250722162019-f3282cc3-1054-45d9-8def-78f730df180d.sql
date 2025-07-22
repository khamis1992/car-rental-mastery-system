
-- إنشاء جدول قوالب مراكز التكلفة المتخصصة
CREATE TABLE IF NOT EXISTS public.cost_center_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL DEFAULT get_current_tenant_id(),
    template_name text NOT NULL,
    template_type text NOT NULL CHECK (template_type IN ('branch', 'vehicle_type', 'contract_type', 'driver_type')),
    template_config jsonb NOT NULL DEFAULT '{}',
    cost_center_prefix text NOT NULL,
    auto_allocation_rules jsonb DEFAULT '{}',
    performance_metrics jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    UNIQUE(tenant_id, template_name)
);

-- إنشاء جدول ربط المركبات بمراكز التكلفة التلقائي
CREATE TABLE IF NOT EXISTS public.vehicle_cost_center_mappings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL DEFAULT get_current_tenant_id(),
    vehicle_id uuid NOT NULL,
    cost_center_id uuid NOT NULL,
    mapping_type text NOT NULL CHECK (mapping_type IN ('automatic', 'manual')),
    allocation_percentage numeric(5,2) DEFAULT 100.00 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    effective_from date DEFAULT CURRENT_DATE,
    effective_to date,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    UNIQUE(tenant_id, vehicle_id, cost_center_id, effective_from)
);

-- إنشاء جدول تحليل الأداء لمراكز التكلفة
CREATE TABLE IF NOT EXISTS public.cost_center_performance_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL DEFAULT get_current_tenant_id(),
    cost_center_id uuid NOT NULL,
    analysis_period_start date NOT NULL,
    analysis_period_end date NOT NULL,
    total_revenue numeric(15,2) DEFAULT 0,
    total_costs numeric(15,2) DEFAULT 0,
    gross_profit numeric(15,2) DEFAULT 0,
    profit_margin numeric(5,2) DEFAULT 0,
    vehicle_utilization_rate numeric(5,2) DEFAULT 0,
    contract_count integer DEFAULT 0,
    active_vehicles integer DEFAULT 0,
    maintenance_costs numeric(15,2) DEFAULT 0,
    fuel_costs numeric(15,2) DEFAULT 0,
    insurance_costs numeric(15,2) DEFAULT 0,
    depreciation_costs numeric(15,2) DEFAULT 0,
    performance_score numeric(5,2) DEFAULT 0,
    kpi_metrics jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    calculated_by uuid,
    UNIQUE(tenant_id, cost_center_id, analysis_period_start, analysis_period_end)
);

-- إنشاء جدول KPIs مراكز التكلفة
CREATE TABLE IF NOT EXISTS public.cost_center_kpis (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL DEFAULT get_current_tenant_id(),
    cost_center_id uuid NOT NULL,
    kpi_name text NOT NULL,
    kpi_value numeric(15,2) NOT NULL,
    kpi_target numeric(15,2),
    kpi_type text NOT NULL CHECK (kpi_type IN ('revenue', 'cost', 'profitability', 'utilization', 'efficiency')),
    measurement_period date NOT NULL,
    variance_percentage numeric(5,2),
    trend_direction text CHECK (trend_direction IN ('up', 'down', 'stable')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(tenant_id, cost_center_id, kpi_name, measurement_period)
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_cost_center_templates_tenant_type ON public.cost_center_templates(tenant_id, template_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_cost_center_mappings_vehicle ON public.vehicle_cost_center_mappings(tenant_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_performance_analytics_period ON public.cost_center_performance_analytics(tenant_id, analysis_period_start, analysis_period_end);
CREATE INDEX IF NOT EXISTS idx_cost_center_kpis_period ON public.cost_center_kpis(tenant_id, measurement_period);

-- تطبيق RLS
ALTER TABLE public.cost_center_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_cost_center_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_center_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_center_kpis ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة قوالب مراكز التكلفة"
ON public.cost_center_templates
FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)))
WITH CHECK (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة ربط المركبات بمراكز التكلفة"
ON public.vehicle_cost_center_mappings
FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)))
WITH CHECK (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تحليل الأداء"
ON public.cost_center_performance_analytics
FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)))
WITH CHECK (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة KPIs"
ON public.cost_center_kpis
FOR ALL
TO authenticated
USING (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)))
WITH CHECK (tenant_id = get_current_tenant_id() AND (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role)));

-- دالة لإنشاء مراكز التكلفة المتخصصة تلقائياً
CREATE OR REPLACE FUNCTION public.create_specialized_cost_centers(tenant_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    branch_count integer := 0;
    vehicle_type_count integer := 0;
    contract_type_count integer := 0;
    result_data jsonb;
BEGIN
    -- إنشاء مراكز التكلفة للفروع
    INSERT INTO public.cost_centers (tenant_id, cost_center_code, cost_center_name, cost_center_type, level, hierarchy_path, is_active)
    SELECT 
        tenant_id_param,
        'BR-' || LPAD(ROW_NUMBER() OVER (ORDER BY branch_name)::text, 3, '0'),
        'فرع ' || branch_name,
        'branch',
        1,
        'BR-' || LPAD(ROW_NUMBER() OVER (ORDER BY branch_name)::text, 3, '0'),
        true
    FROM public.enhanced_branches 
    WHERE tenant_id = tenant_id_param AND is_active = true;
    
    GET DIAGNOSTICS branch_count = ROW_COUNT;
    
    -- إنشاء مراكز التكلفة لأنواع المركبات
    INSERT INTO public.cost_centers (tenant_id, cost_center_code, cost_center_name, cost_center_type, level, hierarchy_path, is_active)
    VALUES 
    (tenant_id_param, 'VT-001', 'سيارات صغيرة', 'vehicle_type', 1, 'VT-001', true),
    (tenant_id_param, 'VT-002', 'سيارات متوسطة', 'vehicle_type', 1, 'VT-002', true),
    (tenant_id_param, 'VT-003', 'سيارات كبيرة', 'vehicle_type', 1, 'VT-003', true),
    (tenant_id_param, 'VT-004', 'سيارات فاخرة', 'vehicle_type', 1, 'VT-004', true),
    (tenant_id_param, 'VT-005', 'حافلات صغيرة', 'vehicle_type', 1, 'VT-005', true),
    (tenant_id_param, 'VT-006', 'شاحنات', 'vehicle_type', 1, 'VT-006', true);
    
    vehicle_type_count := 6;
    
    -- إنشاء مراكز التكلفة لأنواع العقود
    INSERT INTO public.cost_centers (tenant_id, cost_center_code, cost_center_name, cost_center_type, level, hierarchy_path, is_active)
    VALUES 
    (tenant_id_param, 'CT-001', 'عقود يومية', 'contract_type', 1, 'CT-001', true),
    (tenant_id_param, 'CT-002', 'عقود شهرية', 'contract_type', 1, 'CT-002', true),
    (tenant_id_param, 'CT-003', 'عقود مع سائق', 'contract_type', 1, 'CT-003', true),
    (tenant_id_param, 'CT-004', 'عقود بدون سائق', 'contract_type', 1, 'CT-004', true),
    (tenant_id_param, 'CT-005', 'عقود VIP', 'contract_type', 1, 'CT-005', true),
    (tenant_id_param, 'CT-006', 'عقود طويلة المدى', 'contract_type', 1, 'CT-006', true);
    
    contract_type_count := 6;
    
    result_data := jsonb_build_object(
        'success', true,
        'branch_cost_centers', branch_count,
        'vehicle_type_cost_centers', vehicle_type_count,
        'contract_type_cost_centers', contract_type_count,
        'total_created', branch_count + vehicle_type_count + contract_type_count,
        'created_at', now()
    );
    
    RETURN result_data;
END;
$$;

-- دالة لحساب أداء مراكز التكلفة
CREATE OR REPLACE FUNCTION public.calculate_cost_center_performance(
    cost_center_id_param uuid,
    start_date_param date,
    end_date_param date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id uuid;
    total_revenue numeric := 0;
    total_costs numeric := 0;
    contract_count integer := 0;
    vehicle_count integer := 0;
    maintenance_costs numeric := 0;
    performance_data jsonb;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    -- حساب الإيرادات من العقود
    SELECT 
        COALESCE(SUM(c.total_amount), 0),
        COUNT(*)
    INTO total_revenue, contract_count
    FROM public.contracts c
    WHERE c.cost_center_id = cost_center_id_param
    AND c.tenant_id = current_tenant_id
    AND c.start_date BETWEEN start_date_param AND end_date_param;
    
    -- حساب التكاليف من مراكز التكلفة
    SELECT COALESCE(SUM(actual_spent), 0)
    INTO total_costs
    FROM public.cost_centers
    WHERE id = cost_center_id_param
    AND tenant_id = current_tenant_id;
    
    -- حساب عدد المركبات المرتبطة
    SELECT COUNT(DISTINCT vehicle_id)
    INTO vehicle_count
    FROM public.vehicle_cost_center_mappings
    WHERE cost_center_id = cost_center_id_param
    AND tenant_id = current_tenant_id
    AND effective_from <= end_date_param
    AND (effective_to IS NULL OR effective_to >= start_date_param);
    
    -- حفظ تحليل الأداء
    INSERT INTO public.cost_center_performance_analytics (
        tenant_id, cost_center_id, analysis_period_start, analysis_period_end,
        total_revenue, total_costs, gross_profit, profit_margin,
        contract_count, active_vehicles, calculated_by
    ) VALUES (
        current_tenant_id, cost_center_id_param, start_date_param, end_date_param,
        total_revenue, total_costs, total_revenue - total_costs,
        CASE WHEN total_revenue > 0 THEN ((total_revenue - total_costs) / total_revenue) * 100 ELSE 0 END,
        contract_count, vehicle_count, auth.uid()
    )
    ON CONFLICT (tenant_id, cost_center_id, analysis_period_start, analysis_period_end)
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_costs = EXCLUDED.total_costs,
        gross_profit = EXCLUDED.gross_profit,
        profit_margin = EXCLUDED.profit_margin,
        contract_count = EXCLUDED.contract_count,
        active_vehicles = EXCLUDED.active_vehicles,
        created_at = now();
    
    performance_data := jsonb_build_object(
        'total_revenue', total_revenue,
        'total_costs', total_costs,
        'gross_profit', total_revenue - total_costs,
        'profit_margin', CASE WHEN total_revenue > 0 THEN ((total_revenue - total_costs) / total_revenue) * 100 ELSE 0 END,
        'contract_count', contract_count,
        'vehicle_count', vehicle_count,
        'analysis_period', jsonb_build_object(
            'start_date', start_date_param,
            'end_date', end_date_param
        )
    );
    
    RETURN performance_data;
END;
$$;

-- دالة لربط المركبات بمراكز التكلفة تلقائياً
CREATE OR REPLACE FUNCTION public.auto_link_vehicles_to_cost_centers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id uuid;
    vehicle_record RECORD;
    cost_center_id uuid;
    linked_count integer := 0;
BEGIN
    current_tenant_id := get_current_tenant_id();
    
    FOR vehicle_record IN 
        SELECT v.id, v.vehicle_type, v.branch_id
        FROM public.vehicles v
        WHERE v.tenant_id = current_tenant_id
        AND v.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM public.vehicle_cost_center_mappings vccm
            WHERE vccm.vehicle_id = v.id
            AND vccm.tenant_id = current_tenant_id
            AND vccm.effective_to IS NULL
        )
    LOOP
        -- البحث عن مركز التكلفة المناسب حسب نوع المركبة
        SELECT cc.id INTO cost_center_id
        FROM public.cost_centers cc
        WHERE cc.tenant_id = current_tenant_id
        AND cc.cost_center_type = 'vehicle_type'
        AND cc.is_active = true
        AND (
            (vehicle_record.vehicle_type = 'sedan' AND cc.cost_center_code = 'VT-001') OR
            (vehicle_record.vehicle_type = 'suv' AND cc.cost_center_code = 'VT-002') OR
            (vehicle_record.vehicle_type = 'luxury' AND cc.cost_center_code = 'VT-004') OR
            (vehicle_record.vehicle_type = 'bus' AND cc.cost_center_code = 'VT-005') OR
            (vehicle_record.vehicle_type = 'truck' AND cc.cost_center_code = 'VT-006')
        )
        LIMIT 1;
        
        IF cost_center_id IS NOT NULL THEN
            INSERT INTO public.vehicle_cost_center_mappings (
                tenant_id, vehicle_id, cost_center_id, mapping_type, created_by
            ) VALUES (
                current_tenant_id, vehicle_record.id, cost_center_id, 'automatic', auth.uid()
            );
            
            linked_count := linked_count + 1;
        END IF;
    END LOOP;
    
    RETURN linked_count;
END;
$$;

-- إدراج القوالب الافتراضية
INSERT INTO public.cost_center_templates (template_name, template_type, template_config, cost_center_prefix, auto_allocation_rules)
VALUES 
('قالب مراكز التكلفة للفروع', 'branch', '{"auto_create": true, "include_all_branches": true}', 'BR-', '{"allocation_method": "by_location", "update_frequency": "daily"}'),
('قالب مراكز التكلفة لأنواع المركبات', 'vehicle_type', '{"vehicle_categories": ["sedan", "suv", "luxury", "bus", "truck"]}', 'VT-', '{"allocation_method": "by_vehicle_type", "update_frequency": "real_time"}'),
('قالب مراكز التكلفة لأنواع العقود', 'contract_type', '{"contract_types": ["daily", "monthly", "with_driver", "without_driver"]}', 'CT-', '{"allocation_method": "by_contract_type", "update_frequency": "daily"}')
ON CONFLICT (tenant_id, template_name) DO NOTHING;
