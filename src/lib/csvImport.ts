import { z } from 'zod';
import { vehicleSchema, type VehicleFormData } from '@/components/Fleet/AddVehicleForm/types';

export interface CSVImportResult {
  success: boolean;
  data?: VehicleFormData[];
  errors?: string[];
  warnings?: string[];
}

export interface CSVValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

// CSV schema with string types for parsing
const csvVehicleSchema = z.object({
  make: z.string().min(1, 'الصانع مطلوب'),
  model: z.string().min(1, 'الموديل مطلوب'),
  year: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error('السنة يجب أن تكون رقماً');
    return num;
  }),
  color: z.string().min(1, 'اللون مطلوب'),
  vehicle_type: z.enum(['sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'van', 'luxury']),
  license_plate: z.string().min(1, 'رقم اللوحة مطلوب'),
  vin_number: z.string().optional(),
  body_type: z.string().optional(),
  daily_rate: z.string().transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) throw new Error('السعر اليومي يجب أن يكون رقماً موجباً');
    return num;
  }),
  weekly_rate: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('السعر الأسبوعي يجب أن يكون رقماً');
    return num;
  }),
  monthly_rate: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('السعر الشهري يجب أن يكون رقماً');
    return num;
  }),
  min_daily_rate: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('الحد الأدنى للسعر اليومي يجب أن يكون رقماً');
    return num;
  }),
  max_daily_rate: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('الحد الأقصى للسعر اليومي يجب أن يكون رقماً');
    return num;
  }),
  mileage_limit: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error('حد المسافة يجب أن يكون رقماً');
    return num;
  }),
  excess_mileage_cost: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('تكلفة المسافة الإضافية يجب أن تكون رقماً');
    return num;
  }),
  engine_size: z.string().optional(),
  fuel_type: z.string().default('بنزين'),
  transmission: z.string().default('أوتوماتيك'),
  mileage: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return 0;
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error('المسافة المقطوعة يجب أن تكون رقماً');
    return num;
  }),
  insurance_type: z.string().optional().default('comprehensive'),
  insurance_company: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_expiry: z.string().optional(),
  owner_type: z.string().optional().default('company'),
  purchase_date: z.string().optional(),
  purchase_cost: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('تكلفة الشراء يجب أن تكون رقماً');
    return num;
  }),
  depreciation_rate: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('معدل الاستهلاك يجب أن يكون رقماً');
    return num;
  }),
  useful_life_years: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error('سنوات العمر الإنتاجي يجب أن تكون رقماً');
    return num;
  }),
  residual_value: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('القيمة المتبقية يجب أن تكون رقماً');
    return num;
  }),
  depreciation_method: z.string().optional().default('straight_line'),
  registration_expiry: z.string().optional(),
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
  
  const requiredHeaders = ['make', 'model', 'year', 'color', 'vehicle_type', 'license_plate', 'daily_rate'];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    errors.push(`العمود/الأعمدة المطلوبة مفقودة: ${missingHeaders.join(', ')}`);
  }
  
  return { isValid: errors.length === 0, errors };
}

export function convertCSVToVehicleData(csvContent: string): CSVImportResult {
  const rows = parseCSV(csvContent);
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: VehicleFormData[] = [];
  
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
      const validatedData = csvVehicleSchema.parse(rowData);
      
      // Convert to VehicleFormData format
      const vehicleData: VehicleFormData = {
        make: validatedData.make,
        model: validatedData.model,
        year: validatedData.year,
        color: validatedData.color,
        vehicle_type: validatedData.vehicle_type,
        license_plate: validatedData.license_plate,
        vin_number: validatedData.vin_number,
        body_type: validatedData.body_type,
        daily_rate: validatedData.daily_rate,
        weekly_rate: validatedData.weekly_rate,
        monthly_rate: validatedData.monthly_rate,
        min_daily_rate: validatedData.min_daily_rate,
        max_daily_rate: validatedData.max_daily_rate,
        mileage_limit: validatedData.mileage_limit,
        excess_mileage_cost: validatedData.excess_mileage_cost,
        engine_size: validatedData.engine_size,
        fuel_type: validatedData.fuel_type,
        transmission: validatedData.transmission,
        mileage: validatedData.mileage,
        insurance_type: validatedData.insurance_type as any,
        insurance_company: validatedData.insurance_company,
        insurance_policy_number: validatedData.insurance_policy_number,
        insurance_expiry: validatedData.insurance_expiry,
        has_insurance_policy: true,
        owner_type: validatedData.owner_type as any,
        purchase_date: validatedData.purchase_date,
        purchase_cost: validatedData.purchase_cost,
        depreciation_rate: validatedData.depreciation_rate,
        useful_life_years: validatedData.useful_life_years,
        residual_value: validatedData.residual_value,
        depreciation_method: validatedData.depreciation_method as any,
        registration_expiry: validatedData.registration_expiry,
        notes: validatedData.notes,
      };
      
      data.push(vehicleData);
      
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

export function generateSampleCSV(): string {
  const headers = [
    'make', 'model', 'year', 'color', 'vehicle_type', 'license_plate', 'vin_number', 'body_type',
    'daily_rate', 'weekly_rate', 'monthly_rate', 'min_daily_rate', 'max_daily_rate',
    'mileage_limit', 'excess_mileage_cost', 'engine_size', 'fuel_type', 'transmission', 'mileage',
    'insurance_type', 'insurance_company', 'insurance_policy_number', 'insurance_expiry',
    'owner_type', 'purchase_date', 'purchase_cost', 'depreciation_rate', 'useful_life_years',
    'residual_value', 'depreciation_method', 'registration_expiry', 'notes'
  ];
  
  const sampleData = [
    ['تويوتا', 'كامري', '2023', 'أبيض', 'sedan', 'ك ص د 123', 'JTDKB20U090123456', 'سيدان', '25.000', '150.000', '500.000', '20.000', '30.000', '200', '0.500', '2.5L', 'بنزين', 'أوتوماتيك', '15000', 'comprehensive', 'شركة التأمين الكويتية', 'POL123456', '2025-12-31', 'company', '2023-01-15', '12000.000', '20', '5', '2000.000', 'straight_line', '2025-06-30', 'مركبة جديدة بحالة ممتازة'],
    ['نيسان', 'التيما', '2022', 'أسود', 'sedan', 'ك ص د 456', 'JN1AZ36D12M123456', 'سيدان', '22.000', '140.000', '450.000', '18.000', '28.000', '200', '0.500', '2.0L', 'بنزين', 'أوتوماتيك', '25000', 'comprehensive', 'شركة الخليج للتأمين', 'POL789123', '2025-08-15', 'company', '2022-03-10', '10000.000', '20', '5', '1500.000', 'straight_line', '2025-04-20', ''],
    ['فورد', 'إكسبلورر', '2023', 'أزرق', 'suv', 'ك ص د 789', '1FMHK7F89NGA12345', 'SUV', '35.000', '220.000', '750.000', '30.000', '40.000', '200', '0.500', '3.5L', 'بنزين', 'أوتوماتيك', '8000', 'comprehensive', 'شركة الكويت للتأمين', 'POL456789', '2026-01-10', 'company', '2023-05-20', '18000.000', '20', '7', '3000.000', 'straight_line', '2025-09-15', 'سيارة عائلية واسعة']
  ];
  
  const csvContent = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
  return csvContent;
}