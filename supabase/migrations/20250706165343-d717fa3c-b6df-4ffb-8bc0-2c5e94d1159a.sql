-- دالة لتحديث تكاليف مراكز التكلفة تلقائياً
CREATE OR REPLACE FUNCTION public.update_all_cost_center_costs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- تحديث التكاليف من الموظفين (الرواتب الشهرية)
  UPDATE public.cost_centers 
  SET actual_spent = COALESCE((
    SELECT SUM(e.salary * 12) -- تقدير سنوي
    FROM public.employees e
    WHERE e.primary_cost_center_id = cost_centers.id
    AND e.status = 'active'
  ), 0)
  WHERE cost_center_type = 'administrative';

  -- تحديث التكاليف من العقود
  UPDATE public.cost_centers 
  SET actual_spent = actual_spent + COALESCE((
    SELECT SUM(c.total_amount)
    FROM public.contracts c
    WHERE c.cost_center_id = cost_centers.id
    AND c.status IN ('active', 'completed')
    AND c.created_at >= date_trunc('year', CURRENT_DATE)
  ), 0)
  WHERE cost_center_type IN ('operational', 'revenue');

  -- تحديث التكاليف من صيانة المركبات
  UPDATE public.cost_centers 
  SET actual_spent = actual_spent + COALESCE((
    SELECT SUM(m.cost)
    FROM public.maintenance_records m
    JOIN public.vehicles v ON m.vehicle_id = v.id
    WHERE v.cost_center_id = cost_centers.id
    AND m.maintenance_date >= date_trunc('year', CURRENT_DATE)
  ), 0)
  WHERE cost_center_type = 'operational';

  -- تحديث التكاليف من توزيعات التكلفة
  UPDATE public.cost_centers 
  SET actual_spent = actual_spent + COALESCE((
    SELECT SUM(ca.allocation_amount)
    FROM public.cost_center_allocations ca
    WHERE ca.cost_center_id = cost_centers.id
    AND ca.allocation_date >= date_trunc('year', CURRENT_DATE)
  ), 0);

  -- تحديث تاريخ آخر تحديث
  UPDATE public.cost_centers 
  SET updated_at = now();

END;
$$;

-- دالة لإنشاء تنبيهات تجاوز الميزانية
CREATE OR REPLACE FUNCTION public.check_budget_overruns()
RETURNS TABLE(
  cost_center_id UUID,
  cost_center_name TEXT,
  cost_center_code TEXT,
  budget_amount NUMERIC,
  actual_spent NUMERIC,
  overrun_amount NUMERIC,
  overrun_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.cost_center_name,
    cc.cost_center_code,
    cc.budget_amount,
    cc.actual_spent,
    (cc.actual_spent - cc.budget_amount) as overrun_amount,
    CASE 
      WHEN cc.budget_amount > 0 THEN
        ((cc.actual_spent - cc.budget_amount) / cc.budget_amount) * 100
      ELSE 0 
    END as overrun_percentage
  FROM public.cost_centers cc
  WHERE cc.is_active = true
  AND cc.budget_amount > 0
  AND cc.actual_spent > cc.budget_amount
  ORDER BY ((cc.actual_spent - cc.budget_amount) / cc.budget_amount) DESC;
END;
$$;

-- دالة لتحديث كلفة مركز تكلفة واحد
CREATE OR REPLACE FUNCTION public.update_cost_center_actual_cost(cost_center_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  employee_costs NUMERIC := 0;
  contract_costs NUMERIC := 0;
  maintenance_costs NUMERIC := 0;
  allocation_costs NUMERIC := 0;
  cc_type TEXT;
BEGIN
  -- الحصول على نوع مركز التكلفة
  SELECT cost_center_type INTO cc_type
  FROM public.cost_centers
  WHERE id = cost_center_id;

  -- حساب تكاليف الموظفين (للمراكز الإدارية)
  IF cc_type = 'administrative' THEN
    SELECT COALESCE(SUM(e.salary * 12), 0) INTO employee_costs
    FROM public.employees e
    WHERE e.primary_cost_center_id = cost_center_id
    AND e.status = 'active';
  END IF;

  -- حساب تكاليف العقود
  SELECT COALESCE(SUM(c.total_amount), 0) INTO contract_costs
  FROM public.contracts c
  WHERE c.cost_center_id = cost_center_id
  AND c.status IN ('active', 'completed')
  AND c.created_at >= date_trunc('year', CURRENT_DATE);

  -- حساب تكاليف الصيانة
  SELECT COALESCE(SUM(m.cost), 0) INTO maintenance_costs
  FROM public.maintenance_records m
  JOIN public.vehicles v ON m.vehicle_id = v.id
  WHERE v.cost_center_id = cost_center_id
  AND m.maintenance_date >= date_trunc('year', CURRENT_DATE);

  -- حساب توزيعات التكلفة
  SELECT COALESCE(SUM(ca.allocation_amount), 0) INTO allocation_costs
  FROM public.cost_center_allocations ca
  WHERE ca.cost_center_id = cost_center_id
  AND ca.allocation_date >= date_trunc('year', CURRENT_DATE);

  -- تحديث المركز
  UPDATE public.cost_centers 
  SET 
    actual_spent = employee_costs + contract_costs + maintenance_costs + allocation_costs,
    updated_at = now()
  WHERE id = cost_center_id;

END;
$$;

-- تحسين الأداء - إنشاء فهارس لمراكز التكلفة
CREATE INDEX IF NOT EXISTS idx_employees_cost_centers ON public.employees(primary_cost_center_id) WHERE primary_cost_center_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_cost_center ON public.contracts(cost_center_id) WHERE cost_center_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_cost_center ON public.vehicles(cost_center_id) WHERE cost_center_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cost_center_allocations_cost_center_id ON public.cost_center_allocations(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_allocations_reference ON public.cost_center_allocations(reference_type, reference_id);