-- Add remaining new fields to vehicles table for enhanced functionality

-- Check if columns exist and add only missing ones
DO $$ 
BEGIN
    -- Add body_type if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='vehicles' AND column_name='body_type') THEN
        ALTER TABLE public.vehicles ADD COLUMN body_type TEXT;
        COMMENT ON COLUMN public.vehicles.body_type IS 'نوع هيكل المركبة (4 أبواب، 2 أبواب، إلخ)';
    END IF;

    -- Add advanced pricing fields if not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='vehicles' AND column_name='min_daily_rate') THEN
        ALTER TABLE public.vehicles ADD COLUMN min_daily_rate NUMERIC;
        COMMENT ON COLUMN public.vehicles.min_daily_rate IS 'الحد الأدنى للسعر اليومي';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='vehicles' AND column_name='max_daily_rate') THEN
        ALTER TABLE public.vehicles ADD COLUMN max_daily_rate NUMERIC;
        COMMENT ON COLUMN public.vehicles.max_daily_rate IS 'الحد الأقصى للسعر اليومي';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='vehicles' AND column_name='mileage_limit') THEN
        ALTER TABLE public.vehicles ADD COLUMN mileage_limit NUMERIC;
        COMMENT ON COLUMN public.vehicles.mileage_limit IS 'حد الكيلومترات اليومي المسموح';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='vehicles' AND column_name='excess_mileage_cost') THEN
        ALTER TABLE public.vehicles ADD COLUMN excess_mileage_cost NUMERIC;
        COMMENT ON COLUMN public.vehicles.excess_mileage_cost IS 'تكلفة الكيلومتر الإضافي';
    END IF;

    -- Add previous accumulated depreciation field if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='vehicles' AND column_name='previous_accumulated_depreciation') THEN
        ALTER TABLE public.vehicles ADD COLUMN previous_accumulated_depreciation NUMERIC DEFAULT 0;
        COMMENT ON COLUMN public.vehicles.previous_accumulated_depreciation IS 'الاستهلاك المتراكم السابق للأصل';
    END IF;
END $$;