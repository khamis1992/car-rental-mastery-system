-- إصلاح سياسات RLS لإدارة المؤسسات

-- إنشاء سياسات خاصة لـ admin@admin.com لإدارة المؤسسات
CREATE POLICY "SaaS admin can manage all tenants" ON public.tenants
FOR ALL USING (
  is_saas_admin()
);

-- إنشاء سياسات لإدارة المستخدمين للمؤسسات
CREATE POLICY "SaaS admin can manage tenant users" ON public.tenant_users
FOR ALL USING (
  is_saas_admin()
);

-- إنشاء سياسات لرؤية الملفات الشخصية
CREATE POLICY "SaaS admin can view all profiles" ON public.profiles
FOR SELECT USING (
  is_saas_admin()
);

-- إضافة سياسة لإدارة الاشتراكات (إذا كان الجدول موجود)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    EXECUTE 'CREATE POLICY "SaaS admin can manage subscriptions" ON public.subscriptions FOR ALL USING (is_saas_admin())';
  END IF;
END $$;

-- إضافة سياسة لإدارة سجل الاشتراكات (إذا كان الجدول موجود)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_history') THEN
    EXECUTE 'CREATE POLICY "SaaS admin can view subscription history" ON public.subscription_history FOR SELECT USING (is_saas_admin())';
  END IF;
END $$;

SELECT 'تم إنشاء سياسات RLS للسماح لـ admin@admin.com بإدارة المؤسسات' as result;