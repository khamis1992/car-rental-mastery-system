-- المرحلة الأولى: تحديث قاعدة البيانات لعزل البيانات بين المؤسسات

-- إضافة tenant_id للجداول المفقودة
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.journal_entry_lines ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.fixed_assets ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.office_locations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.payroll_periods ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.violation_payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.traffic_violations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE public.transaction_log ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON public.departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON public.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant_id ON public.quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_id ON public.journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_tenant_id ON public.journal_entry_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_tenant_id ON public.fixed_assets(tenant_id);

-- تحديث البيانات الموجودة بـ tenant_id من get_current_tenant_id()
UPDATE public.employees SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;
UPDATE public.departments SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;
UPDATE public.vehicles SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;
UPDATE public.quotations SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;
UPDATE public.invoices SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;
UPDATE public.payments SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;
UPDATE public.journal_entries SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;
UPDATE public.journal_entry_lines SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;
UPDATE public.fixed_assets SET tenant_id = get_current_tenant_id() WHERE tenant_id IS NULL;

-- جعل tenant_id مطلوب في الجداول الأساسية
ALTER TABLE public.employees ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.departments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.quotations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.journal_entries ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.journal_entry_lines ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.fixed_assets ALTER COLUMN tenant_id SET NOT NULL;

-- تحديث الـ triggers لتعيين tenant_id تلقائياً
CREATE OR REPLACE FUNCTION public.set_tenant_id_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة triggers للجداول
DROP TRIGGER IF EXISTS set_tenant_id_employees ON public.employees;
CREATE TRIGGER set_tenant_id_employees
  BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_trigger();

DROP TRIGGER IF EXISTS set_tenant_id_vehicles ON public.vehicles;
CREATE TRIGGER set_tenant_id_vehicles
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_trigger();

DROP TRIGGER IF EXISTS set_tenant_id_quotations ON public.quotations;
CREATE TRIGGER set_tenant_id_quotations
  BEFORE INSERT ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_trigger();

DROP TRIGGER IF EXISTS set_tenant_id_invoices ON public.invoices;
CREATE TRIGGER set_tenant_id_invoices
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_trigger();

DROP TRIGGER IF EXISTS set_tenant_id_payments ON public.payments;
CREATE TRIGGER set_tenant_id_payments
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_trigger();

DROP TRIGGER IF EXISTS set_tenant_id_journal_entries ON public.journal_entries;
CREATE TRIGGER set_tenant_id_journal_entries
  BEFORE INSERT ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_trigger();

-- تحديث سياسات RLS للجداول الأساسية
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

-- سياسات الموظفين
DROP POLICY IF EXISTS "employees_tenant_isolation" ON public.employees;
CREATE POLICY "employees_tenant_isolation" ON public.employees
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- سياسات المركبات
DROP POLICY IF EXISTS "vehicles_tenant_isolation" ON public.vehicles;
CREATE POLICY "vehicles_tenant_isolation" ON public.vehicles
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- سياسات العروض
DROP POLICY IF EXISTS "quotations_tenant_isolation" ON public.quotations;
CREATE POLICY "quotations_tenant_isolation" ON public.quotations
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- سياسات الفواتير
DROP POLICY IF EXISTS "invoices_tenant_isolation" ON public.invoices;
CREATE POLICY "invoices_tenant_isolation" ON public.invoices
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- سياسات المدفوعات
DROP POLICY IF EXISTS "payments_tenant_isolation" ON public.payments;
CREATE POLICY "payments_tenant_isolation" ON public.payments
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- سياسات القيود المحاسبية
DROP POLICY IF EXISTS "journal_entries_tenant_isolation" ON public.journal_entries;
CREATE POLICY "journal_entries_tenant_isolation" ON public.journal_entries
  FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "journal_entry_lines_tenant_isolation" ON public.journal_entry_lines;
CREATE POLICY "journal_entry_lines_tenant_isolation" ON public.journal_entry_lines
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- سياسات الأصول الثابتة
DROP POLICY IF EXISTS "fixed_assets_tenant_isolation" ON public.fixed_assets;
CREATE POLICY "fixed_assets_tenant_isolation" ON public.fixed_assets
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- إنشاء وظيفة حماية للتأكد من عدم تسرب البيانات
CREATE OR REPLACE FUNCTION public.validate_tenant_access(table_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN table_tenant_id = get_current_tenant_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء وظيفة مراقبة لتسجيل محاولات الوصول المشبوهة
CREATE TABLE IF NOT EXISTS public.tenant_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  attempted_tenant_id UUID,
  table_name TEXT,
  action TEXT,
  success BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.log_tenant_access(
  p_tenant_id UUID,
  p_attempted_tenant_id UUID,
  p_table_name TEXT,
  p_action TEXT,
  p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.tenant_access_log (
    user_id, tenant_id, attempted_tenant_id, table_name, action, success
  ) VALUES (
    auth.uid(), p_tenant_id, p_attempted_tenant_id, p_table_name, p_action, p_success
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;