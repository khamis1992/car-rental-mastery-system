
-- تنفيذ خطة إدارة عضوية المستخدمين في المؤسسات

-- الخطوة 1: إزالة admin@bashaererp.com من Default Organization
DELETE FROM public.tenant_users 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@bashaererp.com'
)
AND tenant_id = '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid;

-- الخطوة 2: إضافة قيد فريد لضمان عضوية واحدة فقط لكل مستخدم (باستثناء super_admin)
-- إنشاء فهرس فريد جزئي لفرض القاعدة
CREATE UNIQUE INDEX CONCURRENTLY tenant_users_single_membership_idx 
ON public.tenant_users (user_id) 
WHERE role != 'super_admin' AND status = 'active';

-- الخطوة 3: إضافة دالة للتحقق من صحة العضوية قبل الإدراج/التحديث
CREATE OR REPLACE FUNCTION public.validate_single_tenant_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- السماح لـ super_admin بالانتماء لمؤسسات متعددة
  IF NEW.role = 'super_admin' THEN
    RETURN NEW;
  END IF;
  
  -- التحقق من عدم وجود عضوية نشطة أخرى للمستخدم
  IF EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = NEW.user_id 
    AND status = 'active' 
    AND role != 'super_admin'
    AND (TG_OP = 'INSERT' OR id != NEW.id)
  ) THEN
    RAISE EXCEPTION 'المستخدم لا يمكن أن ينتمي إلا لمؤسسة واحدة فقط';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- الخطوة 4: إضافة الـ trigger للتحقق من صحة البيانات
DROP TRIGGER IF EXISTS validate_single_membership_trigger ON public.tenant_users;
CREATE TRIGGER validate_single_membership_trigger
  BEFORE INSERT OR UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_single_tenant_membership();

-- الخطوة 5: إضافة دالة مساعدة للحصول على المؤسسة الوحيدة للمستخدم
CREATE OR REPLACE FUNCTION public.get_user_single_tenant(user_id_param uuid)
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  user_role text,
  tenant_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tu.tenant_id,
    t.name as tenant_name,
    tu.role as user_role,
    t.status as tenant_status
  FROM public.tenant_users tu
  JOIN public.tenants t ON tu.tenant_id = t.id
  WHERE tu.user_id = user_id_param
  AND tu.status = 'active'
  AND tu.role != 'super_admin'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- الخطوة 6: تسجيل العملية في سجل التدقيق
INSERT INTO public.tenant_access_log (
  user_id, 
  tenant_id, 
  action, 
  success,
  table_name
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@bashaererp.com'),
  '5566e078-92c0-4396-aebc-2850ca7d47b0'::uuid,
  'membership_removed',
  true,
  'tenant_users'
);

-- رسالة تأكيد
SELECT 'تم تنفيذ خطة إدارة عضوية المستخدمين بنجاح' as result;
