-- إنشاء دالة حذف المؤسسة الافتراضية السريع
CREATE OR REPLACE FUNCTION public.quick_remove_default_organization()
RETURNS TEXT AS $$
DECLARE
    default_org_id UUID;
    deletion_result TEXT;
BEGIN
    -- البحث عن المؤسسة الافتراضية
    SELECT id INTO default_org_id
    FROM public.tenants
    WHERE name ILIKE '%default%' OR name = 'Default Organization'
    LIMIT 1;
    
    IF default_org_id IS NULL THEN
        RETURN 'لا توجد مؤسسة افتراضية في النظام';
    END IF;
    
    -- استخدام دالة الحذف النهائي الموجودة
    SELECT public.hard_delete_tenant(default_org_id, 'حذف تلقائي للمؤسسة الافتراضية')::text
    INTO deletion_result;
    
    RETURN 'تم حذف المؤسسة الافتراضية بنجاح: ' || deletion_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'خطأ في حذف المؤسسة الافتراضية: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة عمود amount_paid إلى جدول saas_invoices إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saas_invoices' AND column_name = 'amount_paid'
    ) THEN
        ALTER TABLE public.saas_invoices ADD COLUMN amount_paid NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- إضافة عمود invoice_date إلى جدول saas_invoices إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saas_invoices' AND column_name = 'invoice_date'
    ) THEN
        ALTER TABLE public.saas_invoices ADD COLUMN invoice_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- تحديث البيانات الموجودة لضمان التوافق
UPDATE public.saas_invoices 
SET 
    amount_paid = COALESCE(amount_paid, 0),
    invoice_date = COALESCE(invoice_date, created_at::date)
WHERE amount_paid IS NULL OR invoice_date IS NULL;