// أنواع البيانات لنظام SADAD

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
  sadad_status: 'pending' | 'processing' | 'paid' | 'failed' | 'expired' | 'cancelled';
  
  // معلومات الدفعة
  amount: number;
  currency: string;
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

// أنواع البيانات لطلبات SADAD API
export interface SadadCreatePaymentRequest {
  amount: number;
  currency: string;
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
  currency?: string;
  paid_at?: string;
  error?: string;
  error_code?: string;
}

// أنواع البيانات للـ webhook
export interface SadadWebhookPayload {
  event_type: 'payment.completed' | 'payment.failed' | 'payment.expired' | 'payment.cancelled';
  transaction_id: string;
  reference_number?: string;
  status: string;
  amount?: number;
  currency?: string;
  paid_at?: string;
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  additional_data?: any;
}

// نماذج البيانات للنماذج
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
  currency: string;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  expires_in_minutes?: number;
}

// إحصائيات SADAD
export interface SadadStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  total_amount: number;
  success_rate: number;
  average_payment_amount: number;
}

// خيارات التكوين
export interface SadadConfig {
  merchant_id: string;
  merchant_key: string;
  api_url: string;
  webhook_secret?: string;
  timeout_seconds?: number;
  max_retries?: number;
}