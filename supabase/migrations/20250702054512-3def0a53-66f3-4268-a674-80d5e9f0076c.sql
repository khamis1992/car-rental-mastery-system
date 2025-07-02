-- إعادة إنشاء دالة توليد رقم المركبة مع تحديد اسم العمود بوضوح
DROP FUNCTION IF EXISTS public.generate_vehicle_number();

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