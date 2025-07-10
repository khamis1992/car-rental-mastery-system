// ملف موحد لأنواع البيانات المتعلقة بنظام SaaS
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
  
  // أنواع خطط الاشتراك
  SubscriptionPlan,
  PlanFormData,
  
  // أنواع الاشتراكات
  SaasSubscription,
  BaseSubscription,
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
  
  // أنواع SADAD المدمجة
  SadadPaymentRequest,
  UnifiedPaymentResponse as SadadPaymentResponse,
  
  // أنواع الاستخدام
  TenantUsage,
  
  // أنواع الإحصائيات
  SaasBillingStats,
  
  // دوال التحقق
  isValidCurrency,
  isValidPaymentGateway,
  isValidSubscriptionStatus,
  isValidInvoiceStatus,
  isValidPaymentStatus,
} from '@/types/unified-billing';