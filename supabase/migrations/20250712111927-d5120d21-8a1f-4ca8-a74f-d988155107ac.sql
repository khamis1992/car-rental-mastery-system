-- المرحلة الأولى: عزل البيانات المحاسبية لكل tenant
-- إضافة tenant_id للجداول المحاسبية التي تفتقدها

-- 1. إضافة tenant_id لجدول journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 2. إضافة tenant_id لجدول journal_entry_lines (عبر الربط مع journal_entries)
-- لا نحتاج tenant_id مباشر لأنه سيتم الوصول عبر journal_entries

-- 3. إضافة tenant_id للجداول المحاسبية الأخرى
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.bank_transactions 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.fixed_assets 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.asset_depreciation 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.budget_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 4. تحديث الجداول الموجودة لتعيين tenant_id للسجلات الحالية
-- سنعين tenant_id للسجلات الموجودة بناءً على أول tenant نشط
UPDATE public.journal_entries 
SET tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE public.bank_accounts 
SET tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE public.bank_transactions bt
SET tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE public.fixed_assets 
SET tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE public.asset_depreciation 
SET tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE public.budgets 
SET tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE public.budget_items 
SET tenant_id = (SELECT id FROM public.tenants WHERE status = 'active' LIMIT 1)
WHERE tenant_id IS NULL;

-- 5. جعل tenant_id مطلوب للجداول الجديدة
ALTER TABLE public.journal_entries 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.bank_accounts 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.bank_transactions 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.fixed_assets 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.asset_depreciation 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.budgets 
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.budget_items 
ALTER COLUMN tenant_id SET NOT NULL;

-- 6. إنشاء/تحديث RLS policies للجداول المحاسبية

-- Journal Entries
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة القيود" ON public.journal_entries;
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية القيود" ON public.journal_entries;

CREATE POLICY "المحاسبون يمكنهم إدارة قيود tenant الخاص بهم" ON public.journal_entries
FOR ALL USING (
  tenant_id = public.get_current_tenant_id() AND 
  (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

-- Journal Entry Lines (ترتبط بـ journal_entries)
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة سطور القيود" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية سطور القيود" ON public.journal_entry_lines;

CREATE POLICY "المحاسبون يمكنهم إدارة سطور قيود tenant الخاص بهم" ON public.journal_entry_lines
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.journal_entries je 
    WHERE je.id = journal_entry_lines.journal_entry_id 
    AND je.tenant_id = public.get_current_tenant_id()
  ) AND 
  (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

-- Bank Accounts
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة الحسابات البنكية" ON public.bank_accounts;
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية الحسابات البنكية" ON public.bank_accounts;

CREATE POLICY "المحاسبون يمكنهم إدارة حسابات tenant الخاص بهم" ON public.bank_accounts
FOR ALL USING (
  tenant_id = public.get_current_tenant_id() AND 
  (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

-- Bank Transactions
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة المعاملات البنكية" ON public.bank_transactions;
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم رؤية المعاملات البنكية" ON public.bank_transactions;

CREATE POLICY "المحاسبون يمكنهم إدارة معاملات tenant الخاص بهم" ON public.bank_transactions
FOR ALL USING (
  tenant_id = public.get_current_tenant_id() AND 
  (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

-- Fixed Assets
CREATE POLICY "المحاسبون يمكنهم إدارة أصول tenant الخاص بهم" ON public.fixed_assets
FOR ALL USING (
  tenant_id = public.get_current_tenant_id() AND 
  (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

-- Asset Depreciation
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة الاستهلاك" ON public.asset_depreciation;

CREATE POLICY "المحاسبون يمكنهم إدارة استهلاك tenant الخاص بهم" ON public.asset_depreciation
FOR ALL USING (
  tenant_id = public.get_current_tenant_id() AND 
  (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

-- Budgets
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة الميزانيات" ON public.budgets;

CREATE POLICY "المحاسبون يمكنهم إدارة ميزانيات tenant الخاص بهم" ON public.budgets
FOR ALL USING (
  tenant_id = public.get_current_tenant_id() AND 
  (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

-- Budget Items
DROP POLICY IF EXISTS "المحاسبون والمديرون يمكنهم إدارة بنود الميزانية" ON public.budget_items;

CREATE POLICY "المحاسبون يمكنهم إدارة بنود ميزانيات tenant الخاص بهم" ON public.budget_items
FOR ALL USING (
  tenant_id = public.get_current_tenant_id() AND 
  (has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']))
);

-- 7. إضافة triggers لتعيين tenant_id تلقائياً
CREATE OR REPLACE FUNCTION public.set_accounting_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tenant_id := public.get_current_tenant_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء triggers للجداول المحاسبية
DROP TRIGGER IF EXISTS set_tenant_id_journal_entries ON public.journal_entries;
CREATE TRIGGER set_tenant_id_journal_entries
  BEFORE INSERT ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_accounting_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_bank_accounts ON public.bank_accounts;
CREATE TRIGGER set_tenant_id_bank_accounts
  BEFORE INSERT ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_accounting_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_bank_transactions ON public.bank_transactions;
CREATE TRIGGER set_tenant_id_bank_transactions
  BEFORE INSERT ON public.bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_accounting_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_fixed_assets ON public.fixed_assets;
CREATE TRIGGER set_tenant_id_fixed_assets
  BEFORE INSERT ON public.fixed_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_accounting_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_asset_depreciation ON public.asset_depreciation;
CREATE TRIGGER set_tenant_id_asset_depreciation
  BEFORE INSERT ON public.asset_depreciation
  FOR EACH ROW EXECUTE FUNCTION public.set_accounting_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_budgets ON public.budgets;
CREATE TRIGGER set_tenant_id_budgets
  BEFORE INSERT ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_accounting_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_budget_items ON public.budget_items;
CREATE TRIGGER set_tenant_id_budget_items
  BEFORE INSERT ON public.budget_items
  FOR EACH ROW EXECUTE FUNCTION public.set_accounting_tenant_id();