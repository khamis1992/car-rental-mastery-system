-- إنشاء جداول النظام المحاسبي المتقدم

-- جدول الفروع
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_code TEXT NOT NULL UNIQUE,
  branch_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- جدول مراكز التكلفة
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_center_code TEXT NOT NULL UNIQUE,
  cost_center_name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.cost_centers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- جدول الفترات المالية
CREATE TABLE public.financial_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- جدول دليل الحسابات
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_name_en TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  account_category TEXT NOT NULL CHECK (account_category IN ('current_asset', 'fixed_asset', 'current_liability', 'long_term_liability', 'capital', 'operating_revenue', 'other_revenue', 'operating_expense', 'other_expense')),
  parent_account_id UUID REFERENCES public.chart_of_accounts(id),
  level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  allow_posting BOOLEAN DEFAULT true,
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- جدول القيود المحاسبية
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_number TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('manual', 'contract', 'invoice', 'payment', 'adjustment')),
  reference_id UUID,
  description TEXT NOT NULL,
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  branch_id UUID REFERENCES public.branches(id),
  financial_period_id UUID REFERENCES public.financial_periods(id),
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_by UUID,
  reversed_at TIMESTAMP WITH TIME ZONE,
  reversed_by UUID,
  reversal_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- جدول تفاصيل القيود المحاسبية
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  description TEXT,
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  line_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين Row Level Security
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية الفروع" 
ON public.branches FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المديرون يمكنهم إدارة الفروع" 
ON public.branches FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية مراكز التكلفة" 
ON public.cost_centers FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المديرون يمكنهم إدارة مراكز التكلفة" 
ON public.cost_centers FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية الفترات المالية" 
ON public.financial_periods FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المديرون يمكنهم إدارة الفترات المالية" 
ON public.financial_periods FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية دليل الحسابات" 
ON public.chart_of_accounts FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة دليل الحسابات" 
ON public.chart_of_accounts FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية القيود المحاسبية" 
ON public.journal_entries FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة القيود المحاسبية" 
ON public.journal_entries FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية تفاصيل القيود" 
ON public.journal_entry_lines FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تفاصيل القيود" 
ON public.journal_entry_lines FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- دوال لتوليد أرقام تلقائية
CREATE OR REPLACE FUNCTION public.generate_branch_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  branch_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(branch_code FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.branches
  WHERE branch_code ~ '^BR[0-9]+$';
  
  branch_code := 'BR' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN branch_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_cost_center_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  cost_center_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(cost_center_code FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.cost_centers
  WHERE cost_center_code ~ '^CC[0-9]+$';
  
  cost_center_code := 'CC' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN cost_center_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  entry_number TEXT;
  current_year TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(entry_number, '-', 2) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.journal_entries
  WHERE entry_number LIKE 'JE-' || current_year || '-%';
  
  entry_number := 'JE-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN entry_number;
END;
$$;

-- دالة للتحقق من توازن القيد المحاسبي
CREATE OR REPLACE FUNCTION public.validate_journal_entry_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_debit NUMERIC := 0;
  total_credit NUMERIC := 0;
BEGIN
  SELECT 
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM public.journal_entry_lines
  WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  UPDATE public.journal_entries 
  SET 
    total_debit = total_debit,
    total_credit = total_credit,
    updated_at = now()
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- دالة لتحديث أرصدة الحسابات
CREATE OR REPLACE FUNCTION public.update_account_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  entry_status TEXT;
BEGIN
  -- التحقق من حالة القيد
  SELECT status INTO entry_status
  FROM public.journal_entries
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  -- تحديث الأرصدة فقط للقيود المرحلة
  IF entry_status = 'posted' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.chart_of_accounts
      SET current_balance = current_balance + 
          CASE 
            WHEN account_type IN ('asset', 'expense') THEN NEW.debit_amount - NEW.credit_amount
            ELSE NEW.credit_amount - NEW.debit_amount
          END,
          updated_at = now()
      WHERE id = NEW.account_id;
    ELSIF TG_OP = 'UPDATE' THEN
      UPDATE public.chart_of_accounts
      SET current_balance = current_balance - 
          CASE 
            WHEN account_type IN ('asset', 'expense') THEN OLD.debit_amount - OLD.credit_amount
            ELSE OLD.credit_amount - OLD.debit_amount
          END +
          CASE 
            WHEN account_type IN ('asset', 'expense') THEN NEW.debit_amount - NEW.credit_amount
            ELSE NEW.credit_amount - NEW.debit_amount
          END,
          updated_at = now()
      WHERE id = NEW.account_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.chart_of_accounts
      SET current_balance = current_balance - 
          CASE 
            WHEN account_type IN ('asset', 'expense') THEN OLD.debit_amount - OLD.credit_amount
            ELSE OLD.credit_amount - OLD.debit_amount
          END,
          updated_at = now()
      WHERE id = OLD.account_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء المحفزات
CREATE TRIGGER validate_journal_entry_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION public.validate_journal_entry_balance();

CREATE TRIGGER update_account_balances_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balances();

CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_periods_updated_at
BEFORE UPDATE ON public.financial_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at
BEFORE UPDATE ON public.chart_of_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إدراج بيانات افتراضية لدليل الحسابات
INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, account_category, level, allow_posting) VALUES
-- الأصول
('1000', 'الأصول', 'asset', 'current_asset', 1, false),
('1100', 'الأصول المتداولة', 'asset', 'current_asset', 2, false),
('1101', 'الصندوق', 'asset', 'current_asset', 3, true),
('1102', 'البنك', 'asset', 'current_asset', 3, true),
('1103', 'العملاء', 'asset', 'current_asset', 3, true),
('1200', 'الأصول الثابتة', 'asset', 'fixed_asset', 2, false),
('1201', 'السيارات', 'asset', 'fixed_asset', 3, true),
('1202', 'المعدات', 'asset', 'fixed_asset', 3, true),

-- الخصوم
('2000', 'الخصوم', 'liability', 'current_liability', 1, false),
('2100', 'الخصوم المتداولة', 'liability', 'current_liability', 2, false),
('2101', 'الموردون', 'liability', 'current_liability', 3, true),
('2102', 'مستحقات', 'liability', 'current_liability', 3, true),

-- حقوق الملكية
('3000', 'حقوق الملكية', 'equity', 'capital', 1, false),
('3101', 'رأس المال', 'equity', 'capital', 2, true),
('3201', 'الأرباح المحتجزة', 'equity', 'capital', 2, true),

-- الإيرادات
('4000', 'الإيرادات', 'revenue', 'operating_revenue', 1, false),
('4101', 'إيرادات تأجير السيارات', 'revenue', 'operating_revenue', 2, true),
('4102', 'إيرادات أخرى', 'revenue', 'other_revenue', 2, true),

-- المصروفات
('5000', 'المصروفات', 'expense', 'operating_expense', 1, false),
('5101', 'مصروفات الصيانة', 'expense', 'operating_expense', 2, true),
('5102', 'مصروفات الوقود', 'expense', 'operating_expense', 2, true),
('5103', 'مصروفات التأمين', 'expense', 'operating_expense', 2, true),
('5201', 'رواتب الموظفين', 'expense', 'operating_expense', 2, true);

-- إدراج فرع افتراضي
INSERT INTO public.branches (branch_code, branch_name, is_active) VALUES
('BR001', 'الفرع الرئيسي', true);

-- إدراج مركز تكلفة افتراضي
INSERT INTO public.cost_centers (cost_center_code, cost_center_name, is_active) VALUES
('CC001', 'الإدارة العامة', true),
('CC002', 'قسم تأجير السيارات', true);

-- إدراج الفترة المالية الحالية
INSERT INTO public.financial_periods (period_name, start_date, end_date, fiscal_year) VALUES
('السنة المالية 2025', '2025-01-01', '2025-12-31', 2025);