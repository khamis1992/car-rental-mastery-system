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
  { value: 'none', labelAr: 'لا يوجد تأمين', labelEn: 'None' }
] as const;