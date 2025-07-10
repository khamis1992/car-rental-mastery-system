// ملف موحد لأنواع البيانات المتعلقة بنظام SADAD
// تم تحديثه لاستخدام التعريفات الموحدة من unified-billing.ts

// إعادة تصدير الأنواع الموحدة المتعلقة بـ SADAD
export type {
  // الأنواع الأساسية لـ SADAD
  SadadPaymentStatus,
  Currency,
  
  // إعدادات SADAD
  SadadSettings,
  SadadSettingsFormData,
  SadadConfig,
  
  // مدفوعات SADAD
  SadadPayment,
  CreateSadadPaymentFormData,
  
  // طلبات واستجابات API
  SadadCreatePaymentRequest,
  SadadCreatePaymentResponse,
  SadadPaymentStatusResponse,
  
  // أحداث Webhook
  SadadWebhookEvent,
  SadadWebhookPayload,
  
  // سجل المعاملات
  SadadTransactionLog,
  
  // إحصائيات SADAD
  SadadStats,
  
  // دوال التحقق
  isValidSadadPaymentStatus,
  isValidCurrency,
} from '@/types/unified-billing';