// تكوين موحد لنظام الفوترة والاشتراكات
// يحتوي على جميع الإعدادات والثوابت المشتركة

import type { Currency, PaymentGateway } from '@/types/unified-billing';

// ===== الثوابت العامة =====

export const BILLING_CONFIG = {
  // العملات المدعومة
  SUPPORTED_CURRENCIES: ['KWD', 'USD', 'EUR'] as const,
  
  // العملة الافتراضية
  DEFAULT_CURRENCY: 'KWD' as Currency,
  
  // بوابات الدفع المدعومة
  SUPPORTED_GATEWAYS: ['stripe', 'sadad'] as const,
  
  // أقل وأكبر مبلغ للدفع
  MIN_PAYMENT_AMOUNT: 0.001,
  MAX_PAYMENT_AMOUNT: 999999.999,
  
  // مدة انتهاء الصلاحية الافتراضية (بالدقائق)
  DEFAULT_PAYMENT_EXPIRY_MINUTES: 1440, // 24 ساعة
  MAX_PAYMENT_EXPIRY_MINUTES: 10080, // أسبوع
  
  // أحجام الدفعات للاستعلامات
  DEFAULT_BATCH_SIZE: 100,
  MAX_BATCH_SIZE: 1000,
  
  // أوقات انتهاء الذاكرة المؤقتة
  CACHE_TTL: {
    PLANS: 5 * 60 * 1000, // 5 دقائق
    STATS: 5 * 60 * 1000, // 5 دقائق
    SETTINGS: 10 * 60 * 1000, // 10 دقائق
  },
  
  // حدود إعادة المحاولة
  RETRY_LIMITS: {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    BACKOFF_MULTIPLIER: 2,
  },
} as const;

// ===== إعدادات SADAD =====

export const SADAD_CONFIG = {
  // نمط رقم الهاتف الكويتي
  PHONE_REGEX: /^(\+965|965)?[569][0-9]{7}$/,
  
  // نمط البريد الإلكتروني
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // أحداث الـ webhook المدعومة
  WEBHOOK_EVENTS: [
    'payment.completed',
    'payment.failed', 
    'payment.expired',
    'payment.cancelled'
  ] as const,
  
  // حالات الدفع المختلفة
  PAYMENT_STATUSES: [
    'pending',
    'processing', 
    'paid',
    'failed',
    'expired',
    'cancelled'
  ] as const,
  
  // URLs افتراضية للبيئة التجريبية والإنتاج
  SANDBOX_URL: 'https://sandbox.sadad.qa/api/v1',
  PRODUCTION_URL: 'https://api.sadad.qa/v1',
  
  // أقصى طول للوصف
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// ===== إعدادات Stripe =====

export const STRIPE_CONFIG = {
  // العملات المدعومة في Stripe
  SUPPORTED_CURRENCIES: ['USD', 'EUR'] as const,
  
  // أنواع طرق الدفع المدعومة
  PAYMENT_METHODS: [
    'card',
    'bank_transfer',
    'wallet'
  ] as const,
  
  // إعدادات webhook
  WEBHOOK_TOLERANCE: 600, // 10 دقائق
  
  // حدود المبلغ
  MIN_AMOUNT_USD: 0.50,
  MIN_AMOUNT_EUR: 0.50,
} as const;

// ===== إعدادات الاشتراكات =====

export const SUBSCRIPTION_CONFIG = {
  // أنواع دورات الفوترة
  BILLING_CYCLES: ['monthly', 'yearly'] as const,
  
  // حالات الاشتراك
  STATUSES: [
    'active',
    'paused', 
    'canceled',
    'expired',
    'trialing',
    'past_due',
    'unpaid'
  ] as const,
  
  // مدة التجربة الافتراضية (بالأيام)
  DEFAULT_TRIAL_DAYS: 14,
  
  // تحذير انتهاء الاشتراك (بالأيام)
  EXPIRY_WARNING_DAYS: 7,
  
  // حد أقصى لعدد الخطط
  MAX_PLANS_PER_TENANT: 10,
} as const;

// ===== إعدادات الفواتير =====

export const INVOICE_CONFIG = {
  // حالات الفاتورة
  STATUSES: [
    'draft',
    'open',
    'paid',
    'uncollectible', 
    'void',
    'sent',
    'overdue'
  ] as const,
  
  // أنواع عناصر الفاتورة
  ITEM_TYPES: [
    'subscription',
    'usage', 
    'addon',
    'discount'
  ] as const,
  
  // إعدادات أرقام الفواتير
  INVOICE_NUMBER_PREFIX: 'SAAS-',
  INVOICE_NUMBER_LENGTH: 6,
  
  // مدة استحقاق الفاتورة الافتراضية (بالأيام)
  DEFAULT_DUE_DAYS: 30,
  
  // تحذير استحقاق الفاتورة (بالأيام)
  DUE_WARNING_DAYS: 3,
} as const;

// ===== رسائل الخطأ المحلية =====

export const ERROR_MESSAGES = {
  VALIDATION: {
    INVALID_AMOUNT: 'المبلغ يجب أن يكون بين {min} و {max}',
    INVALID_CURRENCY: 'العملة يجب أن تكون واحدة من: {currencies}',
    INVALID_EMAIL: 'تنسيق البريد الإلكتروني غير صحيح',
    INVALID_PHONE: 'تنسيق رقم الهاتف غير صحيح',
    DESCRIPTION_TOO_LONG: 'الوصف لا يمكن أن يتجاوز {maxLength} حرف',
    INVALID_EXPIRY: 'مدة انتهاء الصلاحية يجب أن تكون بين {min} و {max} دقيقة',
  },
  
  PAYMENT: {
    NOT_FOUND: 'الدفعة غير موجودة',
    ALREADY_PROCESSED: 'تم معالجة الدفعة بالفعل',
    EXPIRED: 'انتهت صلاحية الدفعة',
    GATEWAY_ERROR: 'خطأ في بوابة الدفع',
    INSUFFICIENT_FUNDS: 'الرصيد غير كافي',
  },
  
  SUBSCRIPTION: {
    NOT_FOUND: 'الاشتراك غير موجود',
    ALREADY_CANCELED: 'تم إلغاء الاشتراك بالفعل',
    EXPIRED: 'انتهت صلاحية الاشتراك',
    LIMIT_EXCEEDED: 'تم تجاوز حد الاشتراكات المسموح',
  },
  
  INVOICE: {
    NOT_FOUND: 'الفاتورة غير موجودة',
    ALREADY_PAID: 'تم دفع الفاتورة بالفعل',
    OVERDUE: 'الفاتورة متأخرة الدفع',
    VOID: 'الفاتورة ملغاة',
  },
  
  GENERAL: {
    UNAUTHORIZED: 'غير مصرح بالوصول',
    NOT_AUTHENTICATED: 'المستخدم غير مسجل دخول',
    SERVER_ERROR: 'خطأ في الخادم',
    NETWORK_ERROR: 'خطأ في الشبكة',
    UNKNOWN_ERROR: 'خطأ غير معروف',
  },
} as const;

// ===== دوال مساعدة للتكوين =====

export const formatErrorMessage = (
  template: string, 
  params: Record<string, string | number>
): string => {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
};

export const getPaymentExpiryTime = (minutes?: number): Date => {
  const expiryMinutes = minutes || BILLING_CONFIG.DEFAULT_PAYMENT_EXPIRY_MINUTES;
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  return SADAD_CONFIG.PHONE_REGEX.test(phone.replace(/\s|-/g, ''));
};

export const isValidEmail = (email: string): boolean => {
  return SADAD_CONFIG.EMAIL_REGEX.test(email);
};

export const validatePaymentAmount = (
  amount: number, 
  currency: Currency = BILLING_CONFIG.DEFAULT_CURRENCY
): boolean => {
  if (currency === 'USD' && amount < STRIPE_CONFIG.MIN_AMOUNT_USD) {
    return false;
  }
  if (currency === 'EUR' && amount < STRIPE_CONFIG.MIN_AMOUNT_EUR) {
    return false;
  }
  
  return amount >= BILLING_CONFIG.MIN_PAYMENT_AMOUNT && 
         amount <= BILLING_CONFIG.MAX_PAYMENT_AMOUNT;
};

export const getSadadApiUrl = (isSandbox: boolean): string => {
  return isSandbox ? SADAD_CONFIG.SANDBOX_URL : SADAD_CONFIG.PRODUCTION_URL;
};

export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `${INVOICE_CONFIG.INVOICE_NUMBER_PREFIX}${timestamp.slice(-6)}${random.toUpperCase()}`;
};

// ===== أنواع التكوين المصدرة =====

export type BillingConfigType = typeof BILLING_CONFIG;
export type SadadConfigType = typeof SADAD_CONFIG;
export type StripeConfigType = typeof STRIPE_CONFIG;
export type SubscriptionConfigType = typeof SUBSCRIPTION_CONFIG;
export type InvoiceConfigType = typeof INVOICE_CONFIG;