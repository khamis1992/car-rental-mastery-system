// =======================================================
// تعريفات خطط الاشتراك الموحدة
// تطابق قاعدة البيانات 100%
// =======================================================

export type SubscriptionPlanCode = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface SubscriptionPlanLimits {
  max_users_per_tenant: number;
  max_vehicles: number;
  max_contracts: number;
  storage_limit_gb: number;
}

export interface SubscriptionPlanInfo {
  name: string;
  name_en: string;
  code: SubscriptionPlanCode;
  description: string;
  price_monthly: number;
  price_yearly: number;
  limits: SubscriptionPlanLimits;
  features: string[];
  color: string;
  is_popular: boolean;
  sort_order: number;
}

// =======================================================
// خطط الاشتراك الافتراضية (تطابق قاعدة البيانات)
// =======================================================

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanCode, SubscriptionPlanInfo> = {
  basic: {
    name: 'أساسي',
    name_en: 'Basic',
    code: 'basic',
    description: 'خطة مثالية للشركات الصغيرة التي تبدأ في إدارة أسطول السيارات',
    price_monthly: 29.999,
    price_yearly: 299.990,
    limits: {
      max_users_per_tenant: 10,
      max_vehicles: 50,
      max_contracts: 100,
      storage_limit_gb: 5,
    },
    features: [
      'إدارة أساسية للمركبات',
      'تقارير بسيطة',
      'دعم عبر البريد الإلكتروني',
      'إدارة العقود الأساسية',
      'تتبع المدفوعات'
    ],
    color: 'bg-gray-100 text-gray-800',
    is_popular: false,
    sort_order: 1,
  },

  standard: {
    name: 'معياري',
    name_en: 'Standard',
    code: 'standard',
    description: 'خطة متوازنة للشركات المتوسطة مع ميزات متقدمة',
    price_monthly: 49.999,
    price_yearly: 499.990,
    limits: {
      max_users_per_tenant: 25,
      max_vehicles: 100,
      max_contracts: 250,
      storage_limit_gb: 10,
    },
    features: [
      'جميع مميزات الأساسي',
      'تقارير متقدمة',
      'إدارة متعددة المستخدمين',
      'دعم هاتفي',
      'إشعارات SMS',
      'تحليلات مالية',
      'إدارة الصيانة'
    ],
    color: 'bg-blue-100 text-blue-800',
    is_popular: true,
    sort_order: 2,
  },

  premium: {
    name: 'مميز',
    name_en: 'Premium',
    code: 'premium',
    description: 'خطة شاملة للشركات الكبيرة مع جميع الميزات المتقدمة',
    price_monthly: 79.999,
    price_yearly: 799.990,
    limits: {
      max_users_per_tenant: 50,
      max_vehicles: 200,
      max_contracts: 500,
      storage_limit_gb: 25,
    },
    features: [
      'جميع مميزات المعياري',
      'تحليلات متقدمة',
      'API للتكامل',
      'دعم أولوي',
      'تخصيص التقارير',
      'إدارة المخالفات',
      'نظام CRM متقدم',
      'تكامل مع الأنظمة الخارجية'
    ],
    color: 'bg-purple-100 text-purple-800',
    is_popular: false,
    sort_order: 3,
  },

  enterprise: {
    name: 'مؤسسي',
    name_en: 'Enterprise',
    code: 'enterprise',
    description: 'حل مؤسسي كامل مع دعم مخصص وميزات غير محدودة',
    price_monthly: 149.999,
    price_yearly: 1499.990,
    limits: {
      max_users_per_tenant: 100,
      max_vehicles: 500,
      max_contracts: 1000,
      storage_limit_gb: 100,
    },
    features: [
      'جميع المميزات',
      'مستخدمين غير محدود',
      'تخصيص كامل',
      'دعم مخصص 24/7',
      'تدريب مخصص',
      'استشارات فنية',
      'SLA مضمون',
      'تطوير مخصص'
    ],
    color: 'bg-amber-100 text-amber-800',
    is_popular: false,
    sort_order: 4,
  },
};

// =======================================================
// دوال مساعدة
// =======================================================

/**
 * الحصول على معلومات خطة اشتراك
 */
export const getSubscriptionPlan = (code: SubscriptionPlanCode): SubscriptionPlanInfo => {
  return SUBSCRIPTION_PLANS[code];
};

/**
 * الحصول على جميع خطط الاشتراك كمصفوفة مرتبة
 */
export const getAllSubscriptionPlans = (): SubscriptionPlanInfo[] => {
  return Object.values(SUBSCRIPTION_PLANS).sort((a, b) => a.sort_order - b.sort_order);
};

/**
 * الحصول على خطط الاشتراك النشطة فقط
 */
export const getActiveSubscriptionPlans = (): SubscriptionPlanInfo[] => {
  return getAllSubscriptionPlans(); // جميع الخطط نشطة حالياً
};

/**
 * الحصول على الخطة الأكثر شعبية
 */
export const getPopularPlan = (): SubscriptionPlanInfo => {
  return SUBSCRIPTION_PLANS.standard;
};

/**
 * تنسيق السعر بالعملة الكويتية
 */
export const formatPrice = (price: number, currency = 'KWD'): string => {
  return new Intl.NumberFormat('ar-KW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(price);
};

/**
 * حساب نسبة التوفير للاشتراك السنوي
 */
export const calculateYearlySavings = (plan: SubscriptionPlanInfo): number => {
  const monthlyTotal = plan.price_monthly * 12;
  const yearlyTotal = plan.price_yearly;
  return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
};

/**
 * التحقق من صحة كود الخطة
 */
export const isValidPlanCode = (code: string): code is SubscriptionPlanCode => {
  return ['basic', 'standard', 'premium', 'enterprise'].includes(code);
};

/**
 * مقارنة خطتين
 */
export const comparePlans = (plan1: SubscriptionPlanCode, plan2: SubscriptionPlanCode): number => {
  const p1 = SUBSCRIPTION_PLANS[plan1];
  const p2 = SUBSCRIPTION_PLANS[plan2];
  return p1.sort_order - p2.sort_order;
};

// =======================================================
// أنواع إضافية للـ forms والـ components
// =======================================================

export interface PlanSelectOption {
  value: SubscriptionPlanCode;
  label: string;
  description: string;
  price: string;
  popular?: boolean;
}

/**
 * تحويل خطط الاشتراك لخيارات Select
 */
export const getSubscriptionPlanOptions = (): PlanSelectOption[] => {
  return getAllSubscriptionPlans().map(plan => ({
    value: plan.code,
    label: plan.name,
    description: plan.description,
    price: formatPrice(plan.price_monthly),
    popular: plan.is_popular,
  }));
};

// =======================================================
// ثوابت مفيدة
// =======================================================

export const PLAN_COLORS = {
  basic: 'bg-gray-100 text-gray-800',
  standard: 'bg-blue-100 text-blue-800',
  premium: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-amber-100 text-amber-800',
} as const;

export const PLAN_NAMES = {
  basic: 'أساسي',
  standard: 'معياري',
  premium: 'مميز',
  enterprise: 'مؤسسي',
} as const;

export const PLAN_NAMES_EN = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
  enterprise: 'Enterprise',
} as const; 