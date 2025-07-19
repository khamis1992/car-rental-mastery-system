
-- حل مشكلة حذف الحسابات الفرعية نهائياً
-- المشكلة: الـ trigger يحاول إدراج سجل في account_audit_log يشير للحساب المحذوف مما يسبب انتهاك القيد المرجعي

-- أولاً: تعديل جدول account_audit_log لجعل account_id قابل للقيم الفارغة
ALTER TABLE public.account_audit_log 
ALTER COLUMN account_id DROP NOT NULL;

-- ثانياً: تحديث دالة log_account_changes للتعامل مع عمليات الحذف بشكل صحيح
CREATE OR REPLACE FUNCTION public.log_account_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  mapped_action_type TEXT;
  target_account_id UUID;
BEGIN
  -- Map TG_OP values to the allowed values in the check constraint
  CASE TG_OP
    WHEN 'INSERT' THEN 
      mapped_action_type := 'created';
      target_account_id := NEW.id;
    WHEN 'UPDATE' THEN 
      mapped_action_type := 'updated';
      target_account_id := NEW.id;
    WHEN 'DELETE' THEN 
      mapped_action_type := 'deleted';
      target_account_id := NULL; -- لا نحفظ مرجع للحساب المحذوف
    ELSE 
      mapped_action_type := 'updated'; -- fallback
      target_account_id := COALESCE(NEW.id, OLD.id);
  END CASE;

  -- حفظ معرف الحساب في البيانات القديمة للحذف
  INSERT INTO public.account_audit_log (
    account_id, user_id, tenant_id,
    action_type, old_values, new_values
  ) VALUES (
    target_account_id,
    auth.uid(),
    get_current_tenant_id(),
    mapped_action_type,
    CASE 
      WHEN TG_OP = 'DELETE' THEN 
        to_jsonb(OLD) || jsonb_build_object('deleted_account_id', OLD.id)
      ELSE 
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
    END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ثالثاً: إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_account_audit_log_deleted_accounts 
ON public.account_audit_log 
USING gin ((old_values->>'deleted_account_id')) 
WHERE action_type = 'deleted';

-- رابعاً: إضافة تعليق توضيحي
COMMENT ON COLUMN public.account_audit_log.account_id IS 
'معرف الحساب - يكون NULL للحسابات المحذوفة، ومعرف الحساب المحذوف محفوظ في old_values.deleted_account_id';
