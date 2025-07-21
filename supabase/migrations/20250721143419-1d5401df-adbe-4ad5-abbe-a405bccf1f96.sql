
-- إنشاء جدول بيانات الموردين
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  supplier_code TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  supplier_name_en TEXT,
  supplier_type TEXT NOT NULL DEFAULT 'individual' CHECK (supplier_type IN ('individual', 'company')),
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'الكويت',
  civil_id TEXT,
  commercial_registration TEXT,
  tax_number TEXT,
  payment_terms INTEGER DEFAULT 30,
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  currency_code TEXT DEFAULT 'KWD',
  bank_name TEXT,
  bank_account TEXT,
  iban TEXT,
  swift_code TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول فواتير الموردين
CREATE TABLE public.supplier_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  supplier_invoice_number TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- المبالغ
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  outstanding_amount NUMERIC NOT NULL DEFAULT 0,
  
  -- الحالة والنوع
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'partially_paid', 'overdue', 'cancelled')),
  invoice_type TEXT NOT NULL DEFAULT 'purchase' CHECK (invoice_type IN ('purchase', 'maintenance', 'insurance', 'utilities', 'rent', 'other')),
  
  -- شروط الدفع
  payment_terms INTEGER DEFAULT 30,
  
  -- معلومات إضافية
  description TEXT,
  notes TEXT,
  
  -- الموافقة
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- الملفات المرفقة
  attachments TEXT[],
  
  -- البيانات الوصفية
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول بنود فواتير الموردين
CREATE TABLE public.supplier_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  
  -- تفاصيل البند
  description TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'service' CHECK (item_type IN ('service', 'part', 'maintenance', 'insurance', 'fuel', 'other')),
  
  -- التسعير
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  
  -- مرجع المركبة إذا كان مرتبطاً
  vehicle_id UUID,
  
  -- تواريخ الخدمة
  service_date DATE,
  
  -- البيانات الوصفية
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول مدفوعات الموردين
CREATE TABLE public.supplier_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  payment_number TEXT NOT NULL UNIQUE,
  supplier_invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  
  -- تفاصيل الدفع
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card', 'online')),
  
  -- تفاصيل المعاملة
  transaction_reference TEXT,
  bank_name TEXT,
  check_number TEXT,
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  
  -- معلومات إضافية
  notes TEXT,
  receipt_url TEXT,
  
  -- الموافقة
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- البيانات الوصفية
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول دفتر الأستاذ المساعد للموردين
CREATE TABLE public.supplier_subsidiary_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  journal_entry_id UUID,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  debit_amount NUMERIC NOT NULL DEFAULT 0,
  credit_amount NUMERIC NOT NULL DEFAULT 0,
  running_balance NUMERIC NOT NULL DEFAULT 0,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('invoice', 'payment', 'adjustment', 'opening_balance')),
  reference_id UUID,
  invoice_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول كشوف حسابات الموردين
CREATE TABLE public.supplier_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  total_debits NUMERIC NOT NULL DEFAULT 0,
  total_credits NUMERIC NOT NULL DEFAULT 0,
  statement_data JSONB,
  generated_by UUID,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed'))
);

-- إنشاء جدول تحليل أعمار الدائنين
CREATE TABLE public.supplier_aging_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_amount NUMERIC NOT NULL DEFAULT 0,  -- 0-30 يوم
  days_30_60 NUMERIC NOT NULL DEFAULT 0,     -- 31-60 يوم
  days_61_90 NUMERIC NOT NULL DEFAULT 0,     -- 61-90 يوم
  days_91_120 NUMERIC NOT NULL DEFAULT 0,    -- 91-120 يوم
  over_120_days NUMERIC NOT NULL DEFAULT 0,  -- أكثر من 120 يوم
  total_outstanding NUMERIC NOT NULL DEFAULT 0,
  oldest_invoice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- إنشاء جدول سجل معاملات الموردين
CREATE TABLE public.supplier_transaction_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_current_tenant_id(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('invoice_created', 'payment_made', 'credit_applied', 'adjustment', 'debit_entry', 'credit_entry')),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('invoice', 'payment', 'credit_note', 'adjustment')),
  reference_id UUID,
  journal_entry_id UUID,
  balance_before NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  metadata JSONB
);

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_subsidiary_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_aging_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_transaction_log ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للموردين
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية الموردين" ON public.suppliers FOR SELECT
TO authenticated USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة الموردين" ON public.suppliers FOR ALL
TO authenticated USING (tenant_id = get_current_tenant_id() AND (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
));

-- إنشاء سياسات RLS لفواتير الموردين
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية فواتير الموردين" ON public.supplier_invoices FOR SELECT
TO authenticated USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة فواتير الموردين" ON public.supplier_invoices FOR ALL
TO authenticated USING (tenant_id = get_current_tenant_id() AND (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
));

-- إنشاء سياسات RLS لبنود فواتير الموردين
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية بنود فواتير الموردين" ON public.supplier_invoice_items FOR SELECT
TO authenticated USING (EXISTS (
  SELECT 1 FROM public.supplier_invoices si 
  WHERE si.id = supplier_invoice_id AND si.tenant_id = get_current_tenant_id()
));

CREATE POLICY "الموظفون يمكنهم إدارة بنود فواتير الموردين" ON public.supplier_invoice_items FOR ALL
TO authenticated USING (EXISTS (
  SELECT 1 FROM public.supplier_invoices si 
  WHERE si.id = supplier_invoice_id AND si.tenant_id = get_current_tenant_id()
) AND (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
));

-- إنشاء سياسات RLS لمدفوعات الموردين
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية مدفوعات الموردين" ON public.supplier_payments FOR SELECT
TO authenticated USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة مدفوعات الموردين" ON public.supplier_payments FOR ALL
TO authenticated USING (tenant_id = get_current_tenant_id() AND (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
));

-- إنشاء سياسات RLS لدفتر الأستاذ المساعد للموردين
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية دفتر الأستاذ المساعد للموردين" ON public.supplier_subsidiary_ledger FOR SELECT
TO authenticated USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة دفتر الأستاذ المساعد للموردين" ON public.supplier_subsidiary_ledger FOR ALL
TO authenticated USING (tenant_id = get_current_tenant_id() AND (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
));

-- إنشاء سياسات RLS لكشوف حسابات الموردين
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية كشوف حسابات الموردين" ON public.supplier_statements FOR SELECT
TO authenticated USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة كشوف حسابات الموردين" ON public.supplier_statements FOR ALL
TO authenticated USING (tenant_id = get_current_tenant_id() AND (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
));

-- إنشاء سياسات RLS لتحليل أعمار الدائنين
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية تحليل أعمار الدائنين" ON public.supplier_aging_analysis FOR SELECT
TO authenticated USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة تحليل أعمار الدائنين" ON public.supplier_aging_analysis FOR ALL
TO authenticated USING (tenant_id = get_current_tenant_id() AND (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
));

-- إنشاء سياسات RLS لسجل معاملات الموردين
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية سجل معاملات الموردين" ON public.supplier_transaction_log FOR SELECT
TO authenticated USING (tenant_id = get_current_tenant_id());

CREATE POLICY "الموظفون يمكنهم إدارة سجل معاملات الموردين" ON public.supplier_transaction_log FOR ALL
TO authenticated USING (tenant_id = get_current_tenant_id() AND (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'accountant')
));

-- إنشاء وظائف لتوليد أرقام الفواتير والمدفوعات
CREATE OR REPLACE FUNCTION public.generate_supplier_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.supplier_invoices
  WHERE invoice_number ~ '^SUP[0-9]+$';
  
  invoice_number := 'SUP' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_supplier_payment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  payment_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.supplier_payments
  WHERE payment_number ~ '^SPY[0-9]+$';
  
  payment_number := 'SPY' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN payment_number;
END;
$$;

-- إنشاء trigger لتحديث مجاميع فواتير الموردين
CREATE OR REPLACE FUNCTION public.update_supplier_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.supplier_invoices 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM public.supplier_invoice_items 
      WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);
  
  -- تحديث المبلغ الإجمالي
  UPDATE public.supplier_invoices 
  SET 
    total_amount = subtotal + tax_amount - discount_amount,
    outstanding_amount = (subtotal + tax_amount - discount_amount) - paid_amount,
    updated_at = now()
  WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء trigger لتحديث مبالغ المدفوعات
CREATE OR REPLACE FUNCTION public.update_supplier_invoice_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.supplier_invoices 
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.supplier_payments 
      WHERE supplier_invoice_id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id)
      AND status = 'completed'
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);
  
  -- تحديث المبلغ المتبقي والحالة
  UPDATE public.supplier_invoices 
  SET 
    outstanding_amount = total_amount - paid_amount,
    status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partially_paid'
      WHEN due_date < CURRENT_DATE AND paid_amount = 0 THEN 'overdue'
      ELSE status
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء trigger لتحديث الرصيد الجاري للموردين
CREATE OR REPLACE FUNCTION public.update_supplier_running_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  -- حساب الرصيد الجديد
  SELECT 
    COALESCE(SUM(debit_amount - credit_amount), 0) + NEW.debit_amount - NEW.credit_amount
  INTO new_balance
  FROM public.supplier_subsidiary_ledger
  WHERE supplier_id = NEW.supplier_id
  AND transaction_date <= NEW.transaction_date
  AND id < NEW.id;
  
  NEW.running_balance := new_balance;
  
  -- تحديث رصيد المورد
  UPDATE public.suppliers
  SET 
    current_balance = (
      SELECT COALESCE(SUM(debit_amount - credit_amount), 0)
      FROM public.supplier_subsidiary_ledger
      WHERE supplier_id = NEW.supplier_id
    )
  WHERE id = NEW.supplier_id;
  
  RETURN NEW;
END;
$$;

-- إنشاء triggers
CREATE TRIGGER update_supplier_invoice_totals_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_invoice_totals();

CREATE TRIGGER update_supplier_invoice_payments_on_payment_change
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_invoice_payments();

CREATE TRIGGER update_supplier_running_balance_trigger
  BEFORE INSERT ON public.supplier_subsidiary_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_running_balance();

-- إنشاء triggers للتحديث التلقائي للـ updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_invoices_updated_at
  BEFORE UPDATE ON public.supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_payments_updated_at
  BEFORE UPDATE ON public.supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_suppliers_tenant_id ON public.suppliers(tenant_id);
CREATE INDEX idx_suppliers_code ON public.suppliers(supplier_code);
CREATE INDEX idx_suppliers_active ON public.suppliers(is_active);

CREATE INDEX idx_supplier_invoices_tenant_id ON public.supplier_invoices(tenant_id);
CREATE INDEX idx_supplier_invoices_supplier_id ON public.supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_status ON public.supplier_invoices(status);
CREATE INDEX idx_supplier_invoices_due_date ON public.supplier_invoices(due_date);

CREATE INDEX idx_supplier_payments_tenant_id ON public.supplier_payments(tenant_id);
CREATE INDEX idx_supplier_payments_supplier_id ON public.supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_invoice_id ON public.supplier_payments(supplier_invoice_id);

CREATE INDEX idx_supplier_ledger_tenant_id ON public.supplier_subsidiary_ledger(tenant_id);
CREATE INDEX idx_supplier_ledger_supplier_id ON public.supplier_subsidiary_ledger(supplier_id);
CREATE INDEX idx_supplier_ledger_date ON public.supplier_subsidiary_ledger(transaction_date);
