-- ==========================================
-- إصلاح دوال حذف واستعادة المؤسسات
-- ==========================================

-- تحديث دالة safe_delete_tenant لتقوم بالحذف المؤقت فقط (soft delete)
CREATE OR REPLACE FUNCTION public.safe_delete_tenant(tenant_id_param UUID, deletion_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_record RECORD;
BEGIN
    -- التحقق من وجود المؤسسة
    SELECT * INTO tenant_record FROM public.tenants WHERE id = tenant_id_param;
    
    IF tenant_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'المؤسسة غير موجودة'
        );
    END IF;
    
    -- التحقق من أن المؤسسة ليست ملغاة بالفعل
    IF tenant_record.status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'المؤسسة ملغاة بالفعل'
        );
    END IF;
    
    -- تسجيل محاولة الإلغاء
    INSERT INTO public.tenant_deletion_log (
        tenant_id, tenant_name, tenant_slug, deleted_by, 
        deletion_reason, deletion_type, deleted_at
    ) VALUES (
        tenant_id_param, tenant_record.name, tenant_record.slug, auth.uid(), 
        deletion_reason, 'soft_delete', now()
    );
    
    -- إلغاء المؤسسة (soft delete) - تغيير الحالة إلى cancelled
    UPDATE public.tenants 
    SET 
        status = 'cancelled',
        updated_at = now(),
        cancelled_at = now(),
        cancellation_reason = deletion_reason
    WHERE id = tenant_id_param;
    
    -- إلغاء تفعيل جميع مستخدمي المؤسسة
    UPDATE public.tenant_users 
    SET 
        status = 'inactive',
        updated_at = now()
    WHERE tenant_id = tenant_id_param;
    
    -- إرجاع نتيجة النجاح
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم إلغاء المؤسسة بنجاح. يمكن استعادتها لاحقاً.',
        'tenant_id', tenant_id_param,
        'tenant_name', tenant_record.name,
        'cancelled_at', now()
    );
    
EXCEPTION WHEN OTHERS THEN
    -- في حالة حدوث خطأ
    RETURN jsonb_build_object(
        'success', false,
        'error', 'خطأ أثناء إلغاء المؤسسة: ' || SQLERRM,
        'tenant_id', tenant_id_param
    );
END;
$$;

-- إضافة دالة استعادة المؤسسة المُلغاة
CREATE OR REPLACE FUNCTION public.restore_cancelled_tenant(tenant_id_param UUID, restore_reason TEXT DEFAULT 'استعادة من قبل المدير')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_record RECORD;
BEGIN
    -- التحقق من وجود المؤسسة
    SELECT * INTO tenant_record FROM public.tenants WHERE id = tenant_id_param;
    
    IF tenant_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'المؤسسة غير موجودة'
        );
    END IF;
    
    -- التحقق من أن المؤسسة ملغاة
    IF tenant_record.status != 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'يمكن استعادة المؤسسات الملغاة فقط'
        );
    END IF;
    
    -- تسجيل محاولة الاستعادة
    INSERT INTO public.tenant_deletion_log (
        tenant_id, tenant_name, tenant_slug, deleted_by, 
        deletion_reason, deletion_type, deleted_at
    ) VALUES (
        tenant_id_param, tenant_record.name, tenant_record.slug, auth.uid(), 
        restore_reason, 'restore', now()
    );
    
    -- استعادة المؤسسة
    UPDATE public.tenants 
    SET 
        status = 'active',
        updated_at = now(),
        cancelled_at = null,
        cancellation_reason = null
    WHERE id = tenant_id_param;
    
    -- إعادة تفعيل المدير الرئيسي للمؤسسة
    UPDATE public.tenant_users 
    SET 
        status = 'active',
        updated_at = now()
    WHERE tenant_id = tenant_id_param 
    AND role = 'tenant_admin';
    
    -- إرجاع نتيجة النجاح
    RETURN jsonb_build_object(
        'success', true,
        'message', 'تم استعادة المؤسسة بنجاح',
        'tenant_id', tenant_id_param,
        'tenant_name', tenant_record.name,
        'restored_at', now()
    );
    
EXCEPTION WHEN OTHERS THEN
    -- في حالة حدوث خطأ
    RETURN jsonb_build_object(
        'success', false,
        'error', 'خطأ أثناء استعادة المؤسسة: ' || SQLERRM,
        'tenant_id', tenant_id_param
    );
END;
$$;

-- إضافة الأعمدة المطلوبة لجدول tenants إذا لم تكن موجودة
DO $$
BEGIN
    -- إضافة عمود cancelled_at إذا لم يكن موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' 
        AND column_name = 'cancelled_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN cancelled_at TIMESTAMPTZ;
    END IF;
    
    -- إضافة عمود cancellation_reason إذا لم يكن موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' 
        AND column_name = 'cancellation_reason'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tenants ADD COLUMN cancellation_reason TEXT;
    END IF;
END $$;

-- إضافة تعليقات للتوضيح
COMMENT ON FUNCTION public.safe_delete_tenant(UUID, TEXT) IS 'إلغاء المؤسسة مؤقتاً - يمكن استعادتها لاحقاً';
COMMENT ON FUNCTION public.hard_delete_tenant(UUID, TEXT) IS 'حذف المؤسسة نهائياً - لا يمكن التراجع عنه';
COMMENT ON FUNCTION public.restore_cancelled_tenant(UUID, TEXT) IS 'استعادة المؤسسة الملغاة مؤقتاً'; 