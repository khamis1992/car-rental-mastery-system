-- إنشاء جدول المركبات إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  license_plate TEXT NOT NULL UNIQUE,
  vin_number TEXT,
  daily_rate NUMERIC NOT NULL,
  weekly_rate NUMERIC,
  monthly_rate NUMERIC,
  engine_size TEXT,
  fuel_type TEXT NOT NULL DEFAULT 'بنزين',
  transmission TEXT NOT NULL DEFAULT 'أوتوماتيك',
  mileage INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'out_of_service')),
  insurance_company TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  registration_expiry DATE,
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- تمكين Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY IF NOT EXISTS "المستخدمون المصادق عليهم يمكنهم رؤية المركبات" 
ON public.vehicles 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "الموظفون يمكنهم إدارة المركبات" 
ON public.vehicles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'receptionist'::user_role));

-- إنشاء دالة توليد رقم المركبة إذا لم تكن موجودة
CREATE OR REPLACE FUNCTION public.generate_vehicle_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
  vehicle_number TEXT;
BEGIN
  -- الحصول على أعلى رقم مركبة موجود حالياً
  SELECT COALESCE(MAX(CAST(SUBSTRING(v.vehicle_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.vehicles v
  WHERE v.vehicle_number ~ '^VEH[0-9]+$';
  
  -- تكوين رقم المركبة الجديد
  vehicle_number := 'VEH' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN vehicle_number;
END;
$function$;

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();