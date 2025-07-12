-- تحديث سياسات RLS لمنع admin@admin.com من الوصول إلى بيانات المؤسسات
-- وضمان الوصول فقط إلى جداول إدارة النظام العام

-- تحديث سياسة جدول tenant_users لمنع admin@admin.com من رؤية بيانات المؤسسات الأخرى
DROP POLICY IF EXISTS "Users can view tenant associations" ON public.tenant_users;
CREATE POLICY "Users can view tenant associations" ON public.tenant_users
FOR SELECT USING (
  -- المستخدمون العاديون يمكنهم رؤية ارتباطاتهم فقط
  (user_id = auth.uid() AND auth.email() != 'admin@admin.com')
  OR
  -- Super admins يمكنهم رؤية جميع الارتباطات عدا admin@admin.com
  (has_any_tenant_role(ARRAY['super_admin'::text]) AND auth.email() != 'admin@admin.com')
);

-- تحديث سياسة جدول tenants لمنع admin@admin.com من الوصول
DROP POLICY IF EXISTS "Users can view tenants in their organization" ON public.tenants;
CREATE POLICY "Users can view tenants in their organization" ON public.tenants
FOR SELECT USING (
  -- منع admin@admin.com من رؤية أي مؤسسات
  auth.email() != 'admin@admin.com'
  AND (
    id = get_current_tenant_id()
    OR has_any_tenant_role(ARRAY['super_admin'::text])
  )
);

-- تحديث سياسات الجداول الرئيسية لمنع admin@admin.com من الوصول إلى بيانات المؤسسات
UPDATE pg_policies SET qual = replace(qual::text, 'true', 'auth.email() != ''admin@admin.com''')::pg_node_tree
WHERE schemaname = 'public' 
AND tablename IN ('contracts', 'customers', 'vehicles', 'quotations', 'invoices', 'payments')
AND qual::text LIKE '%tenant_id%';

-- إنشاء سياسة خاصة لجدول saas_admins إذا كان موجوداً
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saas_admins') THEN
    -- السماح لـ admin@admin.com بالوصول إلى جدول saas_admins فقط
    DROP POLICY IF EXISTS "SaaS admins can manage their data" ON public.saas_admins;
    CREATE POLICY "SaaS admins can manage their data" ON public.saas_admins
    FOR ALL USING (
      user_id = auth.uid() AND auth.email() = 'admin@admin.com'
    )
    WITH CHECK (
      user_id = auth.uid() AND auth.email() = 'admin@admin.com'
    );
  END IF;
END $$;

-- إنشاء سياسات للجداول التي يحتاج admin@admin.com للوصول إليها
-- جدول system_settings
DROP POLICY IF EXISTS "System admins can manage system settings" ON public.system_settings;
CREATE POLICY "System admins can manage system settings" ON public.system_settings
FOR ALL USING (
  auth.email() = 'admin@admin.com'
  OR has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  auth.email() = 'admin@admin.com'
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- إنشاء RLS لجدول profiles بحيث admin@admin.com يمكنه رؤية ملفه الشخصي فقط
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- رسالة تأكيد
DO $$
BEGIN
  RAISE NOTICE 'تم تحديث سياسات RLS بنجاح - admin@admin.com محدود الآن إلى إدارة النظام العام فقط';
END $$;