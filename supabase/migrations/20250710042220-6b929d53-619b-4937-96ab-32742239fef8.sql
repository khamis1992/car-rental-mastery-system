-- إنشاء نظام الأذونات المتقدم للمؤسسات

-- جدول الأذونات الأساسية في النظام
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  permission_description TEXT,
  module_name TEXT NOT NULL, -- مثل: contracts, vehicles, accounting, customers
  action_type TEXT NOT NULL, -- مثل: read, write, delete, approve, export
  resource_level TEXT NOT NULL DEFAULT 'all', -- all, department, own, custom
  is_system_permission BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مجموعات الأذونات لتسهيل الإدارة
CREATE TABLE public.permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  group_description TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ربط الأذونات بالمجموعات
CREATE TABLE public.permission_group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(group_id, permission_id)
);

-- جدول أذونات الأدوار المحسن
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB DEFAULT '{}', -- شروط إضافية للإذن
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, role_name, permission_id)
);

-- جدول الأذونات الخاصة للمستخدمين (استثناءات)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB DEFAULT '{}',
  reason TEXT, -- سبب منح أو سحب الإذن
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, tenant_id, permission_id)
);

-- جدول قيود الوصول للبيانات
CREATE TABLE public.data_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  role_name TEXT,
  department_id UUID REFERENCES public.departments(id),
  access_conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- جدول سجل الأذونات للمراجعة
CREATE TABLE public.permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- grant, revoke, modify
  permission_key TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_role TEXT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس للأداء
CREATE INDEX idx_permissions_module_action ON public.permissions(module_name, action_type);
CREATE INDEX idx_permissions_active ON public.permissions(is_active);
CREATE INDEX idx_role_permissions_tenant_role ON public.role_permissions(tenant_id, role_name);
CREATE INDEX idx_user_permissions_user_tenant ON public.user_permissions(user_id, tenant_id);
CREATE INDEX idx_data_access_rules_tenant_table ON public.data_access_rules(tenant_id, table_name);
CREATE INDEX idx_permission_audit_tenant_user ON public.permission_audit_log(tenant_id, user_id);

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للأذونات الأساسية
CREATE POLICY "Everyone can view system permissions" 
ON public.permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can manage permissions" 
ON public.permissions 
FOR ALL 
USING (has_any_tenant_role(ARRAY['super_admin']))
WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- سياسات أمان مجموعات الأذونات
CREATE POLICY "Tenant admins can manage permission groups" 
ON public.permission_groups 
FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']))
WITH CHECK (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

CREATE POLICY "Users can view permission groups in their tenant" 
ON public.permission_groups 
FOR SELECT 
USING (tenant_id = get_current_tenant_id());

-- سياسات أمان أذونات الأدوار
CREATE POLICY "Tenant admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']))
WITH CHECK (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

CREATE POLICY "Users can view role permissions in their tenant" 
ON public.role_permissions 
FOR SELECT 
USING (tenant_id = get_current_tenant_id());

-- سياسات أمان الأذونات الخاصة
CREATE POLICY "Tenant admins can manage user permissions" 
ON public.user_permissions 
FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']))
WITH CHECK (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (user_id = auth.uid() OR (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager'])));

-- سياسات أمان قيود البيانات
CREATE POLICY "Tenant admins can manage data access rules" 
ON public.data_access_rules 
FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']))
WITH CHECK (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

-- سياسات أمان سجل المراجعة
CREATE POLICY "Tenant admins can view permission audit log" 
ON public.permission_audit_log 
FOR SELECT 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager']));

CREATE POLICY "System can insert audit log" 
ON public.permission_audit_log 
FOR INSERT 
WITH CHECK (true);

-- دالة للتحقق من إذن معين للمستخدم
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID,
  _tenant_id UUID,
  _permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
  has_role_permission BOOLEAN := false;
  has_user_permission BOOLEAN := false;
  user_permission_granted BOOLEAN;
BEGIN
  -- الحصول على دور المستخدم في المؤسسة
  SELECT role INTO user_role
  FROM public.tenant_users
  WHERE user_id = _user_id AND tenant_id = _tenant_id AND status = 'active';
  
  -- التحقق من أذونات الدور
  SELECT EXISTS(
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE rp.tenant_id = _tenant_id
    AND rp.role_name = user_role
    AND p.permission_key = _permission_key
    AND rp.granted = true
    AND (rp.expires_at IS NULL OR rp.expires_at > now())
    AND p.is_active = true
  ) INTO has_role_permission;
  
  -- التحقق من الأذونات الخاصة للمستخدم
  SELECT granted INTO user_permission_granted
  FROM public.user_permissions up
  JOIN public.permissions p ON up.permission_id = p.id
  WHERE up.user_id = _user_id
  AND up.tenant_id = _tenant_id
  AND p.permission_key = _permission_key
  AND (up.expires_at IS NULL OR up.expires_at > now())
  AND p.is_active = true;
  
  -- إذا كان هناك إذن خاص، فإنه يلغي إذن الدور
  IF user_permission_granted IS NOT NULL THEN
    RETURN user_permission_granted;
  END IF;
  
  -- إرجاع إذن الدور
  RETURN has_role_permission;
END;
$$;

-- دالة للحصول على جميع أذونات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_permissions(
  _user_id UUID,
  _tenant_id UUID
)
RETURNS TABLE(
  permission_key TEXT,
  permission_name TEXT,
  module_name TEXT,
  action_type TEXT,
  granted BOOLEAN,
  source TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- الحصول على دور المستخدم
  SELECT role INTO user_role
  FROM public.tenant_users
  WHERE user_id = _user_id AND tenant_id = _tenant_id AND status = 'active';
  
  RETURN QUERY
  WITH role_permissions AS (
    SELECT 
      p.permission_key,
      p.permission_name,
      p.module_name,
      p.action_type,
      rp.granted,
      'role' as source
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE rp.tenant_id = _tenant_id
    AND rp.role_name = user_role
    AND (rp.expires_at IS NULL OR rp.expires_at > now())
    AND p.is_active = true
  ),
  user_permissions AS (
    SELECT 
      p.permission_key,
      p.permission_name,
      p.module_name,
      p.action_type,
      up.granted,
      'user' as source
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = _user_id
    AND up.tenant_id = _tenant_id
    AND (up.expires_at IS NULL OR up.expires_at > now())
    AND p.is_active = true
  )
  SELECT 
    COALESCE(up.permission_key, rp.permission_key),
    COALESCE(up.permission_name, rp.permission_name),
    COALESCE(up.module_name, rp.module_name),
    COALESCE(up.action_type, rp.action_type),
    COALESCE(up.granted, rp.granted),
    COALESCE(up.source, rp.source)
  FROM role_permissions rp
  FULL OUTER JOIN user_permissions up ON rp.permission_key = up.permission_key;
END;
$$;

-- دالة لتسجيل تغييرات الأذونات
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.permission_audit_log (
    tenant_id,
    user_id,
    action_type,
    permission_key,
    target_user_id,
    target_role,
    old_value,
    new_value,
    reason
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'grant'
      WHEN TG_OP = 'UPDATE' THEN 'modify'
      WHEN TG_OP = 'DELETE' THEN 'revoke'
    END,
    (SELECT permission_key FROM public.permissions WHERE id = COALESCE(NEW.permission_id, OLD.permission_id)),
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.role_name, OLD.role_name),
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
    COALESCE(NEW.reason, 'تغيير تلقائي')
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء triggers للمراجعة
CREATE TRIGGER role_permissions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_permission_change();

CREATE TRIGGER user_permissions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_permission_change();

-- إدراج الأذونات الأساسية للنظام
INSERT INTO public.permissions (permission_key, permission_name, permission_description, module_name, action_type, resource_level, is_system_permission) VALUES
-- أذونات العقود
('contracts.read.all', 'عرض جميع العقود', 'يمكن عرض جميع العقود في النظام', 'contracts', 'read', 'all', true),
('contracts.read.department', 'عرض عقود القسم', 'يمكن عرض عقود القسم فقط', 'contracts', 'read', 'department', true),
('contracts.read.own', 'عرض العقود الخاصة', 'يمكن عرض العقود التي أنشأها المستخدم فقط', 'contracts', 'read', 'own', true),
('contracts.write', 'إنشاء وتعديل العقود', 'يمكن إنشاء وتعديل العقود', 'contracts', 'write', 'all', true),
('contracts.delete', 'حذف العقود', 'يمكن حذف العقود', 'contracts', 'delete', 'all', true),
('contracts.approve', 'الموافقة على العقود', 'يمكن الموافقة على العقود ورفضها', 'contracts', 'approve', 'all', true),
('contracts.export', 'تصدير العقود', 'يمكن تصدير بيانات العقود', 'contracts', 'export', 'all', true),

-- أذونات المركبات
('vehicles.read.all', 'عرض جميع المركبات', 'يمكن عرض جميع المركبات في النظام', 'vehicles', 'read', 'all', true),
('vehicles.write', 'إدارة المركبات', 'يمكن إنشاء وتعديل المركبات', 'vehicles', 'write', 'all', true),
('vehicles.delete', 'حذف المركبات', 'يمكن حذف المركبات', 'vehicles', 'delete', 'all', true),
('vehicles.maintenance', 'إدارة صيانة المركبات', 'يمكن إدارة جدولة وتتبع صيانة المركبات', 'vehicles', 'maintenance', 'all', true),

-- أذونات العملاء
('customers.read.all', 'عرض جميع العملاء', 'يمكن عرض جميع العملاء', 'customers', 'read', 'all', true),
('customers.write', 'إدارة العملاء', 'يمكن إنشاء وتعديل بيانات العملاء', 'customers', 'write', 'all', true),
('customers.delete', 'حذف العملاء', 'يمكن حذف العملاء', 'customers', 'delete', 'all', true),

-- أذونات المحاسبة
('accounting.read.all', 'عرض جميع البيانات المحاسبية', 'يمكن عرض جميع القيود والتقارير المحاسبية', 'accounting', 'read', 'all', true),
('accounting.write', 'إدارة القيود المحاسبية', 'يمكن إنشاء وتعديل القيود المحاسبية', 'accounting', 'write', 'all', true),
('accounting.approve', 'الموافقة على القيود', 'يمكن الموافقة على القيود المحاسبية', 'accounting', 'approve', 'all', true),
('accounting.reports', 'عرض التقارير المحاسبية', 'يمكن عرض وتصدير التقارير المحاسبية', 'accounting', 'reports', 'all', true),

-- أذونات الموظفين
('employees.read.all', 'عرض جميع الموظفين', 'يمكن عرض بيانات جميع الموظفين', 'employees', 'read', 'all', true),
('employees.read.department', 'عرض موظفي القسم', 'يمكن عرض موظفي القسم فقط', 'employees', 'read', 'department', true),
('employees.write', 'إدارة الموظفين', 'يمكن إنشاء وتعديل بيانات الموظفين', 'employees', 'write', 'all', true),
('employees.payroll', 'إدارة الرواتب', 'يمكن إدارة رواتب الموظفين', 'employees', 'payroll', 'all', true),

-- أذونات التقارير
('reports.financial', 'التقارير المالية', 'يمكن عرض التقارير المالية', 'reports', 'read', 'all', true),
('reports.operational', 'التقارير التشغيلية', 'يمكن عرض التقارير التشغيلية', 'reports', 'read', 'all', true),
('reports.export', 'تصدير التقارير', 'يمكن تصدير التقارير', 'reports', 'export', 'all', true),

-- أذونات الإعدادات
('settings.system', 'إعدادات النظام', 'يمكن تعديل إعدادات النظام العامة', 'settings', 'write', 'all', true),
('settings.tenant', 'إعدادات المؤسسة', 'يمكن تعديل إعدادات المؤسسة', 'settings', 'write', 'all', true),
('settings.permissions', 'إدارة الأذونات', 'يمكن إدارة أذونات المستخدمين والأدوار', 'settings', 'permissions', 'all', true);

-- دالة لإعداد الأذونات الافتراضية للأدوار
CREATE OR REPLACE FUNCTION public.setup_default_role_permissions(_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- أذونات مدير المؤسسة
  INSERT INTO public.role_permissions (tenant_id, role_name, permission_id, granted)
  SELECT _tenant_id, 'tenant_admin', id, true
  FROM public.permissions
  WHERE is_system_permission = true;
  
  -- أذونات المدير
  INSERT INTO public.role_permissions (tenant_id, role_name, permission_id, granted)
  SELECT _tenant_id, 'manager', id, true
  FROM public.permissions
  WHERE permission_key IN (
    'contracts.read.all', 'contracts.write', 'contracts.approve',
    'vehicles.read.all', 'vehicles.write',
    'customers.read.all', 'customers.write',
    'employees.read.all', 'employees.write',
    'reports.financial', 'reports.operational', 'reports.export'
  );
  
  -- أذونات المحاسب
  INSERT INTO public.role_permissions (tenant_id, role_name, permission_id, granted)
  SELECT _tenant_id, 'accountant', id, true
  FROM public.permissions
  WHERE permission_key IN (
    'contracts.read.all', 'accounting.read.all', 'accounting.write',
    'accounting.reports', 'reports.financial', 'reports.export'
  );
  
  -- أذونات موظف الاستقبال
  INSERT INTO public.role_permissions (tenant_id, role_name, permission_id, granted)
  SELECT _tenant_id, 'receptionist', id, true
  FROM public.permissions
  WHERE permission_key IN (
    'contracts.read.department', 'contracts.write',
    'customers.read.all', 'customers.write',
    'vehicles.read.all'
  );
  
  -- أذونات المستخدم العادي
  INSERT INTO public.role_permissions (tenant_id, role_name, permission_id, granted)
  SELECT _tenant_id, 'user', id, true
  FROM public.permissions
  WHERE permission_key IN (
    'contracts.read.own', 'customers.read.all', 'vehicles.read.all'
  );
END;
$$;