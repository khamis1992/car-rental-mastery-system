-- إصلاح مشكلة التباس الأسماء وتطبيق عزل المؤسسات

-- تعطيل جميع triggers المتعلقة بالمؤسسات مؤقتاً
DROP TRIGGER IF EXISTS auto_setup_new_tenant_accounting ON public.tenants;

-- الحصول على أول مؤسسة موجودة في النظام وتطبيق العزل
DO $$
DECLARE
    first_tenant_id uuid;
    current_table text;
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
    FOREACH current_table IN ARRAY tables_to_update
    LOOP
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE information_schema.columns.table_name = current_table 
            AND information_schema.columns.column_name = 'tenant_id'
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_id uuid', current_table);
        END IF;
        
        -- تحديث القيم الفارغة
        EXECUTE format('UPDATE public.%I SET tenant_id = $1 WHERE tenant_id IS NULL', current_table) 
        USING first_tenant_id;
        
        -- تطبيق القيود
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL', current_table);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT public.get_current_tenant_id()', current_table);
        
        -- تمكين RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', current_table);
        
        -- حذف السياسات الموجودة
        EXECUTE format('DROP POLICY IF EXISTS "%I_tenant_isolation" ON public.%I', current_table, current_table);
        
        -- إنشاء سياسة العزل
        EXECUTE format('
            CREATE POLICY "%I_tenant_isolation"
            ON public.%I
            FOR ALL
            USING (tenant_id = public.get_current_tenant_id())
            WITH CHECK (tenant_id = public.get_current_tenant_id())
        ', current_table, current_table);
        
        -- إضافة trigger للتأكد من تعيين tenant_id
        EXECUTE format('DROP TRIGGER IF EXISTS ensure_tenant_id_trigger ON public.%I', current_table);
        EXECUTE format('
            CREATE TRIGGER ensure_tenant_id_trigger
            BEFORE INSERT ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.ensure_tenant_id_on_insert()
        ', current_table);
        
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