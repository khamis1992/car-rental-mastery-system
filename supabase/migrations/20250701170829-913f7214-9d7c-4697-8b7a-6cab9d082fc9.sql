-- إنشاء enum لنوع العميل
CREATE TYPE public.customer_type AS ENUM ('individual', 'company');

-- إنشاء enum لحالة العميل
CREATE TYPE public.customer_status AS ENUM ('active', 'inactive', 'blocked');

-- إنشاء جدول العملاء
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_number TEXT NOT NULL UNIQUE,
  customer_type customer_type NOT NULL DEFAULT 'individual',
  
  -- بيانات أساسية
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  national_id TEXT, -- رقم الهوية أو السجل التجاري
  
  -- بيانات العنوان
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'المملكة العربية السعودية',
  
  -- بيانات إضافية للشركات
  company_contact_person TEXT, -- الشخص المسؤول
  company_registration_number TEXT, -- رقم السجل التجاري
  tax_number TEXT, -- الرقم الضريبي
  
  -- تقييم العميل
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  
  -- حالة العميل
  status customer_status NOT NULL DEFAULT 'active',
  
  -- معلومات إضافية
  total_contracts INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  last_contract_date TIMESTAMP WITH TIME ZONE,
  
  -- تواريخ النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تاريخ العملاء
CREATE TABLE public.customer_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'created', 'updated', 'contract_signed', 'payment_received', etc.
  description TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تقييمات العملاء
CREATE TABLE public.customer_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- معايير التقييم
  payment_reliability INTEGER DEFAULT 5 CHECK (payment_reliability >= 1 AND payment_reliability <= 5),
  vehicle_care INTEGER DEFAULT 5 CHECK (vehicle_care >= 1 AND vehicle_care <= 5),
  communication INTEGER DEFAULT 5 CHECK (communication >= 1 AND communication <= 5),
  overall_rating INTEGER DEFAULT 5 CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  -- تفاصيل التقييم
  comments TEXT,
  contract_id UUID, -- سنربطه بجدول العقود لاحقاً
  
  -- معلومات النظام
  evaluated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_evaluations ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للعملاء
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية العملاء"
ON public.customers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "المديرون والموظفون يمكنهم إضافة عملاء"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'receptionist')
);

CREATE POLICY "المديرون والموظفون يمكنهم تحديث العملاء"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- سياسات تاريخ العملاء
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية تاريخ العملاء"
ON public.customer_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "المستخدمون المصادق عليهم يمكنهم إضافة تاريخ العملاء"
ON public.customer_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- سياسات تقييمات العملاء
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية التقييمات"
ON public.customer_evaluations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "المستخدمون المصادق عليهم يمكنهم إضافة التقييمات"
ON public.customer_evaluations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- دالة لتوليد رقم العميل التلقائي
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  customer_number TEXT;
BEGIN
  -- الحصول على أعلى رقم عميل
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.customers
  WHERE customer_number ~ '^CUS[0-9]+$';
  
  -- تكوين رقم العميل الجديد
  customer_number := 'CUS' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN customer_number;
END;
$$;

-- دالة لإضافة تاريخ العميل تلقائياً
CREATE OR REPLACE FUNCTION public.add_customer_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.customer_history (customer_id, action_type, description, created_by)
    VALUES (NEW.id, 'created', 'تم إنشاء العميل', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.customer_history (customer_id, action_type, description, created_by)
    VALUES (NEW.id, 'updated', 'تم تحديث بيانات العميل', auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- إنشاء trigger لإضافة التاريخ
CREATE TRIGGER customer_history_trigger
  AFTER INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.add_customer_history();

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة indexes للأداء
CREATE INDEX idx_customers_customer_number ON public.customers(customer_number);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_type ON public.customers(customer_type);
CREATE INDEX idx_customer_history_customer_id ON public.customer_history(customer_id);
CREATE INDEX idx_customer_evaluations_customer_id ON public.customer_evaluations(customer_id);