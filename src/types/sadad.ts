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