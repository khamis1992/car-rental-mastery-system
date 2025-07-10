export interface SaasSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'paused' | 'canceled' | 'expired' | 'trialing' | 'past_due' | 'unpaid';
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
  plan?: {
    id: string;
    plan_name: string;
    price_monthly: number;
    price_yearly: number;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SaasInvoice {
  id: string;
  subscription_id: string;
  tenant_id: string;
  stripe_invoice_id?: string;
  invoice_number: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  invoice_pdf_url?: string;
  description?: string;
  metadata?: Record<string, any>;
  
  // Relations
  subscription?: SaasSubscription;
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
  items?: SaasInvoiceItem[];
}

export interface SaasInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: 'subscription' | 'usage' | 'addon' | 'discount';
  created_at: string;
}

export interface SaasPayment {
  id: string;
  invoice_id: string;
  tenant_id: string;
  amount: number;
  payment_method: string;
  payment_reference?: string;
  payment_date: string;
  status: 'processing' | 'succeeded' | 'failed' | 'canceled' | 'requires_action';
  gateway_response?: Record<string, any>;
  created_at: string;
  created_by?: string;
  paid_at?: string;
  
  // Relations
  invoice?: SaasInvoice;
  tenant?: {
    id: string;
    name: string;
  };
}

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