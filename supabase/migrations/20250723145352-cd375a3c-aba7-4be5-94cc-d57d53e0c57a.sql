-- المرحلة الأولى المحدودة: إصلاح الجداول الموجودة فقط
-- تأمين عزل البيانات للجداول الحرجة الموجودة

-- 1. إصلاح جدول customer_history (إضافة tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_history') THEN
        -- إضافة tenant_id إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customer_history' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.customer_history 
            ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
        END IF;

        -- تفعيل RLS
        ALTER TABLE public.customer_history ENABLE ROW LEVEL SECURITY;

        -- إضافة سياسة العزل
        DROP POLICY IF EXISTS "customer_history_tenant_isolation" ON public.customer_history;
        CREATE POLICY "customer_history_tenant_isolation" 
        ON public.customer_history 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());

        -- إضافة trigger
        DROP TRIGGER IF EXISTS ensure_tenant_id_on_customer_history ON public.customer_history;
        CREATE TRIGGER ensure_tenant_id_on_customer_history
            BEFORE INSERT ON public.customer_history
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
    END IF;
END $$;

-- 2. إصلاح جدول invoice_items (إضافة tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
        -- إضافة tenant_id إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoice_items' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.invoice_items 
            ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
        END IF;

        -- تفعيل RLS
        ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

        -- إضافة سياسة العزل
        DROP POLICY IF EXISTS "invoice_items_tenant_isolation" ON public.invoice_items;
        CREATE POLICY "invoice_items_tenant_isolation" 
        ON public.invoice_items 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());

        -- إضافة trigger
        DROP TRIGGER IF EXISTS ensure_tenant_id_on_invoice_items ON public.invoice_items;
        CREATE TRIGGER ensure_tenant_id_on_invoice_items
            BEFORE INSERT ON public.invoice_items
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
    END IF;
END $$;

-- 3. إصلاح جدول journal_entry_lines (تأمين RLS)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_lines') THEN
        -- تفعيل RLS
        ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

        -- إضافة سياسة العزل محدثة
        DROP POLICY IF EXISTS "journal_entry_lines_tenant_isolation" ON public.journal_entry_lines;
        CREATE POLICY "journal_entry_lines_tenant_isolation" 
        ON public.journal_entry_lines 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());
    END IF;
END $$;

-- 4. إصلاح جدول journal_entry_details (إضافة tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_details') THEN
        -- إضافة tenant_id إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'journal_entry_details' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.journal_entry_details 
            ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
        END IF;

        -- تفعيل RLS
        ALTER TABLE public.journal_entry_details ENABLE ROW LEVEL SECURITY;

        -- إضافة سياسة العزل
        DROP POLICY IF EXISTS "journal_entry_details_tenant_isolation" ON public.journal_entry_details;
        CREATE POLICY "journal_entry_details_tenant_isolation" 
        ON public.journal_entry_details 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());

        -- إضافة trigger
        DROP TRIGGER IF EXISTS ensure_tenant_id_on_journal_entry_details ON public.journal_entry_details;
        CREATE TRIGGER ensure_tenant_id_on_journal_entry_details
            BEFORE INSERT ON public.journal_entry_details
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
    END IF;
END $$;

-- 5. إصلاح جدول collective_invoice_items (تحسين العزل)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collective_invoice_items') THEN
        -- إضافة tenant_id إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'collective_invoice_items' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.collective_invoice_items 
            ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
        END IF;

        -- تفعيل RLS
        ALTER TABLE public.collective_invoice_items ENABLE ROW LEVEL SECURITY;

        -- إضافة سياسة العزل محدثة
        DROP POLICY IF EXISTS "collective_invoice_items_tenant_isolation" ON public.collective_invoice_items;
        CREATE POLICY "collective_invoice_items_tenant_isolation" 
        ON public.collective_invoice_items 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());

        -- إضافة trigger
        DROP TRIGGER IF EXISTS ensure_tenant_id_on_collective_invoice_items ON public.collective_invoice_items;
        CREATE TRIGGER ensure_tenant_id_on_collective_invoice_items
            BEFORE INSERT ON public.collective_invoice_items
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
    END IF;
END $$;

-- 6. تأمين advanced_kpis (تحديث السياسة الموجودة)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'advanced_kpis') THEN
        -- إضافة tenant_id إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'advanced_kpis' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.advanced_kpis 
            ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
        END IF;

        -- حذف السياسات القديمة وإنشاء سياسة موحدة
        DROP POLICY IF EXISTS "Users can access advanced KPIs for their tenant" ON public.advanced_kpis;
        DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية ا" ON public.advanced_kpis;
        DROP POLICY IF EXISTS "المديرون يمكنهم إدارة المؤشرات ال" ON public.advanced_kpis;
        DROP POLICY IF EXISTS "advanced_kpis_tenant_isolation" ON public.advanced_kpis;

        CREATE POLICY "advanced_kpis_tenant_isolation" 
        ON public.advanced_kpis 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());

        -- إضافة trigger
        DROP TRIGGER IF EXISTS ensure_tenant_id_on_advanced_kpis ON public.advanced_kpis;
        CREATE TRIGGER ensure_tenant_id_on_advanced_kpis
            BEFORE INSERT ON public.advanced_kpis
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
    END IF;
END $$;

-- 7. إصلاح performance_benchmarks
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_benchmarks') THEN
        -- إضافة tenant_id إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'performance_benchmarks' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.performance_benchmarks 
            ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
        END IF;

        -- حذف السياسات القديمة وإنشاء سياسة موحدة
        DROP POLICY IF EXISTS "Users can access benchmarks for their tenant" ON public.performance_benchmarks;
        DROP POLICY IF EXISTS "performance_benchmarks_tenant_isolation" ON public.performance_benchmarks;

        CREATE POLICY "performance_benchmarks_tenant_isolation" 
        ON public.performance_benchmarks 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());

        -- إضافة trigger
        DROP TRIGGER IF EXISTS ensure_tenant_id_on_performance_benchmarks ON public.performance_benchmarks;
        CREATE TRIGGER ensure_tenant_id_on_performance_benchmarks
            BEFORE INSERT ON public.performance_benchmarks
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
    END IF;
END $$;

-- 8. إصلاح kpi_targets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kpi_targets') THEN
        -- إضافة tenant_id إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'kpi_targets' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.kpi_targets 
            ADD COLUMN tenant_id UUID NOT NULL DEFAULT get_current_tenant_id();
        END IF;

        -- حذف السياسات القديمة وإنشاء سياسة موحدة
        DROP POLICY IF EXISTS "Users can access KPI targets for their tenant" ON public.kpi_targets;
        DROP POLICY IF EXISTS "kpi_targets_tenant_isolation" ON public.kpi_targets;

        CREATE POLICY "kpi_targets_tenant_isolation" 
        ON public.kpi_targets 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());

        -- إضافة trigger
        DROP TRIGGER IF EXISTS ensure_tenant_id_on_kpi_targets ON public.kpi_targets;
        CREATE TRIGGER ensure_tenant_id_on_kpi_targets
            BEFORE INSERT ON public.kpi_targets
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
    END IF;
END $$;