import { z } from 'zod';

export interface CustomerCSVImportResult {
  success: boolean;
  data?: CustomerImportData[];
  errors?: string[];
  warnings?: string[];
}

export interface CustomerImportData {
  customer_type: 'individual' | 'company';
  name: string;
  email?: string;
  phone: string;
  national_id?: string;
  address?: string;
  city?: string;
  country?: string;
  company_contact_person?: string;
  company_registration_number?: string;
  tax_number?: string;
  notes?: string;
}

// CSV schema with string types for parsing
const csvCustomerSchema = z.object({
  customer_type: z.enum(['individual', 'company', 'فرد', 'شركة']).transform((val) => {
    return val === 'فرد' || val === 'individual' ? 'individual' : 'company';
  }),
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب').refine((phone) => {
    const phoneRegex = /^(\+965|965|0)?[569][0-9]{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }, 'رقم الهاتف غير صحيح'),
  email: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    return val.trim();
  }).refine((email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, 'البريد الإلكتروني غير صحيح'),
  national_id: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional().default('الكويت'),
  company_contact_person: z.string().optional(),
  company_registration_number: z.string().optional(),
  tax_number: z.string().optional(),
  notes: z.string().optional(),
});

export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split('\n');
  const rows: string[][] = [];
  
  for (const line of lines) {
    // Simple CSV parsing - handles quotes and commas
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    fields.push(currentField.trim());
    rows.push(fields);
  }
  
  return rows;
}

export function validateCSVStructure(rows: string[][]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (rows.length === 0) {
    errors.push('الملف فارغ');
    return { isValid: false, errors };
  }
  
  if (rows.length === 1) {
    errors.push('الملف يحتوي على العناوين فقط، لا توجد بيانات');
    return { isValid: false, errors };
  }
  
  const requiredHeaders = ['customer_type', 'name', 'phone'];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    errors.push(`العمود/الأعمدة المطلوبة مفقودة: ${missingHeaders.join(', ')}`);
  }
  
  return { isValid: errors.length === 0, errors };
}

export function convertCSVToCustomerData(csvContent: string): CustomerCSVImportResult {
  const rows = parseCSV(csvContent);
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: CustomerImportData[] = [];
  
  // Validate structure first
  const structureValidation = validateCSVStructure(rows);
  if (!structureValidation.isValid) {
    return { success: false, errors: structureValidation.errors };
  }
  
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const dataRows = rows.slice(1);
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = i + 2; // +2 because we start from row 2 (after headers)
    
    try {
      // Create object from CSV row
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });
      
      // Validate and transform the data
      const validatedData = csvCustomerSchema.parse(rowData);
      
      // Additional validation for company type
      if (validatedData.customer_type === 'company' && !validatedData.company_contact_person) {
        warnings.push(`الصف ${rowNumber}: الشركات تحتاج إلى شخص مسؤول`);
      }
      
      // Convert to CustomerImportData format
      const customerData: CustomerImportData = {
        customer_type: validatedData.customer_type,
        name: validatedData.name.trim(),
        phone: validatedData.phone.replace(/\s/g, ''),
        email: validatedData.email,
        national_id: validatedData.national_id?.trim() || undefined,
        address: validatedData.address?.trim() || undefined,
        city: validatedData.city?.trim() || undefined,
        country: validatedData.country || 'الكويت',
        company_contact_person: validatedData.customer_type === 'company' ? validatedData.company_contact_person?.trim() : undefined,
        company_registration_number: validatedData.customer_type === 'company' ? validatedData.company_registration_number?.trim() : undefined,
        tax_number: validatedData.customer_type === 'company' ? validatedData.tax_number?.trim() : undefined,
        notes: validatedData.notes?.trim() || undefined,
      };
      
      data.push(customerData);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(err => 
          `العمود "${err.path.join('.')}" في الصف ${rowNumber}: ${err.message}`
        );
        errors.push(...fieldErrors);
      } else {
        errors.push(`خطأ في الصف ${rowNumber}: ${error instanceof Error ? error.message : 'خطأ غير محدد'}`);
      }
    }
  }
  
  if (data.length === 0 && errors.length > 0) {
    return { success: false, errors };
  }
  
  if (errors.length > 0) {
    warnings.push(`تم تجاهل ${errors.length} صف بسبب أخطاء في البيانات`);
  }
  
  return {
    success: true,
    data,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

export function generateSampleCustomerCSV(): string {
  const headers = [
    'customer_type', 'name', 'phone', 'email', 'national_id', 
    'address', 'city', 'country', 'company_contact_person', 
    'company_registration_number', 'tax_number', 'notes'
  ];
  
  const sampleData = [
    ['فرد', 'أحمد محمد الكندري', '65123456', 'ahmed.mohamed@email.com', '287654321', 'منطقة السالمية، شارع سالم المبارك', 'مدينة الكويت', 'الكويت', '', '', '', 'عميل مميز'],
    ['شركة', 'شركة النجوم للتجارة العامة', '99887766', 'info@alnojoom.com', '1234567890', 'منطقة الشرق، برج التجارة', 'مدينة الكويت', 'الكويت', 'خالد أحمد المطيري', '1234567890', 'TAX123456789', 'شركة موثوقة'],
    ['فرد', 'فاطمة علي الصباح', '51234567', 'fatima.ali@gmail.com', '298765432', 'منطقة حولي، شارع تونس', 'حولي', 'الكويت', '', '', '', ''],
    ['شركة', 'مؤسسة الخليج للمقاولات', '22334455', 'gulf.contracting@company.com', '9876543210', 'منطقة الفروانية، الشارع الرئيسي', 'الفروانية', 'الكويت', 'سعد محمد العتيبي', '9876543210', 'TAX987654321', 'مؤسسة كبيرة']
  ];
  
  const csvContent = [headers.join(','), ...sampleData.map(row => `"${row.join('","')}"`)].join('\n');
  return csvContent;
}