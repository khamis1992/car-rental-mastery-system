-- ==========================================
-- نظام الصلاحيات المتقدم
-- ==========================================

-- جدول فئات الصلاحيات
CREATE TABLE IF NOT EXISTS public.permission_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- جدول الصلاحيات
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.permission_categories(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL CHECK (level IN ('read', 'write', 'admin')),
    is_system BOOLEAN DEFAULT false, -- صلاحيات النظام لا يمكن حذفها
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- جدول الأدوار
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 100, -- مستوى الدور (أقل رقم = صلاحيات أكثر)
    is_system BOOLEAN DEFAULT false, -- أدوار النظام لا يمكن حذفها
    is_default BOOLEAN DEFAULT false, -- دور افتراضي للمستخدمين الجدد
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- null للأدوار العامة
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- جدول ربط الأدوار بالصلاحيات
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- جدول سجل تغييرات الصلاحيات
CREATE TABLE IF NOT EXISTS public.permission_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL, -- grant, revoke, create_role, delete_role, etc.
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    role_id UUID REFERENCES public.roles(id),
    permission_id UUID REFERENCES public.permissions(id),
    target_user_id UUID REFERENCES auth.users(id), -- المستخدم المتأثر بالتغيير
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category_id);
CREATE INDEX IF NOT EXISTS idx_permissions_level ON public.permissions(level);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON public.permission_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.permission_audit_log(created_at);

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_permission_categories_updated_at BEFORE UPDATE ON public.permission_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إضافة عمود الدور للمستخدمين إذا لم يكن موجود
DO $$
BEGIN
    -- إضافة عمود role_id لجدول tenant_users إذا لم يكن موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_users' 
        AND column_name = 'role_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tenant_users ADD COLUMN role_id UUID REFERENCES public.roles(id);
    END IF;
END $$;

-- إدراج فئات الصلاحيات الأساسية
INSERT INTO public.permission_categories (name, display_name, description, icon, sort_order) VALUES
('system', 'إدارة النظام', 'صلاحيات إدارة النظام العامة', 'Crown', 1),
('users', 'إدارة المستخدمين', 'صلاحيات إدارة المستخدمين والأدوار', 'Users', 2),
('fleet', 'إدارة الأسطول', 'صلاحيات إدارة المركبات والصيانة', 'Settings', 3),
('business', 'الأعمال', 'صلاحيات إدارة العقود والعملاء', 'UserCheck', 4),
('finance', 'المالية', 'صلاحيات المحاسبة والفواتير', 'Shield', 5),
('basic', 'أساسيات', 'الصلاحيات الأساسية', 'Eye', 6)
ON CONFLICT (name) DO NOTHING;

-- إدراج الصلاحيات الأساسية
INSERT INTO public.permissions (name, display_name, description, category_id, level, is_system) VALUES
-- صلاحيات النظام
('system.settings', 'إعدادات النظام', 'إدارة إعدادات النظام العامة', (SELECT id FROM permission_categories WHERE name = 'system'), 'admin', true),
('system.monitoring', 'مراقبة النظام', 'مراقبة أداء النظام والخوادم', (SELECT id FROM permission_categories WHERE name = 'system'), 'read', true),
('system.tenants.manage', 'إدارة المؤسسات', 'إنشاء وتعديل وحذف المؤسسات', (SELECT id FROM permission_categories WHERE name = 'system'), 'admin', true),
('system.backup', 'النسخ الاحتياطي', 'إدارة النسخ الاحتياطية', (SELECT id FROM permission_categories WHERE name = 'system'), 'admin', true),

-- صلاحيات المستخدمين
('users.manage', 'إدارة المستخدمين', 'إضافة وتعديل وحذف المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'admin', true),
('users.view', 'عرض المستخدمين', 'عرض قائمة المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'read', true),
('users.roles.manage', 'إدارة الأدوار', 'إنشاء وتعديل أدوار المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'admin', true),
('users.permissions.manage', 'إدارة الصلاحيات', 'تخصيص الصلاحيات للأدوار', (SELECT id FROM permission_categories WHERE name = 'users'), 'admin', true),

-- صلاحيات الأسطول
('fleet.vehicles.manage', 'إدارة المركبات', 'إضافة وتعديل وحذف المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'write', true),
('fleet.vehicles.view', 'عرض المركبات', 'عرض قائمة المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'read', true),
('fleet.maintenance.manage', 'إدارة الصيانة', 'جدولة وإدارة صيانة المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'write', true),
('fleet.insurance.manage', 'إدارة التأمين', 'إدارة تأمين المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'write', true),

-- صلاحيات الأعمال
('business.contracts.manage', 'إدارة العقود', 'إنشاء وتعديل العقود', (SELECT id FROM permission_categories WHERE name = 'business'), 'write', true),
('business.contracts.view', 'عرض العقود', 'عرض قائمة العقود', (SELECT id FROM permission_categories WHERE name = 'business'), 'read', true),
('business.customers.manage', 'إدارة العملاء', 'إضافة وتعديل بيانات العملاء', (SELECT id FROM permission_categories WHERE name = 'business'), 'write', true),
('business.customers.view', 'عرض العملاء', 'عرض قائمة العملاء', (SELECT id FROM permission_categories WHERE name = 'business'), 'read', true),

-- صلاحيات المالية
('finance.accounting.manage', 'إدارة المحاسبة', 'إدارة الحسابات والقيود المحاسبية', (SELECT id FROM permission_categories WHERE name = 'finance'), 'admin', true),
('finance.invoices.manage', 'إدارة الفواتير', 'إنشاء وإدارة الفواتير', (SELECT id FROM permission_categories WHERE name = 'finance'), 'write', true),
('finance.payments.manage', 'إدارة المدفوعات', 'تسجيل ومعالجة المدفوعات', (SELECT id FROM permission_categories WHERE name = 'finance'), 'write', true),
('finance.reports.view', 'عرض التقارير', 'عرض التقارير المالية والإدارية', (SELECT id FROM permission_categories WHERE name = 'finance'), 'read', true),

-- الصلاحيات الأساسية
('basic.dashboard.view', 'عرض لوحة التحكم', 'الوصول للوحة التحكم الرئيسية', (SELECT id FROM permission_categories WHERE name = 'basic'), 'read', true),
('basic.profile.edit', 'تحرير الملف الشخصي', 'تعديل البيانات الشخصية', (SELECT id FROM permission_categories WHERE name = 'basic'), 'write', true)
ON CONFLICT (name) DO NOTHING;

-- إدراج الأدوار الأساسية
INSERT INTO public.roles (name, display_name, description, level, is_system, is_default) VALUES
('super_admin', 'مدير النظام العام', 'مدير النظام العام - صلاحيات كاملة', 0, true, false),
('tenant_admin', 'مدير المؤسسة', 'مدير المؤسسة - إدارة كاملة للمؤسسة', 10, true, false),
('manager', 'مدير', 'مدير - صلاحيات إدارية محدودة', 20, true, false),
('accountant', 'محاسب', 'محاسب - إدارة المالية والتقارير', 30, true, false),
('technician', 'فني', 'فني - صيانة المركبات', 40, true, false),
('receptionist', 'موظف استقبال', 'موظف استقبال - إدارة العقود والعملاء', 50, true, false),
('user', 'مستخدم عادي', 'مستخدم عادي - صلاحيات محدودة', 100, true, true)
ON CONFLICT (name) DO NOTHING;

-- تخصيص الصلاحيات للأدوار
-- دور super_admin يحصل على جميع الصلاحيات
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'),
    p.id
FROM permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- دور tenant_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'tenant_admin'),
    p.id
FROM permissions p
WHERE p.name IN (
    'users.manage', 'users.view', 'users.roles.manage',
    'fleet.vehicles.manage', 'fleet.vehicles.view', 'fleet.maintenance.manage', 'fleet.insurance.manage',
    'business.contracts.manage', 'business.contracts.view', 'business.customers.manage', 'business.customers.view',
    'finance.accounting.manage', 'finance.invoices.manage', 'finance.payments.manage', 'finance.reports.view',
    'basic.dashboard.view', 'basic.profile.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- دور manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'manager'),
    p.id
FROM permissions p
WHERE p.name IN (
    'users.view',
    'fleet.vehicles.manage', 'fleet.vehicles.view', 'fleet.maintenance.manage',
    'business.contracts.manage', 'business.contracts.view', 'business.customers.view',
    'finance.reports.view',
    'basic.dashboard.view', 'basic.profile.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- دور accountant
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'accountant'),
    p.id
FROM permissions p
WHERE p.name IN (
    'finance.accounting.manage', 'finance.invoices.manage', 'finance.payments.manage', 'finance.reports.view',
    'business.contracts.view', 'business.customers.view',
    'basic.dashboard.view', 'basic.profile.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- دور technician
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'technician'),
    p.id
FROM permissions p
WHERE p.name IN (
    'fleet.vehicles.view', 'fleet.maintenance.manage',
    'basic.dashboard.view', 'basic.profile.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- دور receptionist
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'receptionist'),
    p.id
FROM permissions p
WHERE p.name IN (
    'business.contracts.manage', 'business.contracts.view', 'business.customers.manage', 'business.customers.view',
    'fleet.vehicles.view',
    'basic.dashboard.view', 'basic.profile.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- دور user الأساسي
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'user'),
    p.id
FROM permissions p
WHERE p.name IN (
    'basic.dashboard.view', 'basic.profile.edit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- تحديث المستخدمين الحاليين بالأدوار المناسبة
UPDATE public.tenant_users 
SET role_id = (
    CASE 
        WHEN role = 'super_admin' THEN (SELECT id FROM roles WHERE name = 'super_admin')
        WHEN role = 'tenant_admin' THEN (SELECT id FROM roles WHERE name = 'tenant_admin')
        WHEN role = 'manager' THEN (SELECT id FROM roles WHERE name = 'manager')
        WHEN role = 'accountant' THEN (SELECT id FROM roles WHERE name = 'accountant')
        WHEN role = 'technician' THEN (SELECT id FROM roles WHERE name = 'technician')
        WHEN role = 'receptionist' THEN (SELECT id FROM roles WHERE name = 'receptionist')
        ELSE (SELECT id FROM roles WHERE name = 'user')
    END
)
WHERE role_id IS NULL;

-- دوال مساعدة للتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id_param UUID,
    permission_name_param TEXT,
    tenant_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    -- التحقق من الصلاحية
    SELECT EXISTS(
        SELECT 1 
        FROM tenant_users tu
        JOIN roles r ON r.id = tu.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE tu.user_id = user_id_param
        AND p.name = permission_name_param
        AND (tenant_id_param IS NULL OR tu.tenant_id = tenant_id_param)
        AND tu.status = 'active'
        AND r.is_active = true
        AND p.is_active = true
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;

-- دالة للحصول على صلاحيات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_permissions(
    user_id_param UUID,
    tenant_id_param UUID DEFAULT NULL
)
RETURNS TABLE(
    permission_name TEXT,
    permission_display_name TEXT,
    category_name TEXT,
    level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.name,
        p.display_name,
        pc.name,
        p.level
    FROM tenant_users tu
    JOIN roles r ON r.id = tu.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    JOIN permission_categories pc ON pc.id = p.category_id
    WHERE tu.user_id = user_id_param
    AND (tenant_id_param IS NULL OR tu.tenant_id = tenant_id_param)
    AND tu.status = 'active'
    AND r.is_active = true
    AND p.is_active = true
    ORDER BY pc.sort_order, p.name;
END;
$$;

-- دالة لتسجيل أنشطة الصلاحيات
CREATE OR REPLACE FUNCTION public.log_permission_activity(
    action_param TEXT,
    user_id_param UUID,
    tenant_id_param UUID DEFAULT NULL,
    role_id_param UUID DEFAULT NULL,
    permission_id_param UUID DEFAULT NULL,
    target_user_id_param UUID DEFAULT NULL,
    details_param JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO permission_audit_log (
        action, user_id, tenant_id, role_id, permission_id, 
        target_user_id, details, ip_address, user_agent
    ) VALUES (
        action_param, user_id_param, tenant_id_param, role_id_param, 
        permission_id_param, target_user_id_param, details_param,
        inet_client_addr(), current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- RLS Policies
ALTER TABLE public.permission_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies للقراءة
CREATE POLICY "Users can view permission categories" ON public.permission_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view roles" ON public.roles FOR SELECT TO authenticated USING (
    -- المستخدمون يمكنهم رؤية الأدوار العامة أو أدوار المؤسسة التي ينتمون إليها
    tenant_id IS NULL OR 
    tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Users can view role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (
    role_id IN (
        SELECT r.id FROM roles r 
        WHERE r.tenant_id IS NULL OR 
        r.tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND status = 'active'
        )
    )
);

-- Policies للإدارة (super admin و tenant admin)
CREATE POLICY "Super admin can manage all" ON public.roles FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM tenant_users tu
        JOIN roles r ON r.id = tu.role_id
        WHERE tu.user_id = auth.uid() 
        AND r.name = 'super_admin'
        AND tu.status = 'active'
    )
);

CREATE POLICY "Tenant admin can manage tenant roles" ON public.roles FOR ALL TO authenticated USING (
    tenant_id IN (
        SELECT tu.tenant_id FROM tenant_users tu
        JOIN roles r ON r.id = tu.role_id
        WHERE tu.user_id = auth.uid() 
        AND r.name IN ('super_admin', 'tenant_admin')
        AND tu.status = 'active'
    )
);

-- Policy لسجل التتبع
CREATE POLICY "Users can view own audit logs" ON public.permission_audit_log FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM tenant_users tu
        JOIN roles r ON r.id = tu.role_id
        WHERE tu.user_id = auth.uid() 
        AND r.name IN ('super_admin', 'tenant_admin')
        AND tu.status = 'active'
        AND (tenant_id IS NULL OR tu.tenant_id = permission_audit_log.tenant_id)
    )
);

-- تعليقات للتوضيح
COMMENT ON TABLE public.permission_categories IS 'فئات الصلاحيات';
COMMENT ON TABLE public.permissions IS 'الصلاحيات المتاحة في النظام';
COMMENT ON TABLE public.roles IS 'أدوار المستخدمين';
COMMENT ON TABLE public.role_permissions IS 'ربط الأدوار بالصلاحيات';
COMMENT ON TABLE public.permission_audit_log IS 'سجل تتبع تغييرات الصلاحيات';

COMMENT ON FUNCTION public.user_has_permission(UUID, TEXT, UUID) IS 'التحقق من صلاحية مستخدم معين';
COMMENT ON FUNCTION public.get_user_permissions(UUID, UUID) IS 'الحصول على جميع صلاحيات المستخدم';
COMMENT ON FUNCTION public.log_permission_activity(TEXT, UUID, UUID, UUID, UUID, UUID, JSONB) IS 'تسجيل نشاط الصلاحيات'; 