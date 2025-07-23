-- إنشاء جداول مطابقة البنوك
CREATE TABLE public.bank_reconciliation_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  import_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_name TEXT,
  file_size INTEGER,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  matched_transactions INTEGER NOT NULL DEFAULT 0,
  unmatched_transactions INTEGER NOT NULL DEFAULT 0,
  import_status TEXT NOT NULL DEFAULT 'pending' CHECK (import_status IN ('pending', 'processing', 'completed', 'failed')),
  imported_by UUID,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- إنشاء جدول المعاملات البنكية المستوردة
CREATE TABLE public.imported_bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.bank_reconciliation_imports(id),
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  balance_after NUMERIC,
  bank_reference TEXT,
  check_number TEXT,
  matched_journal_entry_id UUID REFERENCES public.journal_entries(id),
  match_confidence NUMERIC DEFAULT 0,
  match_type TEXT CHECK (match_type IN ('manual', 'automatic', 'suggested')),
  matched_at TIMESTAMP WITH TIME ZONE,
  matched_by UUID,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_matched BOOLEAN DEFAULT false,
  match_notes TEXT
);

-- إنشاء جدول مطابقات المصالحة البنكية
CREATE TABLE public.bank_reconciliation_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imported_transaction_id UUID NOT NULL REFERENCES public.imported_bank_transactions(id),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id),
  match_amount NUMERIC NOT NULL,
  match_confidence NUMERIC DEFAULT 0,
  match_type TEXT NOT NULL CHECK (match_type IN ('manual', 'automatic', 'suggested')),
  match_reason TEXT,
  matched_by UUID NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_confirmed BOOLEAN DEFAULT false,
  notes TEXT
);

-- إنشاء جدول تقارير المصالحة البنكية
CREATE TABLE public.bank_reconciliation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  reconciliation_date DATE NOT NULL,
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  book_balance NUMERIC DEFAULT 0,
  total_deposits NUMERIC DEFAULT 0,
  total_withdrawals NUMERIC DEFAULT 0,
  outstanding_deposits NUMERIC DEFAULT 0,
  outstanding_withdrawals NUMERIC DEFAULT 0,
  bank_charges NUMERIC DEFAULT 0,
  interest_earned NUMERIC DEFAULT 0,
  reconciled_balance NUMERIC DEFAULT 0,
  variance_amount NUMERIC DEFAULT 0,
  reconciliation_status TEXT NOT NULL DEFAULT 'draft' CHECK (reconciliation_status IN ('draft', 'in_progress', 'completed', 'approved')),
  prepared_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- تمكين RLS
ALTER TABLE public.bank_reconciliation_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliation_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliation_reports ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للمستوردات
CREATE POLICY "المحاسبون يمكنهم إدارة مستوردات tenant" 
ON public.bank_reconciliation_imports 
FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']));

-- إنشاء سياسات RLS للمعاملات المستوردة
CREATE POLICY "المحاسبون يمكنهم إدارة المعاملات المستوردة tenant" 
ON public.imported_bank_transactions 
FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']));

-- إنشاء سياسات RLS للمطابقات
CREATE POLICY "المحاسبون يمكنهم إدارة المطابقات tenant" 
ON public.bank_reconciliation_matches 
FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']));

-- إنشاء سياسات RLS للتقارير
CREATE POLICY "المحاسبون يمكنهم إدارة التقارير tenant" 
ON public.bank_reconciliation_reports 
FOR ALL 
USING (tenant_id = get_current_tenant_id() AND has_any_tenant_role(ARRAY['tenant_admin', 'manager', 'accountant']));

-- إنشاء الفهارس للأداء
CREATE INDEX idx_bank_reconciliation_imports_bank_account ON public.bank_reconciliation_imports(bank_account_id);
CREATE INDEX idx_imported_bank_transactions_import ON public.imported_bank_transactions(import_id);
CREATE INDEX idx_imported_bank_transactions_account ON public.imported_bank_transactions(bank_account_id);
CREATE INDEX idx_bank_reconciliation_matches_transaction ON public.bank_reconciliation_matches(imported_transaction_id);
CREATE INDEX idx_bank_reconciliation_reports_account ON public.bank_reconciliation_reports(bank_account_id);

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_bank_reconciliation_imports_updated_at
  BEFORE UPDATE ON public.bank_reconciliation_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_reconciliation_reports_updated_at
  BEFORE UPDATE ON public.bank_reconciliation_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();