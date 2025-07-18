-- ==============================================
-- إصلاح فوري لمشكلة: column "category_id" does not exist
-- انسخ هذا الكود كاملاً في SQL Editor في Supabase
-- ==============================================

-- الخطوة 1: إنشاء جدول فئات الصلاحيات أولاً
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

-- الخطوة 2: إضافة عمود category_id إلى جدول permissions إذا لم يكن موجود
DO $$
BEGIN
    -- التحقق من وجود جدول permissions أولاً
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permissions' AND table_schema = 'public') THEN
        -- إضافة العمود إذا لم يكن موجود
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'permissions' 
            AND column_name = 'category_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.permissions ADD COLUMN category_id UUID REFERENCES public.permission_categories(id) ON DELETE CASCADE;
            RAISE NOTICE 'تم إضافة عمود category_id';
        ELSE
            RAISE NOTICE 'عمود category_id موجود بالفعل';
        END IF;
    ELSE
        -- إنشاء جدول permissions كاملاً إذا لم يكن موجود
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
        RAISE NOTICE 'تم إنشاء جدول permissions';
    END IF;
END $$;

-- الخطوة 3: إدراج البيانات الأساسية
INSERT INTO public.permission_categories (name, display_name, description, icon, sort_order) VALUES
('system', 'إدارة النظام', 'صلاحيات إدارة النظام العامة', 'Crown', 1),
('users', 'إدارة المستخدمين', 'صلاحيات إدارة المستخدمين والأدوار', 'Users', 2),
('fleet', 'إدارة الأسطول', 'صلاحيات إدارة المركبات والصيانة', 'Settings', 3),
('business', 'الأعمال', 'صلاحيات إدارة العقود والعملاء', 'UserCheck', 4),
('finance', 'المالية', 'صلاحيات المحاسبة والفواتير', 'Shield', 5),
('basic', 'أساسيات', 'الصلاحيات الأساسية', 'Eye', 6)
ON CONFLICT (name) DO NOTHING;

-- الخطوة 4: إنشاء الفهرس (هذا سبب المشكلة الأصلية)
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category_id);

-- الخطوة 5: إضافة بعض الصلاحيات الأساسية
INSERT INTO public.permissions (name, display_name, description, category_id, level, is_system) VALUES
('system.settings', 'إعدادات النظام', 'إدارة إعدادات النظام العامة', (SELECT id FROM permission_categories WHERE name = 'system'), 'admin', true),
('users.manage', 'إدارة المستخدمين', 'إضافة وتعديل وحذف المستخدمين', (SELECT id FROM permission_categories WHERE name = 'users'), 'admin', true),
('fleet.vehicles.view', 'عرض المركبات', 'عرض قائمة المركبات', (SELECT id FROM permission_categories WHERE name = 'fleet'), 'read', true),
('business.contracts.view', 'عرض العقود', 'عرض قائمة العقود', (SELECT id FROM permission_categories WHERE name = 'business'), 'read', true),
('finance.reports.view', 'عرض التقارير', 'عرض التقارير المالية والإدارية', (SELECT id FROM permission_categories WHERE name = 'finance'), 'read', true),
('basic.dashboard.view', 'عرض لوحة التحكم', 'الوصول للوحة التحكم الرئيسية', (SELECT id FROM permission_categories WHERE name = 'basic'), 'read', true)
ON CONFLICT (name) DO NOTHING;

-- رسالة النجاح
SELECT 
    '🎉 تم إصلاح مشكلة category_id بنجاح!' as status,
    'حدث الصفحة الآن (F5) لرؤية النتيجة' as next_step,
    (SELECT COUNT(*) FROM permission_categories) as categories_created,
    (SELECT COUNT(*) FROM permissions) as permissions_created; 