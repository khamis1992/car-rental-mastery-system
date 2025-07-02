-- إنشاء جدول المركبات إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'van', 'luxury')),
  license_plate TEXT NOT NULL UNIQUE,
  vin_number TEXT,
  daily_rate NUMERIC NOT NULL,
  weekly_rate NUMERIC,
  monthly_rate NUMERIC,
  engine_size TEXT,
  fuel_type TEXT DEFAULT 'بنزين',
  transmission TEXT DEFAULT 'أوتوماتيك',
  mileage INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'out_of_service')),
  insurance_company TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  registration_expiry DATE,
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الوصول
DO $$
BEGIN
  -- حذف السياسات الموجودة إن وجدت
  DROP POLICY IF EXISTS "المستخدمون المصادق عليهم يمكنهم رؤية المركبات" ON public.vehicles;
  DROP POLICY IF EXISTS "الموظفون يمكنهم إدارة المركبات" ON public.vehicles;
  
  -- إنشاء السياسات الجديدة
  CREATE POLICY "المستخدمون المصادق عليهم يمكنهم رؤية المركبات" 
  ON public.vehicles 
  FOR SELECT 
  USING (true);
  
  CREATE POLICY "الموظفون يمكنهم إدارة المركبات" 
  ON public.vehicles 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));
END $$;

-- إضافة trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();