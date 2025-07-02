-- Add new fields to vehicles table for enhanced functionality

-- Add VIN number and body type
ALTER TABLE public.vehicles 
ADD COLUMN vin_number TEXT,
ADD COLUMN body_type TEXT;

-- Add advanced pricing fields
ALTER TABLE public.vehicles 
ADD COLUMN min_daily_rate NUMERIC,
ADD COLUMN max_daily_rate NUMERIC,
ADD COLUMN mileage_limit NUMERIC,
ADD COLUMN excess_mileage_cost NUMERIC;

-- Add previous accumulated depreciation field
ALTER TABLE public.vehicles 
ADD COLUMN previous_accumulated_depreciation NUMERIC DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.vin_number IS 'رقم الهيكل للمركبة';
COMMENT ON COLUMN public.vehicles.body_type IS 'نوع هيكل المركبة (4 أبواب، 2 أبواب، إلخ)';
COMMENT ON COLUMN public.vehicles.min_daily_rate IS 'الحد الأدنى للسعر اليومي';
COMMENT ON COLUMN public.vehicles.max_daily_rate IS 'الحد الأقصى للسعر اليومي';
COMMENT ON COLUMN public.vehicles.mileage_limit IS 'حد الكيلومترات اليومي المسموح';
COMMENT ON COLUMN public.vehicles.excess_mileage_cost IS 'تكلفة الكيلومتر الإضافي';
COMMENT ON COLUMN public.vehicles.previous_accumulated_depreciation IS 'الاستهلاك المتراكم السابق للأصل';