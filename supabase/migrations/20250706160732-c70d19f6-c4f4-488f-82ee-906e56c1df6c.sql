-- Phase 1: تحسين جدول مراكز التكلفة
ALTER TABLE public.cost_centers 
ADD COLUMN IF NOT EXISTS cost_center_type text DEFAULT 'operational',
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS budget_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_spent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS hierarchy_path text;

-- إنشاء فهرس على hierarchy_path للبحث السريع
CREATE INDEX IF NOT EXISTS idx_cost_centers_hierarchy_path ON public.cost_centers USING gin(to_tsvector('english', hierarchy_path));
CREATE INDEX IF NOT EXISTS idx_cost_centers_department ON public.cost_centers(department_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_manager ON public.cost_centers(manager_id);

-- Phase 2: ربط الموظفين بمراكز التكلفة
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS primary_cost_center_id uuid REFERENCES public.cost_centers(id),
ADD COLUMN IF NOT EXISTS secondary_cost_center_id uuid REFERENCES public.cost_centers(id);

-- Phase 3: ربط العقود والمركبات بمراكز التكلفة
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id);

ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id);

-- إنشاء جدول لتوزيع التكاليف على مراكز التكلفة المتعددة
CREATE TABLE IF NOT EXISTS public.cost_center_allocations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_type text NOT NULL, -- 'contract', 'employee', 'vehicle', 'expense'
    reference_id uuid NOT NULL,
    cost_center_id uuid NOT NULL REFERENCES public.cost_centers(id),
    allocation_percentage numeric DEFAULT 100 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    allocation_amount numeric DEFAULT 0,
    allocation_date date DEFAULT CURRENT_DATE,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- إنشاء فهارس لجدول التوزيعات
CREATE INDEX IF NOT EXISTS idx_cost_center_allocations_reference ON public.cost_center_allocations(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_allocations_cost_center ON public.cost_center_allocations(cost_center_id);

-- Phase 4: إنشاء دالة لحساب التسلسل الهرمي
CREATE OR REPLACE FUNCTION public.update_cost_center_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    parent_path text;
    current_level integer;
BEGIN
    -- إذا كان هناك مركز تكلفة أب
    IF NEW.parent_id IS NOT NULL THEN
        SELECT hierarchy_path, level + 1
        INTO parent_path, current_level
        FROM public.cost_centers
        WHERE id = NEW.parent_id;
        
        NEW.hierarchy_path := COALESCE(parent_path, '') || '/' || NEW.cost_center_code;
        NEW.level := current_level;
    ELSE
        NEW.hierarchy_path := NEW.cost_center_code;
        NEW.level := 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث التسلسل الهرمي تلقائياً
DROP TRIGGER IF EXISTS trigger_update_cost_center_hierarchy ON public.cost_centers;
CREATE TRIGGER trigger_update_cost_center_hierarchy
    BEFORE INSERT OR UPDATE ON public.cost_centers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cost_center_hierarchy();

-- دالة لحساب التكاليف الفعلية لمركز التكلفة
CREATE OR REPLACE FUNCTION public.calculate_cost_center_actual_costs(cost_center_id_param uuid)
RETURNS numeric AS $$
DECLARE
    total_cost numeric := 0;
    contract_costs numeric := 0;
    employee_costs numeric := 0;
    vehicle_costs numeric := 0;
    allocation_costs numeric := 0;
BEGIN
    -- حساب تكاليف العقود المرتبطة مباشرة
    SELECT COALESCE(SUM(total_amount), 0) INTO contract_costs
    FROM public.contracts
    WHERE cost_center_id = cost_center_id_param
    AND status IN ('active', 'completed');
    
    -- حساب تكاليف الموظفين (الراتب الشهري)
    SELECT COALESCE(SUM(salary), 0) INTO employee_costs
    FROM public.employees
    WHERE (primary_cost_center_id = cost_center_id_param OR secondary_cost_center_id = cost_center_id_param)
    AND status = 'active';
    
    -- حساب التكاليف المخصصة من جدول التوزيعات
    SELECT COALESCE(SUM(allocation_amount), 0) INTO allocation_costs
    FROM public.cost_center_allocations
    WHERE cost_center_id = cost_center_id_param;
    
    total_cost := contract_costs + employee_costs + allocation_costs;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتحديث التكاليف الفعلية لجميع مراكز التكلفة
CREATE OR REPLACE FUNCTION public.update_all_cost_center_costs()
RETURNS void AS $$
DECLARE
    cc_record RECORD;
BEGIN
    FOR cc_record IN SELECT id FROM public.cost_centers WHERE is_active = true LOOP
        UPDATE public.cost_centers 
        SET actual_spent = public.calculate_cost_center_actual_costs(cc_record.id),
            updated_at = now()
        WHERE id = cc_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء view لعرض تقرير مراكز التكلفة
CREATE OR REPLACE VIEW public.cost_center_report AS
SELECT 
    cc.id,
    cc.cost_center_code,
    cc.cost_center_name,
    cc.cost_center_type,
    cc.level,
    cc.hierarchy_path,
    cc.budget_amount,
    cc.actual_spent,
    cc.budget_amount - cc.actual_spent as variance,
    CASE 
        WHEN cc.budget_amount > 0 THEN ((cc.actual_spent / cc.budget_amount) * 100)
        ELSE 0 
    END as budget_utilization_percentage,
    d.department_name,
    e.first_name || ' ' || e.last_name as manager_name,
    COUNT(DISTINCT emp.id) as employee_count,
    COUNT(DISTINCT c.id) as contract_count,
    COUNT(DISTINCT v.id) as vehicle_count
FROM public.cost_centers cc
LEFT JOIN public.departments d ON cc.department_id = d.id
LEFT JOIN public.employees e ON cc.manager_id = e.id
LEFT JOIN public.employees emp ON (emp.primary_cost_center_id = cc.id OR emp.secondary_cost_center_id = cc.id)
LEFT JOIN public.contracts c ON c.cost_center_id = cc.id
LEFT JOIN public.vehicles v ON v.cost_center_id = cc.id
WHERE cc.is_active = true
GROUP BY cc.id, cc.cost_center_code, cc.cost_center_name, cc.cost_center_type, 
         cc.level, cc.hierarchy_path, cc.budget_amount, cc.actual_spent, 
         d.department_name, e.first_name, e.last_name;

-- تحديث RLS policies
ALTER TABLE public.cost_center_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة توزيعات التكلفة"
ON public.cost_center_allocations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إضافة بيانات أساسية لمراكز التكلفة
INSERT INTO public.cost_centers (cost_center_code, cost_center_name, cost_center_type, level, hierarchy_path, is_active)
VALUES 
    ('CC-001', 'مركز التكلفة الرئيسي', 'administrative', 1, 'CC-001', true),
    ('CC-002', 'مركز تكلفة العمليات', 'operational', 1, 'CC-002', true),
    ('CC-003', 'مركز تكلفة المبيعات', 'revenue', 1, 'CC-003', true),
    ('CC-004', 'مركز تكلفة الصيانة', 'support', 1, 'CC-004', true)
ON CONFLICT (cost_center_code) DO NOTHING;