import { z } from 'zod';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanCode } from '@/types/subscription-plans';

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
  subscription_plan: z.enum(['basic', 'standard', 'premium', 'enterprise'] as const, {
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

// استخدام خطط الاشتراك الموحدة
export const subscriptionPlans = SUBSCRIPTION_PLANS;
export type SubscriptionPlanKey = SubscriptionPlanCode;