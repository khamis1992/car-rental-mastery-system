-- إضافة حقول جديدة لعروض الأسعار العامة
ALTER TABLE public.quotations 
ADD COLUMN public_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN client_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN client_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN client_notes TEXT,
ADD COLUMN public_link_expires_at TIMESTAMP WITH TIME ZONE;

-- إنشاء فهرس للرمز العام
CREATE UNIQUE INDEX idx_quotations_public_token ON public.quotations(public_token);

-- دالة لتوليد رابط عام جديد
CREATE OR REPLACE FUNCTION public.generate_public_quotation_link(quotation_id UUID, expires_in_days INTEGER DEFAULT 30)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
  quotation_number TEXT;
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
  RETURNING quotation_number INTO quotation_number;
  
  IF quotation_number IS NULL THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;
  
  RETURN new_token::TEXT;
END;
$$;

-- سياسة RLS للوصول العام للعروض
CREATE POLICY "Public access to quotations via token"
ON public.quotations
FOR SELECT
TO anon
USING (
  public_token IS NOT NULL 
  AND public_link_expires_at > now()
  AND status IN ('sent', 'accepted', 'rejected')
);

-- سياسة RLS لتحديث استجابة العملاء
CREATE POLICY "Public update quotation response"
ON public.quotations
FOR UPDATE
TO anon
USING (
  public_token IS NOT NULL 
  AND public_link_expires_at > now()
  AND status IN ('sent', 'accepted')
)
WITH CHECK (
  public_token IS NOT NULL 
  AND public_link_expires_at > now()
  AND status IN ('sent', 'accepted', 'rejected')
);