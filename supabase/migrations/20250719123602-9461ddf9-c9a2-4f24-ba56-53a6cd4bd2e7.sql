
-- إنشاء جدول سجلات الصيانة للمركبات
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC(15,3) DEFAULT 0,
  mileage_at_service INTEGER,
  scheduled_date DATE,
  completed_date DATE,
  next_service_date DATE,
  service_provider TEXT,
  invoice_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- تمكين Row Level Security
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة الصيانة" 
ON public.vehicle_maintenance 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء جدول أسباب الاستبعاد للأصول
CREATE TABLE IF NOT EXISTS public.asset_disposal_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reason_code TEXT NOT NULL UNIQUE,
  reason_name TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج أسباب الاستبعاد الافتراضية
INSERT INTO public.asset_disposal_reasons (reason_code, reason_name, requires_approval) VALUES
('DAMAGED', 'تلف الأصل', true),
('OBSOLETE', 'أصبح قديماً', true),
('SOLD', 'تم بيعه', true),
('DONATED', 'تم التبرع به', true),
('THEFT', 'سرقة', true),
('ACCIDENT', 'حادث', true),
('END_LIFE', 'انتهاء العمر الافتراضي', false)
ON CONFLICT (reason_code) DO NOTHING;

-- إنشاء جدول تتبع مواقع الأصول
CREATE TABLE IF NOT EXISTS public.asset_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_code TEXT NOT NULL UNIQUE,
  location_name TEXT NOT NULL,
  address TEXT,
  responsible_person TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء سياسات RLS للمواقع
ALTER TABLE public.asset_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة المواقع" 
ON public.asset_locations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء جدول تاريخ حركة الأصول
CREATE TABLE IF NOT EXISTS public.asset_movement_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.fixed_assets(id),
  from_location_id UUID REFERENCES public.asset_locations(id),
  to_location_id UUID REFERENCES public.asset_locations(id),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  movement_reason TEXT,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- تمكين RLS لتاريخ الحركة
ALTER TABLE public.asset_movement_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المحاسبون والمديرون يمكنهم إدارة تاريخ الحركة" 
ON public.asset_movement_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إنشاء جدول فئات الصيانة
CREATE TABLE IF NOT EXISTS public.maintenance_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  default_frequency_months INTEGER DEFAULT 12,
  is_critical BOOLEAN DEFAULT false,
  estimated_cost NUMERIC(15,3) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج فئات الصيانة الافتراضية
INSERT INTO public.maintenance_categories (category_name, default_frequency_months, is_critical, description) VALUES
('صيانة دورية', 6, false, 'صيانة دورية عامة'),
('تغيير زيت', 3, false, 'تغيير زيت المحرك والفلاتر'),
('فحص فني', 12, true, 'فحص فني شامل للمركبة'),
('صيانة الإطارات', 6, false, 'فحص وتدوير الإطارات'),
('صيانة الفرامل', 12, true, 'فحص وصيانة نظام الفرامل'),
('صيانة التكييف', 6, false, 'صيانة نظام التكييف'),
('إصلاح طارئ', 0, true, 'إصلاحات طارئة غير مجدولة')
ON CONFLICT (category_name) DO NOTHING;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle_id ON public.vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_status ON public.vehicle_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_scheduled_date ON public.vehicle_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_asset_movement_history_asset_id ON public.asset_movement_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_movement_history_movement_date ON public.asset_movement_history(movement_date);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق triggers
DROP TRIGGER IF EXISTS update_vehicle_maintenance_updated_at ON public.vehicle_maintenance;
CREATE TRIGGER update_vehicle_maintenance_updated_at
  BEFORE UPDATE ON public.vehicle_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_asset_locations_updated_at ON public.asset_locations;
CREATE TRIGGER update_asset_locations_updated_at
  BEFORE UPDATE ON public.asset_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
