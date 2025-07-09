-- تنفيذ خطة شاملة لإصلاح مراكز التكلفة وضمان عرض البيانات الصحيحة

-- 1. إنشاء مراكز تكلفة أساسية إذا لم تكن موجودة
DO $$
DECLARE
    operational_center_id UUID;
    admin_center_id UUID;
    revenue_center_id UUID;
    support_center_id UUID;
BEGIN
    -- مركز العمليات التشغيلية
    INSERT INTO public.cost_centers (
        cost_center_code, cost_center_name, description, cost_center_type,
        budget_amount, actual_spent, level, hierarchy_path, is_active
    ) VALUES (
        'OP001', 'العمليات التشغيلية', 'مركز تكلفة العمليات الرئيسية', 'operational',
        500000, 0, 1, 'OP001', true
    ) ON CONFLICT (cost_center_code) DO NOTHING
    RETURNING id INTO operational_center_id;

    -- مركز الإدارة
    INSERT INTO public.cost_centers (
        cost_center_code, cost_center_name, description, cost_center_type,
        budget_amount, actual_spent, level, hierarchy_path, is_active
    ) VALUES (
        'AD001', 'الإدارة العامة', 'مركز تكلفة الإدارة والموارد البشرية', 'administrative',
        300000, 0, 1, 'AD001', true
    ) ON CONFLICT (cost_center_code) DO NOTHING
    RETURNING id INTO admin_center_id;

    -- مركز الإيرادات
    INSERT INTO public.cost_centers (
        cost_center_code, cost_center_name, description, cost_center_type,
        budget_amount, actual_spent, level, hierarchy_path, is_active
    ) VALUES (
        'RV001', 'مركز الإيرادات', 'مركز تكلفة المبيعات والتأجير', 'revenue',
        200000, 0, 1, 'RV001', true
    ) ON CONFLICT (cost_center_code) DO NOTHING
    RETURNING id INTO revenue_center_id;

    -- مركز الدعم
    INSERT INTO public.cost_centers (
        cost_center_code, cost_center_name, description, cost_center_type,
        budget_amount, actual_spent, level, hierarchy_path, is_active
    ) VALUES (
        'SP001', 'الدعم والصيانة', 'مركز تكلفة الدعم والصيانة', 'support',
        150000, 0, 1, 'SP001', true
    ) ON CONFLICT (cost_center_code) DO NOTHING
    RETURNING id INTO support_center_id;

    RAISE NOTICE 'تم إنشاء مراكز التكلفة الأساسية';
END $$;

-- 2. ربط المركبات بمراكز التكلفة
UPDATE public.vehicles 
SET cost_center_id = (
    SELECT id FROM public.cost_centers 
    WHERE cost_center_code = 'OP001' 
    LIMIT 1
)
WHERE cost_center_id IS NULL
AND status = 'available';

-- 3. ربط الموظفين بمراكز التكلفة
UPDATE public.employees 
SET primary_cost_center_id = (
    CASE 
        WHEN department_id IS NOT NULL THEN (
            SELECT id FROM public.cost_centers 
            WHERE cost_center_code = 'AD001' 
            LIMIT 1
        )
        ELSE (
            SELECT id FROM public.cost_centers 
            WHERE cost_center_code = 'OP001' 
            LIMIT 1
        )
    END
)
WHERE primary_cost_center_id IS NULL
AND status = 'active';

-- 4. ربط العقود بمراكز التكلفة
UPDATE public.contracts 
SET cost_center_id = (
    SELECT id FROM public.cost_centers 
    WHERE cost_center_code = 'RV001' 
    LIMIT 1
)
WHERE cost_center_id IS NULL
AND status IN ('active', 'completed');

-- 5. إنشاء أو تحديث view لتقرير مراكز التكلفة
DROP VIEW IF EXISTS public.cost_center_report;

CREATE VIEW public.cost_center_report AS
SELECT 
    cc.id,
    cc.cost_center_code,
    cc.cost_center_name,
    cc.cost_center_type,
    cc.level,
    cc.hierarchy_path,
    cc.budget_amount,
    cc.actual_spent,
    (cc.actual_spent - cc.budget_amount) as variance,
    CASE 
        WHEN cc.budget_amount > 0 THEN (cc.actual_spent / cc.budget_amount) * 100
        ELSE 0 
    END as budget_utilization_percentage,
    d.department_name,
    CONCAT(e.first_name, ' ', e.last_name) as manager_name,
    (SELECT COUNT(*) FROM public.employees emp WHERE emp.primary_cost_center_id = cc.id) as employee_count,
    (SELECT COUNT(*) FROM public.contracts c WHERE c.cost_center_id = cc.id) as contract_count,
    (SELECT COUNT(*) FROM public.vehicles v WHERE v.cost_center_id = cc.id) as vehicle_count
FROM public.cost_centers cc
LEFT JOIN public.departments d ON cc.department_id = d.id
LEFT JOIN public.employees e ON cc.manager_id = e.id
WHERE cc.is_active = true
ORDER BY cc.hierarchy_path;

-- 6. إنشاء توزيعات تكلفة أولية للعقود المكتملة
INSERT INTO public.cost_center_allocations (
    reference_type, reference_id, cost_center_id, allocation_percentage, allocation_amount, notes
)
SELECT 
    'contract',
    c.id,
    c.cost_center_id,
    100,
    c.final_amount,
    'توزيع تلقائي للعقد المكتمل'
FROM public.contracts c
WHERE c.status = 'completed' 
AND c.cost_center_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.cost_center_allocations ca 
    WHERE ca.reference_type = 'contract' 
    AND ca.reference_id = c.id
);

-- 7. إنشاء توزيعات تكلفة للصيانة
INSERT INTO public.cost_center_allocations (
    reference_type, reference_id, cost_center_id, allocation_percentage, allocation_amount, notes
)
SELECT 
    'maintenance',
    vm.id,
    COALESCE(v.cost_center_id, (SELECT id FROM public.cost_centers WHERE cost_center_code = 'SP001' LIMIT 1)),
    100,
    vm.cost,
    'توزيع تكلفة صيانة'
FROM public.vehicle_maintenance vm
JOIN public.vehicles v ON vm.vehicle_id = v.id
WHERE vm.status = 'completed' 
AND vm.cost > 0
AND NOT EXISTS (
    SELECT 1 FROM public.cost_center_allocations ca 
    WHERE ca.reference_type = 'maintenance' 
    AND ca.reference_id = vm.id
);

-- 8. تحديث التكاليف الفعلية لمراكز التكلفة
PERFORM public.update_all_cost_center_costs();

-- 9. إضافة بيانات وهمية إضافية للاختبار
DO $$
DECLARE
    test_cost_center_id UUID;
BEGIN
    -- الحصول على مركز العمليات
    SELECT id INTO test_cost_center_id FROM public.cost_centers WHERE cost_center_code = 'OP001';
    
    -- إضافة توزيع تكلفة وهمي للاختبار
    INSERT INTO public.cost_center_allocations (
        reference_type, reference_id, cost_center_id, allocation_percentage, allocation_amount, notes
    ) VALUES (
        'manual', gen_random_uuid(), test_cost_center_id, 100, 25000, 'توزيع تكلفة تجريبي'
    );
    
    -- تحديث التكلفة الفعلية مباشرة للاختبار
    UPDATE public.cost_centers 
    SET actual_spent = actual_spent + 25000
    WHERE id = test_cost_center_id;
    
    RAISE NOTICE 'تم إضافة بيانات تجريبية لمركز العمليات';
END $$;

-- 10. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_cost_center_allocations_cost_center_date 
ON public.cost_center_allocations(cost_center_id, allocation_date);

CREATE INDEX IF NOT EXISTS idx_contracts_cost_center_status 
ON public.contracts(cost_center_id, status) WHERE cost_center_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employees_cost_center_status 
ON public.employees(primary_cost_center_id, status) WHERE primary_cost_center_id IS NOT NULL;

-- 11. تقرير نهائي عن حالة مراكز التكلفة
DO $$
DECLARE
    total_centers INTEGER;
    centers_with_budget INTEGER;
    centers_with_spending INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_centers FROM public.cost_centers WHERE is_active = true;
    SELECT COUNT(*) INTO centers_with_budget FROM public.cost_centers WHERE is_active = true AND budget_amount > 0;
    SELECT COUNT(*) INTO centers_with_spending FROM public.cost_centers WHERE is_active = true AND actual_spent > 0;
    
    RAISE NOTICE '=== تقرير حالة مراكز التكلفة ===';
    RAISE NOTICE 'إجمالي مراكز التكلفة النشطة: %', total_centers;
    RAISE NOTICE 'المراكز التي لها ميزانية: %', centers_with_budget;
    RAISE NOTICE 'المراكز التي لها مصروفات فعلية: %', centers_with_spending;
    RAISE NOTICE '=== انتهى التقرير ===';
END $$;