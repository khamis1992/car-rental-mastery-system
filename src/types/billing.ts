// ملف موحد لأنواع البيانات المتعلقة بمعالجة الفوترة
// تم تحديثه لاستخدام التعريفات الموحدة من unified-billing.ts

// إعادة تصدير الأنواع الموحدة
export type {
  // الأنواع الأساسية
  Currency,
  PaymentGateway,
  PaymentMethod,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  BillingCycle,
  
  // أنواع الاشتراكات والخطط
  SubscriptionPlan,
  SaasSubscription,
  PlanFormData,
  SubscriptionFormData,
  
  // أنواع الفواتير
  SaasInvoice,
  SaasInvoiceItem,
  BaseInvoice,
  BaseInvoiceItem,
  CreateInvoiceFormData,
  
  // أنواع المدفوعات
  SaasPayment,
  BasePayment,
  CreatePaymentFormData,
  
  // أنواع الإحصائيات
  SaasBillingStats,
  
  // أنواع الاستخدام
  TenantUsage,
  
  // أنواع معالجة الفوترة
  BillingProcessResult,
  
  // أنواع الطلبات الموحدة
  UnifiedPaymentRequest,
  UnifiedPaymentResponse,
  
  // دوال التحقق
  isValidCurrency,
  isValidPaymentGateway,
  isValidSubscriptionStatus,
  isValidInvoiceStatus,
  isValidPaymentStatus,
} from '@/types/unified-billing';