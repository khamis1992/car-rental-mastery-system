// =======================================================
// ملف موحد لأنواع البيانات المتعلقة بنظام SaaS
// تم تحديثه ليستخدم التعريفات الموحدة من unified-saas.ts
// تاريخ التحديث: 2025-01-15
// =======================================================

// إعادة تصدير جميع الأنواع الموحدة من الملف الجديد
export type {
  // الأنواع الأساسية
  Currency,
  PaymentGateway,
  PaymentMethod,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  BillingCycle,
  InvoiceItemType,
  
  // أنواع خطط الاشتراك
  SubscriptionPlan,
  PlanFormData,
  
  // أنواع الاشتراكات
  SaasSubscription,
  SubscriptionFormData,
  SubscriptionUpdateData,
  
  // أنواع الفواتير
  SaasInvoice,
  SaasInvoiceItem,
  CreateInvoiceFormData,
  
  // أنواع المدفوعات
  SaasPayment,
  CreatePaymentFormData,
  
  // أنواع SADAD المدمجة
  SadadPaymentRequest,
  SadadPaymentResponse,
  
  // أنواع الاستخدام
  TenantUsage,
  UsageUpdateData,
  
  // أنواع الإحصائيات
  SaasBillingStats,
  BillingAnalytics,
  SubscriptionAnalytics,
  
  // أنواع معالجة الفوترة
  BillingProcessResult,
  AutoBillingSettings,
  
  // دوال التحقق
  isValidCurrency,
  isValidPaymentGateway,
  isValidSubscriptionStatus,
  isValidInvoiceStatus,
  isValidPaymentStatus,
  
  // دوال حساب المبالغ
  calculateInvoiceTotal,
  calculateTaxAmount,
  calculateDiscountAmount,
  
  // دوال التواريخ والعملات
  formatCurrency,
  calculateNextBillingDate,
  calculatePeriodEnd,
  
  // دوال التحقق من الحدود
  checkSubscriptionLimits,
} from '@/types/unified-saas';

// إعادة تصدير الثوابت
export { SAAS_CONSTANTS } from '@/types/unified-saas';

// =======================================================
// أنواع إضافية محددة لهذا الملف (إذا لزم الأمر)
// =======================================================

// يمكن إضافة أنواع إضافية هنا إذا كانت مطلوبة
// لكن يفضل إضافتها في unified-saas.ts للحفاظ على التوحيد

// =======================================================
// ملاحظات مهمة
// =======================================================

/*
تم تحديث هذا الملف ليكون مجرد نقطة إعادة تصدير
للأنواع الموحدة في unified-saas.ts

هذا يضمن:
1. التوافق مع الكود الموجود
2. استخدام الأنواع الموحدة الجديدة
3. سهولة الصيانة المستقبلية
4. تجنب التضارب في التعريفات

يُنصح بشدة استخدام الأنواع من unified-saas.ts مباشرة
في الملفات الجديدة بدلاً من هذا الملف.
*/