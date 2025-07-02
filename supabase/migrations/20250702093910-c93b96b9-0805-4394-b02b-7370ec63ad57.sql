-- تحديث دالة توليد الرابط العام لتعيين الحالة إلى 'sent' تلقائياً
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
  
  -- تحديث العرض برمز جديد وتاريخ انتهاء وتعيين الحالة إلى 'sent'
  UPDATE public.quotations 
  SET 
    public_token = new_token,
    public_link_expires_at = now() + (expires_in_days * INTERVAL '1 day'),
    status = 'sent',
    updated_at = now()
  WHERE id = quotation_id
  RETURNING quotation_number, status INTO quotation_record;
  
  IF quotation_record.quotation_number IS NULL THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;
  
  -- يمكن الآن إنشاء روابط عامة للعروض في حالة 'draft' أو 'sent'
  IF quotation_record.status NOT IN ('draft', 'sent') THEN
    RAISE EXCEPTION 'Public links can only be generated for draft or sent quotations';
  END IF;
  
  RETURN new_token::TEXT;
END;
$$;