-- خطة تحسين التكامل الشاملة
-- إنشاء الجداول الجديدة للتكامل بين الأقسام

-- 1. جدول تكاملات الأقسام
CREATE TABLE public.department_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL, -- contract, invoice, payment, maintenance, etc.
    reference_table TEXT NOT NULL, -- اسم الجدول المرجعي
    reference_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    priority_level INTEGER DEFAULT 1, -- 1=عالي, 2=متوسط, 3=منخفض
    assigned_employee_id UUID REFERENCES public.employees(id),
    due_date DATE,
    completion_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. جدول سجل المعاملات الشامل
CREATE TABLE public.transaction_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type TEXT NOT NULL, -- contract_creation, payment_received, maintenance_scheduled, etc.
    source_table TEXT NOT NULL,
    source_id UUID NOT NULL,
    target_table TEXT,
    target_id UUID,
    department_id UUID REFERENCES public.departments(id),
    employee_id UUID REFERENCES public.employees(id),
    customer_id UUID REFERENCES public.customers(id),
    vehicle_id UUID REFERENCES public.vehicles(id),
    amount NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
    priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. جدول الموافقات والسير الإداري
CREATE TABLE public.approvals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    approval_type TEXT NOT NULL, -- contract_approval, payment_approval, maintenance_approval, etc.
    reference_table TEXT NOT NULL,
    reference_id UUID NOT NULL,
    requesting_department_id UUID NOT NULL REFERENCES public.departments(id),
    approving_department_id UUID NOT NULL REFERENCES public.departments(id),
    requested_by UUID NOT NULL REFERENCES public.employees(id),
    assigned_to UUID REFERENCES public.employees(id),
    current_approver UUID REFERENCES public.employees(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
    priority TEXT NOT NULL DEFAULT 'normal',
    approval_level INTEGER DEFAULT 1, -- للموافقات متعددة المستويات
    max_approval_level INTEGER DEFAULT 1,
    amount NUMERIC DEFAULT 0, -- للموافقات المالية
    request_details JSONB DEFAULT '{}',
    approval_comments TEXT,
    rejection_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. جدول تتبع سير العمليات
CREATE TABLE public.workflow_steps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_name TEXT NOT NULL, -- contract_workflow, maintenance_workflow, etc.
    step_order INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id),
    responsible_role TEXT, -- admin, manager, accountant, etc.
    is_approval_required BOOLEAN DEFAULT false,
    estimated_duration_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. جدول مؤشرات الأداء المتقدمة
CREATE TABLE public.advanced_kpis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    kpi_code TEXT NOT NULL UNIQUE,
    kpi_name_ar TEXT NOT NULL,
    kpi_name_en TEXT,
    category TEXT NOT NULL, -- financial, operational, customer, employee
    department_id UUID REFERENCES public.departments(id),
    calculation_formula TEXT NOT NULL, -- SQL formula or calculation method
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    previous_value NUMERIC DEFAULT 0,
    calculation_period TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, yearly
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    is_automated BOOLEAN DEFAULT true,
    alert_threshold_high NUMERIC,
    alert_threshold_low NUMERIC,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. جدول التكامل مع الأنظمة الخارجية
CREATE TABLE public.external_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_name TEXT NOT NULL,
    integration_type TEXT NOT NULL, -- api, database, file_import, etc.
    endpoint_url TEXT,
    api_key_name TEXT, -- اسم المفتاح في secrets
    configuration JSONB DEFAULT '{}',
    department_id UUID REFERENCES public.departments(id),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency TEXT DEFAULT 'hourly', -- hourly, daily, weekly
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس للأداء الأمثل
CREATE INDEX idx_department_integrations_dept_type ON public.department_integrations(department_id, integration_type);
CREATE INDEX idx_department_integrations_reference ON public.department_integrations(reference_table, reference_id);
CREATE INDEX idx_transaction_log_type_status ON public.transaction_log(transaction_type, status);
CREATE INDEX idx_transaction_log_department ON public.transaction_log(department_id, created_at DESC);
CREATE INDEX idx_approvals_status_dept ON public.approvals(status, requesting_department_id);
CREATE INDEX idx_approvals_assigned ON public.approvals(assigned_to, status);
CREATE INDEX idx_workflow_steps_workflow ON public.workflow_steps(workflow_name, step_order);
CREATE INDEX idx_advanced_kpis_category ON public.advanced_kpis(category, department_id);
CREATE INDEX idx_external_integrations_active ON public.external_integrations(is_active, last_sync_at);

-- تفعيل Row Level Security
ALTER TABLE public.department_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
-- سياسات department_integrations
CREATE POLICY "المديرون والمحاسبون يمكنهم رؤية تكاملات الأقسام" 
ON public.department_integrations FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'));

CREATE POLICY "المديرون يمكنهم إدارة تكاملات الأقسام" 
ON public.department_integrations FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- سياسات transaction_log
CREATE POLICY "المديرون والمحاسبون يمكنهم رؤية سجل المعاملات" 
ON public.transaction_log FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'));

CREATE POLICY "النظام يمكنه إدراج سجلات المعاملات" 
ON public.transaction_log FOR INSERT 
WITH CHECK (true);

-- سياسات approvals
CREATE POLICY "المستخدمون يمكنهم رؤية موافقاتهم" 
ON public.approvals FOR SELECT 
USING (
    assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    requested_by IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "الموظفون يمكنهم طلب الموافقات" 
ON public.approvals FOR INSERT 
WITH CHECK (requested_by IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "المسؤولون يمكنهم تحديث الموافقات" 
ON public.approvals FOR UPDATE 
USING (
    assigned_to IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- سياسات workflow_steps
CREATE POLICY "الجميع يمكنهم رؤية خطوات سير العمل" 
ON public.workflow_steps FOR SELECT 
USING (is_active = true);

CREATE POLICY "المديرون يمكنهم إدارة خطوات سير العمل" 
ON public.workflow_steps FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- سياسات advanced_kpis
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية المؤشرات المتقدمة" 
ON public.advanced_kpis FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'accountant'));

CREATE POLICY "المديرون يمكنهم إدارة المؤشرات المتقدمة" 
ON public.advanced_kpis FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- سياسات external_integrations
CREATE POLICY "المديرون يمكنهم إدارة التكاملات الخارجية" 
ON public.external_integrations FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- إنشاء دوال مساعدة للتكامل
CREATE OR REPLACE FUNCTION public.log_transaction(
    p_transaction_type TEXT,
    p_source_table TEXT,
    p_source_id UUID,
    p_department_id UUID DEFAULT NULL,
    p_employee_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_vehicle_id UUID DEFAULT NULL,
    p_amount NUMERIC DEFAULT 0,
    p_description TEXT DEFAULT '',
    p_details JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.transaction_log (
        transaction_type, source_table, source_id, department_id,
        employee_id, customer_id, vehicle_id, amount, description, details
    ) VALUES (
        p_transaction_type, p_source_table, p_source_id, p_department_id,
        p_employee_id, p_customer_id, p_vehicle_id, p_amount, p_description, p_details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- دالة إنشاء طلب موافقة
CREATE OR REPLACE FUNCTION public.create_approval_request(
    p_approval_type TEXT,
    p_reference_table TEXT,
    p_reference_id UUID,
    p_requesting_dept_id UUID,
    p_approving_dept_id UUID,
    p_requested_by UUID,
    p_amount NUMERIC DEFAULT 0,
    p_details JSONB DEFAULT '{}',
    p_priority TEXT DEFAULT 'normal'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    approval_id UUID;
    assigned_employee UUID;
BEGIN
    -- العثور على المسؤول في القسم المطلوب الموافقة منه
    SELECT e.id INTO assigned_employee
    FROM public.employees e
    JOIN public.departments d ON e.department_id = d.id
    WHERE d.id = p_approving_dept_id
    AND e.position ILIKE '%مدير%'
    LIMIT 1;
    
    INSERT INTO public.approvals (
        approval_type, reference_table, reference_id,
        requesting_department_id, approving_department_id,
        requested_by, assigned_to, amount, request_details, priority
    ) VALUES (
        p_approval_type, p_reference_table, p_reference_id,
        p_requesting_dept_id, p_approving_dept_id,
        p_requested_by, assigned_employee, p_amount, p_details, p_priority
    ) RETURNING id INTO approval_id;
    
    -- تسجيل المعاملة
    PERFORM public.log_transaction(
        'approval_requested',
        'approvals',
        approval_id,
        p_requesting_dept_id,
        p_requested_by,
        NULL,
        NULL,
        p_amount,
        'طلب موافقة: ' || p_approval_type,
        jsonb_build_object('approval_id', approval_id, 'priority', p_priority)
    );
    
    RETURN approval_id;
END;
$$;

-- دالة حساب المؤشرات تلقائياً
CREATE OR REPLACE FUNCTION public.calculate_advanced_kpi(kpi_code_param TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    kpi_record RECORD;
    calculated_value NUMERIC := 0;
BEGIN
    SELECT * INTO kpi_record 
    FROM public.advanced_kpis 
    WHERE kpi_code = kpi_code_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'KPI not found: %', kpi_code_param;
    END IF;
    
    -- حساب المؤشرات الأساسية
    CASE kpi_record.kpi_code
        WHEN 'MONTHLY_REVENUE' THEN
            SELECT COALESCE(SUM(total_amount), 0) INTO calculated_value
            FROM public.contracts
            WHERE status = 'completed'
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
            
        WHEN 'ACTIVE_CONTRACTS' THEN
            SELECT COUNT(*) INTO calculated_value
            FROM public.contracts
            WHERE status = 'active';
            
        WHEN 'VEHICLE_UTILIZATION' THEN
            SELECT (COUNT(CASE WHEN status = 'rented' THEN 1 END)::NUMERIC / 
                   NULLIF(COUNT(*), 0) * 100) INTO calculated_value
            FROM public.vehicles
            WHERE is_active = true;
            
        WHEN 'AVERAGE_CONTRACT_VALUE' THEN
            SELECT COALESCE(AVG(total_amount), 0) INTO calculated_value
            FROM public.contracts
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
            
        WHEN 'MAINTENANCE_COST_RATIO' THEN
            WITH monthly_maintenance AS (
                SELECT COALESCE(SUM(cost), 0) as maintenance_cost
                FROM public.maintenance_records
                WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
            ),
            monthly_revenue AS (
                SELECT COALESCE(SUM(total_amount), 0) as revenue
                FROM public.contracts
                WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
            )
            SELECT (mm.maintenance_cost / NULLIF(mr.revenue, 0) * 100) INTO calculated_value
            FROM monthly_maintenance mm, monthly_revenue mr;
            
        ELSE
            -- للمؤشرات المخصصة، محاولة تنفيذ الصيغة إذا كانت SQL صالح
            calculated_value := 0;
    END CASE;
    
    -- تحديث قيمة المؤشر
    UPDATE public.advanced_kpis 
    SET 
        previous_value = current_value,
        current_value = calculated_value,
        last_calculated_at = now()
    WHERE kpi_code = kpi_code_param;
    
    RETURN calculated_value;
END;
$$;

-- إدراج مؤشرات أداء أساسية
INSERT INTO public.advanced_kpis (kpi_code, kpi_name_ar, kpi_name_en, category, calculation_formula, target_value) VALUES
('MONTHLY_REVENUE', 'الإيرادات الشهرية', 'Monthly Revenue', 'financial', 'SUM(contracts.total_amount) WHERE month = current_month', 50000),
('ACTIVE_CONTRACTS', 'العقود النشطة', 'Active Contracts', 'operational', 'COUNT(contracts) WHERE status = active', 100),
('VEHICLE_UTILIZATION', 'معدل استغلال المركبات', 'Vehicle Utilization Rate', 'operational', '(rented_vehicles / total_vehicles) * 100', 85),
('CUSTOMER_SATISFACTION', 'رضا العملاء', 'Customer Satisfaction', 'customer', 'AVG(customer_evaluations.overall_rating)', 4.5),
('AVERAGE_CONTRACT_VALUE', 'متوسط قيمة العقد', 'Average Contract Value', 'financial', 'AVG(contracts.total_amount)', 1000),
('MAINTENANCE_COST_RATIO', 'نسبة تكلفة الصيانة', 'Maintenance Cost Ratio', 'operational', '(maintenance_costs / revenue) * 100', 15),
('PAYMENT_COLLECTION_RATE', 'معدل تحصيل المدفوعات', 'Payment Collection Rate', 'financial', '(collected_payments / total_invoices) * 100', 95);

-- إدراج خطوات سير العمل الأساسية
INSERT INTO public.workflow_steps (workflow_name, step_order, step_name, department_id, responsible_role, is_approval_required) 
SELECT 
    'contract_workflow', 1, 'إنشاء العقد', d.id, 'receptionist', false
FROM public.departments d WHERE d.department_name ILIKE '%استقبال%' LIMIT 1;

INSERT INTO public.workflow_steps (workflow_name, step_order, step_name, department_id, responsible_role, is_approval_required)
SELECT 
    'contract_workflow', 2, 'مراجعة مالية', d.id, 'accountant', true
FROM public.departments d WHERE d.department_name ILIKE '%محاسبة%' LIMIT 1;

INSERT INTO public.workflow_steps (workflow_name, step_order, step_name, department_id, responsible_role, is_approval_required)
SELECT 
    'contract_workflow', 3, 'موافقة نهائية', d.id, 'manager', true
FROM public.departments d WHERE d.department_name ILIKE '%إدارة%' LIMIT 1;

-- إنشاء triggers للتكامل التلقائي
CREATE OR REPLACE FUNCTION public.auto_log_contract_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_transaction(
            'contract_created',
            'contracts',
            NEW.id,
            NULL,
            NEW.created_by,
            NEW.customer_id,
            NEW.vehicle_id,
            NEW.total_amount,
            'تم إنشاء عقد جديد رقم: ' || NEW.contract_number,
            jsonb_build_object('contract_type', NEW.contract_type, 'status', NEW.status)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            PERFORM public.log_transaction(
                'contract_status_changed',
                'contracts',
                NEW.id,
                NULL,
                auth.uid(),
                NEW.customer_id,
                NEW.vehicle_id,
                NEW.total_amount,
                'تغيير حالة العقد من ' || OLD.status || ' إلى ' || NEW.status,
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
            );
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_auto_log_contract_changes
    AFTER INSERT OR UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION public.auto_log_contract_changes();

-- إضافة دالة حساب جميع المؤشرات
CREATE OR REPLACE FUNCTION public.calculate_all_kpis()
RETURNS TABLE(kpi_code TEXT, calculated_value NUMERIC, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    kpi_record RECORD;
    calc_value NUMERIC;
BEGIN
    FOR kpi_record IN SELECT ak.kpi_code FROM public.advanced_kpis ak WHERE ak.is_automated = true LOOP
        BEGIN
            calc_value := public.calculate_advanced_kpi(kpi_record.kpi_code);
            kpi_code := kpi_record.kpi_code;
            calculated_value := calc_value;
            status := 'success';
            RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
            kpi_code := kpi_record.kpi_code;
            calculated_value := 0;
            status := 'error: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$;