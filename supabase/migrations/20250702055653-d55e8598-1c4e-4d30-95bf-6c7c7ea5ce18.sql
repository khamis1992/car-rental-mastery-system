-- إعادة إنشاء دالة توليد رقم عرض السعر مع تحديد اسم العمود بوضوح
DROP FUNCTION IF EXISTS public.generate_quotation_number();

CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
  quotation_number TEXT;
BEGIN
  -- الحصول على أعلى رقم عرض سعر موجود حالياً
  SELECT COALESCE(MAX(CAST(SUBSTRING(q.quotation_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.quotations q
  WHERE q.quotation_number ~ '^QUO[0-9]+$';
  
  -- تكوين رقم عرض السعر الجديد
  quotation_number := 'QUO' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN quotation_number;
END;
$function$;