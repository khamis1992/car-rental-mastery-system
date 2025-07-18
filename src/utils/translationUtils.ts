// ===================================================
// أدوات التوحيد اللغوي والترجمة
// ===================================================

// معجم المصطلحات الموحدة
export const UNIFIED_TERMS = {
  // المصطلحات الأساسية
  dashboard: 'لوحة التحكم',
  admin: 'المدير',
  user: 'المستخدم',
  organization: 'المؤسسة',
  tenant: 'المؤسسة',
  role: 'الدور',
  permission: 'الصلاحية',
  
  // إجراءات النظام
  create: 'إنشاء',
  add: 'إضافة',
  edit: 'تحرير',
  update: 'تحديث',
  delete: 'حذف',
  remove: 'إزالة',
  save: 'حفظ',
  cancel: 'إلغاء',
  submit: 'إرسال',
  confirm: 'تأكيد',
  
  // حالات العمليات
  loading: 'جاري التحميل...',
  saving: 'جاري الحفظ...',
  deleting: 'جاري الحذف...',
  processing: 'جاري المعالجة...',
  success: 'تم بنجاح',
  error: 'خطأ',
  failed: 'فشل',
  
  // حالات البيانات
  active: 'نشط',
  inactive: 'غير نشط',
  pending: 'في الانتظار',
  suspended: 'معلق',
  cancelled: 'ملغي',
  completed: 'مكتمل',
  
  // العناصر الواجهة
  table: 'جدول',
  list: 'قائمة',
  form: 'نموذج',
  modal: 'نافذة',
  dialog: 'مربع حوار',
  button: 'زر',
  field: 'حقل',
  
  // الملاحة
  home: 'الرئيسية',
  back: 'رجوع',
  next: 'التالي',
  previous: 'السابق',
  close: 'إغلاق',
  open: 'فتح',
  
  // البحث والفلترة
  search: 'البحث',
  filter: 'فلترة',
  sort: 'ترتيب',
  export: 'تصدير',
  import: 'استيراد',
  
  // الأرقام والتواريخ
  date: 'التاريخ',
  time: 'الوقت',
  count: 'العدد',
  total: 'الإجمالي',
  
  // المالية
  invoice: 'الفاتورة',
  payment: 'الدفع',
  subscription: 'الاشتراك',
  plan: 'الخطة',
  billing: 'الفوترة',
  
  // الأسطول
  vehicle: 'المركبة',
  fleet: 'الأسطول',
  maintenance: 'الصيانة',
  
  // الأعمال
  contract: 'العقد',
  customer: 'العميل',
  business: 'الأعمال',
} as const;

// رسائل النظام الموحدة
export const SYSTEM_MESSAGES = {
  // رسائل النجاح
  success: {
    created: (item: string) => `تم إنشاء ${item} بنجاح`,
    updated: (item: string) => `تم تحديث ${item} بنجاح`,
    deleted: (item: string) => `تم حذف ${item} بنجاح`,
    saved: 'تم الحفظ بنجاح',
    sent: 'تم الإرسال بنجاح',
    activated: (item: string) => `تم تفعيل ${item} بنجاح`,
    deactivated: (item: string) => `تم إلغاء تفعيل ${item} بنجاح`,
  },
  
  // رسائل الخطأ
  error: {
    general: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    network: 'خطأ في الاتصال. تأكد من اتصالك بالإنترنت.',
    permission: 'ليس لديك صلاحية للقيام بهذا الإجراء.',
    notFound: (item: string) => `لم يتم العثور على ${item}`,
    validation: 'يرجى التحقق من البيانات المدخلة.',
    required: (field: string) => `${field} مطلوب`,
    invalid: (field: string) => `${field} غير صحيح`,
    exists: (item: string) => `${item} موجود بالفعل`,
    failed: (action: string) => `فشل في ${action}`,
  },
  
  // رسائل التأكيد
  confirm: {
    delete: (item: string) => `هل أنت متأكد من حذف ${item}؟ هذا الإجراء لا يمكن التراجع عنه.`,
    update: (item: string) => `هل تريد حفظ التغييرات على ${item}؟`,
    cancel: 'هل تريد إلغاء العملية؟ ستفقد التغييرات غير المحفوظة.',
    activate: (item: string) => `هل تريد تفعيل ${item}؟`,
    deactivate: (item: string) => `هل تريد إلغاء تفعيل ${item}؟`,
  },
  
  // رسائل المعلومات
  info: {
    empty: 'لا توجد بيانات للعرض',
    loading: 'جاري تحميل البيانات...',
    noResults: 'لا توجد نتائج مطابقة للبحث',
    selectItem: 'يرجى اختيار عنصر من القائمة',
    processing: 'جاري معالجة طلبك...',
  },
  
  // رسائل التحذير
  warning: {
    unsavedChanges: 'لديك تغييرات غير محفوظة. هل تريد المتابعة؟',
    largeData: 'هذه العملية قد تستغرق وقتاً أطول بسبب كمية البيانات الكبيرة.',
    irreversible: 'هذا الإجراء لا يمكن التراجع عنه.',
    maintenance: 'النظام في وضع الصيانة. قد تواجه بعض المشاكل.',
  },
} as const;

// دالة للحصول على المصطلح الموحد
export const getTerm = (key: keyof typeof UNIFIED_TERMS): string => {
  return UNIFIED_TERMS[key] || key;
};

// دالة للحصول على رسالة النظام
export const getMessage = (
  category: keyof typeof SYSTEM_MESSAGES,
  key: string,
  ...args: string[]
): string => {
  const messages = SYSTEM_MESSAGES[category] as any;
  const messageTemplate = messages[key];
  
  if (typeof messageTemplate === 'function') {
    return messageTemplate(...args);
  }
  
  return messageTemplate || `رسالة غير معروفة: ${category}.${key}`;
};

// تنسيق الأرقام للعربية
export const formatNumber = (
  number: number,
  options: {
    locale?: string;
    currency?: string;
    decimals?: number;
    thousands?: boolean;
  } = {}
): string => {
  const {
    locale = 'ar-SA',
    currency,
    decimals = 0,
    thousands = true,
  } = options;

  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: thousands,
  };

  if (currency) {
    formatOptions.style = 'currency';
    formatOptions.currency = currency;
  }

  return new Intl.NumberFormat(locale, formatOptions).format(number);
};

// تنسيق التواريخ للعربية
export const formatDate = (
  date: Date | string,
  options: {
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
    includeTime?: boolean;
    timeOnly?: boolean;
  } = {}
): string => {
  const {
    locale = 'ar-SA',
    format = 'medium',
    includeTime = false,
    timeOnly = false,
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (timeOnly) {
    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: format === 'short' ? '2-digit' : 'numeric',
    month: format === 'short' ? 'numeric' : format === 'long' ? 'long' : 'short',
    day: 'numeric',
  };

  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }

  return dateObj.toLocaleDateString(locale, formatOptions);
};

// تنسيق الحالات
export const formatStatus = (status: string): { text: string; variant: string } => {
  const statusMap: Record<string, { text: string; variant: string }> = {
    active: { text: getTerm('active'), variant: 'success' },
    inactive: { text: getTerm('inactive'), variant: 'secondary' },
    pending: { text: getTerm('pending'), variant: 'warning' },
    suspended: { text: getTerm('suspended'), variant: 'warning' },
    cancelled: { text: getTerm('cancelled'), variant: 'destructive' },
    completed: { text: getTerm('completed'), variant: 'success' },
    failed: { text: getTerm('failed'), variant: 'destructive' },
  };

  return statusMap[status] || { text: status, variant: 'secondary' };
};

// تحويل النص لـ Slug عربي
export const createSlug = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, '-') // مسافات
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\-]/g, '') // إبقاء العربية والإنجليزية والأرقام فقط
    .replace(/-+/g, '-') // إزالة الشرطات المتتالية
    .replace(/^-|-$/g, ''); // إزالة الشرطات من البداية والنهاية
};

// التحقق من النص العربي
export const isArabic = (text: string): boolean => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

// تحديد اتجاه النص
export const getTextDirection = (text: string): 'rtl' | 'ltr' => {
  return isArabic(text) ? 'rtl' : 'ltr';
};

// قاموس الأخطاء الشائعة وترجمتها
export const ERROR_TRANSLATIONS = {
  'Network Error': 'خطأ في الشبكة',
  'Request failed': 'فشل في الطلب',
  'Unauthorized': 'غير مصرح',
  'Forbidden': 'ممنوع',
  'Not Found': 'غير موجود',
  'Internal Server Error': 'خطأ داخلي في الخادم',
  'Bad Request': 'طلب خاطئ',
  'Timeout': 'انتهت مهلة الانتظار',
  'Connection refused': 'تم رفض الاتصال',
  'Invalid credentials': 'بيانات اعتماد غير صحيحة',
  'Token expired': 'انتهت صلاحية الرمز المميز',
  'Permission denied': 'تم رفض الإذن',
  'Resource not found': 'المورد غير موجود',
  'Validation failed': 'فشل التحقق',
  'Duplicate entry': 'مدخل مكرر',
} as const;

// ترجمة رسائل الخطأ
export const translateError = (error: string): string => {
  // البحث عن الخطأ في القاموس
  const translation = ERROR_TRANSLATIONS[error as keyof typeof ERROR_TRANSLATIONS];
  if (translation) return translation;

  // البحث عن جزء من الخطأ
  for (const [englishError, arabicTranslation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (error.toLowerCase().includes(englishError.toLowerCase())) {
      return arabicTranslation;
    }
  }

  // إذا لم نجد ترجمة، نرجع الخطأ الأصلي
  return error;
};

// تنظيف النصوص من المسافات الزائدة
export const cleanText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // استبدال المسافات المتعددة بمسافة واحدة
    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // إزالة الأحرف الخفية
};

// تحويل المصطلحات الإنجليزية للعربية
export const SECTION_TRANSLATIONS = {
  hero: 'القسم الرئيسي',
  about: 'عن الشركة',
  services: 'الخدمات',
  features: 'المميزات',
  pricing: 'الأسعار',
  contact: 'اتصل بنا',
  testimonials: 'آراء العملاء',
  team: 'الفريق',
  portfolio: 'أعمالنا',
  blog: 'المدونة',
  faq: 'الأسئلة الشائعة',
  footer: 'تذييل الصفحة',
  header: 'رأس الصفحة',
  navigation: 'القائمة',
  sidebar: 'الشريط الجانبي',
  content: 'المحتوى',
} as const;

// ترجمة أقسام الصفحة
export const translateSection = (section: string): string => {
  const translation = SECTION_TRANSLATIONS[section as keyof typeof SECTION_TRANSLATIONS];
  return translation || section;
};

// Hook للترجمة
export const useTranslation = () => {
  const t = (key: keyof typeof UNIFIED_TERMS) => getTerm(key);
  const msg = (category: keyof typeof SYSTEM_MESSAGES, key: string, ...args: string[]) => 
    getMessage(category, key, ...args);
  
  return {
    t,
    msg,
    formatNumber,
    formatDate,
    formatStatus,
    translateError,
    translateSection,
    createSlug,
    isArabic,
    getTextDirection,
    cleanText,
  };
}; 