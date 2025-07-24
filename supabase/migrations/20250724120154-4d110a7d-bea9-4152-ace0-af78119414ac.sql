-- المرحلة الثانية: إصلاح مشاكل RLS المفقودة وإضافة سياسات حماية شاملة

-- 1. إضافة سياسات RLS للجداول المهمة التي تفتقر إليها
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

CREATE POLICY "Tenant isolation for vehicle_maintenance" 
ON public.vehicle_maintenance 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Tenant isolation for vehicle_assignments" 
ON public.vehicle_assignments 
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

CREATE POLICY "Tenant isolation for branches" 
ON public.branches 
FOR ALL 
USING (tenant_id = get_current_tenant_id());

-- 2. إضافة سياسات حماية للجداول الحساسة
CREATE POLICY "Admin only access for user_activity_logs" 
ON public.user_activity_logs 
FOR ALL 
USING (
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
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE user_id = auth.uid() 
      AND tenant_id = get_current_tenant_id()
      AND role IN ('super_admin', 'tenant_admin', 'manager', 'accountant')
      AND status = 'active'
    )
  )
);

-- 3. تحسين دوال الأمان وإضافة SET search_path
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
    -- جلب معرف المؤسسة للمستخدم الحالي
    SELECT tu.tenant_id INTO tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
    AND tu.status = 'active'
    ORDER BY tu.created_at DESC
    LIMIT 1;
    
    RETURN tenant_id;
END;
$$;

-- 4. تحديث دوال المصادقة لتكون آمنة
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
    -- جلب معلومات المستخدم والمؤسسة والصلاحيات
    SELECT 
        auth.uid() as user_id,
        u.email,
        tu.role,
        tu.tenant_id,
        t.name as tenant_name,
        t.status as tenant_status,
        CASE WHEN tu.role = 'super_admin' THEN true ELSE false END as is_super_admin,
        jsonb_build_object(
            'can_manage_users', tu.role IN ('super_admin', 'tenant_admin', 'manager'),
            'can_manage_accounting', tu.role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
            'can_manage_vehicles', tu.role IN ('super_admin', 'tenant_admin', 'manager'),
            'can_view_reports', tu.role IN ('super_admin', 'tenant_admin', 'manager', 'accountant'),
            'can_manage_contracts', tu.role IN ('super_admin', 'tenant_admin', 'manager', 'receptionist')
        ) as permissions
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
        'permissions', user_record.permissions
    );
    
    RETURN result;
END;
$$;

-- 5. إنشاء دالة لتسجيل العمليات الأمنية
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type text,
    table_name text DEFAULT NULL,
    record_id uuid DEFAULT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.user_activity_logs (
        tenant_id,
        user_id,
        action_type,
        action_description,
        metadata,
        ip_address,
        user_agent
    ) VALUES (
        get_current_tenant_id(),
        auth.uid(),
        event_type,
        CASE 
            WHEN table_name IS NOT NULL THEN 'عملية على جدول: ' || table_name
            ELSE 'حدث أمني'
        END,
        metadata || jsonb_build_object('record_id', record_id, 'table_name', table_name),
        current_setting('request.headers')::json->>'x-forwarded-for',
        current_setting('request.headers')::json->>'user-agent'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- تجاهل الأخطاء في التسجيل حتى لا تؤثر على العملية الأساسية
        NULL;
END;
$$;

-- 6. إنشاء trigger لمراقبة التعديلات الحساسة
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- تسجيل التعديلات على الجداول الحساسة
    IF TG_OP = 'DELETE' THEN
        PERFORM log_security_event('sensitive_delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_security_event('sensitive_update', TG_TABLE_NAME, NEW.id, 
            jsonb_build_object('old_values', to_jsonb(OLD), 'new_values', to_jsonb(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM log_security_event('sensitive_insert', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- 7. تطبيق triggers على الجداول الحساسة
CREATE TRIGGER audit_chart_of_accounts_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

CREATE TRIGGER audit_journal_entries_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

CREATE TRIGGER audit_payments_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

CREATE TRIGGER audit_tenant_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.tenant_users
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

-- 8. تحسين دالة التحقق من الصلاحيات
CREATE OR REPLACE FUNCTION public.check_user_permission(required_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_context jsonb;
    has_permission boolean := false;
BEGIN
    user_context := get_user_tenant_context();
    
    -- التحقق من الصلاحية المطلوبة
    CASE required_permission
        WHEN 'manage_users' THEN
            has_permission := (user_context->'permissions'->>'can_manage_users')::boolean;
        WHEN 'manage_accounting' THEN
            has_permission := (user_context->'permissions'->>'can_manage_accounting')::boolean;
        WHEN 'manage_vehicles' THEN
            has_permission := (user_context->'permissions'->>'can_manage_vehicles')::boolean;
        WHEN 'view_reports' THEN
            has_permission := (user_context->'permissions'->>'can_view_reports')::boolean;
        WHEN 'manage_contracts' THEN
            has_permission := (user_context->'permissions'->>'can_manage_contracts')::boolean;
        ELSE
            has_permission := false;
    END CASE;
    
    -- تسجيل محاولة الوصول
    PERFORM log_security_event('permission_check', 
        NULL, 
        NULL, 
        jsonb_build_object('permission', required_permission, 'granted', has_permission)
    );
    
    RETURN has_permission;
END;
$$;