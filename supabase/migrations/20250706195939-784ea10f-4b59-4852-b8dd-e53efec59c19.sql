-- إنشاء جدول التأمينات المتعددة للمركبات
CREATE TABLE public.vehicle_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('comprehensive', 'third_party', 'basic', 'collision', 'theft', 'fire', 'natural_disasters')),
  insurance_company TEXT,
  policy_number TEXT,
  start_date DATE,
  expiry_date DATE,
  premium_amount NUMERIC(10,3) DEFAULT 0,
  coverage_amount NUMERIC(12,3),
  deductible_amount NUMERIC(10,3) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إنشاء الفهارس
CREATE INDEX idx_vehicle_insurance_vehicle_id ON public.vehicle_insurance(vehicle_id);
CREATE INDEX idx_vehicle_insurance_type ON public.vehicle_insurance(insurance_type);
CREATE INDEX idx_vehicle_insurance_expiry ON public.vehicle_insurance(expiry_date);
CREATE INDEX idx_vehicle_insurance_active ON public.vehicle_insurance(is_active);

-- إنشاء دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_vehicle_insurance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفز
CREATE TRIGGER update_vehicle_insurance_updated_at
  BEFORE UPDATE ON public.vehicle_insurance
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_insurance_updated_at();

-- إنشاء سياسات RLS
ALTER TABLE public.vehicle_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية التأمينات"
  ON public.vehicle_insurance FOR SELECT
  USING (true);

CREATE POLICY "الموظفون يمكنهم إدارة التأمينات"
  ON public.vehicle_insurance FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role) OR 
    has_role(auth.uid(), 'receptionist'::user_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'manager'::user_role) OR 
    has_role(auth.uid(), 'accountant'::user_role) OR 
    has_role(auth.uid(), 'receptionist'::user_role)
  );

-- ترحيل البيانات الموجودة من جدول المركبات
INSERT INTO public.vehicle_insurance (
  vehicle_id, 
  insurance_type, 
  insurance_company, 
  policy_number, 
  expiry_date,
  is_active,
  created_at,
  created_by
)
SELECT 
  id as vehicle_id,
  COALESCE(insurance_type, 'comprehensive') as insurance_type,
  insurance_company,
  insurance_policy_number as policy_number,
  insurance_expiry::date as expiry_date,
  true as is_active,
  created_at,
  created_by
FROM public.vehicles 
WHERE (
  insurance_type IS NOT NULL OR 
  insurance_company IS NOT NULL OR 
  insurance_policy_number IS NOT NULL OR 
  insurance_expiry IS NOT NULL
);