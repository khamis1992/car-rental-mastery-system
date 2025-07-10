// أنواع البيانات لنظام SaaS

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

export interface SaasSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'paused';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  canceled_at?: string;
  pause_collection?: any;
  
  // Relations
  tenant?: any;
  plan?: SubscriptionPlan;
}

export interface SaasInvoice {
  id: string;
  subscription_id: string;
  tenant_id: string;
  stripe_invoice_id?: string;
  invoice_number: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  invoice_pdf_url?: string;
  description?: string;
  metadata?: any;
  
  // Relations
  subscription?: SaasSubscription;
  tenant?: any;
  items?: SaasInvoiceItem[];
  payments?: SaasPayment[];
}

export interface SaasInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  amount: number;
  quantity: number;
  unit_price: number;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export interface SaasPayment {
  id: string;
  invoice_id: string;
  subscription_id: string;
  tenant_id: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: 'processing' | 'succeeded' | 'failed' | 'canceled' | 'requires_action';
  payment_method?: string;
  paid_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  
  // Relations
  invoice?: SaasInvoice;
  subscription?: SaasSubscription;
  tenant?: any;
}

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

export interface SubscriptionFormData {
  tenant_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  amount: number;
  currency: string;
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