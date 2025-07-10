// ملف موحد لجميع أنواع البيانات المتعلقة بالفوترة والاشتراكات
// تم إنشاؤه لتوحيد التعريفات المتضاربة وتحسين التنظيم

// ===== الأنواع الأساسية =====

export type Currency = 'KWD' | 'USD' | 'EUR';
export type PaymentGateway = 'stripe' | 'sadad';
export type PaymentMethod = 'stripe' | 'sadad' | 'manual' | 'bank_transfer';

export type SubscriptionStatus = 
  | 'active' 
  | 'paused' 
  | 'canceled' 
  | 'expired' 
  | 'trialing' 
  | 'past_due' 
  | 'unpaid';

export type InvoiceStatus = 
  | 'draft' 
  | 'open' 
  | 'paid' 
  | 'uncollectible' 
  | 'void' 
  | 'sent' 
  | 'overdue';

export type PaymentStatus = 
  | 'processing' 
  | 'succeeded' 
  | 'failed' 
  | 'canceled' 
  | 'requires_action';

export type SadadPaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'paid' 
  | 'failed' 
  | 'expired' 
  | 'cancelled';

export type BillingCycle = 'monthly' | 'yearly';

// ===== أنواع خطط الاشتراك =====

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_name_en?: string;
  plan_code: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_tenants?: number;
  max_users_per_tenant?: number;
  max_vehicles?: number;
  max_contracts?: number;
  storage_limit_gb?: number;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
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
  features: string[];
  max_tenants?: number;
  max_users_per_tenant?: number;
  max_vehicles?: number;
  max_contracts?: number;
  storage_limit_gb?: number;
  is_popular: boolean;
  sort_order: number;
}

// ===== أنواع الاشتراكات =====

export interface BaseSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  amount: number;
  currency: Currency;
  created_at: string;
  updated_at: string;
  canceled_at?: string;
  pause_collection?: any;
}

export interface SaasSubscription extends BaseSubscription {
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  
  // Relations
  plan?: SubscriptionPlan;
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SubscriptionFormData {
  tenant_id: string;
  plan_id: string;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  amount: number;
  currency: Currency;
}

// ===== أنواع الفواتير =====

export interface BaseInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface SaasInvoiceItem extends BaseInvoiceItem {
  item_type: 'subscription' | 'usage' | 'addon' | 'discount';
  period_start?: string;
  period_end?: string;
}

export interface BaseInvoice {
  id: string;
  subscription_id: string;
  tenant_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: Currency;
  billing_period_start: string;
  billing_period_end: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface SaasInvoice extends BaseInvoice {
  stripe_invoice_id?: string;
  invoice_pdf_url?: string;
  
  // Relations
  subscription?: SaasSubscription;
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
  items?: SaasInvoiceItem[];
  payments?: SaasPayment[];
}

// ===== أنواع المدفوعات =====

export interface BasePayment {
  id: string;
  invoice_id: string;
  subscription_id: string;
  tenant_id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_gateway?: PaymentGateway;
  paid_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  // خصائص إضافية للتوافق مع الكود الحالي
  payment_reference?: string;
  payment_date?: string;
  created_by?: string;
  gateway_response?: Record<string, any>;
}

export interface SaasPayment extends BasePayment {
  stripe_payment_intent_id?: string;
  sadad_transaction_id?: string;
  sadad_bill_id?: string;
  
  // Relations
  invoice?: SaasInvoice;
  subscription?: SaasSubscription;
  tenant?: {
    id: string;
    name: string;
  };
}

// ===== أنواع SADAD =====

export interface SadadSettings {
  id: string;
  merchant_id: string;
  merchant_key: string;
  api_url: string;
  is_sandbox: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SadadPayment {
  id: string;
  tenant_id: string;
  saas_invoice_id?: string;
  subscription_id?: string;
  
  // معلومات SADAD
  sadad_transaction_id?: string;
  sadad_reference_number?: string;
  sadad_status: SadadPaymentStatus;
  
  // معلومات الدفعة
  amount: number;
  currency: Currency;
  description?: string;
  
  // معلومات العميل
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  
  // معلومات الاستجابة من SADAD
  sadad_response?: any;
  payment_url?: string;
  
  // تواريخ
  expires_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SadadWebhookEvent {
  id: string;
  event_type: string;
  sadad_transaction_id?: string;
  payment_id?: string;
  event_data: any;
  processed: boolean;
  created_at: string;
}

export interface SadadTransactionLog {
  id: string;
  payment_id: string;
  action: string;
  request_data?: any;
  response_data?: any;
  status: string;
  error_message?: string;
  created_at: string;
}

// ===== أنواع البيانات لطلبات SADAD API =====

export interface SadadCreatePaymentRequest {
  amount: number;
  currency: Currency;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  return_url: string;
  cancel_url: string;
  webhook_url?: string;
  expires_in_minutes?: number;
}

export interface SadadCreatePaymentResponse {
  success: boolean;
  transaction_id?: string;
  reference_number?: string;
  payment_url?: string;
  expires_at?: string;
  error?: string;
  error_code?: string;
}

export interface SadadPaymentStatusResponse {
  success: boolean;
  transaction_id?: string;
  status?: string;
  amount?: number;
  currency?: Currency;
  paid_at?: string;
  error?: string;
  error_code?: string;
}

// ===== أنواع البيانات للـ webhook =====

export interface SadadWebhookPayload {
  event_type: 'payment.completed' | 'payment.failed' | 'payment.expired' | 'payment.cancelled';
  transaction_id: string;
  reference_number?: string;
  status: string;
  amount?: number;
  currency?: Currency;
  paid_at?: string;
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  additional_data?: any;
}

// ===== نماذج البيانات للنماذج =====

export interface SadadSettingsFormData {
  merchant_id: string;
  merchant_key: string;
  api_url: string;
  is_sandbox: boolean;
  is_active: boolean;
}

export interface CreateSadadPaymentFormData {
  saas_invoice_id?: string;
  subscription_id?: string;
  amount: number;
  currency: Currency;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  expires_in_minutes?: number;
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
}

export interface CreatePaymentFormData {
  invoice_id: string;
  subscription_id: string;
  tenant_id: string;
  amount: number;
  currency: Currency;
  payment_method?: PaymentMethod;
  payment_gateway?: PaymentGateway;
  sadad_transaction_id?: string;
  sadad_bill_id?: string;
}

// ===== أنواع الإحصائيات =====

export interface SadadStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_amount: number;
  success_rate: number;
  average_payment_amount: number;
}

export interface SaasBillingStats {
  total_revenue: number;
  monthly_revenue: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  canceled_subscriptions: number;
  overdue_invoices: number;
  total_tenants: number;
  growth_rate: number;
}

// ===== أنواع الاستخدام =====

export interface TenantUsage {
  id: string;
  tenant_id: string;
  usage_date: string;
  users_count: number;
  vehicles_count: number;
  contracts_count: number;
  storage_used_gb: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  tenant?: any;
}

// ===== أنواع التكوين =====

export interface SadadConfig {
  merchant_id: string;
  merchant_key: string;
  api_url: string;
  webhook_secret?: string;
  timeout_seconds?: number;
  max_retries?: number;
}

// ===== أنواع معالجة الفوترة =====

export interface BillingProcessResult {
  success: boolean;
  message: string;
  summary?: {
    total: number;
    success: number;
    errors: number;
  };
  results?: Array<{
    subscription_id: string;
    tenant_name: string;
    invoice_number?: string;
    amount?: number;
    status: 'success' | 'error';
    error?: string;
  }>;
}

// ===== أنواع طلبات الدفع الموحدة =====

export interface UnifiedPaymentRequest {
  invoice_id: string;
  subscription_id: string;
  tenant_id: string;
  amount: number;
  currency: Currency;
  customer_mobile?: string;
  customer_email?: string;
  bill_description: string;
  due_date?: string;
  expires_in_minutes?: number;
  gateway: PaymentGateway;
}

// نوع منفصل لطلبات SADAD (بدون gateway مطلوب)
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
  expires_in_minutes?: number;
}

export interface UnifiedPaymentResponse {
  success: boolean;
  payment_id?: string;
  bill_id?: string;
  transaction_id?: string;
  reference_number?: string;
  payment_url?: string;
  qr_code?: string;
  expires_at?: string;
  error?: string;
  error_code?: string;
  message?: string;
}

// ===== دوال التحقق من الأنواع =====

export const isValidCurrency = (currency: string): currency is Currency => {
  return ['KWD', 'USD', 'EUR'].includes(currency);
};

export const isValidPaymentGateway = (gateway: string): gateway is PaymentGateway => {
  return ['stripe', 'sadad'].includes(gateway);
};

export const isValidSubscriptionStatus = (status: string): status is SubscriptionStatus => {
  return ['active', 'paused', 'canceled', 'expired', 'trialing', 'past_due', 'unpaid'].includes(status);
};

export const isValidInvoiceStatus = (status: string): status is InvoiceStatus => {
  return ['draft', 'open', 'paid', 'uncollectible', 'void', 'sent', 'overdue'].includes(status);
};

export const isValidPaymentStatus = (status: string): status is PaymentStatus => {
  return ['processing', 'succeeded', 'failed', 'canceled', 'requires_action'].includes(status);
};

export const isValidSadadPaymentStatus = (status: string): status is SadadPaymentStatus => {
  return ['pending', 'processing', 'paid', 'failed', 'expired', 'cancelled'].includes(status);
};