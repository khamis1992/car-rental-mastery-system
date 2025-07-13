-- إضافة العمود المفقود lifecycle_stage إلى جدول customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'prospect' CHECK (lifecycle_stage IN ('prospect', 'lead', 'customer', 'loyal_customer', 'vip_customer', 'churned', 'inactive'));

-- إضافة الأعمدة الأخرى إذا لم تكن موجودة
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_code TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS segments TEXT[] DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS identification JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS financial_info JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferences JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'individual' CHECK (type IN ('individual', 'corporate'));

-- تحديث customer_code للصفوف الموجودة إذا كان فارغاً
UPDATE customers 
SET customer_code = 'CUS' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0')
WHERE customer_code IS NULL;

-- إنشاء فهارس للأعمدة الجديدة
CREATE INDEX IF NOT EXISTS idx_customers_lifecycle_stage ON customers (lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers (customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers (type);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers (source);

-- إنشاء constraint فريد لـ customer_code
ALTER TABLE customers ADD CONSTRAINT customers_customer_code_tenant_id_key UNIQUE (customer_code, tenant_id);

-- تحديث البيانات الموجودة بالقيم الافتراضية
UPDATE customers 
SET 
    lifecycle_stage = COALESCE(lifecycle_stage, 'prospect'),
    segments = COALESCE(segments, '{}'),
    tags = COALESCE(tags, '{}'),
    type = COALESCE(type, 'individual')
WHERE 
    lifecycle_stage IS NULL 
    OR segments IS NULL 
    OR tags IS NULL 
    OR type IS NULL; 