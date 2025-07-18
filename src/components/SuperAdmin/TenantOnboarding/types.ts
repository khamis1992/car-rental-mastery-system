import { z } from 'zod';

export const tenantOnboardingSchema = z.object({
  // معلومات المؤسسة الأساسية
  name: z.string()
    .min(2, 'اسم المؤسسة يجب أن يكون على الأقل حرفين')
    .max(100, 'اسم المؤسسة يجب أن يكون أقل من 100 حرف'),
  
  slug: z.string()
    .min(2, 'المعرف الفريد يجب أن يكون على الأقل حرفين')
    .max(50, 'المعرف الفريد يجب أن يكون أقل من 50 حرف')
    .regex(/^[a-z0-9-]+$/, 'المعرف الفريد يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  
  // معلومات الاتصال
  contact_email: z.string()
    .email('البريد الإلكتروني غير صالح')
    .min(1, 'البريد الإلكتروني مطلوب'),
  
  contact_phone: z.string()
    .min(8, 'رقم الهاتف يجب أن يكون على الأقل 8 أرقام')
    .max(20, 'رقم الهاتف يجب أن يكون أقل من 20 رقم')
    .optional(),
  
  // العنوان والموقع
  address: z.string()
    .max(500, 'العنوان يجب أن يكون أقل من 500 حرف')
    .optional(),
  
  city: z.string()
    .max(100, 'اسم المدينة يجب أن يكون أقل من 100 حرف')
    .optional(),
  
  country: z.string()
    .min(1, 'البلد مطلوب')
    .max(100, 'اسم البلد يجب أن يكون أقل من 100 حرف'),
  
  // الإعدادات الفنية
  timezone: z.string()
    .min(1, 'المنطقة الزمنية مطلوبة'),
  
  currency: z.string()
    .min(1, 'العملة مطلوبة')
    .max(10, 'رمز العملة يجب أن يكون أقل من 10 أحرف'),
  
  // خطة الاشتراك
  subscription_plan: z.enum(['basic', 'standard', 'premium', 'enterprise'], {
    errorMap: () => ({ message: 'يجب اختيار خطة اشتراك صالحة' })
  }),
  
  // معلومات المدير
  admin_user: z.object({
    email: z.string()
      .email('البريد الإلكتروني للمدير غير صالح')
      .min(1, 'بريد المدير الإلكتروني مطلوب'),
    
    password: z.string()
      .min(8, 'كلمة المرور يجب أن تكون على الأقل 8 أحرف')
      .max(100, 'كلمة المرور يجب أن تكون أقل من 100 حرف')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حرف صغير وكبير ورقم على الأقل'),
    
    full_name: z.string()
      .min(2, 'الاسم الكامل يجب أن يكون على الأقل حرفين')
      .max(100, 'الاسم الكامل يجب أن يكون أقل من 100 حرف'),
  }),
  
  // الحدود والقيود (اختيارية - ستتم معالجتها تلقائياً حسب خطة الاشتراك)
  max_users: z.number().optional(),
  max_vehicles: z.number().optional(),
  max_contracts: z.number().optional(),
});

export type TenantOnboardingFormData = z.infer<typeof tenantOnboardingSchema>;

// خطط الاشتراك المتاحة
export const subscriptionPlans = {
  basic: {
    name: 'أساسي',
    name_en: 'Basic',
    max_users: 10,
    max_vehicles: 50,
    max_contracts: 100,
    color: 'bg-gray-100 text-gray-800',
    features: ['إدارة أساسية للمركبات', 'تقارير بسيطة', 'دعم عبر البريد الإلكتروني'],
  },
  standard: {
    name: 'معياري',
    name_en: 'Standard',
    max_users: 25,
    max_vehicles: 100,
    max_contracts: 250,
    color: 'bg-blue-100 text-blue-800',
    features: ['جميع مميزات الأساسي', 'تقارير متقدمة', 'إدارة متعددة المستخدمين', 'دعم هاتفي'],
  },
  premium: {
    name: 'مميز',
    name_en: 'Premium',
    max_users: 50,
    max_vehicles: 200,
    max_contracts: 500,
    color: 'bg-purple-100 text-purple-800',
    features: ['جميع مميزات المعياري', 'تحليلات متقدمة', 'API للتكامل', 'دعم أولوي'],
  },
  enterprise: {
    name: 'مؤسسي',
    name_en: 'Enterprise',
    max_users: 100,
    max_vehicles: 500,
    max_contracts: 1000,
    color: 'bg-amber-100 text-amber-800',
    features: ['جميع المميزات', 'تخصيص كامل', 'دعم مخصص', 'تدريب مخصص'],
  }
} as const;

export type SubscriptionPlanKey = keyof typeof subscriptionPlans;