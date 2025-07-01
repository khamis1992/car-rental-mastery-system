-- إنشاء enum لحالة العقد
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending', 'active', 'completed', 'cancelled');

-- إنشاء enum لنوع العقد
CREATE TYPE public.contract_type AS ENUM ('daily', 'weekly', 'monthly', 'custom');

-- إنشاء جدول عروض الأسعار
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  
  -- معلومات العميل
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  
  -- معلومات المركبة
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  
  -- تفاصيل الإيجار
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rental_days INTEGER NOT NULL,
  
  -- الأسعار
  daily_rate DECIMAL(8,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(8,2) DEFAULT 0,
  tax_amount DECIMAL(8,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  
  -- الشروط والأحكام
  terms_and_conditions TEXT,
  special_conditions TEXT,
  
  -- الحالة
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
  valid_until DATE,
  
  -- رجل المبيعات
  sales_person_id UUID REFERENCES auth.users(id),
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول العقود
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL UNIQUE,
  quotation_id UUID REFERENCES public.quotations(id),
  
  -- معلومات العميل
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  
  -- معلومات المركبة
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  
  -- تفاصيل الإيجار
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  rental_days INTEGER NOT NULL,
  contract_type contract_type NOT NULL,
  
  -- الأسعار والمدفوعات
  daily_rate DECIMAL(8,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(8,2) DEFAULT 0,
  tax_amount DECIMAL(8,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  
  -- التأمين والضمانات
  security_deposit DECIMAL(8,2) DEFAULT 0,
  insurance_amount DECIMAL(8,2) DEFAULT 0,
  
  -- الحالة
  status contract_status NOT NULL DEFAULT 'draft',
  
  -- التوقيع الإلكتروني
  customer_signature TEXT, -- base64 encoded signature
  customer_signed_at TIMESTAMP WITH TIME ZONE,
  company_signature TEXT,
  company_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- تفاصيل التسليم والاستلام
  pickup_location TEXT,
  return_location TEXT,
  pickup_mileage INTEGER,
  return_mileage INTEGER,
  fuel_level_pickup TEXT,
  fuel_level_return TEXT,
  
  -- الشروط والملاحظات
  terms_and_conditions TEXT,
  special_conditions TEXT,
  notes TEXT,
  
  -- رجل المبيعات المسؤول
  sales_person_id UUID REFERENCES auth.users(id),
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تمديد العقود
CREATE TABLE public.contract_extensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- التمديد
  original_end_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  extension_days INTEGER NOT NULL,
  
  -- التكلفة الإضافية
  daily_rate DECIMAL(8,2) NOT NULL,
  extension_amount DECIMAL(8,2) NOT NULL,
  
  -- الموافقة
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول المخالفات والحوادث
CREATE TABLE public.contract_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- نوع الحادث
  incident_type TEXT NOT NULL, -- 'violation', 'accident', 'damage', 'theft'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- التفاصيل المالية
  cost DECIMAL(8,2),
  customer_liable BOOLEAN DEFAULT true,
  insurance_covered BOOLEAN DEFAULT false,
  
  -- التواريخ والمكان
  incident_date DATE NOT NULL,
  location TEXT,
  
  -- المرفقات والوثائق
  police_report_number TEXT,
  insurance_claim_number TEXT,
  photos TEXT[], -- URLs to uploaded photos
  
  -- الحالة
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'disputed'
  resolution_notes TEXT,
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_incidents ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للعروض
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية العروض"
ON public.quotations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة العروض"
ON public.quotations
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- سياسات RLS للعقود
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية العقود"
ON public.contracts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة العقود"
ON public.contracts
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- سياسات مماثلة للجداول الأخرى
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية التمديدات"
ON public.contract_extensions FOR SELECT TO authenticated USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة التمديدات"
ON public.contract_extensions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية الحوادث"
ON public.contract_incidents FOR SELECT TO authenticated USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة الحوادث"
ON public.contract_incidents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'receptionist'));

-- دوال لتوليد أرقام تلقائية
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  quotation_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.quotations
  WHERE quotation_number ~ '^QUO[0-9]+$';
  
  quotation_number := 'QUO' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN quotation_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  contract_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.contracts
  WHERE contract_number ~ '^CON[0-9]+$';
  
  contract_number := 'CON' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN contract_number;
END;
$$;

-- دالة لتحديث إحصائيات العميل عند إنشاء عقد
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers 
    SET 
      total_contracts = total_contracts + 1,
      total_revenue = total_revenue + NEW.final_amount,
      last_contract_date = NEW.created_at
    WHERE id = NEW.customer_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- تحديث حالة المركبة عند تغيير حالة العقد
    IF NEW.status = 'active' THEN
      UPDATE public.vehicles SET status = 'rented' WHERE id = NEW.vehicle_id;
    ELSIF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
      UPDATE public.vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- إنشاء triggers
CREATE TRIGGER contract_customer_stats_trigger
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_incidents_updated_at
  BEFORE UPDATE ON public.contract_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة indexes للأداء
CREATE INDEX idx_quotations_customer_id ON public.quotations(customer_id);
CREATE INDEX idx_quotations_vehicle_id ON public.quotations(vehicle_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_contracts_customer_id ON public.contracts(customer_id);
CREATE INDEX idx_contracts_vehicle_id ON public.contracts(vehicle_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_dates ON public.contracts(start_date, end_date);
CREATE INDEX idx_contract_extensions_contract_id ON public.contract_extensions(contract_id);
CREATE INDEX idx_contract_incidents_contract_id ON public.contract_incidents(contract_id);