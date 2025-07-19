
import { ChartOfAccount } from '@/types/accounting';

/**
 * نظام توليد أرقام الحسابات الهرمي المحسّن
 * يتبع نظام ترقيم منطقي وواضح
 */

export interface AccountNumberPattern {
  level: number;
  pattern: string;
  example: string;
  description: string;
}

// أنماط ترقيم الحسابات حسب المستوى
export const ACCOUNT_NUMBER_PATTERNS: AccountNumberPattern[] = [
  { level: 1, pattern: 'X', example: '1', description: 'الحسابات الرئيسية (رقم واحد)' },
  { level: 2, pattern: 'XX', example: '11', description: 'الحسابات الفرعية الأولى (رقمان)' },
  { level: 3, pattern: 'XXX', example: '111', description: 'الحسابات الفرعية الثانية (3 أرقام)' },
  { level: 4, pattern: 'XXXX', example: '1111', description: 'الحسابات الفرعية الثالثة (4 أرقام)' },
  { level: 5, pattern: 'XXXXX', example: '11111', description: 'الحسابات الفرعية الرابعة (5 أرقام)' }
];

/**
 * توليد رقم الحساب الفرعي التالي
 */
export const generateNextSubAccountCode = (
  parentAccount: ChartOfAccount,
  existingCodes: string[]
): string => {
  const parentCode = parentAccount.account_code;
  const parentLevel = parentAccount.level;
  const nextLevel = parentLevel + 1;

  // التحقق من المستوى المسموح
  if (nextLevel > 5) {
    throw new Error('لا يمكن إنشاء حسابات فرعية بعد المستوى الخامس');
  }

  let nextCode: string;

  switch (nextLevel) {
    case 1:
      // المستوى الأول: الحسابات الرئيسية (1-9)
      nextCode = generateMainAccountCode(existingCodes);
      break;
      
    case 2:
      // المستوى الثاني: حسابات فرعية مكونة من رقمين (11, 12, 13...)
      nextCode = generateLevel2Code(parentCode, existingCodes);
      break;
      
    case 3:
      // المستوى الثالث: حسابات فرعية مكونة من 3 أرقام (111, 112, 113...)
      nextCode = generateLevel3Code(parentCode, existingCodes);
      break;
      
    case 4:
      // المستوى الرابع: حسابات فرعية مكونة من 4 أرقام (1111, 1112...)
      nextCode = generateLevel4Code(parentCode, existingCodes);
      break;
      
    case 5:
      // المستوى الخامس: حسابات فرعية مكونة من 5 أرقام (11111, 11112...)
      nextCode = generateLevel5Code(parentCode, existingCodes);
      break;
      
    default:
      throw new Error(`مستوى الحساب ${nextLevel} غير مدعوم`);
  }

  return nextCode;
};

/**
 * توليد رقم للحسابات الرئيسية (المستوى الأول)
 */
const generateMainAccountCode = (existingCodes: string[]): string => {
  const usedNumbers = existingCodes
    .filter(code => /^\d$/.test(code))
    .map(code => parseInt(code))
    .sort((a, b) => a - b);

  for (let i = 1; i <= 9; i++) {
    if (!usedNumbers.includes(i)) {
      return i.toString();
    }
  }
  
  throw new Error('جميع أرقام الحسابات الرئيسية مستخدمة (1-9)');
};

/**
 * توليد رقم للمستوى الثاني (XX)
 */
const generateLevel2Code = (parentCode: string, existingCodes: string[]): string => {
  const prefix = parentCode;
  const pattern = new RegExp(`^${prefix}\\d$`);
  
  const usedSuffixes = existingCodes
    .filter(code => pattern.test(code))
    .map(code => parseInt(code.substring(prefix.length)))
    .sort((a, b) => a - b);

  for (let i = 1; i <= 9; i++) {
    if (!usedSuffixes.includes(i)) {
      return prefix + i.toString();
    }
  }
  
  throw new Error(`جميع الحسابات الفرعية للحساب ${parentCode} مستخدمة`);
};

/**
 * توليد رقم للمستوى الثالث (XXX)
 */
const generateLevel3Code = (parentCode: string, existingCodes: string[]): string => {
  const prefix = parentCode;
  const pattern = new RegExp(`^${prefix}\\d$`);
  
  const usedSuffixes = existingCodes
    .filter(code => pattern.test(code))
    .map(code => parseInt(code.substring(prefix.length)))
    .sort((a, b) => a - b);

  for (let i = 1; i <= 9; i++) {
    if (!usedSuffixes.includes(i)) {
      return prefix + i.toString();
    }
  }
  
  throw new Error(`جميع الحسابات الفرعية للحساب ${parentCode} مستخدمة`);
};

/**
 * توليد رقم للمستوى الرابع (XXXX)
 */
const generateLevel4Code = (parentCode: string, existingCodes: string[]): string => {
  const prefix = parentCode;
  const pattern = new RegExp(`^${prefix}\\d$`);
  
  const usedSuffixes = existingCodes
    .filter(code => pattern.test(code))
    .map(code => parseInt(code.substring(prefix.length)))
    .sort((a, b) => a - b);

  for (let i = 1; i <= 9; i++) {
    if (!usedSuffixes.includes(i)) {
      return prefix + i.toString();
    }
  }
  
  throw new Error(`جميع الحسابات الفرعية للحساب ${parentCode} مستخدمة`);
};

/**
 * توليد رقم للمستوى الخامس (XXXXX)
 */
const generateLevel5Code = (parentCode: string, existingCodes: string[]): string => {
  const prefix = parentCode;
  const pattern = new RegExp(`^${prefix}\\d$`);
  
  const usedSuffixes = existingCodes
    .filter(code => pattern.test(code))
    .map(code => parseInt(code.substring(prefix.length)))
    .sort((a, b) => a - b);

  for (let i = 1; i <= 9; i++) {
    if (!usedSuffixes.includes(i)) {
      return prefix + i.toString();
    }
  }
  
  throw new Error(`جميع الحسابات الفرعية للحساب ${parentCode} مستخدمة`);
};

/**
 * التحقق من صحة رقم الحساب
 */
export const validateAccountCode = (
  code: string,
  parentAccount: ChartOfAccount,
  existingCodes: string[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // التحقق من أن الرقم يحتوي على أرقام فقط
  if (!/^\d+$/.test(code)) {
    errors.push('رقم الحساب يجب أن يحتوي على أرقام فقط');
  }
  
  // التحقق من الطول المناسب للمستوى
  const expectedLevel = parentAccount.level + 1;
  const expectedLength = expectedLevel;
  
  if (code.length !== expectedLength) {
    errors.push(`رقم الحساب للمستوى ${expectedLevel} يجب أن يكون من ${expectedLength} رقم/أرقام`);
  }
  
  // التحقق من أن الرقم يبدأ برقم الحساب الأب
  if (expectedLevel > 1 && !code.startsWith(parentAccount.account_code)) {
    errors.push(`رقم الحساب يجب أن يبدأ برقم الحساب الأب: ${parentAccount.account_code}`);
  }
  
  // التحقق من عدم التكرار
  if (existingCodes.includes(code)) {
    errors.push('رقم الحساب موجود بالفعل');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * الحصول على نمط الترقيم للمستوى المحدد
 */
export const getPatternForLevel = (level: number): AccountNumberPattern | null => {
  return ACCOUNT_NUMBER_PATTERNS.find(p => p.level === level) || null;
};

/**
 * معاينة رقم الحساب المتوقع
 */
export const previewNextAccountCode = (
  parentAccount: ChartOfAccount,
  existingCodes: string[]
): { code: string; pattern: AccountNumberPattern } => {
  const nextLevel = parentAccount.level + 1;
  const pattern = getPatternForLevel(nextLevel);
  
  if (!pattern) {
    throw new Error(`لا يمكن إنشاء حسابات في المستوى ${nextLevel}`);
  }
  
  try {
    const code = generateNextSubAccountCode(parentAccount, existingCodes);
    return { code, pattern };
  } catch (error) {
    throw new Error(`فشل في توليد رقم الحساب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
  }
};
