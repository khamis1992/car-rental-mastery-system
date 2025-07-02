-- إصلاح دالة توليد الرابط العام لتجنب تعارض الأسماء
DROP FUNCTION IF EXISTS public.generate_public_quotation_link(uuid, integer);

CREATE OR REPLACE FUNCTION public.generate_public_quotation_link(quotation_id UUID, expires_in_days INTEGER DEFAULT 30)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
  quotation_record RECORD;
BEGIN
  -- توليد رمز جديد
  new_token := gen_random_uuid();
  
  -- تحديث العرض برمز جديد وتاريخ انتهاء
  UPDATE public.quotations 
  SET 
    public_token = new_token,
    public_link_expires_at = now() + (expires_in_days * INTERVAL '1 day'),
    updated_at = now()
  WHERE id = quotation_id
  RETURNING quotation_number, status INTO quotation_record;
  
  IF quotation_record.quotation_number IS NULL THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;
  
  -- التأكد من أن العرض في حالة مسودة
  IF quotation_record.status != 'draft' THEN
    RAISE EXCEPTION 'Public links can only be generated for draft quotations';
  END IF;
  
  RETURN new_token::TEXT;
END;
$$;