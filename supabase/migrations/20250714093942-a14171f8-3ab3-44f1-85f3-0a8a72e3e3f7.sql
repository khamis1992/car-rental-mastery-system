-- إنشاء جداول الميزات الجديدة

-- 1. جدول تنبيهات انتهاكات العملاء
CREATE TABLE IF NOT EXISTS public.customer_violations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  violation_type text NOT NULL,
  violation_date date NOT NULL,
  description text,
  amount numeric(15,3),
  status text NOT NULL DEFAULT 'active',
  resolved_at timestamp with time zone,
  resolved_by uuid,
  severity text NOT NULL DEFAULT 'medium',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  tenant_id uuid NOT NULL
);

-- 2. جدول حالة توفر المركبات
CREATE TABLE IF NOT EXISTS public.vehicle_availability_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  availability_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  notes text,
  maintenance_scheduled_start timestamp with time zone,
  maintenance_scheduled_end timestamp with time zone,
  estimated_availability timestamp with time zone,
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  tenant_id uuid NOT NULL
);

-- 3. جدول قوالب التسعير
CREATE TABLE IF NOT EXISTS public.pricing_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name text NOT NULL,
  vehicle_category text NOT NULL,
  base_price numeric(15,3) NOT NULL,
  daily_rate numeric(15,3) NOT NULL,
  weekly_rate numeric(15,3),
  monthly_rate numeric(15,3),
  seasonal_multiplier numeric(5,2) DEFAULT 1.0,
  discount_rules jsonb DEFAULT '[]'::jsonb,
  surge_pricing_rules jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  tenant_id uuid NOT NULL
);

-- 4. جدول المهام اليومية (تحديث الجدول الموجود)
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  due_time time,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_to_all boolean NOT NULL DEFAULT false,
  category text DEFAULT 'general',
  estimated_duration integer, -- بالدقائق
  completion_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  tenant_id uuid NOT NULL
);

-- 5. جدول تخصيص المهام للموظفين
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  rating integer, -- تقييم من 1 إلى 5
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. جدول مواد التدريب
CREATE TABLE IF NOT EXISTS public.training_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  content_type text NOT NULL, -- 'video', 'document', 'quiz', 'interactive'
  content_url text,
  content_data jsonb,
  duration_minutes integer,
  difficulty_level text NOT NULL DEFAULT 'beginner',
  category text NOT NULL,
  prerequisites text[],
  learning_objectives text[],
  is_mandatory boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  tenant_id uuid NOT NULL
);

-- 7. جدول تقدم التدريب
CREATE TABLE IF NOT EXISTS public.employee_training_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  material_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  progress_percentage integer DEFAULT 0,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  score integer, -- للاختبارات
  attempts_count integer DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  last_accessed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_customer_violations_customer_id ON public.customer_violations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_violations_status ON public.customer_violations(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_availability_vehicle_id ON public.vehicle_availability_status(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_availability_date ON public.vehicle_availability_status(availability_date);
CREATE INDEX IF NOT EXISTS idx_pricing_templates_category ON public.pricing_templates(vehicle_category);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON public.daily_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON public.daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_employee_id ON public.task_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_category ON public.training_materials(category);
CREATE INDEX IF NOT EXISTS idx_employee_training_progress_employee ON public.employee_training_progress(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_progress_material ON public.employee_training_progress(material_id);

-- تمكين RLS على الجداول الجديدة
ALTER TABLE public.customer_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_availability_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_training_progress ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان

-- سياسات customer_violations
CREATE POLICY "المديرون والمحاسبون يمكنهم إدارة انتهاكات العملاء" ON public.customer_violations
FOR ALL USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'accountant'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'accountant'::user_role)
);

-- سياسات vehicle_availability_status
CREATE POLICY "الموظفون يمكنهم رؤية حالة توفر المركبات" ON public.vehicle_availability_status
FOR SELECT USING (true);

CREATE POLICY "المديرون والفنيون يمكنهم إدارة حالة توفر المركبات" ON public.vehicle_availability_status
FOR ALL USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'technician'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'technician'::user_role)
);

-- سياسات pricing_templates
CREATE POLICY "المديرون والمحاسبون يمكنهم إدارة قوالب التسعير" ON public.pricing_templates
FOR ALL USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'accountant'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'accountant'::user_role)
);

CREATE POLICY "الموظفون يمكنهم رؤية قوالب التسعير النشطة" ON public.pricing_templates
FOR SELECT USING (is_active = true);

-- سياسات daily_tasks
CREATE POLICY "الموظفون يمكنهم رؤية المهام اليومية" ON public.daily_tasks
FOR SELECT USING (true);

CREATE POLICY "المديرون يمكنهم إدارة المهام اليومية" ON public.daily_tasks
FOR ALL USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

-- سياسات task_assignments
CREATE POLICY "الموظفون يمكنهم رؤية تخصيصاتهم" ON public.task_assignments
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

CREATE POLICY "الموظفون يمكنهم تحديث حالة مهامهم" ON public.task_assignments
FOR UPDATE USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "المديرون يمكنهم إدارة تخصيص المهام" ON public.task_assignments
FOR ALL USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

-- سياسات training_materials
CREATE POLICY "الموظفون يمكنهم رؤية مواد التدريب النشطة" ON public.training_materials
FOR SELECT USING (is_active = true);

CREATE POLICY "المديرون يمكنهم إدارة مواد التدريب" ON public.training_materials
FOR ALL USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

-- سياسات employee_training_progress
CREATE POLICY "الموظفون يمكنهم رؤية تقدمهم في التدريب" ON public.employee_training_progress
FOR SELECT USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

CREATE POLICY "الموظفون يمكنهم تحديث تقدمهم في التدريب" ON public.employee_training_progress
FOR UPDATE USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "المديرون يمكنهم إدارة تقدم التدريب" ON public.employee_training_progress
FOR ALL USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

-- إضافة القيود الخارجية
ALTER TABLE public.customer_violations 
ADD CONSTRAINT fk_customer_violations_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.vehicle_availability_status 
ADD CONSTRAINT fk_vehicle_availability_vehicle_id 
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;

ALTER TABLE public.task_assignments 
ADD CONSTRAINT fk_task_assignments_task_id 
FOREIGN KEY (task_id) REFERENCES public.daily_tasks(id) ON DELETE CASCADE;

ALTER TABLE public.task_assignments 
ADD CONSTRAINT fk_task_assignments_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_training_progress 
ADD CONSTRAINT fk_employee_training_progress_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_training_progress 
ADD CONSTRAINT fk_employee_training_progress_material_id 
FOREIGN KEY (material_id) REFERENCES public.training_materials(id) ON DELETE CASCADE;