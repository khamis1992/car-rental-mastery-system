-- إزالة التضارب وتطبيق عزل المؤسسات بطريقة آمنة

-- تعطيل جميع triggers المتعلقة بالمؤسسات مؤقتاً
DROP TRIGGER IF EXISTS auto_setup_new_tenant_accounting ON public.tenants;

-- تحديث الجداول الموجودة بعمود tenant_id مع استخدام المؤسسة الأولى الموجودة

-- الحصول على أول مؤسسة موجودة في النظام
DO $$
DECLARE
    first_tenant_id uuid;
    table_name text;
    tables_to_update text[] := ARRAY[
        'customers', 'vehicles', 'contracts', 'employees', 
        'invoices', 'payments', 'chart_of_accounts', 'journal_entries'
    ];
BEGIN
    -- الحصول على أول مؤسسة موجودة
    SELECT id INTO first_tenant_id
    FROM public.tenants 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- إذا لم توجد أي مؤسسة، إنشاء واحدة بسيطة
    IF first_tenant_id IS NULL THEN
        -- إنشاء مؤسسة افتراضية بدون trigger
        INSERT INTO public.tenants (
            name, slug, country, timezone, currency, 
            status, subscription_plan, subscription_status, 
            max_users, max_vehicles, max_contracts, settings
        ) VALUES (
            'المؤسسة الرئيسية', 'main-tenant', 'Kuwait', 'Asia/Kuwait', 'KWD',
            'active', 'basic', 'active',
            100, 50, 1000, '{}'::jsonb
        ) RETURNING id INTO first_tenant_id;
    END IF;
    
    -- تحديث كل جدول بدوره
    FOREACH table_name IN ARRAY tables_to_update
    LOOP
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_name AND column_name = 'tenant_id'
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_id uuid', table_name);
        END IF;
        
        -- تحديث القيم الفارغة
        EXECUTE format('UPDATE public.%I SET tenant_id = $1 WHERE tenant_id IS NULL', table_name) 
        USING first_tenant_id;
        
        -- تطبيق القيود
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL', table_name);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id()', table_name);
        
        -- تمكين RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        
        -- حذف السياسات الموجودة
        EXECUTE format('DROP POLICY IF EXISTS "%I_tenant_isolation" ON public.%I', table_name, table_name);
        
        -- إنشاء سياسة العزل
        EXECUTE format('
            CREATE POLICY "%I_tenant_isolation"
            ON public.%I
            FOR ALL
            USING (tenant_id = public.get_current_tenant_id())
            WITH CHECK (tenant_id = public.get_current_tenant_id())
        ', table_name, table_name);
        
        -- إضافة trigger للتأكد من تعيين tenant_id
        EXECUTE format('DROP TRIGGER IF EXISTS ensure_tenant_id_trigger ON public.%I', table_name);
        EXECUTE format('
            CREATE TRIGGER ensure_tenant_id_trigger
            BEFORE INSERT ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert()
        ', table_name);
        
    END LOOP;
    
    RAISE NOTICE 'تم تطبيق عزل المؤسسات بنجاح على % جدول باستخدام المؤسسة %', 
                 array_length(tables_to_update, 1), first_tenant_id;
END
$$;

-- إنشاء دالة للتأكد من تعيين tenant_id
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