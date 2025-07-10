-- إنشاء جدول الإعدادات العامة للنظام
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  setting_type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_restart BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX idx_system_settings_type ON public.system_settings(setting_type);
CREATE INDEX idx_system_settings_active ON public.system_settings(is_active);

-- تفعيل RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - فقط مديري النظام العام يمكنهم إدارة الإعدادات
CREATE POLICY "Super admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (has_any_tenant_role(ARRAY['super_admin']))
WITH CHECK (has_any_tenant_role(ARRAY['super_admin']));

-- سياسة للقراءة للمديرين والمحاسبين
CREATE POLICY "Admins can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (has_any_tenant_role(ARRAY['super_admin', 'tenant_admin', 'manager', 'accountant']));

-- دالة لتحديث timestamp تلقائياً
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للتحديث التلقائي
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_settings_updated_at();

-- دالة لتحديث إعداد معين
CREATE OR REPLACE FUNCTION public.update_system_setting(
  setting_key_param TEXT,
  new_value JSONB,
  updated_by_param UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.system_settings
  SET 
    setting_value = new_value,
    updated_at = now(),
    updated_by = updated_by_param
  WHERE setting_key = setting_key_param;
  
  RETURN FOUND;
END;
$$;

-- دالة للحصول على قيمة إعداد معين
CREATE OR REPLACE FUNCTION public.get_system_setting(setting_key_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT system_settings.setting_value INTO setting_value
  FROM public.system_settings
  WHERE setting_key = setting_key_param
  AND is_active = true;
  
  RETURN COALESCE(setting_value, '{}');
END;
$$;

-- إدراج الإعدادات الافتراضية
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
-- إعدادات النظام العامة
('system_name', '"نظام إدارة تأجير السيارات"', 'system', 'اسم النظام'),
('system_version', '"2.1.0"', 'system', 'إصدار النظام'),
('maintenance_mode', 'false', 'system', 'وضع الصيانة'),
('allow_registration', 'true', 'system', 'السماح بالتسجيل'),
('max_tenants_per_user', '5', 'system', 'الحد الأقصى للمؤسسات لكل مستخدم'),
('session_timeout', '1440', 'system', 'مهلة انتهاء الجلسة بالدقائق'),

-- إعدادات الأمان
('password_min_length', '8', 'security', 'الحد الأدنى لطول كلمة المرور'),
('require_two_factor', 'false', 'security', 'المصادقة الثنائية إجبارية'),
('max_login_attempts', '5', 'security', 'محاولات تسجيل الدخول القصوى'),
('lockout_duration', '30', 'security', 'مدة القفل بالدقائق'),

-- إعدادات البريد الإلكتروني
('smtp_host', '"smtp.gmail.com"', 'email', 'خادم SMTP'),
('smtp_port', '587', 'email', 'منفذ SMTP'),
('smtp_username', '""', 'email', 'اسم مستخدم SMTP'),
('smtp_password', '""', 'email', 'كلمة مرور SMTP'),
('from_email', '"noreply@system.com"', 'email', 'البريد الإلكتروني للإرسال'),

-- إعدادات قاعدة البيانات
('backup_frequency', '"daily"', 'database', 'تكرار النسخ الاحتياطية'),
('retention_days', '30', 'database', 'فترة الاحتفاظ بالأيام'),
('auto_optimization', 'true', 'database', 'التحسين التلقائي'),

-- إعدادات الإشعارات
('system_notifications', 'true', 'notifications', 'إشعارات النظام'),
('email_notifications', 'true', 'notifications', 'إشعارات البريد الإلكتروني'),
('sms_notifications', 'false', 'notifications', 'إشعارات الرسائل النصية');

-- دالة للحصول على الإعدادات مجمعة حسب النوع
CREATE OR REPLACE FUNCTION public.get_grouped_system_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB := '{}';
  setting_record RECORD;
BEGIN
  FOR setting_record IN 
    SELECT setting_type, json_agg(
      json_build_object(
        'key', setting_key,
        'value', setting_value,
        'description', description,
        'requires_restart', requires_restart
      )
    ) as settings
    FROM public.system_settings
    WHERE is_active = true
    GROUP BY setting_type
  LOOP
    result := result || jsonb_build_object(setting_record.setting_type, setting_record.settings);
  END LOOP;
  
  RETURN result;
END;
$$;