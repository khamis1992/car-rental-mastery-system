-- إضافة خطط اشتراك أولية
INSERT INTO public.subscription_plans (plan_name, plan_name_en, plan_code, description, price_monthly, price_yearly, features, max_users_per_tenant, max_vehicles, max_contracts, storage_limit_gb, is_popular, sort_order) VALUES
('الخطة الأساسية', 'Basic Plan', 'BASIC', 'خطة مناسبة للشركات الصغيرة', 25.000, 250.000, 
 ARRAY['إدارة 10 مركبات', 'إدارة 50 عقد', '5 مستخدمين', 'تقارير أساسية', 'دعم فني'], 
 5, 10, 50, 5, false, 1),

('الخطة المتقدمة', 'Professional Plan', 'PRO', 'خطة للشركات المتوسطة مع ميزات متقدمة', 50.000, 500.000,
 ARRAY['إدارة 50 مركبة', 'إدارة 200 عقد', '15 مستخدم', 'تقارير متقدمة', 'تكامل API', 'دعم فني مميز'],
 15, 50, 200, 20, true, 2),

('خطة المؤسسات', 'Enterprise Plan', 'ENTERPRISE', 'خطة شاملة للمؤسسات الكبيرة', 100.000, 1000.000,
 ARRAY['مركبات غير محدودة', 'عقود غير محدودة', 'مستخدمين غير محدود', 'تقارير مخصصة', 'تكامل كامل', 'دعم مخصص 24/7'],
 NULL, NULL, NULL, NULL, false, 3);

-- إضافة إعدادات النظام للفوترة التلقائية
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_active) VALUES
('automated_billing_enabled', 'true'::jsonb, 'billing', 'تمكين الفوترة التلقائية', true),
('billing_notification_enabled', 'true'::jsonb, 'billing', 'تمكين إشعارات الفوترة', true),
('overdue_grace_period_days', '7'::jsonb, 'billing', 'فترة السماح للفواتير المتأخرة بالأيام', true);