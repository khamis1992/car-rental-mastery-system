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
  SadadPayment,
  SaasPayment,
  CreatePaymentFormData,
  
  // طلبات واستجابات API
  SadadPaymentRequest,
  SadadPaymentResponse,
  
  // إعدادات SADAD
  SadadSettings,
  SadadSettingsFormData,
  SadadWebhookEvent,
  SadadTransactionLog,
  SadadCreatePaymentRequest,
  SadadCreatePaymentResponse,
  SadadPaymentStatusResponse,
  SadadStats,
  
  // دوال التحقق
  isValidPaymentStatus,
  isValidCurrency,
  isValidPaymentGateway,
  
  // دوال المساعدة
  formatCurrency,
  calculateTaxAmount,
} from '@/types/unified-saas';

// استيراد الأنواع أولاً
import type { CreatePaymentFormData } from '@/types/unified-saas';

// تصدير مباشر للتوافق مع المكونات الموجودة
export type CreateSadadPaymentFormData = CreatePaymentFormData;