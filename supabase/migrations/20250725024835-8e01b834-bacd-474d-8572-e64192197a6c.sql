-- إضافة الأعمدة المفقودة إلى جدول contracts
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS activated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- إضافة الأعمدة المفقودة إلى جدول payments
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_reference text;

-- إضافة الأعمدة المفقودة إلى جدول vehicles
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS available_from timestamp with time zone,
ADD COLUMN IF NOT EXISTS rented_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS maintenance_start timestamp with time zone;