// =======================================================
// أنواع البيانات الموحدة لنظام SaaS
// تاريخ الإنشاء: 2025-01-15
// الهدف: توحيد جميع أنواع البيانات وحل التضارب
// =======================================================

// =======================================================
// الأنواع الأساسية (Base Types)
// =======================================================

export type Currency = 'KWD' | 'USD' | 'EUR' | 'SAR' | 'AED';

export type PaymentGateway = 'stripe' | 'sadad' | 'manual';

export type PaymentMethod = 
  | 'credit_card' 
  | 'debit_card' 
  | 'bank_transfer' 
  | 'sadad' 
  | 'cash' 
  | 'check';

export type SubscriptionStatus = 
  | 'trialing' 
  | 'active' 
  | 'past_due' 
  | 'canceled' 
  | 'unpaid' 
  | 'paused';

export type InvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'paid' 
  | 'overdue' 
  | 'canceled' 
  | 'void'
  | 'open'
  | 'uncollectible';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'succeeded' 
  | 'failed' 
  | 'canceled' 
  | 'refunded';

export type BillingCycle = 'monthly' | 'yearly';

export type InvoiceItemType = 
  | 'subscription' 
  | 'usage' 
  | 'addon' 
  | 'discount' 
  | 'tax';

// =======================================================
// واجهات خطط الاشتراك (Subscription Plans)
// =======================================================

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_name_en?: string;
  plan_code: string;
  description?: string;
  
  // الأسعار
  price_monthly: number;
  price_yearly: number;
  
  // الحدود والمواصفات
  max_tenants?: number;
  max_users_per_tenant: number;
  max_vehicles: number;
  max_contracts: number;
  storage_limit_gb: number;
  
  // الميزات
  features: string[];
  
  // إعدادات الخطة
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  
  // التوقيتات
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PlanFormData {
  plan_name: string;
  plan_name_en?: string;
  plan_code: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  max_tenants?: number;
  max_users_per_tenant: number;
  max_vehicles: number;
  max_contracts: number;
  storage_limit_gb: number;
  features: string[];
  is_popular?: boolean;
  sort_order?: number;
}

// =======================================================
// واجهات الاشتراكات (SaaS Subscriptions)
// =======================================================

export interface SaasSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  
  // معلومات الاشتراك
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  
  // فترات الاشتراك
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  trial_ends_at?: string;
  
  // معلومات الدفع
  amount: number;
  currency: Currency;
  discount_percentage: number;
  
  // إعدادات الاشتراك
  auto_renew: boolean;
  
  // معلومات الإلغاء
  canceled_at?: string;
  cancellation_reason?: string;
  
  // معلومات Stripe
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  
  // التوقيتات
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // العلاقات
  tenant?: {
    id: string;
    name: string;
    email?: string;
  };
  plan?: SubscriptionPlan;
}

export interface SubscriptionFormData {
  tenant_id: string;
  plan_id: string;
  billing_cycle: BillingCycle;
  trial_days?: number;
  discount_percentage?: number;
  auto_renew?: boolean;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  amount?: number;
}

export interface SubscriptionUpdateData {
  status?: SubscriptionStatus;
  billing_cycle?: BillingCycle;
  amount?: number;
  discount_percentage?: number;
  auto_renew?: boolean;
  cancellation_reason?: string;
  pause_collection?: boolean;
}

// =======================================================
// واجهات الفواتير (SaaS Invoices)
// =======================================================

export interface SaasInvoice {
  id: string;
  subscription_id: string;
  tenant_id: string;
  
  // معلومات الفاتورة
  invoice_number: string;
  status: InvoiceStatus;
  
  // المبالغ
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  currency: Currency;
  
  // فترة الفوترة
  billing_period_start: string;
  billing_period_end: string;
  
  // تواريخ مهمة
  invoice_date: string;
  due_date?: string;
  paid_at?: string;
  
  // معلومات إضافية
  description?: string;
  invoice_pdf_url?: string;
  metadata?: Record<string, any>;
  
  // معلومات Stripe
  stripe_invoice_id?: string;
  
  // التوقيتات
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // العلاقات
  subscription?: SaasSubscription;
  tenant?: {
    id: string;
    name: string;
    email?: string;
  };
  items?: SaasInvoiceItem[];
  payments?: SaasPayment[];
}

export interface SaasInvoiceItem {
  id: string;
  invoice_id: string;
  
  // معلومات العنصر
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  
  // نوع العنصر
  item_type: InvoiceItemType;
  
  // فترة العنصر
  period_start?: string;
  period_end?: string;
  
  // التوقيتات
  created_at: string;
}

export interface CreateInvoiceFormData {
  subscription_id: string;
  tenant_id: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  currency: Currency;
  billing_period_start: string;
  billing_period_end: string;
  due_date?: string;
  description?: string;
  items?: Omit<SaasInvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
}

// =======================================================
// واجهات المدفوعات (SaaS Payments)
// =======================================================

export interface SaasPayment {
  id: string;
  invoice_id: string;
  subscription_id: string;
  tenant_id: string;
  
  // معلومات الدفع
  amount: number;
  currency: Currency;
  
  // طريقة الدفع
  payment_method: PaymentMethod;
  payment_gateway?: PaymentGateway;
  
  // الحالة
  status: PaymentStatus;
  
  // معلومات الدفع الخارجي
  external_payment_id?: string;
  payment_reference?: string;
  
  // تواريخ مهمة
  payment_date: string;
  paid_at?: string;
  
  // معلومات إضافية
  failure_reason?: string;
  gateway_response?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // معلومات Stripe
  stripe_payment_intent_id?: string;
  
  // التوقيتات
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // العلاقات
  invoice?: SaasInvoice;
  subscription?: SaasSubscription;
  tenant?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface CreatePaymentFormData {
  invoice_id?: string;
  subscription_id?: string;
  tenant_id?: string;
  amount: number;
  currency: Currency;
  payment_method?: PaymentMethod;
  payment_gateway?: PaymentGateway;
  external_payment_id?: string;
  payment_reference?: string;
  payment_date?: string;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  expires_in_minutes?: number;
  metadata?: Record<string, any>;
}

// =======================================================
// واجهات استخدام المؤسسات (Tenant Usage)
// =======================================================

export interface TenantUsage {
  id: string;
  tenant_id: string;
  
  // تاريخ الاستخدام
  usage_date: string;
  
  // معلومات الاستخدام
  users_count: number;
  vehicles_count: number;
  contracts_count: number;
  storage_used_gb: number;
  api_calls_count: number;
  
  // التوقيتات
  created_at: string;
  updated_at: string;
  
  // العلاقات
  tenant?: {
    id: string;
    name: string;
  };
}

export interface UsageUpdateData {
  users_count?: number;
  vehicles_count?: number;
  contracts_count?: number;
  storage_used_gb?: number;
  api_calls_count?: number;
}

// =======================================================
// واجهات SADAD المدمجة
// =======================================================

export interface SadadPaymentRequest {
  invoice_id: string;
  subscription_id: string;
  tenant_id: string;
  amount: number;
  currency: Currency;
  customer_mobile?: string;
  customer_email?: string;
  bill_description: string;
  due_date?: string;
}

export interface SadadPaymentResponse {
  success: boolean;
  bill_id?: string;
  transaction_id?: string;
  payment_url?: string;
  qr_code?: string;
  error?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

// =======================================================
// واجهات الإحصائيات والتقارير
// =======================================================

export interface SaasBillingStats {
  // الإيرادات
  total_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  
  // الاشتراكات
  active_subscriptions: number;
  trial_subscriptions: number;
  canceled_subscriptions: number;
  total_subscriptions: number;
  
  // الفواتير
  pending_invoices: number;
  overdue_invoices: number;
  paid_invoices: number;
  total_invoices: number;
  
  // المؤسسات
  total_tenants: number;
  active_tenants: number;
  
  // معدلات النمو
  growth_rate: number;
  churn_rate: number;
  
  // متوسط القيم
  average_revenue_per_user: number;
  average_subscription_value: number;
}

export interface BillingAnalytics {
  period: string;
  revenue: number;
  subscriptions: number;
  payments: number;
  growth_percentage: number;
}

export interface SubscriptionAnalytics {
  plan_name: string;
  active_count: number;
  trial_count: number;
  canceled_count: number;
  revenue: number;
  percentage: number;
}

// =======================================================
// واجهات معالجة الفوترة التلقائية
// =======================================================

export interface BillingProcessResult {
  success: boolean;
  processed_count: number;
  failed_count: number;
  total_amount: number;
  results: Array<{
    subscription_id: string;
    tenant_name: string;
    invoice_number?: string;
    amount?: number;
    status: 'success' | 'error';
    error?: string;
  }>;
}

export interface AutoBillingSettings {
  enabled: boolean;
  billing_day: number; // يوم من الشهر
  retry_failed_payments: boolean;
  retry_attempts: number;
  send_notifications: boolean;
  grace_period_days: number;
}

// =======================================================
// دوال التحقق والمساعدة
// =======================================================

export const isValidCurrency = (currency: string): currency is Currency => {
  return ['KWD', 'USD', 'EUR', 'SAR', 'AED'].includes(currency);
};

export const isValidPaymentGateway = (gateway: string): gateway is PaymentGateway => {
  return ['stripe', 'sadad', 'manual'].includes(gateway);
};

export const isValidSubscriptionStatus = (status: string): status is SubscriptionStatus => {
  return ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'].includes(status);
};

export const isValidInvoiceStatus = (status: string): status is InvoiceStatus => {
  return ['draft', 'sent', 'paid', 'overdue', 'canceled', 'void'].includes(status);
};

export const isValidPaymentStatus = (status: string): status is PaymentStatus => {
  return ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'].includes(status);
};

// =======================================================
// دوال حساب المبالغ
// =======================================================

export const calculateInvoiceTotal = (
  subtotal: number, 
  taxAmount: number = 0, 
  discountAmount: number = 0
): number => {
  return Math.max(0, subtotal + taxAmount - discountAmount);
};

export const calculateTaxAmount = (
  amount: number, 
  taxRate: number = 0.05 // 5% ضريبة في الكويت
): number => {
  return Math.round((amount * taxRate) * 100) / 100;
};

export const calculateDiscountAmount = (
  amount: number, 
  discountPercentage: number
): number => {
  return Math.round((amount * discountPercentage / 100) * 100) / 100;
};

// =======================================================
// دوال تحويل التواريخ
// =======================================================

export const formatCurrency = (
  amount: number, 
  currency: Currency = 'KWD'
): string => {
  const formatter = new Intl.NumberFormat('ar-KW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

export const calculateNextBillingDate = (
  currentDate: Date, 
  billingCycle: BillingCycle
): Date => {
  const nextDate = new Date(currentDate);
  
  if (billingCycle === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  
  return nextDate;
};

export const calculatePeriodEnd = (
  periodStart: Date, 
  billingCycle: BillingCycle
): Date => {
  const periodEnd = new Date(periodStart);
  
  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
  }
  
  return periodEnd;
};

// =======================================================
// دوال التحقق من الحدود
// =======================================================

export const checkSubscriptionLimits = (
  plan: SubscriptionPlan, 
  usage: TenantUsage
): {
  withinLimits: boolean;
  violations: string[];
} => {
  const violations: string[] = [];
  
  if (usage.users_count > plan.max_users_per_tenant) {
    violations.push(`تم تجاوز حد المستخدمين: ${usage.users_count}/${plan.max_users_per_tenant}`);
  }
  
  if (usage.vehicles_count > plan.max_vehicles) {
    violations.push(`تم تجاوز حد المركبات: ${usage.vehicles_count}/${plan.max_vehicles}`);
  }
  
  if (usage.contracts_count > plan.max_contracts) {
    violations.push(`تم تجاوز حد العقود: ${usage.contracts_count}/${plan.max_contracts}`);
  }
  
  if (usage.storage_used_gb > plan.storage_limit_gb) {
    violations.push(`تم تجاوز حد التخزين: ${usage.storage_used_gb}GB/${plan.storage_limit_gb}GB`);
  }
  
  return {
    withinLimits: violations.length === 0,
    violations
  };
};

// =======================================================
// ثوابت النظام
// =======================================================

export const SAAS_CONSTANTS = {
  // الحد الأدنى والأقصى للأسعار
  MIN_PRICE: 0,
  MAX_PRICE: 99999.99,
  
  // معدل الضريبة الافتراضي في الكويت
  DEFAULT_TAX_RATE: 0.05,
  
  // العملة الافتراضية
  DEFAULT_CURRENCY: 'KWD' as Currency,
  
  // دورة الفوترة الافتراضية
  DEFAULT_BILLING_CYCLE: 'monthly' as BillingCycle,
  
  // فترة التجربة الافتراضية (أيام)
  DEFAULT_TRIAL_DAYS: 14,
  
  // فترة السماح للدفع (أيام)
  DEFAULT_GRACE_PERIOD: 3,
  
  // عدد محاولات إعادة الدفع
  DEFAULT_RETRY_ATTEMPTS: 3,
  
  // الحدود الافتراضية للخطة الأساسية
  DEFAULT_LIMITS: {
    users: 10,
    vehicles: 25,
    contracts: 100,
    storage_gb: 5,
  },
} as const;

// =======================================================
// ملاحظات نهائية
// =======================================================

// =======================================================
// مرشحات وإحصائيات المدفوعات
// =======================================================

export interface PaymentFilters {
  tenant_id?: string;
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
  from_date?: string;
  to_date?: string;
  min_amount?: number;
  max_amount?: number;
  limit?: number;
}

export interface PaymentStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_amount: number;
  success_rate: number;
  average_payment_amount: number;
  saas_stats?: {
    total: number;
    succeeded: number;
    failed: number;
    pending: number;
    amount: number;
  };
  sadad_stats?: {
    total: number;
    succeeded: number;
    failed: number;
    pending: number;
    amount: number;
  };
}

// =======================================================
// أنواع SADAD المدمجة
// =======================================================

export interface SadadPayment {
  id: string;
  tenant_id: string;
  saas_invoice_id?: string;
  subscription_id?: string;
  
  // معلومات العميل
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  
  // معلومات الدفع
  amount: number;
  currency: Currency;
  description?: string;
  
  // حالة SADAD
  sadad_status: 'pending' | 'processing' | 'paid' | 'failed' | 'expired' | 'cancelled';
  
  // معلومات المعاملة
  sadad_transaction_id?: string;
  sadad_reference_number?: string;
  sadad_bill_id?: string;
  
  // التوقيتات
  expires_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SadadSettingsFormData {
  merchant_id: string;
  merchant_key: string;
  api_url: string;
  is_sandbox: boolean;
  is_active: boolean;
}

/*
هذا الملف يحتوي على جميع أنواع البيانات الموحدة لنظام SaaS
تم تصميمه ليكون:
1. شامل ومفصل
2. متوافق مع مخطط قاعدة البيانات الجديد
3. يحل جميع التضاربات السابقة
4. سهل الاستخدام والصيانة
5. يدعم التوسعات المستقبلية

يجب استخدام هذا الملف كمرجع وحيد لجميع أنواع البيانات
المتعلقة بنظام SaaS في التطبيق.
*/