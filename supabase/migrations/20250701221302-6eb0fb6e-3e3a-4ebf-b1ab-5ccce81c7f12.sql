-- إنشاء جدول الحسابات المصرفية
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking',
  currency TEXT NOT NULL DEFAULT 'KWD',
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  account_id UUID REFERENCES public.chart_of_accounts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول المعاملات المصرفية
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  balance_after NUMERIC DEFAULT 0,
  transaction_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- تمكين RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للحسابات المصرفية
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الحسابات المصرفية" 
ON public.bank_accounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية الحسابات المصرفية" 
ON public.bank_accounts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء سياسات RLS للمعاملات المصرفية
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة المعاملات المصرفية" 
ON public.bank_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

CREATE POLICY "المحاسبون والمديرون يمكنهم رؤية المعاملات المصرفية" 
ON public.bank_transactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء trigger لتحديث الرصيد
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bank_accounts 
    SET current_balance = current_balance + NEW.credit_amount - NEW.debit_amount,
        updated_at = now()
    WHERE id = NEW.bank_account_id;
    
    NEW.balance_after = (SELECT current_balance FROM public.bank_accounts WHERE id = NEW.bank_account_id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_balance_trigger
  AFTER INSERT ON public.bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_bank_account_balance();