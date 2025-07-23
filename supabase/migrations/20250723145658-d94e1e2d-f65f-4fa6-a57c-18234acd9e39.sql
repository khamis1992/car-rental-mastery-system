-- إصلاح أمني حاسم: عزل البيانات بطريقة آمنة
-- التعامل مع البيانات الموجودة أولاً

-- 1. إنشاء دالة مساعدة للحصول على tenant_id افتراضي
CREATE OR REPLACE FUNCTION public.get_default_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  -- إرجاع أول مؤسسة نشطة كقيمة افتراضية
  SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1;
$$;

-- 2. إصلاح customer_history بحذر شديد
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- الحصول على معرف مؤسسة افتراضي
    SELECT public.get_default_tenant_id() INTO default_tenant_id;
    
    IF default_tenant_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_history') THEN
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customer_history' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.customer_history 
            ADD COLUMN tenant_id UUID;
        END IF;

        -- تحديث جميع السجلات الفارغة بقيمة افتراضية
        UPDATE public.customer_history 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;

        -- الآن يمكن جعل العمود NOT NULL بأمان
        ALTER TABLE public.customer_history 
        ALTER COLUMN tenant_id SET NOT NULL;

        -- إضافة القيمة الافتراضية
        ALTER TABLE public.customer_history 
        ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();

        -- تفعيل RLS
        ALTER TABLE public.customer_history ENABLE ROW LEVEL SECURITY;

        -- إضافة سياسة العزل
        DROP POLICY IF EXISTS "customer_history_tenant_isolation" ON public.customer_history;
        CREATE POLICY "customer_history_tenant_isolation" 
        ON public.customer_history 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());
    END IF;
END $$;

-- 3. إصلاح invoice_items بنفس الطريقة الآمنة
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT public.get_default_tenant_id() INTO default_tenant_id;
    
    IF default_tenant_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoice_items' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.invoice_items 
            ADD COLUMN tenant_id UUID;
        END IF;

        -- تحديث جميع السجلات الفارغة
        UPDATE public.invoice_items 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;

        -- جعل العمود NOT NULL
        ALTER TABLE public.invoice_items 
        ALTER COLUMN tenant_id SET NOT NULL;

        -- إضافة القيمة الافتراضية
        ALTER TABLE public.invoice_items 
        ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();

        -- تفعيل RLS
        ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

        -- إضافة سياسة العزل
        DROP POLICY IF EXISTS "invoice_items_tenant_isolation" ON public.invoice_items;
        CREATE POLICY "invoice_items_tenant_isolation" 
        ON public.invoice_items 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());
    END IF;
END $$;

-- 4. إصلاح collective_invoice_items
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT public.get_default_tenant_id() INTO default_tenant_id;
    
    IF default_tenant_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collective_invoice_items') THEN
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'collective_invoice_items' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.collective_invoice_items 
            ADD COLUMN tenant_id UUID;

            -- تحديث جميع السجلات الفارغة
            UPDATE public.collective_invoice_items 
            SET tenant_id = default_tenant_id 
            WHERE tenant_id IS NULL;

            -- جعل العمود NOT NULL
            ALTER TABLE public.collective_invoice_items 
            ALTER COLUMN tenant_id SET NOT NULL;

            -- إضافة القيمة الافتراضية
            ALTER TABLE public.collective_invoice_items 
            ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
        END IF;

        -- تفعيل RLS
        ALTER TABLE public.collective_invoice_items ENABLE ROW LEVEL SECURITY;

        -- إضافة سياسة العزل
        DROP POLICY IF EXISTS "collective_invoice_items_tenant_isolation" ON public.collective_invoice_items;
        CREATE POLICY "collective_invoice_items_tenant_isolation" 
        ON public.collective_invoice_items 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());
    END IF;
END $$;

-- 5. تأمين جدول journal_entry_lines الموجود
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_lines') THEN
        -- تفعيل RLS
        ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

        -- تحديث سياسة العزل
        DROP POLICY IF EXISTS "journal_entry_lines_tenant_isolation" ON public.journal_entry_lines;
        CREATE POLICY "journal_entry_lines_tenant_isolation" 
        ON public.journal_entry_lines 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());
    END IF;
END $$;

-- 6. إضافة triggers للجداول المُصححة
DO $$
DECLARE
    table_names text[] := ARRAY['customer_history', 'invoice_items', 'collective_invoice_items'];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_names[array_position(table_names, table_name)]) THEN
            EXECUTE format('
                DROP TRIGGER IF EXISTS ensure_tenant_id_on_%I ON public.%I;
                CREATE TRIGGER ensure_tenant_id_on_%I
                    BEFORE INSERT ON public.%I
                    FOR EACH ROW
                    EXECUTE FUNCTION public.ensure_tenant_id_on_insert();
            ', table_name, table_name, table_name, table_name);
        END IF;
    END LOOP;
END $$;