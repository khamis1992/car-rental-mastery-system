-- إصلاح دالة تحديث تكاليف مراكز التكلفة لاستخدام الجدول الصحيح
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
    FROM public.vehicle_maintenance m
    JOIN public.vehicles v ON m.vehicle_id = v.id
    WHERE v.cost_center_id = cost_centers.id
    AND m.created_at >= date_trunc('year', CURRENT_DATE)
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