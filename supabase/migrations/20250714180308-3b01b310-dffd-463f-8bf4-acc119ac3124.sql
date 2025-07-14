-- إنشاء جدول مواد التدريب
CREATE TABLE public.training_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'document', 'quiz', 'interactive')),
    content_url TEXT,
    content_data JSONB,
    duration_minutes INTEGER,
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT NOT NULL,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    
    CONSTRAINT training_materials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

-- إنشاء جدول تقدم الموظفين في التدريب
CREATE TABLE public.employee_training_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    material_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')) DEFAULT 'not_started',
    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
    attempts_count INTEGER NOT NULL DEFAULT 0,
    time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT employee_training_progress_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.training_materials(id) ON DELETE CASCADE,
    CONSTRAINT employee_training_progress_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE,
    UNIQUE (employee_id, material_id)
);

-- إنشاء جدول customer_violations
CREATE TABLE public.customer_violations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    violation_type TEXT NOT NULL,
    violation_date DATE NOT NULL,
    description TEXT,
    amount NUMERIC(10,3),
    status TEXT NOT NULL CHECK (status IN ('active', 'resolved')) DEFAULT 'active',
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    
    CONSTRAINT customer_violations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id),
    CONSTRAINT customer_violations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

-- إنشاء جدول pricing_templates
CREATE TABLE public.pricing_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    template_name TEXT NOT NULL,
    vehicle_category TEXT NOT NULL,
    base_price NUMERIC(10,3) NOT NULL,
    daily_rate NUMERIC(10,3) NOT NULL,
    weekly_rate NUMERIC(10,3),
    monthly_rate NUMERIC(10,3),
    seasonal_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    discount_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    surge_pricing_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    
    CONSTRAINT pricing_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

-- إضافة فهارس للأداء
CREATE INDEX idx_training_materials_tenant_category ON public.training_materials(tenant_id, category);
CREATE INDEX idx_training_materials_active ON public.training_materials(is_active) WHERE is_active = true;
CREATE INDEX idx_employee_training_progress_employee ON public.employee_training_progress(employee_id);
CREATE INDEX idx_employee_training_progress_status ON public.employee_training_progress(status);
CREATE INDEX idx_customer_violations_customer ON public.customer_violations(customer_id);
CREATE INDEX idx_customer_violations_status ON public.customer_violations(status);
CREATE INDEX idx_pricing_templates_category ON public.pricing_templates(vehicle_category);

-- إعداد RLS
ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_templates ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمدربين
CREATE POLICY "المديرون والمدربون يمكنهم إدارة مواد التدريب" ON public.training_materials
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'trainer'::user_role));

CREATE POLICY "الموظفون يمكنهم رؤية مواد التدريب النشطة" ON public.training_materials
FOR SELECT USING (is_active = true);

-- سياسات الأمان لتقدم التدريب
CREATE POLICY "الموظفون يمكنهم رؤية تقدمهم في التدريب" ON public.employee_training_progress
FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "الموظفون يمكنهم تحديث تقدمهم في التدريب" ON public.employee_training_progress
FOR ALL USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- سياسات الأمان للانتهاكات
CREATE POLICY "الموظفون يمكنهم إدارة انتهاكات العملاء" ON public.customer_violations
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));

-- سياسات الأمان لقوالب التسعير
CREATE POLICY "المديرون يمكنهم إدارة قوالب التسعير" ON public.pricing_templates
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "الموظفون يمكنهم رؤية قوالب التسعير النشطة" ON public.pricing_templates
FOR SELECT USING (is_active = true);