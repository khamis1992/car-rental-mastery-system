-- إنشاء دالة حذف آمنة للمؤسسات
CREATE OR REPLACE FUNCTION public.safe_delete_tenant(
  tenant_id_param UUID,
  deletion_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_record RECORD;
  deleted_records JSONB := '{}';
  tenant_name_val TEXT;
BEGIN
  -- التحقق من وجود المؤسسة
  SELECT name INTO tenant_name_val
  FROM public.tenants 
  WHERE id = tenant_id_param;
  
  IF tenant_name_val IS NULL THEN
    RAISE EXCEPTION 'Tenant not found';
  END IF;
  
  -- تسجيل عملية الحذف
  INSERT INTO public.tenant_deletion_log (
    tenant_id,
    tenant_name,
    deleted_by,
    deletion_reason,
    deletion_type
  ) VALUES (
    tenant_id_param,
    tenant_name_val,
    auth.uid(),
    deletion_reason,
    'soft_delete'
  );
  
  -- إلغاء تفعيل المؤسسة بدلاً من حذفها
  UPDATE public.tenants 
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = tenant_id_param;
  
  -- إلغاء تفعيل جميع المستخدمين المرتبطين
  UPDATE public.tenant_users 
  SET 
    status = 'inactive',
    updated_at = now()
  WHERE tenant_id = tenant_id_param;
  
  -- إضافة معلومات السجلات المحدثة
  deleted_records := jsonb_build_object(
    'tenant_updated', 1,
    'tenant_users_deactivated', (
      SELECT COUNT(*) FROM public.tenant_users 
      WHERE tenant_id = tenant_id_param
    ),
    'deletion_type', 'soft_delete',
    'tenant_name', tenant_name_val
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', tenant_id_param,
    'tenant_name', tenant_name_val,
    'deleted_records', deleted_records
  );
END;
$$;

-- إنشاء جدول لتسجيل عمليات حذف المؤسسات
CREATE TABLE IF NOT EXISTS public.tenant_deletion_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  tenant_name TEXT NOT NULL,
  deleted_by UUID REFERENCES auth.users(id),
  deletion_reason TEXT,
  deletion_type TEXT NOT NULL DEFAULT 'soft_delete',
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS على جدول سجل الحذف
ALTER TABLE public.tenant_deletion_log ENABLE ROW LEVEL SECURITY;

-- سياسة للمديرين العامين فقط
CREATE POLICY "Super admins can view deletion log" 
ON public.tenant_deletion_log 
FOR SELECT 
USING (has_any_tenant_role(ARRAY['super_admin'::text]));

CREATE POLICY "Super admins can log deletions" 
ON public.tenant_deletion_log 
FOR INSERT 
WITH CHECK (has_any_tenant_role(ARRAY['super_admin'::text]));