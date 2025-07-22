
-- Phase 1: Fix Security Issues - Enable RLS and ensure proper tenant isolation

-- 1. Enable RLS for customers table if not already enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies and create comprehensive ones for customers
DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم رؤية العملاء" ON public.customers;
DROP POLICY IF EXISTS "المديرون والموظفون يمكنهم إضافة عملاء" ON public.customers;
DROP POLICY IF EXISTS "المديرون والموظفون يمكنهم تحديث العملاء" ON public.customers;
DROP POLICY IF EXISTS "Users can view customers in their tenant" ON public.customers;

-- Create comprehensive tenant isolation policy for customers
CREATE POLICY "عزل كامل للعملاء حسب المؤسسة"
ON public.customers
FOR ALL
TO authenticated
USING (tenant_id = public.get_current_tenant_id())
WITH CHECK (tenant_id = public.get_current_tenant_id());

-- 3. Ensure employees table has proper RLS policies
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة الموظفين" ON public.employees;
DROP POLICY IF EXISTS "الموظفون يمكنهم رؤية زملائهم" ON public.employees;
DROP POLICY IF EXISTS "employees_tenant_isolation" ON public.employees;

-- Create comprehensive tenant isolation policy for employees
CREATE POLICY "عزل كامل للموظفين حسب المؤسسة"
ON public.employees
FOR ALL
TO authenticated
USING (tenant_id = public.get_current_tenant_id())
WITH CHECK (tenant_id = public.get_current_tenant_id());

-- 4. Ensure departments table has proper RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية الأقسام" ON public.departments;
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة الأقسام" ON public.departments;

CREATE POLICY "عزل كامل للأقسام حسب المؤسسة"
ON public.departments
FOR ALL
TO authenticated
USING (tenant_id = public.get_current_tenant_id())
WITH CHECK (tenant_id = public.get_current_tenant_id());

-- 5. Ensure office_locations table has proper RLS
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية المواقع" ON public.office_locations;
DROP POLICY IF EXISTS "المديرون يمكنهم إدارة المواقع" ON public.office_locations;

CREATE POLICY "عزل كامل للمواقع المكتبية حسب المؤسسة"
ON public.office_locations
FOR ALL
TO authenticated
USING (tenant_id = public.get_current_tenant_id())
WITH CHECK (tenant_id = public.get_current_tenant_id());

-- 6. Update triggers to ensure tenant_id is set automatically
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set tenant_id if not provided
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_current_tenant_id();
  END IF;
  
  -- Validate tenant_id
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية. يرجى تسجيل الدخول أولاً.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to ensure tenant_id is set
DROP TRIGGER IF EXISTS ensure_tenant_id_customers ON public.customers;
CREATE TRIGGER ensure_tenant_id_customers
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_employees ON public.employees;
CREATE TRIGGER ensure_tenant_id_employees
  BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_departments ON public.departments;
CREATE TRIGGER ensure_tenant_id_departments
  BEFORE INSERT ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

DROP TRIGGER IF EXISTS ensure_tenant_id_office_locations ON public.office_locations;
CREATE TRIGGER ensure_tenant_id_office_locations
  BEFORE INSERT ON public.office_locations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

-- 7. Create debug function to help troubleshoot tenant issues
CREATE OR REPLACE FUNCTION public.debug_tenant_data()
RETURNS JSONB AS $$
DECLARE
  current_user_id UUID;
  current_tenant_id UUID;
  result JSONB;
BEGIN
  current_user_id := auth.uid();
  current_tenant_id := public.get_current_tenant_id();
  
  SELECT jsonb_build_object(
    'user_id', current_user_id,
    'tenant_id', current_tenant_id,
    'customers_count', (SELECT COUNT(*) FROM public.customers WHERE tenant_id = current_tenant_id),
    'employees_count', (SELECT COUNT(*) FROM public.employees WHERE tenant_id = current_tenant_id),
    'departments_count', (SELECT COUNT(*) FROM public.departments WHERE tenant_id = current_tenant_id),
    'office_locations_count', (SELECT COUNT(*) FROM public.office_locations WHERE tenant_id = current_tenant_id),
    'user_tenant_status', (
      SELECT jsonb_build_object(
        'role', tu.role,
        'status', tu.status,
        'tenant_name', t.name
      )
      FROM public.tenant_users tu
      JOIN public.tenants t ON tu.tenant_id = t.id
      WHERE tu.user_id = current_user_id
      AND tu.tenant_id = current_tenant_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
