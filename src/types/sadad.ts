// ملف موحد لأنواع البيانات المتعلقة بنظام SADAD
// تم تحديثه لاستخدام التعريفات الموحدة من unified-saas.ts

// إعادة تصدير الأنواع الموحدة المتعلقة بـ SADAD
export type {
  // الأنواع الأساسية لـ SADAD
  PaymentStatus,
  Currency,
  PaymentGateway,
  PaymentMethod,
  
  // مدفوعات SADAD
  SaasPayment,
  CreatePaymentFormData,
  
  // طلبات واستجابات API
  SadadPaymentRequest,
  SadadPaymentResponse,
  
  // دوال التحقق
  isValidPaymentStatus,
  isValidCurrency,
  isValidPaymentGateway,
  
  // دوال المساعدة
  formatCurrency,
  calculateTaxAmount,
} from '@/types/unified-saas';

// إضافة الأنواع المفقودة للتوافق مع المكونات الموجودة
export type SadadPayment = any; // Temporary fix
export type CreateSadadPaymentFormData = any; // Temporary fix

// Missing exports for compatibility
export interface SadadSettings {
  id?: string;
  merchant_id: string;
  merchant_key: string;
  api_url: string;
  is_sandbox: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SadadWebhookEvent {
  id: string;
  type: string;
  data: any;
  event_type?: string;
  created_at?: string;
  sadad_transaction_id?: string;
  event_data?: any;
}

export interface SadadTransactionLog {
  id: string;
  transaction_id: string;
  status: string;
  amount: number;
  action?: string;
  created_at?: string;
  error_message?: string;
  request_data?: any;
  response_data?: any;
}

export interface SadadCreatePaymentRequest {
  amount: number;
  currency: string;
  description: string;
}

export interface SadadCreatePaymentResponse {
  payment_id: string;
  payment_url: string;
  status: string;
}

export interface SadadPaymentStatusResponse {
  payment_id: string;
  status: string;
  amount: number;
}

export interface SadadStats {
  total_payments: number;
  total_amount: number;
  success_rate: number;
  successful_payments?: number;
  pending_payments?: number;
  failed_payments?: number;
  average_payment_amount?: number;
}

// نوع إعدادات SADAD
export interface SadadSettingsFormData {
  merchant_id: string;
  merchant_key: string;
  api_url: string;
  is_sandbox: boolean;
  is_active: boolean;
}