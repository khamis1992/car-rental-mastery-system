-- الخطة الشاملة لإصلاح وتوسيع مراكز التكلفة

-- المرحلة 1: تنظيف البيانات المكررة وتحسين الهيكل
-- حذف مراكز التكلفة المكررة والاحتفاظ بالأحدث
WITH duplicate_cost_centers AS (
  SELECT 
    id,
    cost_center_code,
    cost_center_name,
    ROW_NUMBER() OVER (
      PARTITION BY cost_center_code, cost_center_name 
      ORDER BY created_at DESC
    ) as rn
  FROM public.cost_centers
)
DELETE FROM public.cost_centers 
WHERE id IN (
  SELECT id FROM duplicate_cost_centers WHERE rn > 1
);

-- المرحلة 2: توسيع أنواع مراكز التكلفة
ALTER TABLE public.cost_centers 
ADD COLUMN IF NOT EXISTS cost_center_category TEXT DEFAULT 'operational';

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_cost_centers_category ON public.cost_centers(cost_center_category);
CREATE INDEX IF NOT EXISTS idx_cost_centers_type_category ON public.cost_centers(cost_center_type, cost_center_category);

-- المرحلة 3: إنشاء مراكز تكلفة شاملة لجميع أقسام النظام
INSERT INTO public.cost_centers (
  cost_center_code, 
  cost_center_name, 
  description, 
  cost_center_type, 
  cost_center_category,
  budget_amount, 
  is_active
) VALUES 
-- مراكز التكلفة الرئيسية
('CC-MAIN-001', 'المركز الرئيسي للإدارة العامة', 'المركز الرئيسي لجميع العمليات الإدارية', 'administrative', 'management', 50000.000, true),
('CC-MAIN-002', 'المركز الرئيسي للعمليات', 'المركز الرئيسي لجميع العمليات التشغيلية', 'operational', 'operations', 100000.000, true),
('CC-MAIN-003', 'المركز الرئيسي للإيرادات', 'المركز الرئيسي لجميع أنشطة الإيرادات', 'revenue', 'sales', 75000.000, true),

-- مراكز تكلفة إدارة الموارد البشرية
('CC-HR-001', 'إدارة الموارد البشرية', 'مركز تكلفة قسم الموارد البشرية', 'administrative', 'hr', 30000.000, true),
('CC-HR-002', 'التوظيف والاختيار', 'تكاليف عمليات التوظيف والاختيار', 'administrative', 'hr', 15000.000, true),
('CC-HR-003', 'التدريب والتطوير', 'تكاليف برامج التدريب والتطوير', 'administrative', 'hr', 20000.000, true),
('CC-HR-004', 'الرواتب والمزايا', 'تكاليف معالجة الرواتب والمزايا', 'administrative', 'hr', 5000.000, true),

-- مراكز تكلفة إدارة المركبات
('CC-VEH-001', 'إدارة الأسطول', 'مركز تكلفة إدارة أسطول المركبات', 'operational', 'fleet', 80000.000, true),
('CC-VEH-002', 'صيانة المركبات', 'تكاليف صيانة وإصلاح المركبات', 'operational', 'maintenance', 45000.000, true),
('CC-VEH-003', 'تأمين المركبات', 'تكاليف تأمين أسطول المركبات', 'operational', 'insurance', 25000.000, true),
('CC-VEH-004', 'وقود ومواد التشغيل', 'تكاليف الوقود ومواد التشغيل', 'operational', 'fuel', 60000.000, true),

-- مراكز تكلفة المبيعات والعملاء
('CC-SALES-001', 'إدارة المبيعات', 'مركز تكلفة قسم المبيعات', 'revenue', 'sales', 40000.000, true),
('CC-SALES-002', 'خدمة العملاء', 'تكاليف خدمة ودعم العملاء', 'support', 'customer_service', 20000.000, true),
('CC-SALES-003', 'التسويق والإعلان', 'تكاليف أنشطة التسويق والإعلان', 'support', 'marketing', 35000.000, true),
('CC-SALES-004', 'إدارة العقود', 'تكاليف إدارة ومتابعة العقود', 'administrative', 'contracts', 15000.000, true),

-- مراكز تكلفة المحاسبة والمالية
('CC-FIN-001', 'إدارة المحاسبة', 'مركز تكلفة قسم المحاسبة', 'administrative', 'accounting', 25000.000, true),
('CC-FIN-002', 'المراجعة الداخلية', 'تكاليف أنشطة المراجعة الداخلية', 'administrative', 'audit', 12000.000, true),
('CC-FIN-003', 'إدارة الخزينة', 'تكاليف إدارة السيولة والخزينة', 'administrative', 'treasury', 8000.000, true),
('CC-FIN-004', 'إعداد التقارير المالية', 'تكاليف إعداد التقارير المالية', 'administrative', 'reporting', 10000.000, true),

-- مراكز تكلفة تقنية المعلومات
('CC-IT-001', 'إدارة تقنية المعلومات', 'مركز تكلفة قسم تقنية المعلومات', 'support', 'it', 40000.000, true),
('CC-IT-002', 'الدعم الفني', 'تكاليف الدعم الفني للأنظمة', 'support', 'it_support', 15000.000, true),
('CC-IT-003', 'تطوير الأنظمة', 'تكاليف تطوير وتحديث الأنظمة', 'support', 'development', 25000.000, true),
('CC-IT-004', 'أمن المعلومات', 'تكاليف أمن وحماية المعلومات', 'support', 'security', 18000.000, true),

-- مراكز تكلفة العمليات اليومية
('CC-OPS-001', 'العمليات اليومية', 'تكاليف العمليات اليومية العامة', 'operational', 'daily_ops', 30000.000, true),
('CC-OPS-002', 'إدارة المخازن', 'تكاليف إدارة المخازن والمواد', 'operational', 'warehouse', 20000.000, true),
('CC-OPS-003', 'النقل والتوصيل', 'تكاليف خدمات النقل والتوصيل', 'operational', 'delivery', 35000.000, true),
('CC-OPS-004', 'مراقبة الجودة', 'تكاليف مراقبة وضمان الجودة', 'operational', 'quality', 12000.000, true),

-- مراكز تكلفة الخدمات المساندة
('CC-SUP-001', 'الخدمات العامة', 'تكاليف الخدمات العامة والمساندة', 'support', 'general', 25000.000, true),
('CC-SUP-002', 'الأمن والسلامة', 'تكاليف الأمن والسلامة المهنية', 'support', 'security', 18000.000, true),
('CC-SUP-003', 'النظافة والصيانة', 'تكاليف النظافة وصيانة المرافق', 'support', 'facilities', 15000.000, true),
('CC-SUP-004', 'الشؤون القانونية', 'تكاليف الاستشارات والخدمات القانونية', 'support', 'legal', 20000.000, true);

-- المرحلة 4: إنشاء جدول تتبع تطور مراكز التكلفة
CREATE TABLE IF NOT EXISTS public.cost_center_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'created', 'updated', 'budget_changed', 'status_changed'
  previous_values JSONB,
  new_values JSONB,
  changed_by UUID,
  change_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_cost_center_history_cost_center_id ON public.cost_center_history(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_history_action_date ON public.cost_center_history(action_type, change_date);

-- المرحلة 5: إنشاء trigger لتتبع التغييرات
CREATE OR REPLACE FUNCTION public.track_cost_center_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.cost_center_history (
      cost_center_id, action_type, new_values, changed_by
    ) VALUES (
      NEW.id, 'created', row_to_json(NEW), auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.budget_amount != NEW.budget_amount THEN
      INSERT INTO public.cost_center_history (
        cost_center_id, action_type, previous_values, new_values, changed_by
      ) VALUES (
        NEW.id, 'budget_changed', 
        jsonb_build_object('budget_amount', OLD.budget_amount),
        jsonb_build_object('budget_amount', NEW.budget_amount),
        auth.uid()
      );
    END IF;
    
    IF OLD.is_active != NEW.is_active THEN
      INSERT INTO public.cost_center_history (
        cost_center_id, action_type, previous_values, new_values, changed_by
      ) VALUES (
        NEW.id, 'status_changed',
        jsonb_build_object('is_active', OLD.is_active),
        jsonb_build_object('is_active', NEW.is_active),
        auth.uid()
      );
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger
DROP TRIGGER IF EXISTS cost_center_changes_trigger ON public.cost_centers;
CREATE TRIGGER cost_center_changes_trigger
  AFTER INSERT OR UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.track_cost_center_changes();

-- المرحلة 6: إنشاء view لتقارير مراكز التكلفة المحسنة
CREATE OR REPLACE VIEW public.cost_center_enhanced_report AS
SELECT 
  cc.id,
  cc.cost_center_code,
  cc.cost_center_name,
  cc.description,
  cc.cost_center_type,
  cc.cost_center_category,
  cc.budget_amount,
  cc.actual_spent,
  cc.level,
  cc.hierarchy_path,
  cc.is_active,
  
  -- حساب معدلات الأداء
  CASE 
    WHEN cc.budget_amount > 0 THEN 
      ROUND(((cc.actual_spent / cc.budget_amount) * 100), 2)
    ELSE 0 
  END as budget_utilization_percentage,
  
  CASE 
    WHEN cc.budget_amount > 0 THEN 
      (cc.budget_amount - cc.actual_spent)
    ELSE 0 
  END as budget_variance,
  
  -- إحصائيات الربط
  COALESCE(emp_count.total, 0) as employees_count,
  COALESCE(contract_count.total, 0) as contracts_count,
  COALESCE(vehicle_count.total, 0) as vehicles_count,
  COALESCE(allocation_count.total, 0) as allocations_count,
  
  -- معلومات القسم
  d.department_name,
  d.description as department_description,
  
  -- معلومات المدير
  CONCAT(e.first_name, ' ', e.last_name) as manager_name,
  e.email as manager_email,
  
  -- معلومات المركز الأب
  parent_cc.cost_center_name as parent_cost_center_name,
  parent_cc.cost_center_code as parent_cost_center_code

FROM public.cost_centers cc
LEFT JOIN public.departments d ON cc.department_id = d.id
LEFT JOIN public.employees e ON cc.manager_id = e.id
LEFT JOIN public.cost_centers parent_cc ON cc.parent_id = parent_cc.id

-- إحصائية الموظفين
LEFT JOIN (
  SELECT 
    primary_cost_center_id as cost_center_id,
    COUNT(*) as total
  FROM public.employees 
  WHERE status = 'active'
  GROUP BY primary_cost_center_id
) emp_count ON cc.id = emp_count.cost_center_id

-- إحصائية العقود
LEFT JOIN (
  SELECT 
    cost_center_id,
    COUNT(*) as total
  FROM public.contracts 
  WHERE status IN ('active', 'completed')
  GROUP BY cost_center_id
) contract_count ON cc.id = contract_count.cost_center_id

-- إحصائية المركبات
LEFT JOIN (
  SELECT 
    cost_center_id,
    COUNT(*) as total
  FROM public.vehicles 
  WHERE status = 'available'
  GROUP BY cost_center_id
) vehicle_count ON cc.id = vehicle_count.cost_center_id

-- إحصائية التخصيصات
LEFT JOIN (
  SELECT 
    cost_center_id,
    COUNT(*) as total
  FROM public.cost_center_allocations
  GROUP BY cost_center_id
) allocation_count ON cc.id = allocation_count.cost_center_id

ORDER BY cc.hierarchy_path, cc.cost_center_code;

-- المرحلة 7: تحديث RLS policies لمراكز التكلفة
ALTER TABLE public.cost_center_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية تاريخ مراكز التكلفة"
ON public.cost_center_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role) OR 
  has_role(auth.uid(), 'accountant'::user_role)
);

-- المرحلة 8: إنشاء function لحساب التكاليف الموزعة تلقائياً
CREATE OR REPLACE FUNCTION public.auto_distribute_costs()
RETURNS INTEGER AS $$
DECLARE
  distribution_count INTEGER := 0;
  cost_center_record RECORD;
BEGIN
  -- توزيع تكاليف العمليات على مراكز التكلفة بناءً على النشاط
  FOR cost_center_record IN 
    SELECT id, cost_center_code, cost_center_type, budget_amount
    FROM public.cost_centers 
    WHERE is_active = true AND cost_center_type = 'operational'
  LOOP
    -- توزيع تكاليف الوقود
    INSERT INTO public.cost_center_allocations (
      reference_type, reference_id, cost_center_id, 
      allocation_percentage, allocation_date, notes
    )
    SELECT 
      'vehicle_fuel', v.id, cost_center_record.id,
      CASE 
        WHEN cost_center_record.cost_center_code LIKE 'CC-VEH%' THEN 80.0
        WHEN cost_center_record.cost_center_code LIKE 'CC-OPS%' THEN 60.0
        ELSE 30.0
      END,
      CURRENT_DATE,
      'توزيع تلقائي لتكاليف الوقود'
    FROM public.vehicles v
    WHERE v.cost_center_id = cost_center_record.id
    AND NOT EXISTS (
      SELECT 1 FROM public.cost_center_allocations cca
      WHERE cca.reference_type = 'vehicle_fuel' 
      AND cca.reference_id = v.id
      AND cca.cost_center_id = cost_center_record.id
    );
    
    distribution_count := distribution_count + 1;
  END LOOP;
  
  RETURN distribution_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- المرحلة 9: إنشاء function لتحديث الهيكل الهرمي
CREATE OR REPLACE FUNCTION public.update_cost_center_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث مسار الهيكل الهرمي
  IF NEW.parent_id IS NULL THEN
    NEW.level := 1;
    NEW.hierarchy_path := NEW.id::text;
  ELSE
    SELECT level + 1, hierarchy_path || '.' || NEW.id::text
    INTO NEW.level, NEW.hierarchy_path
    FROM public.cost_centers
    WHERE id = NEW.parent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للهيكل الهرمي
DROP TRIGGER IF EXISTS cost_center_hierarchy_trigger ON public.cost_centers;
CREATE TRIGGER cost_center_hierarchy_trigger
  BEFORE INSERT OR UPDATE OF parent_id ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_cost_center_hierarchy();

-- المرحلة 10: تحديث مراكز التكلفة الموجودة بالهيكل الجديد
UPDATE public.cost_centers SET updated_at = now() WHERE id = id;