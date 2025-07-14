-- تحديث سياسات الأمان للسماح للمؤسسات التجريبية بالوصول للبيانات

-- إنشاء دالة للتحقق من صلاحية المؤسسة (نشطة أو تجريبية صالحة)
CREATE OR REPLACE FUNCTION public.is_tenant_valid(tenant_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    tenant_record RECORD;
BEGIN
    -- جلب بيانات المؤسسة
    SELECT status, trial_ends_at
    INTO tenant_record
    FROM public.tenants
    WHERE id = tenant_id_param;
    
    -- إذا لم توجد المؤسسة
    IF tenant_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- المؤسسات النشطة مسموحة دائماً
    IF tenant_record.status = 'active' THEN
        RETURN true;
    END IF;
    
    -- المؤسسات التجريبية: التحقق من تاريخ الانتهاء
    IF tenant_record.status = 'trial' THEN
        -- إذا لم يكن هناك تاريخ انتهاء، فهي صالحة
        IF tenant_record.trial_ends_at IS NULL THEN
            RETURN true;
        END IF;
        
        -- التحقق من عدم انتهاء الفترة التجريبية
        RETURN tenant_record.trial_ends_at > now();
    END IF;
    
    -- باقي الحالات غير مسموحة (suspended, cancelled, etc.)
    RETURN false;
END;
$$;

-- تحديث دالة get_current_tenant_id للتحقق من صلاحية المؤسسة
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    tenant_id_result uuid;
BEGIN
    -- جلب معرف المؤسسة للمستخدم الحالي
    SELECT tu.tenant_id
    INTO tenant_id_result
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
    AND tu.status = 'active'
    AND public.is_tenant_valid(tu.tenant_id);
    
    RETURN tenant_id_result;
END;
$$;

-- منح الصلاحيات للدوال
GRANT EXECUTE ON FUNCTION public.is_tenant_valid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;