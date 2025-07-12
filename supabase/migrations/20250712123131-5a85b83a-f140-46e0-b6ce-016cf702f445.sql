-- المرحلة الأولى: تقوية قاعدة البيانات للعزل الكامل

-- 1. إضافة وظائف مساعدة للعزل
CREATE OR REPLACE FUNCTION public.ensure_tenant_isolation()
RETURNS TRIGGER AS $$
BEGIN
  -- التأكد من أن tenant_id يتم ضبطه تلقائيًا
  IF TG_OP = 'INSERT' THEN
    IF NEW.tenant_id IS NULL THEN
      NEW.tenant_id := public.get_current_tenant_id();
      
      -- التأكد من وجود tenant_id صحيح
      IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'لا يمكن تحديد المؤسسة الحالية. يرجى تسجيل الدخول أولاً.';
      END IF;
    END IF;
  END IF;
  
  -- التأكد من أن المستخدم يمكنه الوصول فقط لبيانات مؤسسته
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.tenant_id != public.get_current_tenant_id() THEN
      RAISE EXCEPTION 'غير مصرح لك بالوصول إلى بيانات مؤسسة أخرى.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. إضافة وظيفة للتحقق من سلامة العزل
CREATE OR REPLACE FUNCTION public.validate_tenant_isolation_integrity()
RETURNS JSONB AS $$
DECLARE
  violations JSONB := '[]'::jsonb;
  table_record RECORD;
  violation_count INTEGER;
BEGIN
  -- فحص جميع الجداول التي تحتوي على tenant_id
  FOR table_record IN (
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = pg_tables.tablename 
      AND column_name = 'tenant_id'
    )
  ) LOOP
    -- فحص وجود سجلات بدون tenant_id
    EXECUTE format('SELECT COUNT(*) FROM %I.%I WHERE tenant_id IS NULL', 
                   table_record.schemaname, table_record.tablename) 
    INTO violation_count;
    
    IF violation_count > 0 THEN
      violations := violations || jsonb_build_object(
        'table', table_record.tablename,
        'issue', 'null_tenant_id',
        'count', violation_count
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'is_secure', jsonb_array_length(violations) = 0,
    'violations', violations,
    'checked_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. إضافة وظيفة لتسجيل محاولات الوصول المشبوهة
CREATE OR REPLACE FUNCTION public.log_tenant_access_attempt(
  attempted_tenant_id UUID,
  table_name TEXT,
  action TEXT,
  success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.tenant_access_logs (
    user_id,
    attempted_tenant_id,
    actual_tenant_id,
    table_name,
    action,
    success,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    auth.uid(),
    attempted_tenant_id,
    public.get_current_tenant_id(),
    table_name,
    action,
    success,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إنشاء جدول لتسجيل محاولات الوصول
CREATE TABLE IF NOT EXISTS public.tenant_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  attempted_tenant_id UUID,
  actual_tenant_id UUID,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS على جدول السجلات
ALTER TABLE public.tenant_access_logs ENABLE ROW LEVEL SECURITY;

-- سياسة RLS لجدول السجلات
CREATE POLICY "المديرون يمكنهم رؤية سجلات الوصول"
ON public.tenant_access_logs
FOR SELECT
TO authenticated
USING (
  public.has_any_tenant_role(ARRAY['tenant_admin', 'manager'])
);

-- 5. تطبيق triggers على الجداول الحساسة
DROP TRIGGER IF EXISTS ensure_contracts_tenant_isolation ON public.contracts;
CREATE TRIGGER ensure_contracts_tenant_isolation
  BEFORE INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_isolation();

DROP TRIGGER IF EXISTS ensure_customers_tenant_isolation ON public.customers;
CREATE TRIGGER ensure_customers_tenant_isolation
  BEFORE INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_isolation();

DROP TRIGGER IF EXISTS ensure_vehicles_tenant_isolation ON public.vehicles;
CREATE TRIGGER ensure_vehicles_tenant_isolation
  BEFORE INSERT OR UPDATE OR DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_isolation();

DROP TRIGGER IF EXISTS ensure_employees_tenant_isolation ON public.employees;
CREATE TRIGGER ensure_employees_tenant_isolation
  BEFORE INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.ensure_tenant_isolation();

-- 6. تحديث سياسات RLS لتكون أكثر صرامة
DROP POLICY IF EXISTS "Users can view contracts in their tenant" ON public.contracts;
CREATE POLICY "عزل كامل للعقود حسب المؤسسة"
ON public.contracts
FOR ALL
TO authenticated
USING (tenant_id = public.get_current_tenant_id())
WITH CHECK (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "Users can view customers in their tenant" ON public.customers;
CREATE POLICY "عزل كامل للعملاء حسب المؤسسة"
ON public.customers
FOR ALL
TO authenticated
USING (tenant_id = public.get_current_tenant_id())
WITH CHECK (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "Users can view vehicles in their tenant" ON public.vehicles;
CREATE POLICY "عزل كامل للمركبات حسب المؤسسة"
ON public.vehicles
FOR ALL
TO authenticated
USING (tenant_id = public.get_current_tenant_id())
WITH CHECK (tenant_id = public.get_current_tenant_id());

-- 7. إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON public.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON public.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_access_logs_tenant_id ON public.tenant_access_logs(attempted_tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_access_logs_created_at ON public.tenant_access_logs(created_at);

-- 8. إضافة constraints للتأكد من سلامة البيانات
ALTER TABLE public.contracts 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.customers 
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.vehicles 
  ALTER COLUMN tenant_id SET NOT NULL;