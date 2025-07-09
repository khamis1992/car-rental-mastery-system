-- إنشاء جدول إعدادات مراكز التكلفة
CREATE TABLE public.cost_center_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE INDEX idx_cost_center_settings_key ON public.cost_center_settings(setting_key);
CREATE INDEX idx_cost_center_settings_type ON public.cost_center_settings(setting_type);

-- تفعيل RLS
ALTER TABLE public.cost_center_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "المديرون يمكنهم إدارة إعدادات مراكز التكلفة"
ON public.cost_center_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role));

CREATE POLICY "المحاسبون يمكنهم رؤية إعدادات مراكز التكلفة"
ON public.cost_center_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'manager'::user_role) OR has_role(auth.uid(), 'accountant'::user_role));

-- إدراج الإعدادات الافتراضية
INSERT INTO public.cost_center_settings (setting_key, setting_value, setting_type, description) VALUES
('auto_allocation_enabled', 'true', 'automation', 'تفعيل التوزيع التلقائي للتكاليف على مراكز التكلفة'),
('default_cost_center_type', '"operational"', 'defaults', 'نوع مركز التكلفة الافتراضي عند إنشاء مركز جديد'),
('budget_alert_threshold', '80', 'alerts', 'نسبة التنبيه عند اقتراب الميزانية من النفاد (%)'),
('auto_budget_calculation', 'false', 'automation', 'حساب الميزانية تلقائياً بناءً على البيانات التاريخية'),
('cost_update_frequency', '"daily"', 'automation', 'تكرار تحديث التكاليف (daily, weekly, monthly)'),
('require_approval_for_budget_changes', 'true', 'approvals', 'طلب موافقة عند تغيير الميزانية'),
('default_currency', '"KWD"', 'defaults', 'العملة الافتراضية لمراكز التكلفة'),
('enable_hierarchy', 'true', 'structure', 'تفعيل التسلسل الهرمي لمراكز التكلفة'),
('max_hierarchy_levels', '5', 'structure', 'أقصى عدد مستويات في التسلسل الهرمي'),
('enable_cost_center_reports', 'true', 'reporting', 'تفعيل تقارير مراكز التكلفة');

-- إنشاء دالة للحصول على قيمة إعداد
CREATE OR REPLACE FUNCTION public.get_cost_center_setting(setting_key_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_value JSONB;
BEGIN
  SELECT setting_value INTO setting_value
  FROM public.cost_center_settings
  WHERE setting_key = setting_key_param
  AND is_active = true;
  
  RETURN COALESCE(setting_value, 'null'::jsonb);
END;
$$;

-- إنشاء دالة لتحديث إعداد
CREATE OR REPLACE FUNCTION public.update_cost_center_setting(
  setting_key_param TEXT,
  new_value JSONB,
  updated_by_param UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.cost_center_settings
  SET 
    setting_value = new_value,
    updated_at = now(),
    updated_by = updated_by_param
  WHERE setting_key = setting_key_param;
  
  RETURN FOUND;
END;
$$;

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_cost_center_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_cost_center_settings_updated_at
  BEFORE UPDATE ON public.cost_center_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cost_center_settings_updated_at();