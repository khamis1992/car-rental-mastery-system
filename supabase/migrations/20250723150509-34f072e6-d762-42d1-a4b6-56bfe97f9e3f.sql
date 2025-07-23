-- تنفيذ عزل المؤسسات عبر قاعدة البيانات

-- إنشاء دالة للحصول على معرف المؤسسة الافتراضي بشكل آمن
CREATE OR REPLACE FUNCTION public.get_safe_default_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_tenant_id uuid;
BEGIN
    SELECT id INTO default_tenant_id
    FROM public.tenants 
    WHERE status = 'active' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF default_tenant_id IS NULL THEN
        -- إنشاء مؤسسة افتراضية إذا لم توجد
        INSERT INTO public.tenants (
            name, slug, country, timezone, currency, 
            status, subscription_plan, subscription_status, 
            max_users, max_vehicles, max_contracts, settings
        ) VALUES (
            'المؤسسة الافتراضية', 'default-tenant', 'Kuwait', 'Asia/Kuwait', 'KWD',
            'active', 'basic', 'active',
            100, 50, 1000, '{}'::jsonb
        ) RETURNING id INTO default_tenant_id;
    END IF;
    
    RETURN default_tenant_id;
END;
$$;

-- تحديث الجداول لإضافة عمود tenant_id وتطبيق عزل المؤسسات

-- 1. جدول customers
DO $$
DECLARE
    default_tenant_id uuid := public.get_safe_default_tenant_id();
BEGIN
    -- إضافة العمود إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN tenant_id uuid;
    END IF;
    
    -- تحديث القيم الفارغة
    UPDATE public.customers 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    -- تطبيق القيد
    ALTER TABLE public.customers 
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id();
    
    -- تمكين RLS إذا لم يكن مُمكناً
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
    
    -- حذف السياسات الموجودة وإنشاء سياسة جديدة للعزل
    DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم رؤية العملاء" ON public.customers;
    DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة العملاء" ON public.customers;
    DROP POLICY IF EXISTS "customers_tenant_isolation" ON public.customers;
    
    CREATE POLICY "customers_tenant_isolation"
    ON public.customers
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());
END
$$;

-- 2. جدول vehicles
DO $$
DECLARE
    default_tenant_id uuid := public.get_safe_default_tenant_id();
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.vehicles ADD COLUMN tenant_id uuid;
    END IF;
    
    UPDATE public.vehicles 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    ALTER TABLE public.vehicles 
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id();
    
    ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم رؤية المركبات" ON public.vehicles;
    DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة المركبات" ON public.vehicles;
    DROP POLICY IF EXISTS "vehicles_tenant_isolation" ON public.vehicles;
    
    CREATE POLICY "vehicles_tenant_isolation"
    ON public.vehicles
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());
END
$$;

-- 3. جدول contracts
DO $$
DECLARE
    default_tenant_id uuid := public.get_safe_default_tenant_id();
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.contracts ADD COLUMN tenant_id uuid;
    END IF;
    
    UPDATE public.contracts 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    ALTER TABLE public.contracts 
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id();
    
    ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم رؤية العقود" ON public.contracts;
    DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة العقود" ON public.contracts;
    DROP POLICY IF EXISTS "contracts_tenant_isolation" ON public.contracts;
    
    CREATE POLICY "contracts_tenant_isolation"
    ON public.contracts
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());
END
$$;

-- 4. جدول employees
DO $$
DECLARE
    default_tenant_id uuid := public.get_safe_default_tenant_id();
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.employees ADD COLUMN tenant_id uuid;
    END IF;
    
    UPDATE public.employees 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    ALTER TABLE public.employees 
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id();
    
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "المديرون يمكنهم إدارة الموظفين" ON public.employees;
    DROP POLICY IF EXISTS "الموظفون يمكنهم رؤية ملفاتهم الشخصية" ON public.employees;
    DROP POLICY IF EXISTS "employees_tenant_isolation" ON public.employees;
    
    CREATE POLICY "employees_tenant_isolation"
    ON public.employees
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());
END
$$;

-- 5. جدول invoices
DO $$
DECLARE
    default_tenant_id uuid := public.get_safe_default_tenant_id();
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN tenant_id uuid;
    END IF;
    
    UPDATE public.invoices 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    ALTER TABLE public.invoices 
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id();
    
    ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم رؤية الفواتير" ON public.invoices;
    DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة الفواتير" ON public.invoices;
    DROP POLICY IF EXISTS "invoices_tenant_isolation" ON public.invoices;
    
    CREATE POLICY "invoices_tenant_isolation"
    ON public.invoices
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());
END
$$;

-- 6. جدول payments
DO $$
DECLARE
    default_tenant_id uuid := public.get_safe_default_tenant_id();
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN tenant_id uuid;
    END IF;
    
    UPDATE public.payments 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    ALTER TABLE public.payments 
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id();
    
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم رؤية المدفوعات" ON public.payments;
    DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة المدفوعات" ON public.payments;
    DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payments;
    
    CREATE POLICY "payments_tenant_isolation"
    ON public.payments
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());
END
$$;

-- 7. جدول chart_of_accounts
DO $$
DECLARE
    default_tenant_id uuid := public.get_safe_default_tenant_id();
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chart_of_accounts' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.chart_of_accounts ADD COLUMN tenant_id uuid;
    END IF;
    
    UPDATE public.chart_of_accounts 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    ALTER TABLE public.chart_of_accounts 
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id();
    
    ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة دليل الحسابات" ON public.chart_of_accounts;
    DROP POLICY IF EXISTS "الموظفون يمكنهم رؤية دليل الحسابات" ON public.chart_of_accounts;
    DROP POLICY IF EXISTS "chart_of_accounts_tenant_isolation" ON public.chart_of_accounts;
    
    CREATE POLICY "chart_of_accounts_tenant_isolation"
    ON public.chart_of_accounts
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());
END
$$;

-- 8. جدول journal_entries
DO $$
DECLARE
    default_tenant_id uuid := public.get_safe_default_tenant_id();
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'journal_entries' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.journal_entries ADD COLUMN tenant_id uuid;
    END IF;
    
    UPDATE public.journal_entries 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    ALTER TABLE public.journal_entries 
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id();
    
    ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "المحاسبون يمكنهم إدارة القيود المحاسبية" ON public.journal_entries;
    DROP POLICY IF EXISTS "journal_entries_tenant_isolation" ON public.journal_entries;
    
    CREATE POLICY "journal_entries_tenant_isolation"
    ON public.journal_entries
    FOR ALL
    USING (tenant_id = public.get_current_tenant_id())
    WITH CHECK (tenant_id = public.get_current_tenant_id());
END
$$;

-- إضافة trigger لضمان تعيين tenant_id تلقائياً
CREATE OR REPLACE FUNCTION public.ensure_tenant_id_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    current_tenant_id uuid;
BEGIN
    IF NEW.tenant_id IS NULL THEN
        current_tenant_id := public.get_current_tenant_id();
        
        IF current_tenant_id IS NULL THEN
            RAISE EXCEPTION 'لا يمكن تحديد هوية المؤسسة الحالية';
        END IF;
        
        NEW.tenant_id := current_tenant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تطبيق trigger على الجداول الرئيسية
DO $$
DECLARE
    table_name text;
    tables_to_update text[] := ARRAY['customers', 'vehicles', 'contracts', 'employees', 'invoices', 'payments', 'chart_of_accounts', 'journal_entries'];
BEGIN
    FOREACH table_name IN ARRAY tables_to_update
    LOOP
        -- حذف trigger إذا كان موجوداً
        EXECUTE format('DROP TRIGGER IF EXISTS ensure_tenant_id_trigger ON public.%I', table_name);
        
        -- إنشاء trigger جديد
        EXECUTE format('
            CREATE TRIGGER ensure_tenant_id_trigger
            BEFORE INSERT ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert()
        ', table_name);
    END LOOP;
END
$$;