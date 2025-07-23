// =======================================================
// نقطة الدخول الموحدة لجميع أنواع البيانات
// =======================================================

// إعادة تصدير جميع الأنواع من الملفات الموحدة
export * from './unified-saas';

// أنواع خاصة بالمشروع
export * from './tenant';
export * from './payment-receipt';

// أنواع النظام
export * from './violation';
export * from './checks';
export * from './bankReconciliation';
export type { 
  // تصدير محدود من invoice.ts لتجنب التضارب مع unified-saas
  Invoice as LocalInvoice,
  InvoiceItem as LocalInvoiceItem,
  Payment as LocalPayment,
  AdditionalCharge,
  InvoiceWithDetails,
  PaymentFormData as LocalPaymentFormData,
  InvoiceFormData as LocalInvoiceFormData,
  CollectiveInvoice,
  CollectiveInvoiceItem,
  CollectiveInvoicePayment,
  CollectionRecord,
  CollectiveInvoiceFormData,
  CollectionRecordFormData
} from './invoice';

// أنواع مكونات محددة
export * from '../components/Fleet/AddVehicleForm/types';
export * from '../components/SuperAdmin/TenantOnboarding/types';

// أنواع خدمات
export * from '../services/Orchestration/types';

// تصدير أنواع محددة للتوافق مع المكونات الموجودة
export type {
  // أنواع الدفع الموحدة
  SaasPayment as Payment,
  CreatePaymentFormData as PaymentFormData,
  
  // أنواع الفواتير الموحدة
  SaasInvoice as UnifiedInvoice,
  CreateInvoiceFormData as UnifiedInvoiceFormData,
  
  // أنواع الاشتراكات الموحدة
  SaasSubscription as UnifiedSubscription,
  SubscriptionFormData as UnifiedSubscriptionFormData,
  
  // أنواع خطط الاشتراك
  SubscriptionPlan as UnifiedPlan,
  PlanFormData as UnifiedPlanFormData,
} from './unified-saas';