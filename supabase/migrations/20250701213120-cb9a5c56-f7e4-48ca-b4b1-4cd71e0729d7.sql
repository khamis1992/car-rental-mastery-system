-- إنشاء جدول أنواع المخالفات المرورية
CREATE TABLE public.violation_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_code TEXT NOT NULL UNIQUE,
  violation_name_ar TEXT NOT NULL,
  violation_name_en TEXT,
  description TEXT,
  base_fine_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'general', -- 'speed', 'parking', 'traffic_light', 'general'
  severity_level TEXT DEFAULT 'minor', -- 'minor', 'moderate', 'major', 'severe'
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول المخالفات المرورية
CREATE TABLE public.traffic_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_number TEXT NOT NULL UNIQUE,
  
  -- معلومات المخالفة
  violation_type_id UUID NOT NULL REFERENCES public.violation_types(id),
  violation_date DATE NOT NULL,
  violation_time TIME,
  location TEXT,
  description TEXT,
  
  -- معلومات المركبة والعقد
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  contract_id UUID REFERENCES public.contracts(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  
  -- معلومات المخالفة من الجهات الرسمية
  official_violation_number TEXT,
  issuing_authority TEXT,
  officer_name TEXT,
  
  -- التفاصيل المالية
  fine_amount DECIMAL(8,2) NOT NULL,
  processing_fee DECIMAL(8,2) DEFAULT 0,
  total_amount DECIMAL(8,2) NOT NULL,
  
  -- تحديد المسؤولية
  liability_determination TEXT DEFAULT 'pending', -- 'pending', 'customer', 'company', 'shared'
  liability_percentage DECIMAL(5,2) DEFAULT 100.00, -- نسبة مسؤولية العميل
  liability_reason TEXT,
  liability_determined_by UUID REFERENCES auth.users(id),
  liability_determined_at TIMESTAMP WITH TIME ZONE,
  
  -- الحالة والدفع
  status TEXT DEFAULT 'pending', -- 'pending', 'notified', 'paid', 'disputed', 'closed'
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'paid', 'partial'
  payment_due_date DATE,
  paid_amount DECIMAL(8,2) DEFAULT 0,
  
  -- معلومات إضافية
  evidence_photos TEXT[], -- URLs للصور
  documents TEXT[], -- URLs للوثائق
  notes TEXT,
  
  -- تواريخ مهمة
  customer_notified_at TIMESTAMP WITH TIME ZONE,
  follow_up_date DATE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول مدفوعات المخالفات
CREATE TABLE public.violation_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number TEXT NOT NULL UNIQUE,
  violation_id UUID NOT NULL REFERENCES public.traffic_violations(id) ON DELETE CASCADE,
  
  -- معلومات الدفع
  amount DECIMAL(8,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'card', 'bank_transfer', 'check'
  
  -- تفاصيل الدفع
  transaction_reference TEXT,
  bank_name TEXT,
  check_number TEXT,
  receipt_url TEXT,
  
  -- الحالة
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
  notes TEXT,
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تاريخ المخالفات
CREATE TABLE public.violation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_id UUID NOT NULL REFERENCES public.traffic_violations(id) ON DELETE CASCADE,
  
  -- معلومات الحدث
  action_type TEXT NOT NULL, -- 'created', 'notified', 'liability_determined', 'payment_received', 'status_changed'
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.violation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_history ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لأنواع المخالفات
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية أنواع المخالفات"
ON public.violation_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة أنواع المخالفات"
ON public.violation_types
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- سياسات RLS للمخالفات المرورية
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية المخالفات"
ON public.traffic_violations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة المخالفات"
ON public.traffic_violations
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- سياسات مماثلة للمدفوعات والتاريخ
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية مدفوعات المخالفات"
ON public.violation_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة مدفوعات المخالفات"
ON public.violation_payments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'accountant') OR public.has_role(auth.uid(), 'receptionist'));

CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية تاريخ المخالفات"
ON public.violation_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "الموظفون يمكنهم إضافة تاريخ المخالفات"
ON public.violation_history FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'receptionist'));

-- دالة لتوليد رقم المخالفة
CREATE OR REPLACE FUNCTION public.generate_violation_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  violation_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(violation_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.traffic_violations
  WHERE violation_number ~ '^VIO[0-9]+$';
  
  violation_number := 'VIO' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN violation_number;
END;
$$;

-- دالة لتوليد رقم دفعة المخالفة
CREATE OR REPLACE FUNCTION public.generate_violation_payment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  payment_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.violation_payments
  WHERE payment_number ~ '^VPY[0-9]+$';
  
  payment_number := 'VPY' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN payment_number;
END;
$$;

-- دالة لتحديث حالة الدفع تلقائياً
CREATE OR REPLACE FUNCTION public.update_violation_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- تحديث المبلغ المدفوع في المخالفة
  UPDATE public.traffic_violations 
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.violation_payments 
      WHERE violation_id = COALESCE(NEW.violation_id, OLD.violation_id)
      AND status = 'completed'
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.violation_id, OLD.violation_id);
  
  -- تحديث حالة الدفع
  UPDATE public.traffic_violations 
  SET 
    payment_status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    status = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      ELSE status
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.violation_id, OLD.violation_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- دالة لإضافة سجل في التاريخ
CREATE OR REPLACE FUNCTION public.add_violation_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.violation_history (violation_id, action_type, description, created_by)
    VALUES (NEW.id, 'created', 'تم إنشاء المخالفة', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- إضافة سجل عند تغيير الحالة
    IF OLD.status != NEW.status THEN
      INSERT INTO public.violation_history (violation_id, action_type, description, old_value, new_value, created_by)
      VALUES (NEW.id, 'status_changed', 'تم تغيير حالة المخالفة', OLD.status, NEW.status, auth.uid());
    END IF;
    
    -- إضافة سجل عند تحديد المسؤولية
    IF OLD.liability_determination != NEW.liability_determination THEN
      INSERT INTO public.violation_history (violation_id, action_type, description, old_value, new_value, created_by)
      VALUES (NEW.id, 'liability_determined', 'تم تحديد مسؤولية المخالفة', OLD.liability_determination, NEW.liability_determination, auth.uid());
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- إنشاء triggers
CREATE TRIGGER violation_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.violation_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_violation_payment_status();

CREATE TRIGGER violation_history_trigger
  AFTER INSERT OR UPDATE ON public.traffic_violations
  FOR EACH ROW EXECUTE FUNCTION public.add_violation_history();

CREATE TRIGGER update_violation_types_updated_at
  BEFORE UPDATE ON public.violation_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_traffic_violations_updated_at
  BEFORE UPDATE ON public.traffic_violations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_violation_payments_updated_at
  BEFORE UPDATE ON public.violation_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة indexes للأداء
CREATE INDEX idx_traffic_violations_vehicle_id ON public.traffic_violations(vehicle_id);
CREATE INDEX idx_traffic_violations_contract_id ON public.traffic_violations(contract_id);
CREATE INDEX idx_traffic_violations_customer_id ON public.traffic_violations(customer_id);
CREATE INDEX idx_traffic_violations_status ON public.traffic_violations(status);
CREATE INDEX idx_traffic_violations_violation_date ON public.traffic_violations(violation_date);
CREATE INDEX idx_violation_payments_violation_id ON public.violation_payments(violation_id);
CREATE INDEX idx_violation_history_violation_id ON public.violation_history(violation_id);

-- إدراج بعض أنواع المخالفات الأساسية
INSERT INTO public.violation_types (violation_code, violation_name_ar, violation_name_en, base_fine_amount, points, category, severity_level) VALUES
('SP001', 'تجاوز السرعة المحددة', 'Exceeding Speed Limit', 50.000, 2, 'speed', 'minor'),
('SP002', 'تجاوز السرعة بشكل مفرط', 'Excessive Speeding', 150.000, 4, 'speed', 'major'),
('PK001', 'الوقوف في مكان ممنوع', 'Illegal Parking', 25.000, 1, 'parking', 'minor'),
('PK002', 'الوقوف في موقف المعاقين', 'Parking in Disabled Spot', 100.000, 3, 'parking', 'moderate'),
('TL001', 'تجاوز الإشارة الحمراء', 'Running Red Light', 100.000, 4, 'traffic_light', 'major'),
('GN001', 'عدم ربط حزام الأمان', 'Not Wearing Seatbelt', 30.000, 1, 'general', 'minor'),
('GN002', 'استخدام الهاتف أثناء القيادة', 'Using Phone While Driving', 75.000, 2, 'general', 'moderate'),
('GN003', 'القيادة تحت تأثير الكحول', 'Driving Under Influence', 500.000, 8, 'general', 'severe');