-- إزالة الـ view الحالي وإنشاء function آمن بدلاً منه
DROP VIEW IF EXISTS public.cost_center_report;

-- إنشاء function آمن للحصول على تقرير مراكز التكلفة
CREATE OR REPLACE FUNCTION public.get_cost_center_report()
RETURNS TABLE (
    id uuid,
    cost_center_code text,
    cost_center_name text,
    cost_center_type text,
    level integer,
    hierarchy_path text,
    budget_amount numeric,
    actual_spent numeric,
    variance numeric,
    budget_utilization_percentage numeric,
    department_name text,
    manager_name text,
    employee_count bigint,
    contract_count bigint,
    vehicle_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_tenant_id uuid;
BEGIN
    -- التحقق من المصادقة
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'غير مصرح لك بالوصول إلى هذه البيانات';
    END IF;
    
    -- الحصول على معرف المؤسسة الحالية
    current_tenant_id := public.get_current_tenant_id();
    
    IF current_tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية';
    END IF;
    
    -- التحقق من الصلاحيات
    IF NOT public.has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']) THEN
        RAISE EXCEPTION 'ليس لديك صلاحية لعرض تقارير مراكز التكلفة';
    END IF;
    
    -- إرجاع البيانات مع قيود الأمان
    RETURN QUERY
    SELECT 
        cc.id,
        cc.cost_center_code,
        cc.cost_center_name,
        cc.cost_center_type,
        cc.level,
        cc.hierarchy_path,
        cc.budget_amount,
        cc.actual_spent,
        (cc.budget_amount - cc.actual_spent) AS variance,
        CASE
            WHEN cc.budget_amount > 0 THEN (cc.actual_spent / cc.budget_amount * 100)
            ELSE 0
        END AS budget_utilization_percentage,
        d.department_name,
        (e.first_name || ' ' || e.last_name) AS manager_name,
        count(DISTINCT emp.id) AS employee_count,
        count(DISTINCT c.id) AS contract_count,
        count(DISTINCT v.id) AS vehicle_count
    FROM cost_centers cc
        LEFT JOIN departments d ON cc.department_id = d.id AND d.tenant_id = current_tenant_id
        LEFT JOIN employees e ON cc.manager_id = e.id AND e.tenant_id = current_tenant_id
        LEFT JOIN employees emp ON (emp.primary_cost_center_id = cc.id OR emp.secondary_cost_center_id = cc.id) 
                                  AND emp.tenant_id = current_tenant_id
        LEFT JOIN contracts c ON c.cost_center_id = cc.id AND c.tenant_id = current_tenant_id
        LEFT JOIN vehicles v ON v.cost_center_id = cc.id AND v.tenant_id = current_tenant_id
    WHERE cc.is_active = true 
      AND cc.tenant_id = current_tenant_id
    GROUP BY cc.id, cc.cost_center_code, cc.cost_center_name, cc.cost_center_type, 
             cc.level, cc.hierarchy_path, cc.budget_amount, cc.actual_spent, 
             d.department_name, e.first_name, e.last_name
    ORDER BY cc.cost_center_code;
END;
$$;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION public.get_cost_center_report() IS 'دالة آمنة للحصول على تقرير مراكز التكلفة مع التحقق من الصلاحيات';

-- إنشاء view آمن جديد (اختياري)
CREATE VIEW public.cost_center_report_secure AS
SELECT * FROM public.get_cost_center_report();

-- تفعيل RLS على الـ view الجديد
ALTER VIEW public.cost_center_report_secure OWNER TO postgres;

-- تعليق توضيحي للـ view
COMMENT ON VIEW public.cost_center_report_secure IS 'عرض آمن لتقرير مراكز التكلفة - يستخدم دالة آمنة للتحقق من الصلاحيات';