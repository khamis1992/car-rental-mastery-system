-- ==========================================
-- التحقق من وجود جداول نظام الصلاحيات وإصلاحها
-- ==========================================

-- التحقق من وجود جدول فئات الصلاحيات وإنشاؤه إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permission_categories' AND table_schema = 'public') THEN
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
        
        RAISE NOTICE 'Created permission_categories table';
    END IF;
END $$;

-- التحقق من وجود جدول الصلاحيات وإنشاؤه إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permissions' AND table_schema = 'public') THEN
        CREATE TABLE public.permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(200) NOT NULL,
            description TEXT,
            category_id UUID REFERENCES public.permission_categories(id) ON DELETE CASCADE,
            level VARCHAR(20) NOT NULL CHECK (level IN ('read', 'write', 'admin')),
            is_system BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        RAISE NOTICE 'Created permissions table';
    ELSE
        -- التحقق من وجود عمود category_id وإضافته إذا لم يكن موجود
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'permissions' 
            AND column_name = 'category_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.permissions ADD COLUMN category_id UUID REFERENCES public.permission_categories(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added category_id column to permissions table';
        END IF;
    END IF;
END $$;

-- التحقق من وجود جدول الأدوار وإنشاؤه إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') THEN
        CREATE TABLE public.roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(200) NOT NULL,
            description TEXT,
            level INTEGER NOT NULL DEFAULT 100,
            is_system BOOLEAN DEFAULT false,
            is_default BOOLEAN DEFAULT false,
            tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        RAISE NOTICE 'Created roles table';
    END IF;
END $$;

-- التحقق من وجود جدول ربط الأدوار بالصلاحيات
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'role_permissions' AND table_schema = 'public') THEN
        CREATE TABLE public.role_permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
            permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
            granted_by UUID REFERENCES auth.users(id),
            granted_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(role_id, permission_id)
        );
        
        RAISE NOTICE 'Created role_permissions table';
    END IF;
END $$;

-- التحقق من وجود جدول سجل التتبع
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permission_audit_log' AND table_schema = 'public') THEN
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
        
        RAISE NOTICE 'Created permission_audit_log table';
    END IF;
END $$;

-- إضافة عمود role_id إلى جدول tenant_users إذا لم يكن موجود
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_users' 
        AND column_name = 'role_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tenant_users ADD COLUMN role_id UUID REFERENCES public.roles(id);
        RAISE NOTICE 'Added role_id column to tenant_users table';
    END IF;
END $$;

-- إنشاء الفهارس إذا لم تكن موجودة مع التحقق من وجود الأعمدة أولاً
DO $$
BEGIN
    -- فهارس للصلاحيات - التحقق من وجود العمود أولاً
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'permissions' 
        AND column_name = 'category_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_category') THEN
        CREATE INDEX idx_permissions_category ON public.permissions(category_id);
        RAISE NOTICE 'Created index idx_permissions_category';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'permissions' 
        AND column_name = 'level'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_level') THEN
        CREATE INDEX idx_permissions_level ON public.permissions(level);
        RAISE NOTICE 'Created index idx_permissions_level';
    END IF;
    
    -- فهارس للأدوار
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'tenant_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_roles_tenant') THEN
        CREATE INDEX idx_roles_tenant ON public.roles(tenant_id);
        RAISE NOTICE 'Created index idx_roles_tenant';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'level'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_roles_level') THEN
        CREATE INDEX idx_roles_level ON public.roles(level);
        RAISE NOTICE 'Created index idx_roles_level';
    END IF;
    
    -- فهارس لربط الصلاحيات
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'role_permissions' 
        AND column_name = 'role_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_role_permissions_role') THEN
        CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
        RAISE NOTICE 'Created index idx_role_permissions_role';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'role_permissions' 
        AND column_name = 'permission_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_role_permissions_permission') THEN
        CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);
        RAISE NOTICE 'Created index idx_role_permissions_permission';
    END IF;
    
    -- فهارس لسجل التتبع
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'permission_audit_log' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_log_user') THEN
        CREATE INDEX idx_audit_log_user ON public.permission_audit_log(user_id);
        RAISE NOTICE 'Created index idx_audit_log_user';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'permission_audit_log' 
        AND column_name = 'tenant_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_log_tenant') THEN
        CREATE INDEX idx_audit_log_tenant ON public.permission_audit_log(tenant_id);
        RAISE NOTICE 'Created index idx_audit_log_tenant';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'permission_audit_log' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_log_created') THEN
        CREATE INDEX idx_audit_log_created ON public.permission_audit_log(created_at);
        RAISE NOTICE 'Created index idx_audit_log_created';
    END IF;
END $$;

-- إدراج البيانات الأساسية فقط إذا لم تكن موجودة
DO $$
BEGIN
    -- إدراج فئات الصلاحيات
    IF NOT EXISTS (SELECT 1 FROM public.permission_categories WHERE name = 'system') THEN
        INSERT INTO public.permission_categories (name, display_name, description, icon, sort_order) VALUES
        ('system', 'إدارة النظام', 'صلاحيات إدارة النظام العامة', 'Crown', 1),
        ('users', 'إدارة المستخدمين', 'صلاحيات إدارة المستخدمين والأدوار', 'Users', 2),
        ('fleet', 'إدارة الأسطول', 'صلاحيات إدارة المركبات والصيانة', 'Settings', 3),
        ('business', 'الأعمال', 'صلاحيات إدارة العقود والعملاء', 'UserCheck', 4),
        ('finance', 'المالية', 'صلاحيات المحاسبة والفواتير', 'Shield', 5),
        ('basic', 'أساسيات', 'الصلاحيات الأساسية', 'Eye', 6);
        
        RAISE NOTICE 'Inserted permission categories';
    END IF;
    
    -- إدراج الصلاحيات الأساسية
    IF NOT EXISTS (SELECT 1 FROM public.permissions WHERE name = 'system.settings') THEN
        INSERT INTO public.permissions (name, display_name, description, category_id, level, is_system) VALUES
        -- صلاحيات النظام
        ('system.settings', 'إعدادات النظام', 'إدارة إعدادات النظام العامة', (SELECT id FROM permission_categories WHERE name = 'system'), 'admin', true),
        ('system.monitoring', 'مراقبة النظام', 'مراقبة أداء النظام والخوادم', (SELECT id FROM permission_categories WHERE name = 'system'), 'read', true),
        ('system.tenants.manage', 'إدارة المؤسسات', 'إنشاء وتعديل وحذف المؤسسات', (SELECT id FROM permission_categories WHERE name = 'system'), 'admin', true),
        
        -- صلاحيات المستخدمين
        ('users.manage', 'إدارة المستخدمين', 'إضافة وتعديل وحذف المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'admin', true),
        ('users.view', 'عرض المستخدمين', 'عرض قائمة المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'read', true),
        
        -- صلاحيات الأسطول
        ('fleet.vehicles.manage', 'إدارة المركبات', 'إضافة وتعديل وحذف المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'write', true),
        ('fleet.vehicles.view', 'عرض المركبات', 'عرض قائمة المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'read', true),
        
        -- صلاحيات الأعمال
        ('business.contracts.manage', 'إدارة العقود', 'إنشاء وتعديل العقود', (SELECT id FROM permission_categories WHERE name = 'business'), 'write', true),
        ('business.contracts.view', 'عرض العقود', 'عرض قائمة العقود', (SELECT id FROM permission_categories WHERE name = 'business'), 'read', true),
        
        -- صلاحيات المالية
        ('finance.accounting.manage', 'إدارة المحاسبة', 'إدارة الحسابات والقيود المحاسبية', (SELECT id FROM permission_categories WHERE name = 'finance'), 'admin', true),
        ('finance.invoices.manage', 'إدارة الفواتير', 'إنشاء وإدارة الفواتير', (SELECT id FROM permission_categories WHERE name = 'finance'), 'write', true),
        ('finance.reports.view', 'عرض التقارير', 'عرض التقارير المالية والإدارية', (SELECT id FROM permission_categories WHERE name = 'finance'), 'read', true),
        
        -- الصلاحيات الأساسية
        ('basic.dashboard.view', 'عرض لوحة التحكم', 'الوصول للوحة التحكم الرئيسية', (SELECT id FROM permission_categories WHERE name = 'basic'), 'read', true),
        ('basic.profile.edit', 'تحرير الملف الشخصي', 'تعديل البيانات الشخصية', (SELECT id FROM permission_categories WHERE name = 'basic'), 'write', true);
        
        RAISE NOTICE 'Inserted basic permissions';
    END IF;
    
    -- إدراج الأدوار الأساسية
    IF NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'super_admin') THEN
        INSERT INTO public.roles (name, display_name, description, level, is_system, is_default) VALUES
        ('super_admin', 'مدير النظام العام', 'مدير النظام العام - صلاحيات كاملة', 0, true, false),
        ('tenant_admin', 'مدير المؤسسة', 'مدير المؤسسة - إدارة كاملة للمؤسسة', 10, true, false),
        ('manager', 'مدير', 'مدير - صلاحيات إدارية محدودة', 20, true, false),
        ('accountant', 'محاسب', 'محاسب - إدارة المالية والتقارير', 30, true, false),
        ('receptionist', 'موظف استقبال', 'موظف استقبال - إدارة العقود والعملاء', 50, true, false),
        ('user', 'مستخدم عادي', 'مستخدم عادي - صلاحيات محدودة', 100, true, true);
        
        RAISE NOTICE 'Inserted basic roles';
    END IF;
END $$;

-- تحديث المستخدمين الحاليين بالأدوار المناسبة
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.roles WHERE name = 'super_admin') AND 
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_users' AND column_name = 'role_id') THEN
        
        UPDATE public.tenant_users 
        SET role_id = (
            CASE 
                WHEN role = 'super_admin' THEN (SELECT id FROM roles WHERE name = 'super_admin')
                WHEN role = 'tenant_admin' THEN (SELECT id FROM roles WHERE name = 'tenant_admin')
                WHEN role = 'manager' THEN (SELECT id FROM roles WHERE name = 'manager')
                WHEN role = 'accountant' THEN (SELECT id FROM roles WHERE name = 'accountant')
                WHEN role = 'receptionist' THEN (SELECT id FROM roles WHERE name = 'receptionist')
                ELSE (SELECT id FROM roles WHERE name = 'user')
            END
        )
        WHERE role_id IS NULL;
        
        RAISE NOTICE 'Updated existing users with roles';
    END IF;
END $$;

-- إنشاء دوال مساعدة للتحقق من الصلاحيات
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

COMMENT ON FUNCTION public.user_has_permission(UUID, TEXT, UUID) IS 'التحقق من صلاحية مستخدم معين';

-- إنشاء RLS policies أساسية
DO $$
BEGIN
    -- تمكين RLS على الجداول
    ALTER TABLE public.permission_categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;
    
    -- Policy أساسي للقراءة
    DROP POLICY IF EXISTS "Users can view permission categories" ON public.permission_categories;
    CREATE POLICY "Users can view permission categories" ON public.permission_categories FOR SELECT TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Users can view permissions" ON public.permissions;
    CREATE POLICY "Users can view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
    
    RAISE NOTICE 'Created basic RLS policies';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'RLS policies setup encountered an issue: %', SQLERRM;
END $$;

-- رسالة النجاح
DO $$
BEGIN
    RAISE NOTICE 'Permissions system setup completed successfully!';
END $$; 