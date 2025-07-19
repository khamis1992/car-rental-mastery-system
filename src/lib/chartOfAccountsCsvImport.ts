import { z } from 'zod';
import { ChartOfAccount } from '@/types/accounting';

export interface ChartOfAccountsCSVData {
  account_code: string;
  account_name: string;
  account_name_en?: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_category: string;
  parent_account_code?: string;
  allow_posting: boolean;
  opening_balance: number;
  notes?: string;
}

export interface ChartOfAccountsImportResult {
  success: boolean;
  data: ChartOfAccountsCSVData[];
  errors: ChartOfAccountsValidationError[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    duplicateAccounts: number;
    invalidParents: number;
  };
}

export interface ChartOfAccountsValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

const chartOfAccountsSchema = z.object({
  account_code: z.string()
    .min(1, 'رمز الحساب مطلوب')
    .max(20, 'رمز الحساب لا يجب أن يزيد عن 20 حرف')
    .regex(/^[0-9A-Za-z.-]+$/, 'رمز الحساب يجب أن يحتوي على أرقام وحروف فقط'),
  
  account_name: z.string()
    .min(1, 'اسم الحساب مطلوب')
    .max(200, 'اسم الحساب لا يجب أن يزيد عن 200 حرف'),
  
  account_name_en: z.string()
    .max(200, 'الاسم الإنجليزي لا يجب أن يزيد عن 200 حرف')
    .optional()
    .transform(val => val === '' ? undefined : val),
  
  account_type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'], {
    errorMap: () => ({ message: 'نوع الحساب يجب أن يكون أحد القيم التالية: asset, liability, equity, revenue, expense' })
  }),
  
  account_category: z.string()
    .min(1, 'فئة الحساب مطلوبة')
    .max(100, 'فئة الحساب لا يجب أن تزيد عن 100 حرف'),
  
  parent_account_code: z.string()
    .max(20, 'رمز الحساب الأب لا يجب أن يزيد عن 20 حرف')
    .optional()
    .transform(val => val === '' ? undefined : val),
  
  allow_posting: z.union([
    z.boolean(),
    z.string().transform(val => {
      const lower = val.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'نعم' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'لا' || lower === 'no') return false;
      throw new Error('يجب أن تكون القيمة: true/false أو 1/0 أو نعم/لا');
    })
  ]).default(true),
  
  opening_balance: z.union([
    z.number(),
    z.string().transform(val => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) throw new Error('الرصيد الافتتاحي يجب أن يكون رقماً');
      return parsed;
    })
  ]).default(0),
  
  notes: z.string()
    .max(500, 'الملاحظات لا يجب أن تزيد عن 500 حرف')
    .optional()
    .transform(val => val === '' ? undefined : val)
});

const REQUIRED_HEADERS = [
  'account_code',
  'account_name', 
  'account_type',
  'account_category'
];

const OPTIONAL_HEADERS = [
  'account_name_en',
  'parent_account_code',
  'allow_posting',
  'opening_balance',
  'notes'
];

export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const rows: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

export function validateCSVStructure(rows: string[][]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (rows.length === 0) {
    errors.push('الملف فارغ');
    return { isValid: false, errors };
  }
  
  if (rows.length < 2) {
    errors.push('الملف يجب أن يحتوي على رأس الأعمدة وصف واحد على الأقل');
    return { isValid: false, errors };
  }
  
  const headers = rows[0].map(h => h.toLowerCase().trim());
  
  // التحقق من وجود الحقول المطلوبة
  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headers.includes(requiredHeader.toLowerCase())) {
      errors.push(`العمود المطلوب مفقود: ${requiredHeader}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function convertCSVToChartOfAccounts(csvContent: string): ChartOfAccountsImportResult {
  const result: ChartOfAccountsImportResult = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    stats: {
      totalRows: 0,
      validRows: 0,
      duplicateAccounts: 0,
      invalidParents: 0
    }
  };
  
  try {
    const rows = parseCSV(csvContent);
    
    // التحقق من هيكل الملف
    const structureValidation = validateCSVStructure(rows);
    if (!structureValidation.isValid) {
      result.errors.push({
        row: 0,
        field: 'structure',
        value: '',
        message: structureValidation.errors.join(', ')
      });
      return result;
    }
    
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);
    result.stats.totalRows = dataRows.length;
    
    const accountCodes = new Set<string>();
    
    // معالجة كل صف
    for (let i = 0; i < dataRows.length; i++) {
      const rowIndex = i + 2; // +2 لأن الصف الأول هو العناوين والفهرسة تبدأ من 1
      const row = dataRows[i];
      
      // تحويل الصف إلى كائن
      const rawData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rawData[header] = row[index] || '';
      });
      
      try {
        // التحقق من صحة البيانات
        const validatedData = chartOfAccountsSchema.parse(rawData) as ChartOfAccountsCSVData;
        
        // التحقق من عدم تكرار رمز الحساب
        if (accountCodes.has(validatedData.account_code)) {
          result.errors.push({
            row: rowIndex,
            field: 'account_code',
            value: validatedData.account_code,
            message: 'رمز الحساب مكرر في الملف'
          });
          result.stats.duplicateAccounts++;
          continue;
        }
        
        accountCodes.add(validatedData.account_code);
        result.data.push(validatedData);
        result.stats.validRows++;
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          for (const issue of error.issues) {
            result.errors.push({
              row: rowIndex,
              field: issue.path.join('.'),
              value: String(rawData[issue.path[0] as string] || ''),
              message: issue.message
            });
          }
        } else {
          result.errors.push({
            row: rowIndex,
            field: 'unknown',
            value: '',
            message: `خطأ غير متوقع: ${String(error)}`
          });
        }
      }
    }
    
    // التحقق من الحسابات الأب
    const parentCodes = new Set(result.data.map(acc => acc.account_code));
    result.data.forEach((account, index) => {
      if (account.parent_account_code && !parentCodes.has(account.parent_account_code)) {
        result.warnings.push(`الصف ${index + 2}: الحساب الأب "${account.parent_account_code}" غير موجود في الملف`);
        result.stats.invalidParents++;
      }
    });
    
    result.success = result.errors.length === 0;
    
  } catch (error) {
    result.errors.push({
      row: 0,
      field: 'file',
      value: '',
      message: `خطأ في قراءة الملف: ${String(error)}`
    });
  }
  
  return result;
}

export function generateSampleCSV(): string {
  const headers = [
    'account_code',
    'account_name',
    'account_name_en',
    'account_type',
    'account_category',
    'parent_account_code',
    'allow_posting',
    'opening_balance',
    'notes'
  ];
  
  const sampleData = [
    ['1', 'الأصول', 'Assets', 'asset', 'current_asset', '', 'false', '0', 'حساب رئيسي للأصول'],
    ['11', 'الأصول المتداولة', 'Current Assets', 'asset', 'current_asset', '1', 'false', '0', 'الأصول قصيرة الأجل'],
    ['111', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'current_asset', '11', 'false', '0', 'النقدية والحسابات البنكية'],
    ['1111', 'الصندوق', 'Cash Box', 'asset', 'current_asset', '111', 'true', '5000', 'صندوق النقدية الرئيسي'],
    ['1112', 'البنك الأهلي الكويتي', 'NBK Account', 'asset', 'current_asset', '111', 'true', '100000', 'حساب جاري بالبنك الأهلي'],
    ['2', 'الالتزامات', 'Liabilities', 'liability', 'current_liability', '', 'false', '0', 'حساب رئيسي للالتزامات'],
    ['21', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', 'current_liability', '2', 'false', '0', 'الالتزامات قصيرة الأجل'],
    ['211', 'الذمم الدائنة', 'Accounts Payable', 'liability', 'current_liability', '21', 'true', '0', 'مبالغ مستحقة للموردين']
  ];
  
  const csvContent = [headers.join(',')]
    .concat(sampleData.map(row => row.map(cell => `"${cell}"`).join(',')))
    .join('\n');
  
  return csvContent;
}