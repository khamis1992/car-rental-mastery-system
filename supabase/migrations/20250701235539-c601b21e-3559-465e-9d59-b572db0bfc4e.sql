-- إدراج إعدادات الحضور الافتراضية إذا لم تكن موجودة
INSERT INTO public.attendance_settings (
  allow_manual_override,
  require_location,
  max_distance_meters,
  grace_period_minutes
)
SELECT 
  true,    -- السماح بالاستثناء اليدوي
  true,    -- يتطلب الموقع
  100,     -- المسافة المسموحة 100 متر
  15       -- فترة سماح 15 دقيقة
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_settings
);

-- إدراج موقع مكتب افتراضي إذا لم يكن موجود
INSERT INTO public.office_locations (
  name,
  address,
  latitude,
  longitude,
  radius,
  is_active
)
SELECT 
  'المكتب الرئيسي',
  'الكويت العاصمة',
  29.3375,  -- خط عرض الكويت
  47.9744,  -- خط طول الكويت
  100,      -- نطاق 100 متر
  true      -- نشط
WHERE NOT EXISTS (
  SELECT 1 FROM public.office_locations WHERE is_active = true
);