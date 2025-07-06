/**
 * دالة لترجمة أنواع التأمين إلى العربية
 */
export const getInsuranceTypeText = (insuranceType: string): string => {
  switch (insuranceType) {
    case 'comprehensive':
      return 'تأمين شامل';
    case 'third_party':
      return 'تأمين ضد الغير';
    case 'basic':
      return 'تأمين أساسي';
    case 'collision':
      return 'تأمين التصادم';
    case 'theft':
      return 'تأمين السرقة';
    case 'fire':
      return 'تأمين الحريق';
    case 'natural_disasters':
      return 'تأمين الكوارث الطبيعية';
    case 'none':
      return 'لا يوجد تأمين';
    default:
      return insuranceType;
  }
};

/**
 * دالة لترجمة أنواع التأمين إلى الإنجليزية مع العربية
 */
export const getInsuranceTypeBilingualText = (insuranceType: string): string => {
  switch (insuranceType) {
    case 'comprehensive':
      return 'Comprehensive / شامل';
    case 'third_party':
      return 'Third Party / ضد الغير';
    case 'basic':
      return 'Basic / أساسي';
    case 'none':
      return 'None / لا يوجد';
    default:
      return insuranceType;
  }
};

/**
 * جميع أنواع التأمين المتاحة في النظام
 */
export const INSURANCE_TYPES = [
  { value: 'comprehensive', labelAr: 'تأمين شامل', labelEn: 'Comprehensive' },
  { value: 'third_party', labelAr: 'تأمين ضد الغير', labelEn: 'Third Party' },
  { value: 'basic', labelAr: 'تأمين أساسي', labelEn: 'Basic' },
  { value: 'collision', labelAr: 'تأمين التصادم', labelEn: 'Collision' },
  { value: 'theft', labelAr: 'تأمين السرقة', labelEn: 'Theft' },
  { value: 'fire', labelAr: 'تأمين الحريق', labelEn: 'Fire' },
  { value: 'natural_disasters', labelAr: 'تأمين الكوارث الطبيعية', labelEn: 'Natural Disasters' }
] as const;

/**
 * دالة للحصول على لون حالة التأمين حسب تاريخ الانتهاء
 */
export const getInsuranceStatusColor = (expiryDate?: string): string => {
  if (!expiryDate) return 'text-muted-foreground';
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'text-red-600'; // منتهي
  if (daysUntilExpiry <= 7) return 'text-red-500'; // أسبوع أو أقل
  if (daysUntilExpiry <= 30) return 'text-yellow-500'; // شهر أو أقل
  return 'text-green-600'; // ساري
};

/**
 * دالة للحصول على نص حالة التأمين
 */
export const getInsuranceStatusText = (expiryDate?: string): string => {
  if (!expiryDate) return 'غير محدد';
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'منتهي الصلاحية';
  if (daysUntilExpiry <= 7) return `ينتهي خلال ${daysUntilExpiry} أيام`;
  if (daysUntilExpiry <= 30) return `ينتهي خلال ${daysUntilExpiry} يوم`;
  return 'ساري';
};