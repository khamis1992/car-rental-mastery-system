-- تعديل دالة تسجيل التغييرات لمعالجة حالة عدم وجود tenant_id أيضاً
CREATE OR REPLACE FUNCTION public.log_account_changes()
RETURNS TRIGGER AS $$
DECLARE
  mapped_action_type TEXT;
  current_user_id UUID;
  current_tenant_id_val UUID;
BEGIN
  -- Map TG_OP values to the allowed values in the check constraint
  CASE TG_OP
    WHEN 'INSERT' THEN mapped_action_type := 'created';
    WHEN 'UPDATE' THEN mapped_action_type := 'updated';
    WHEN 'DELETE' THEN mapped_action_type := 'deleted';
    ELSE mapped_action_type := 'updated'; -- fallback
  END CASE;

  -- الحصول على معرف المستخدم الحالي مع قيمة افتراضية
  current_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001');

  -- التحقق من وجود المستخدم في جدول auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = current_user_id) THEN
    -- استخدام معرف مستخدم النظام الافتراضي
    current_user_id := '00000000-0000-0000-0000-000000000001';
  END IF;

  -- الحصول على tenant_id من السجل المحذوف أو الحالي
  current_tenant_id_val := COALESCE(
    get_current_tenant_id(), 
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    '00000000-0000-0000-0000-000000000000'
  );

  INSERT INTO public.account_audit_log (
    account_id, user_id, tenant_id,
    action_type, old_values, new_values
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    current_user_id,
    current_tenant_id_val,
    mapped_action_type,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف الحساب التجريبي
DELETE FROM public.chart_of_accounts 
WHERE account_code = '100001' 
AND account_name = 'تجربة' 
AND id = '995cdde1-1e89-4fef-bd84-91e0e906b999';