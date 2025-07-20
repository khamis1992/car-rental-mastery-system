
-- إضافة الحقول المطلوبة لجدول العملاء
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS national_id TEXT,
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'company')),
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_registration_number TEXT,
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS governorate TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'الكويت';

-- إضافة فهرس للرقم المدني للبحث السريع
CREATE INDEX IF NOT EXISTS idx_customers_national_id ON public.customers(national_id);

-- إضافة فهرس لرقم تسجيل الشركة
CREATE INDEX IF NOT EXISTS idx_customers_company_registration ON public.customers(company_registration_number);

-- تحديث الجدول ليكون الرقم المدني مطلوباً للأفراد
-- سنستخدم constraint بدلاً من NOT NULL لمرونة أكبر
ALTER TABLE public.customers 
ADD CONSTRAINT customers_national_id_required 
CHECK (
  (customer_type = 'individual' AND national_id IS NOT NULL AND length(trim(national_id)) > 0) OR
  (customer_type = 'company' AND company_registration_number IS NOT NULL AND length(trim(company_registration_number)) > 0)
);

-- إضافة constraint للتأكد من عدم تكرار الرقم المدني
ALTER TABLE public.customers 
ADD CONSTRAINT customers_national_id_unique 
UNIQUE (national_id, tenant_id);

-- إضافة constraint للتأكد من عدم تكرار رقم تسجيل الشركة
ALTER TABLE public.customers 
ADD CONSTRAINT customers_company_registration_unique 
UNIQUE (company_registration_number, tenant_id);
