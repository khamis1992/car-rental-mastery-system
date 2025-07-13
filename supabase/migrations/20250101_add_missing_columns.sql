-- إضافة الأعمدة المفقودة لجدول العملاء
-- تاريخ الإنشاء: 2025-01-01
-- الغرض: إضافة الأعمدة الجديدة لدعم CRM المتقدم

-- إضافة العمود lifecycle_stage إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'lifecycle_stage'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN lifecycle_stage TEXT DEFAULT 'prospect' 
        CHECK (lifecycle_stage IN ('prospect', 'lead', 'customer', 'loyal_customer', 'vip_customer', 'churned', 'inactive'));
    END IF;
END $$;

-- إضافة العمود segments إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'segments'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN segments TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- إضافة العمود tags إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- إضافة العمود source إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN source TEXT;
    END IF;
END $$;

-- إضافة العمود assigned_to إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN assigned_to UUID;
    END IF;
END $$;

-- إضافة العمود customer_code إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'customer_code'
    ) THEN
        -- إضافة العمود أولاً
        ALTER TABLE customers 
        ADD COLUMN customer_code TEXT;
        
        -- تحديث القيم الموجودة بأكواد عملاء فريدة
        UPDATE customers 
        SET customer_code = 'CUS' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0')
        WHERE customer_code IS NULL;
        
        -- جعل العمود مطلوب
        ALTER TABLE customers 
        ALTER COLUMN customer_code SET NOT NULL;
    END IF;
END $$;

-- إضافة العمود type إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN type TEXT DEFAULT 'individual' 
        CHECK (type IN ('individual', 'corporate'));
    END IF;
END $$;

-- إضافة العمود secondary_phone إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'secondary_phone'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN secondary_phone TEXT;
    END IF;
END $$;

-- إضافة العمود identification إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'identification'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN identification JSONB;
    END IF;
END $$;

-- إضافة العمود financial_info إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'financial_info'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN financial_info JSONB;
    END IF;
END $$;

-- إضافة العمود preferences إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN preferences JSONB;
    END IF;
END $$;

-- إضافة العمود company_name إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN company_name TEXT;
    END IF;
END $$;

-- إنشاء فهرس للعمود lifecycle_stage إذا لم يكن موجوداً
CREATE INDEX IF NOT EXISTS idx_customers_lifecycle_stage ON customers (lifecycle_stage);

-- إنشاء فهرس للعمود customer_code إذا لم يكن موجوداً
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers (customer_code);

-- إنشاء فهرس للعمود type إذا لم يكن موجوداً
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers (type);

-- إنشاء فهرس للعمود source إذا لم يكن موجوداً
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers (source);

-- إنشاء فهرس للعمود assigned_to إذا لم يكن موجوداً
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers (assigned_to);

-- تحديث البيانات الموجودة مع القيم الافتراضية إذا لزم الأمر
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

-- إضافة constraint فريد لـ customer_code إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'customers' 
        AND constraint_name = 'customers_customer_code_tenant_id_key'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT customers_customer_code_tenant_id_key 
        UNIQUE (customer_code, tenant_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- التقييد موجود بالفعل، تجاهل
        NULL;
END $$;

-- تسجيل إكمال التحديث
INSERT INTO database_migrations (version, description, applied_at)
VALUES ('20250101_add_missing_columns', 'إضافة الأعمدة المفقودة لجدول العملاء', NOW())
ON CONFLICT (version) DO NOTHING; 