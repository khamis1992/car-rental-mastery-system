-- إضافة جدول للتسلسل الهرمي لرموز الأصول
CREATE TABLE IF NOT EXISTS public.asset_code_hierarchy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  parent_code TEXT REFERENCES public.asset_code_hierarchy(code),
  level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إضافة فهرس للتحسين
CREATE INDEX IF NOT EXISTS idx_asset_code_hierarchy_parent ON public.asset_code_hierarchy(parent_code);
CREATE INDEX IF NOT EXISTS idx_asset_code_hierarchy_level ON public.asset_code_hierarchy(level);

-- إدراج البيانات الأساسية للتسلسل الهرمي
INSERT INTO public.asset_code_hierarchy (code, name_ar, name_en, parent_code, level) VALUES
('1', 'المركبات', 'Vehicles', NULL, 1),
('11', 'سيارات ركاب', 'Passenger Cars', '1', 2),
('12', 'مركبات تجارية', 'Commercial Vehicles', '1', 2),
('13', 'مركبات فاخرة', 'Luxury Vehicles', '1', 2),
('111', 'سيدان', 'Sedan', '11', 3),
('112', 'دفع رباعي', 'SUV', '11', 3),
('113', 'هاتشباك', 'Hatchback', '11', 3),
('121', 'فان', 'Van', '12', 3),
('122', 'بيك أب', 'Pickup', '12', 3),
('131', 'كوبيه فاخرة', 'Luxury Coupe', '13', 3),
('132', 'سيدان فاخرة', 'Luxury Sedan', '13', 3);

-- تحديث جدول المركبات لإضافة رمز الأصل الهرمي
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS asset_code_hierarchy TEXT REFERENCES public.asset_code_hierarchy(code),
ADD COLUMN IF NOT EXISTS asset_sequence_number INTEGER;

-- دالة لتوليد رمز الأصل الهرمي الكامل
CREATE OR REPLACE FUNCTION public.generate_hierarchical_asset_code(vehicle_type TEXT, make TEXT, model TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  hierarchy_code TEXT;
  sequence_num INTEGER;
  full_asset_code TEXT;
BEGIN
  -- تحديد الرمز الهرمي بناءً على نوع المركبة
  CASE vehicle_type
    WHEN 'sedan' THEN hierarchy_code := '111';
    WHEN 'suv' THEN hierarchy_code := '112';
    WHEN 'hatchback' THEN hierarchy_code := '113';
    WHEN 'van' THEN hierarchy_code := '121';
    WHEN 'pickup' THEN hierarchy_code := '122';
    WHEN 'coupe' THEN hierarchy_code := '131';
    WHEN 'luxury' THEN hierarchy_code := '132';
    ELSE hierarchy_code := '111'; -- افتراضي
  END CASE;
  
  -- الحصول على الرقم التسلسلي التالي لهذا النوع
  SELECT COALESCE(MAX(asset_sequence_number), 0) + 1
  INTO sequence_num
  FROM public.vehicles
  WHERE asset_code_hierarchy = hierarchy_code;
  
  -- تكوين الرمز الكامل
  full_asset_code := hierarchy_code || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN full_asset_code;
END;
$$;

-- تحديث دالة إنشاء أصل المركبة لتشمل الرمز الهرمي
CREATE OR REPLACE FUNCTION public.create_vehicle_asset_with_hierarchy(vehicle_id uuid, vehicle_data json)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  asset_id UUID;
  hierarchical_code TEXT;
  sequence_num INTEGER;
  asset_code TEXT;
  depreciation_expense_account UUID;
  accumulated_depreciation_account UUID;
BEGIN
  -- توليد الرمز الهرمي
  hierarchical_code := public.generate_hierarchical_asset_code(
    vehicle_data->>'vehicle_type',
    vehicle_data->>'make',
    vehicle_data->>'model'
  );
  
  -- استخراج الرقم التسلسلي من الرمز
  sequence_num := SPLIT_PART(hierarchical_code, '-', 2)::INTEGER;
  
  -- الحصول على حسابات الاستهلاك
  SELECT id INTO depreciation_expense_account 
  FROM public.chart_of_accounts 
  WHERE account_code = '5120'
  LIMIT 1;
  
  SELECT id INTO accumulated_depreciation_account 
  FROM public.chart_of_accounts 
  WHERE account_code = '1320'
  LIMIT 1;
  
  -- إنشاء كود الأصل التقليدي
  asset_code := public.generate_asset_code();
  
  -- إنشاء الأصل الثابت
  INSERT INTO public.fixed_assets (
    asset_code,
    asset_name,
    asset_category,
    purchase_date,
    purchase_cost,
    useful_life_years,
    residual_value,
    depreciation_method,
    depreciation_expense_account_id,
    accumulated_depreciation_account_id,
    book_value,
    description,
    status,
    created_by
  ) VALUES (
    asset_code,
    (vehicle_data->>'make') || ' ' || (vehicle_data->>'model') || ' - ' || (vehicle_data->>'license_plate'),
    'vehicle',
    (vehicle_data->>'purchase_date')::DATE,
    (vehicle_data->>'purchase_cost')::NUMERIC,
    (vehicle_data->>'useful_life_years')::INTEGER,
    COALESCE((vehicle_data->>'residual_value')::NUMERIC, 0),
    COALESCE(vehicle_data->>'depreciation_method', 'straight_line'),
    depreciation_expense_account,
    accumulated_depreciation_account,
    (vehicle_data->>'purchase_cost')::NUMERIC,
    'أصل ثابت - ' || hierarchical_code || ' - ' || (vehicle_data->>'vehicle_number'),
    'active',
    auth.uid()
  ) RETURNING id INTO asset_id;
  
  -- تحديث المركبة بالمعلومات الهرمية
  UPDATE public.vehicles 
  SET 
    asset_id = asset_id,
    asset_code_hierarchy = SPLIT_PART(hierarchical_code, '-', 1),
    asset_sequence_number = sequence_num
  WHERE id = vehicle_id;
  
  RETURN asset_id;
END;
$$;

-- إضافة RLS policies
ALTER TABLE public.asset_code_hierarchy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الموظفون يمكنهم رؤية التسلسل الهرمي للأصول"
ON public.asset_code_hierarchy FOR SELECT
USING (true);

CREATE POLICY "المديرون يمكنهم إدارة التسلسل الهرمي للأصول"
ON public.asset_code_hierarchy FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

-- إضافة trigger لتحديث updated_at
CREATE TRIGGER update_asset_code_hierarchy_updated_at
  BEFORE UPDATE ON public.asset_code_hierarchy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();