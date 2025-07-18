-- ==========================================
-- إصلاح عاجل لمشكلة نظام الصلاحيات
-- هذا الملف يحل مشكلة التعارض مع الجداول الموجودة
-- ==========================================

-- إيقاف RLS مؤقتاً لتجنب المشاكل
ALTER TABLE IF EXISTS public.permission_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.permission_audit_log DISABLE ROW LEVEL SECURITY;

-- حذف الدوال الموجودة أولاً
DROP FUNCTION IF EXISTS public.user_has_permission(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.get_user_permissions(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID, UUID);

-- حذف الجداول الموجودة إذا كانت تحتوي على هيكل خاطئ
DROP TABLE IF EXISTS public.permission_audit_log CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.permission_categories CASCADE;

-- إزالة عمود role_id من tenant_users إذا كان موجوداً
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_users' 
        AND column_name = 'role_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tenant_users DROP COLUMN role_id;
    END IF;
END $$;

-- إنشاء جدول فئات الصلاحيات من جديد
CREATE TABLE public.permission_categories (
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

-- إنشاء جدول الصلاحيات من جديد
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES public.permission_categories(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL CHECK (level IN ('read', 'write', 'admin')),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- إنشاء جدول الأدوار من جديد
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 100,
    is_system BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name, tenant_id)
);

-- إنشاء جدول ربط الأدوار بالصلاحيات من جديد
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- إنشاء جدول سجل التتبع من جديد
CREATE TABLE public.permission_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    role_id UUID REFERENCES public.roles(id),
    permission_id UUID REFERENCES public.permissions(id),
    target_user_id UUID REFERENCES auth.users(id),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- إضافة عمود role_id إلى جدول tenant_users
ALTER TABLE public.tenant_users ADD COLUMN role_id UUID REFERENCES public.roles(id);

-- إنشاء الفهارس
CREATE INDEX idx_permissions_category ON public.permissions(category_id);
CREATE INDEX idx_permissions_level ON public.permissions(level);
CREATE INDEX idx_permissions_name ON public.permissions(name);
CREATE INDEX idx_roles_tenant ON public.roles(tenant_id);
CREATE INDEX idx_roles_level ON public.roles(level);
CREATE INDEX idx_roles_name ON public.roles(name);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX idx_audit_log_user ON public.permission_audit_log(user_id);
CREATE INDEX idx_audit_log_tenant ON public.permission_audit_log(tenant_id);
CREATE INDEX idx_audit_log_created ON public.permission_audit_log(created_at);
CREATE INDEX idx_tenant_users_role ON public.tenant_users(role_id);

-- إدراج فئات الصلاحيات
INSERT INTO public.permission_categories (name, display_name, description, icon, sort_order) VALUES
('system', 'إدارة النظام', 'صلاحيات إدارة النظام العامة', 'Crown', 1),
('users', 'إدارة المستخدمين', 'صلاحيات إدارة المستخدمين والأدوار', 'Users', 2),
('fleet', 'إدارة الأسطول', 'صلاحيات إدارة المركبات والصيانة', 'Truck', 3),
('business', 'الأعمال', 'صلاحيات إدارة العقود والعملاء', 'UserCheck', 4),
('finance', 'المالية', 'صلاحيات المحاسبة والفواتير', 'DollarSign', 5),
('basic', 'أساسيات', 'الصلاحيات الأساسية', 'Eye', 6);

-- إدراج الصلاحيات الأساسية
INSERT INTO public.permissions (name, display_name, description, category_id, level, is_system) VALUES
-- صلاحيات النظام
('system.settings', 'إعدادات النظام', 'إدارة إعدادات النظام العامة', (SELECT id FROM permission_categories WHERE name = 'system'), 'admin', true),
('system.monitoring', 'مراقبة النظام', 'مراقبة أداء النظام والخوادم', (SELECT id FROM permission_categories WHERE name = 'system'), 'read', true),
('system.tenants.manage', 'إدارة المؤسسات', 'إنشاء وتعديل وحذف المؤسسات', (SELECT id FROM permission_categories WHERE name = 'system'), 'admin', true),

-- صلاحيات المستخدمين
('users.manage', 'إدارة المستخدمين', 'إضافة وتعديل وحذف المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'admin', false),
('users.view', 'عرض المستخدمين', 'عرض قائمة المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'read', false),
('users.roles.manage', 'إدارة الأدوار', 'إنشاء وتعديل أدوار المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'admin', false),
('users.permissions.manage', 'إدارة الصلاحيات', 'تعديل صلاحيات المستخدمين والأدوار', (SELECT id FROM permission_categories WHERE name = 'users'), 'admin', false),

-- صلاحيات الأسطول
('fleet.vehicles.manage', 'إدارة المركبات', 'إضافة وتعديل وحذف المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'write', false),
('fleet.vehicles.view', 'عرض المركبات', 'عرض قائمة المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'read', false),
('fleet.maintenance.manage', 'إدارة الصيانة', 'جدولة وإدارة صيانة المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'write', false),
('fleet.maintenance.view', 'عرض الصيانة', 'عرض سجلات الصيانة', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'read', false),

-- صلاحيات الأعمال
('business.contracts.manage', 'إدارة العقود', 'إنشاء وتعديل العقود', (SELECT id FROM permission_categories WHERE name = 'business'), 'write', false),
('business.contracts.view', 'عرض العقود', 'عرض قائمة العقود', (SELECT id FROM permission_categories WHERE name = 'business'), 'read', false),
('business.customers.manage', 'إدارة العملاء', 'إضافة وتعديل بيانات العملاء', (SELECT id FROM permission_categories WHERE name = 'business'), 'write', false),
('business.customers.view', 'عرض العملاء', 'عرض قائمة العملاء', (SELECT id FROM permission_categories WHERE name = 'business'), 'read', false),

-- صلاحيات المالية
('finance.accounting.manage', 'إدارة المحاسبة', 'إدارة الحسابات والقيود المحاسبية', (SELECT id FROM permission_categories WHERE name = 'finance'), 'admin', false),
('finance.invoices.manage', 'إدارة الفواتير', 'إنشاء وإدارة الفواتير', (SELECT id FROM permission_categories WHERE name = 'finance'), 'write', false),
('finance.invoices.view', 'عرض الفواتير', 'عرض قائمة الفواتير', (SELECT id FROM permission_categories WHERE name = 'finance'), 'read', false),
('finance.payments.manage', 'إدارة المدفوعات', 'تسجيل ومعالجة المدفوعات', (SELECT id FROM permission_categories WHERE name = 'finance'), 'write', false),
('finance.reports.view', 'عرض التقارير', 'عرض التقارير المالية والإدارية', (SELECT id FROM permission_categories WHERE name = 'finance'), 'read', false),

-- الصلاحيات الأساسية
('basic.dashboard.view', 'عرض لوحة التحكم', 'الوصول للوحة التحكم الرئيسية', (SELECT id FROM permission_categories WHERE name = 'basic'), 'read', false),
('basic.profile.edit', 'تحرير الملف الشخصي', 'تعديل البيانات الشخصية', (SELECT id FROM permission_categories WHERE name = 'basic'), 'write', false),
('basic.notifications.view', 'عرض الإشعارات', 'عرض الإشعارات والتنبيهات', (SELECT id FROM permission_categories WHERE name = 'basic'), 'read', false);

-- إدراج الأدوار النظامية (بدون tenant_id)
INSERT INTO public.roles (name, display_name, description, level, is_system, is_default, tenant_id) VALUES
('super_admin', 'مدير النظام العام', 'مدير النظام العام - صلاحيات كاملة', 0, true, false, NULL);

-- إدراج الأدوار العامة (تطبق على جميع المؤسسات)
INSERT INTO public.roles (name, display_name, description, level, is_system, is_default, tenant_id) VALUES
('tenant_admin', 'مدير المؤسسة', 'مدير المؤسسة - إدارة كاملة للمؤسسة', 10, true, false, NULL),
('manager', 'مدير', 'مدير - صلاحيات إدارية محدودة', 20, true, false, NULL),
('accountant', 'محاسب', 'محاسب - إدارة المالية والتقارير', 30, true, false, NULL),
('technician', 'فني', 'فني - صيانة المركبات', 40, true, false, NULL),
('receptionist', 'موظف استقبال', 'موظف استقبال - إدارة العقود والعملاء', 50, true, false, NULL),
('user', 'مستخدم عادي', 'مستخدم عادي - صلاحيات محدودة', 100, true, true, NULL);

-- تخصيص الصلاحيات للأدوار

-- دور super_admin يحصل على جميع الصلاحيات
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin';

-- دور tenant_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'tenant_admin'
AND p.name IN (
    'users.manage', 'users.view', 'users.roles.manage', 'users.permissions.manage',
    'fleet.vehicles.manage', 'fleet.vehicles.view', 'fleet.maintenance.manage', 'fleet.maintenance.view',
    'business.contracts.manage', 'business.contracts.view', 'business.customers.manage', 'business.customers.view',
    'finance.accounting.manage', 'finance.invoices.manage', 'finance.invoices.view', 'finance.payments.manage', 'finance.reports.view',
    'basic.dashboard.view', 'basic.profile.edit', 'basic.notifications.view'
);

-- دور manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
AND p.name IN (
    'users.view',
    'fleet.vehicles.manage', 'fleet.vehicles.view', 'fleet.maintenance.manage', 'fleet.maintenance.view',
    'business.contracts.manage', 'business.contracts.view', 'business.customers.view',
    'finance.reports.view', 'finance.invoices.view',
    'basic.dashboard.view', 'basic.profile.edit', 'basic.notifications.view'
);

-- دور accountant
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'accountant'
AND p.name IN (
    'finance.accounting.manage', 'finance.invoices.manage', 'finance.invoices.view', 'finance.payments.manage', 'finance.reports.view',
    'business.contracts.view', 'business.customers.view',
    'basic.dashboard.view', 'basic.profile.edit', 'basic.notifications.view'
);

-- دور technician
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'technician'
AND p.name IN (
    'fleet.vehicles.view', 'fleet.maintenance.manage', 'fleet.maintenance.view',
    'basic.dashboard.view', 'basic.profile.edit', 'basic.notifications.view'
);

-- دور receptionist
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'receptionist'
AND p.name IN (
    'business.contracts.manage', 'business.contracts.view', 'business.customers.manage', 'business.customers.view',
    'fleet.vehicles.view',
    'basic.dashboard.view', 'basic.profile.edit', 'basic.notifications.view'
);

-- دور user الأساسي
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
    r.id,
    p.id
FROM roles r, permissions p
WHERE r.name = 'user'
AND p.name IN (
    'basic.dashboard.view', 'basic.profile.edit', 'basic.notifications.view'
);

-- تحديث المستخدمين الحاليين بالأدوار المناسبة
UPDATE public.tenant_users 
SET role_id = (
    CASE 
        WHEN role = 'super_admin' THEN (SELECT id FROM roles WHERE name = 'super_admin' AND tenant_id IS NULL)
        WHEN role = 'tenant_admin' THEN (SELECT id FROM roles WHERE name = 'tenant_admin' AND tenant_id IS NULL)
        WHEN role = 'manager' THEN (SELECT id FROM roles WHERE name = 'manager' AND tenant_id IS NULL)
        WHEN role = 'accountant' THEN (SELECT id FROM roles WHERE name = 'accountant' AND tenant_id IS NULL)
        WHEN role = 'technician' THEN (SELECT id FROM roles WHERE name = 'technician' AND tenant_id IS NULL)
        WHEN role = 'receptionist' THEN (SELECT id FROM roles WHERE name = 'receptionist' AND tenant_id IS NULL)
        ELSE (SELECT id FROM roles WHERE name = 'user' AND tenant_id IS NULL)
    END
)
WHERE role_id IS NULL;

-- إنشاء دالة للتحقق من الصلاحيات
CREATE FUNCTION public.user_has_permission(
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
    -- التحقق من وجود المستخدم والصلاحية
    SELECT EXISTS(
        SELECT 1 
        FROM tenant_users tu
        JOIN roles r ON r.id = tu.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE tu.user_id = user_id_param
        AND p.name = permission_name_param
        AND (tenant_id_param IS NULL OR tu.tenant_id = tenant_id_param)
        AND (tu.status IS NULL OR tu.status = 'active')
        AND r.is_active = true
        AND p.is_active = true
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;

-- إنشاء دالة للحصول على صلاحيات المستخدم
CREATE FUNCTION public.get_user_permissions(
    user_id_param UUID,
    tenant_id_param UUID DEFAULT NULL
)
RETURNS TABLE(
    permission_name TEXT,
    permission_display_name TEXT,
    category_name TEXT,
    category_display_name TEXT,
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
        pc.display_name,
        p.level
    FROM tenant_users tu
    JOIN roles r ON r.id = tu.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    JOIN permission_categories pc ON pc.id = p.category_id
    WHERE tu.user_id = user_id_param
    AND (tenant_id_param IS NULL OR tu.tenant_id = tenant_id_param)
    AND (tu.status IS NULL OR tu.status = 'active')
    AND r.is_active = true
    AND p.is_active = true
    ORDER BY pc.sort_order, p.name;
END;
$$;

-- إنشاء دالة للحصول على دور المستخدم
CREATE FUNCTION public.get_user_role(
    user_id_param UUID,
    tenant_id_param UUID DEFAULT NULL
)
RETURNS TABLE(
    role_name TEXT,
    role_display_name TEXT,
    role_level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.name,
        r.display_name,
        r.level
    FROM tenant_users tu
    JOIN roles r ON r.id = tu.role_id
    WHERE tu.user_id = user_id_param
    AND (tenant_id_param IS NULL OR tu.tenant_id = tenant_id_param)
    AND (tu.status IS NULL OR tu.status = 'active')
    AND r.is_active = true
    LIMIT 1;
END;
$$;

-- تمكين RLS على الجداول
ALTER TABLE public.permission_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

-- إنشاء policies للأمان
CREATE POLICY "Users can view permission categories" ON public.permission_categories 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view permissions" ON public.permissions 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their roles" ON public.roles 
FOR SELECT TO authenticated USING (
    tenant_id IS NULL OR 
    tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND (status IS NULL OR status = 'active')
    )
);

CREATE POLICY "Users can view role permissions" ON public.role_permissions 
FOR SELECT TO authenticated USING (
    role_id IN (
        SELECT r.id FROM roles r 
        WHERE r.tenant_id IS NULL OR 
        r.tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND (status IS NULL OR status = 'active')
        )
    )
);

CREATE POLICY "Users can view audit logs for their tenant" ON public.permission_audit_log 
FOR SELECT TO authenticated USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND (status IS NULL OR status = 'active')
    )
);

-- منح الصلاحيات للمستخدمين
GRANT SELECT ON public.permission_categories TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT ON public.permission_audit_log TO authenticated;

-- رسالة النجاح
DO $$
BEGIN
    RAISE NOTICE '✅ تم إصلاح نظام الصلاحيات بنجاح!';
    RAISE NOTICE '📊 تم إنشاء % فئة صلاحية', (SELECT COUNT(*) FROM permission_categories);
    RAISE NOTICE '🔐 تم إنشاء % صلاحية', (SELECT COUNT(*) FROM permissions);
    RAISE NOTICE '👥 تم إنشاء % دور', (SELECT COUNT(*) FROM roles);
    RAISE NOTICE '🔗 تم ربط % صلاحية بالأدوار', (SELECT COUNT(*) FROM role_permissions);
    RAISE NOTICE '🚀 النظام جاهز للاستخدام الآن!';
END $$; 