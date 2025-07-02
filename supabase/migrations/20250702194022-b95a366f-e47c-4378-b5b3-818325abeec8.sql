-- إضافة الحقول الجديدة لجدول المركبات
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS insurance_type TEXT DEFAULT 'comprehensive' CHECK (insurance_type IN ('comprehensive', 'third_party'));
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'company' CHECK (owner_type IN ('customer', 'company'));
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS useful_life_years INTEGER;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS residual_value NUMERIC DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS depreciation_method TEXT DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance'));
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.fixed_assets(id);

-- إنشاء دالة لإنشاء أصل ثابت من المركبة
CREATE OR REPLACE FUNCTION public.create_vehicle_asset(
  vehicle_id UUID,
  vehicle_data JSON
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  asset_id UUID;
  asset_code TEXT;
  depreciation_expense_account UUID;
  accumulated_depreciation_account UUID;
BEGIN
  -- الحصول على حسابات الاستهلاك
  SELECT id INTO depreciation_expense_account 
  FROM public.chart_of_accounts 
  WHERE account_code = '5120' -- مصاريف استهلاك المركبات
  LIMIT 1;
  
  SELECT id INTO accumulated_depreciation_account 
  FROM public.chart_of_accounts 
  WHERE account_code = '1320' -- مجمع استهلاك المركبات  
  LIMIT 1;
  
  -- إنشاء كود الأصل
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
    'أصل ثابت تم إنشاؤه من مركبة رقم: ' || (vehicle_data->>'vehicle_number'),
    'active',
    auth.uid()
  ) RETURNING id INTO asset_id;
  
  -- ربط المركبة بالأصل
  UPDATE public.vehicles 
  SET asset_id = asset_id 
  WHERE id = vehicle_id;
  
  RETURN asset_id;
END;
$$;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_type ON public.vehicles(owner_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_insurance_type ON public.vehicles(insurance_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_asset_id ON public.vehicles(asset_id);