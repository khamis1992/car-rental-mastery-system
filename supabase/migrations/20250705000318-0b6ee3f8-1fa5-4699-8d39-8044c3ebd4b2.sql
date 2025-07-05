-- إنشاء جدول إعدادات الشركة لتخزين الصور والمعلومات
CREATE TABLE public.company_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  header_image_url TEXT,
  footer_image_url TEXT,
  company_name_ar TEXT DEFAULT 'شركة ساپتكو الخليج لتأجير السيارات',
  company_name_en TEXT DEFAULT 'SAPTCO GULF CAR RENTAL COMPANY',
  address_ar TEXT DEFAULT 'دولة الكويت',
  address_en TEXT DEFAULT 'State of Kuwait',
  phone TEXT DEFAULT '+965 XXXX XXXX',
  email TEXT DEFAULT 'info@saptcogulf.com',
  website TEXT DEFAULT 'www.saptcogulf.com',
  tax_number TEXT,
  commercial_registration TEXT,
  show_header BOOLEAN DEFAULT true,
  show_footer BOOLEAN DEFAULT true,
  header_height INTEGER DEFAULT 120,
  footer_height INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public) VALUES ('company-branding', 'company-branding', true);

-- إنشاء سياسات التخزين
CREATE POLICY "Company branding images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-branding');

CREATE POLICY "Authenticated users can upload company branding images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-branding' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update company branding images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-branding' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete company branding images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-branding' AND auth.uid() IS NOT NULL);

-- إنشاء سياسات RLS للجدول
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view company branding" 
ON public.company_branding 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and managers can manage company branding" 
ON public.company_branding 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'manager'::user_role)
);

-- إدراج البيانات الافتراضية
INSERT INTO public.company_branding (
  company_name_ar,
  company_name_en,
  address_ar,
  address_en,
  phone,
  email,
  website
) VALUES (
  'شركة ساپتكو الخليج لتأجير السيارات',
  'SAPTCO GULF CAR RENTAL COMPANY',
  'دولة الكويت',
  'State of Kuwait',
  '+965 XXXX XXXX',
  'info@saptcogulf.com',
  'www.saptcogulf.com'
);

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_company_branding_updated_at
BEFORE UPDATE ON public.company_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();