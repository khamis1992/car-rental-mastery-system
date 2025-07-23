-- إصلاح أمني شامل: المرحلة الأولى مبسطة
-- تأمين الجداول الأساسية بعزل البيانات

-- 1. إنشاء دالة مساعدة للحصول على tenant_id افتراضي
CREATE OR REPLACE FUNCTION public.get_safe_default_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.tenants WHERE status = 'active' ORDER BY created_at LIMIT 1;
$$;

-- 2. إصلاح customer_history
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT public.get_safe_default_tenant_id() INTO default_tenant_id;
    
    IF default_tenant_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'customer_history'
    ) THEN
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customer_history' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.customer_history ADD COLUMN tenant_id UUID;
        END IF;

        -- تحديث السجلات الفارغة
        UPDATE public.customer_history 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;

        -- جعل العمود NOT NULL
        ALTER TABLE public.customer_history ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.customer_history ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();

        -- تفعيل RLS وإضافة السياسة
        ALTER TABLE public.customer_history ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "customer_history_tenant_isolation" ON public.customer_history;
        CREATE POLICY "customer_history_tenant_isolation" 
        ON public.customer_history 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());
    END IF;
END $$;

-- 3. إصلاح invoice_items
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT public.get_safe_default_tenant_id() INTO default_tenant_id;
    
    IF default_tenant_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'invoice_items'
    ) THEN
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'invoice_items' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.invoice_items ADD COLUMN tenant_id UUID;
        END IF;

        -- تحديث السجلات الفارغة
        UPDATE public.invoice_items 
        SET tenant_id = default_tenant_id 
        WHERE tenant_id IS NULL;

        -- جعل العمود NOT NULL
        ALTER TABLE public.invoice_items ALTER COLUMN tenant_id SET NOT NULL;
        ALTER TABLE public.invoice_items ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();

        -- تفعيل RLS وإضافة السياسة
        ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
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
    SELECT public.get_safe_default_tenant_id() INTO default_tenant_id;
    
    IF default_tenant_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'collective_invoice_items'
    ) THEN
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'collective_invoice_items' 
            AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE public.collective_invoice_items ADD COLUMN tenant_id UUID;
            
            -- تحديث السجلات الفارغة
            UPDATE public.collective_invoice_items 
            SET tenant_id = default_tenant_id 
            WHERE tenant_id IS NULL;

            -- جعل العمود NOT NULL
            ALTER TABLE public.collective_invoice_items ALTER COLUMN tenant_id SET NOT NULL;
            ALTER TABLE public.collective_invoice_items ALTER COLUMN tenant_id SET DEFAULT get_current_tenant_id();
        END IF;

        -- تفعيل RLS وإضافة السياسة
        ALTER TABLE public.collective_invoice_items ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "collective_invoice_items_tenant_isolation" ON public.collective_invoice_items;
        CREATE POLICY "collective_invoice_items_tenant_isolation" 
        ON public.collective_invoice_items 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());
    END IF;
END $$;

-- 5. تأمين journal_entry_lines الموجود
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'journal_entry_lines'
    ) THEN
        ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "journal_entry_lines_tenant_isolation" ON public.journal_entry_lines;
        CREATE POLICY "journal_entry_lines_tenant_isolation" 
        ON public.journal_entry_lines 
        FOR ALL 
        USING (tenant_id = get_current_tenant_id());
    END IF;
END $$;

-- 6. إضافة triggers للحماية
-- Customer History
DROP TRIGGER IF EXISTS ensure_tenant_id_on_customer_history ON public.customer_history;
CREATE TRIGGER ensure_tenant_id_on_customer_history
    BEFORE INSERT ON public.customer_history
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

-- Invoice Items  
DROP TRIGGER IF EXISTS ensure_tenant_id_on_invoice_items ON public.invoice_items;
CREATE TRIGGER ensure_tenant_id_on_invoice_items
    BEFORE INSERT ON public.invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_tenant_id_on_insert();

-- Collective Invoice Items
DROP TRIGGER IF EXISTS ensure_tenant_id_on_collective_invoice_items ON public.collective_invoice_items;
CREATE TRIGGER ensure_tenant_id_on_collective_invoice_items
    BEFORE INSERT ON public.collective_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_tenant_id_on_insert();