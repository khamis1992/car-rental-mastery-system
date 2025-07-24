-- المرحلة الثانية المصححة النهائية: إصلاح مشاكل RLS

-- 1. إضافة سياسات RLS للجداول الأساسية
CREATE POLICY "Tenant isolation for chart_of_accounts" 
ON public.chart_of_accounts 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for employees" 
ON public.employees 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for vehicles" 
ON public.vehicles 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for contracts" 
ON public.contracts 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for customers" 
ON public.customers 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for invoices" 
ON public.invoices 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for payments" 
ON public.payments 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for journal_entries" 
ON public.journal_entries 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for journal_entry_lines" 
ON public.journal_entry_lines 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for departments" 
ON public.departments 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for office_locations" 
ON public.office_locations 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for branches" 
ON public.branches 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for budgets" 
ON public.budgets 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for budget_items" 
ON public.budget_items 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for bank_accounts" 
ON public.bank_accounts 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for bank_transactions" 
ON public.bank_transactions 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 2. سياسات للجداول الحساسة مع الحقول الصحيحة
CREATE POLICY "Admin only access for user_activity_logs" 
ON public.user_activity_logs 
FOR ALL 
USING (
  tenant_id = get_current_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = get_current_tenant_id()
    AND role IN ('super_admin', 'tenant_admin')
    AND status = 'active'
  )
);

CREATE POLICY "Restricted access for financial_reports" 
ON public.financial_reports 
FOR ALL 
USING (
  tenant_id = get_current_tenant_id() AND
  (
    generated_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE user_id = auth.uid() 
      AND tenant_id = get_current_tenant_id()
      AND role IN ('super_admin', 'tenant_admin', 'manager', 'accountant')
      AND status = 'active'
    )
  )
);

-- 3. تحديث دوال الأمان مع إصلاح search_path
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    tenant_id uuid;
BEGIN
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
    AND tu.status = 'active'
    ORDER BY tu.created_at DESC
    LIMIT 1;
    
    RETURN tenant_id;
END;
$$;

-- 4. دالة آمنة لجلب السياق
CREATE OR REPLACE FUNCTION public.get_user_tenant_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result jsonb;
    user_record record;
BEGIN
    SELECT 
        auth.uid() as user_id,
        u.email,
        tu.role,
        tu.tenant_id,
        t.name as tenant_name,
        t.status as tenant_status,
        CASE WHEN tu.role = 'super_admin' THEN true ELSE false END as is_super_admin
    INTO user_record
    FROM auth.users u
    LEFT JOIN public.tenant_users tu ON tu.user_id = u.id AND tu.status = 'active'
    LEFT JOIN public.tenants t ON t.id = tu.tenant_id
    WHERE u.id = auth.uid();
    
    result := jsonb_build_object(
        'user_id', user_record.user_id,
        'email', user_record.email,
        'role', user_record.role,
        'tenant_id', user_record.tenant_id,
        'tenant_name', user_record.tenant_name,
        'tenant_status', user_record.tenant_status,
        'is_super_admin', user_record.is_super_admin,
        'permissions', jsonb_build_object(
            'can_manage_users', user_record.role IN ('super_admin', 'tenant_admin', 'manager'),
            'can_manage_accounting', user_record.role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
            'can_manage_vehicles', user_record.role IN ('super_admin', 'tenant_admin', 'manager'),
            'can_view_reports', user_record.role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
            'can_manage_contracts', user_record.role IN ('super_admin', 'tenant_admin', 'manager', 'receptionist')
        )
    );
    
    RETURN result;
END;
$$;

-- 5. إنشاء middleware آمن للعمليات الحساسة
CREATE OR REPLACE FUNCTION public.secure_tenant_operation(
    operation_type text,
    table_name text,
    required_role text DEFAULT 'user'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_context jsonb;
    user_role text;
    tenant_id uuid;
BEGIN
    -- جلب السياق الآمن
    user_context := get_user_tenant_context();
    user_role := user_context->>'role';
    tenant_id := (user_context->>'tenant_id')::uuid;
    
    -- التحقق من وجود مؤسسة
    IF tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن الوصول بدون مؤسسة صالحة';
    END IF;
    
    -- التحقق من الصلاحية
    CASE required_role
        WHEN 'super_admin' THEN
            IF user_role != 'super_admin' THEN
                RAISE EXCEPTION 'تتطلب هذه العملية صلاحية مدير النظام';
            END IF;
        WHEN 'tenant_admin' THEN
            IF user_role NOT IN ('super_admin', 'tenant_admin') THEN
                RAISE EXCEPTION 'تتطلب هذه العملية صلاحية مدير المؤسسة';
            END IF;
        WHEN 'manager' THEN
            IF user_role NOT IN ('super_admin', 'tenant_admin', 'manager') THEN
                RAISE EXCEPTION 'تتطلب هذه العملية صلاحية إدارية';
            END IF;
    END CASE;
    
    RETURN true;
END;
$$;

-- 6. دالة محسنة للتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION public.check_user_permission(required_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_context jsonb;
    permissions jsonb;
    has_permission boolean := false;
BEGIN
    user_context := get_user_tenant_context();
    permissions := user_context->'permissions';
    
    CASE required_permission
        WHEN 'manage_users' THEN
            has_permission := (permissions->>'can_manage_users')::boolean;
        WHEN 'manage_accounting' THEN
            has_permission := (permissions->>'can_manage_accounting')::boolean;
        WHEN 'manage_vehicles' THEN
            has_permission := (permissions->>'can_manage_vehicles')::boolean;
        WHEN 'view_reports' THEN
            has_permission := (permissions->>'can_view_reports')::boolean;
        WHEN 'manage_contracts' THEN
            has_permission := (permissions->>'can_manage_contracts')::boolean;
        ELSE
            has_permission := false;
    END CASE;
    
    RETURN COALESCE(has_permission, false);
END;
$$;