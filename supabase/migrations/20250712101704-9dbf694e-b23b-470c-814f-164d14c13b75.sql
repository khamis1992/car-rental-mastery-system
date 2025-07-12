-- إنشاء جدول لمحتوى الصفحة الرئيسية
CREATE TABLE public.landing_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_value JSONB NOT NULL DEFAULT '{}',
  content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'json'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(section_name, content_key)
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX idx_landing_content_section_active ON public.landing_page_content(section_name, is_active);

-- تفعيل RLS
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة - الجميع يمكنهم قراءة المحتوى النشط
CREATE POLICY "Everyone can read active landing content" 
ON public.landing_page_content 
FOR SELECT 
USING (is_active = true);

-- سياسة للكتابة - المديرون العامون فقط يمكنهم إدارة المحتوى
CREATE POLICY "Super admins can manage landing content" 
ON public.landing_page_content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND status = 'active'
  )
);

-- تحديث التوقيت تلقائياً
CREATE OR REPLACE FUNCTION public.update_landing_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landing_content_updated_at
  BEFORE UPDATE ON public.landing_page_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_landing_content_updated_at();

-- إدراج البيانات الافتراضية
INSERT INTO public.landing_page_content (section_name, content_key, content_value, content_type) VALUES
-- Hero Section
('hero', 'title', '{"ar": "نظام إدارة تأجير السيارات الأكثر تطوراً", "en": "The Most Advanced Car Rental Management System"}', 'json'),
('hero', 'subtitle', '{"ar": "حلول متكاملة لإدارة أسطول السيارات مع تقنيات حديثة ونظام محاسبي متقدم", "en": "Comprehensive fleet management solutions with modern technology and advanced accounting system"}', 'json'),
('hero', 'cta_text', '{"ar": "احجز عرضاً تجريبياً", "en": "Book a Demo"}', 'json'),

-- Features Section  
('features', 'title', '{"ar": "المميزات الرئيسية", "en": "Key Features"}', 'json'),
('features', 'subtitle', '{"ar": "نظام شامل يغطي جميع احتياجاتك في إدارة تأجير السيارات", "en": "A comprehensive system covering all your car rental management needs"}', 'json'),

-- Pricing Section
('pricing', 'title', '{"ar": "الخطط والأسعار", "en": "Pricing Plans"}', 'json'),
('pricing', 'subtitle', '{"ar": "اختر الخطة المناسبة لحجم عملك", "en": "Choose the plan that fits your business size"}', 'json'),

-- Contact Section
('contact', 'title', '{"ar": "تواصل معنا", "en": "Contact Us"}', 'json'),
('contact', 'subtitle', '{"ar": "نحن هنا لمساعدتك في تطوير عملك", "en": "We are here to help you grow your business"}', 'json'),
('contact', 'phone_primary', '{"ar": "+965 2220 0000", "en": "+965 2220 0000"}', 'json'),
('contact', 'phone_secondary', '{"ar": "+965 9999 0000", "en": "+965 9999 0000"}', 'json'),
('contact', 'email_sales', '{"ar": "sales@saptcogulf.com", "en": "sales@saptcogulf.com"}', 'json'),
('contact', 'email_support', '{"ar": "support@saptcogulf.com", "en": "support@saptcogulf.com"}', 'json'),
('contact', 'address', '{"ar": "الكويت، منطقة الشرق، شارع الخليج العربي", "en": "Kuwait, Sharq District, Arabian Gulf Street"}', 'json'),
('contact', 'working_hours', '{"ar": "الأحد - الخميس: 8:00 ص - 6:00 م", "en": "Sunday - Thursday: 8:00 AM - 6:00 PM"}', 'json'),

-- Footer Section
('footer', 'company_description', '{"ar": "شركة ساپتكو الخليج الرائدة في مجال تأجير السيارات وحلول إدارة الأساطيل", "en": "SAPTCO Gulf leading company in car rental and fleet management solutions"}', 'json'),
('footer', 'copyright', '{"ar": "جميع الحقوق محفوظة - شركة ساپتكو الخليج", "en": "All rights reserved - SAPTCO Gulf Company"}', 'json');