// ملف موحد لأنواع البيانات المتعلقة بمعالجة الفوترة
// تم تحديثه لاستخدام التعريفات الموحدة من unified-saas.ts

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
  CreateInvoiceFormData,
  
  // أنواع المدفوعات
  SaasPayment,
  CreatePaymentFormData,
  
  // أنواع الإحصائيات
  SaasBillingStats,
  BillingAnalytics,
  
  // أنواع الاستخدام
  TenantUsage,
  
  // أنواع معالجة الفوترة
  BillingProcessResult,
  AutoBillingSettings,
  
  // دوال التحقق
  isValidCurrency,
  isValidPaymentGateway,
  isValidSubscriptionStatus,
  isValidInvoiceStatus,
  isValidPaymentStatus,
  
  // دوال المساعدة
  formatCurrency,
  calculateTaxAmount,
  calculateInvoiceTotal,
  calculateDiscountAmount,
} from '@/types/unified-saas';

// استيراد الأنواع أولاً
import type { 
  SaasPayment, 
  CreatePaymentFormData, 
  SaasInvoice, 
  CreateInvoiceFormData 
} from '@/types/unified-saas';

// تصدير أنواع إضافية للتوافق
export type Payment = SaasPayment;
export type PaymentFormData = CreatePaymentFormData;
export type Invoice = SaasInvoice;
export type InvoiceFormData = CreateInvoiceFormData;