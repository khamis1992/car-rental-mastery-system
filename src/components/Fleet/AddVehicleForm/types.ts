import { z } from 'zod';

export const vehicleSchema = z.object({
  make: z.string().min(2, 'يجب إدخال الصانع'),
  model: z.string().min(2, 'يجب إدخال الموديل'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(2, 'يجب إدخال اللون'),
  vehicle_type: z.enum(['sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'van', 'luxury']),
  license_plate: z.string().min(3, 'يجب إدخال رقم اللوحة'),
  vin_number: z.string().optional(),
  body_type: z.string().optional(),
  daily_rate: z.number().min(1, 'يجب إدخال السعر اليومي'),
  weekly_rate: z.number().optional(),
  monthly_rate: z.number().optional(),
  min_daily_rate: z.number().optional(),
  max_daily_rate: z.number().optional(),
  mileage_limit: z.number().optional(),
  excess_mileage_cost: z.number().optional(),
  engine_size: z.string().optional(),
  fuel_type: z.string().default('بنزين'),
  transmission: z.string().default('أوتوماتيك'),
  mileage: z.number().default(0),
  // Insurance fields
  insurance_type: z.enum(['comprehensive', 'third_party']).default('comprehensive'),
  insurance_company: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_expiry: z.string().optional(),
  has_insurance_policy: z.boolean().default(true),
  // Owner type
  owner_type: z.enum(['customer', 'company']).default('company'),
  // Asset depreciation fields (conditional on owner_type being 'company')
  purchase_date: z.string().optional(),
  purchase_cost: z.number().optional(),
  depreciation_rate: z.number().optional(),
  useful_life_years: z.number().optional(),
  residual_value: z.number().optional(),
  depreciation_method: z.enum(['straight_line', 'declining_balance']).default('straight_line'),
  previous_accumulated_depreciation: z.number().optional(),
  // Other fields
  registration_expiry: z.string().optional(),
  notes: z.string().optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;