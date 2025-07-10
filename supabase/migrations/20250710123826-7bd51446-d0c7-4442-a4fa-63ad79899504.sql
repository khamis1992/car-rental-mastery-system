-- إنشاء جداول نظام SaaS بشكل تدريجي

-- جدول خطط الاشتراك
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  plan_name_en TEXT,
  plan_code TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  max_tenants INTEGER,
  max_users_per_tenant INTEGER,
  max_vehicles INTEGER,
  max_contracts INTEGER,
  storage_limit_gb INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- إضافة البيانات التجريبية لخطط الاشتراك
INSERT INTO public.subscription_plans (
  plan_name, plan_name_en, plan_code, description, 
  price_monthly, price_yearly, features, 
  max_tenants, max_users_per_tenant, max_vehicles, max_contracts,
  storage_limit_gb, is_popular, sort_order
) VALUES 
(
  'الخطة الأساسية', 'Basic Plan', 'BASIC',
  'خطة مناسبة للشركات الصغيرة',
  50, 500, 
  ARRAY['إدارة المركبات', 'العقود الأساسية', 'التقارير البسيطة', 'دعم فني أساسي'],
  1, 10, 20, 100,
  5, false, 1
),
(
  'الخطة المتقدمة', 'Premium Plan', 'PREMIUM',
  'خطة مناسبة للشركات المتوسطة',
  100, 1000,
  ARRAY['جميع ميزات الخطة الأساسية', 'تقارير متقدمة', 'إدارة المخالفات', 'التكامل مع APIs', 'دعم فني متقدم'],
  3, 50, 100, 500,
  25, true, 2
),
(
  'خطة الشركات', 'Enterprise Plan', 'ENTERPRISE',
  'خطة مناسبة للشركات الكبيرة',
  200, 2000,
  ARRAY['جميع الميزات', 'تخصيص كامل', 'تقارير تفصيلية', 'دعم فني مخصص 24/7', 'تدريب مجاني'],
  NULL, NULL, NULL, NULL,
  100, false, 3
)
ON CONFLICT (plan_code) DO NOTHING;