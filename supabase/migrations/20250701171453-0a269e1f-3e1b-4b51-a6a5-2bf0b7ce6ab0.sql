-- إنشاء enum لحالة المركبة
CREATE TYPE public.vehicle_status AS ENUM ('available', 'rented', 'maintenance', 'out_of_service');

-- إنشاء enum لنوع المركبة
CREATE TYPE public.vehicle_type AS ENUM ('sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'van', 'luxury');

-- إنشاء جدول المركبات
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL UNIQUE,
  
  -- معلومات المركبة الأساسية
  make TEXT NOT NULL, -- الصانع (تويوتا، نيسان، الخ)
  model TEXT NOT NULL, -- الموديل (كامري، التيما، الخ)
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  
  -- معلومات التسجيل
  license_plate TEXT NOT NULL UNIQUE,
  vin_number TEXT UNIQUE, -- رقم الشاسيه
  registration_expiry DATE,
  
  -- معلومات التأمين
  insurance_company TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  
  -- المعلومات التقنية
  engine_size TEXT,
  fuel_type TEXT DEFAULT 'بنزين',
  transmission TEXT DEFAULT 'أوتوماتيك',
  mileage INTEGER DEFAULT 0,
  
  -- الحالة والتوفر
  status vehicle_status NOT NULL DEFAULT 'available',
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  
  -- معلومات مالية
  daily_rate DECIMAL(8,2) NOT NULL,
  weekly_rate DECIMAL(8,2),
  monthly_rate DECIMAL(8,2),
  
  -- ملاحظات
  notes TEXT,
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول صيانة المركبات
CREATE TABLE public.vehicle_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  
  -- تفاصيل الصيانة
  maintenance_type TEXT NOT NULL, -- 'routine', 'repair', 'inspection', etc.
  description TEXT NOT NULL,
  cost DECIMAL(8,2),
  mileage_at_service INTEGER,
  
  -- التواريخ
  scheduled_date DATE,
  completed_date DATE,
  next_service_date DATE,
  
  -- مقدم الخدمة
  service_provider TEXT,
  invoice_number TEXT,
  
  -- الحالة
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- معلومات النظام
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمركبات
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية المركبات"
ON public.vehicles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "المديرون والفنيون يمكنهم إدارة المركبات"
ON public.vehicles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'technician')
);

-- سياسات RLS للصيانة
CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية الصيانة"
ON public.vehicle_maintenance
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "المديرون والفنيون يمكنهم إدارة الصيانة"
ON public.vehicle_maintenance
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'technician')
);

-- دالة لتوليد رقم المركبة التلقائي
CREATE OR REPLACE FUNCTION public.generate_vehicle_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  vehicle_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(vehicle_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.vehicles
  WHERE vehicle_number ~ '^VEH[0-9]+$';
  
  vehicle_number := 'VEH' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN vehicle_number;
END;
$$;

-- trigger لتحديث updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_maintenance_updated_at
  BEFORE UPDATE ON public.vehicle_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة indexes للأداء
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_license_plate ON public.vehicles(license_plate);
CREATE INDEX idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX idx_vehicle_maintenance_vehicle_id ON public.vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_status ON public.vehicle_maintenance(status);