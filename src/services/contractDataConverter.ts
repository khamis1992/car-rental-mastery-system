import { supabase } from '@/integrations/supabase/client';

export interface ContractData {
  id: string;
  contract_number: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  contract_type: string;
  daily_rate: number;
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  security_deposit?: number;
  insurance_amount?: number;
  final_amount: number;
  pickup_location?: string;
  return_location?: string;
  pickup_mileage?: number;
  fuel_level_pickup?: string;
  fuel_level_return?: string;
  special_conditions?: string;
  terms_and_conditions?: string;
  notes?: string;
  status: string;
  customer_signature?: string;
  company_signature?: string;
  customers?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    national_id?: string;
    address?: string;
  };
  vehicles?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vehicle_number: string;
    color?: string;
  };
}

export interface BilingualContractData {
  customer_id: string;
  vehicle_id: string;
  contract_language: 'ar' | 'en' | 'both';
  start_date: Date;
  end_date: Date;
  contract_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  rental_purpose: 'personal' | 'business' | 'tourism' | 'other';
  daily_rate: number;
  discount_amount?: number;
  tax_amount?: number;
  security_deposit?: number;
  insurance_amount?: number;
  additional_fees?: number;
  pickup_location?: string;
  return_location?: string;
  pickup_time?: string;
  return_time?: string;
  pickup_mileage?: number;
  fuel_level_pickup?: 'full' | 'three_quarters' | 'half' | 'quarter' | 'empty';
  primary_driver_name?: string;
  primary_driver_license?: string;
  additional_drivers?: Array<{
    name: string;
    license_number: string;
    phone?: string;
  }>;
  insurance_type?: 'basic' | 'comprehensive' | 'third_party' | 'none';
  collision_damage_waiver?: boolean;
  theft_protection?: boolean;
  personal_accident_insurance?: boolean;
  special_conditions?: string;
  mileage_limit?: number;
  fuel_policy?: 'full_to_full' | 'same_to_same' | 'prepaid';
  late_return_policy?: string;
  damage_policy?: string;
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  notes?: string;
}

export const contractDataConverter = {
  // Convert regular contract data to bilingual contract format
  toBilingualFormat: (contract: ContractData): Partial<BilingualContractData> => {
    return {
      customer_id: contract.customer_id,
      vehicle_id: contract.vehicle_id,
      contract_language: 'both', // Default to both languages
      start_date: new Date(contract.start_date),
      end_date: new Date(contract.end_date),
      contract_type: contract.contract_type as any,
      rental_purpose: 'personal', // Default value
      daily_rate: contract.daily_rate,
      discount_amount: contract.discount_amount || 0,
      tax_amount: contract.tax_amount || 0,
      security_deposit: contract.security_deposit || 0,
      insurance_amount: contract.insurance_amount || 0,
      pickup_location: contract.pickup_location,
      return_location: contract.return_location,
      pickup_mileage: contract.pickup_mileage,
      fuel_level_pickup: contract.fuel_level_pickup as any,
      insurance_type: 'basic', // Default value
      collision_damage_waiver: false,
      theft_protection: false,
      personal_accident_insurance: false,
      special_conditions: contract.special_conditions,
      fuel_policy: 'full_to_full', // Default value
      terms_accepted: true, // Assume accepted if contract exists
      privacy_policy_accepted: true, // Assume accepted if contract exists
      notes: contract.notes,
    };
  },

  // Convert bilingual contract data to regular contract format
  toRegularFormat: (bilingualData: BilingualContractData, contractNumber: string): Omit<ContractData, 'id' | 'customers' | 'vehicles'> => {
    const rentalDays = Math.ceil(
      (bilingualData.end_date.getTime() - bilingualData.start_date.getTime()) / (1000 * 60 * 60 * 24)
    ) || 1;

    const subtotal = rentalDays * bilingualData.daily_rate;
    const discount = bilingualData.discount_amount || 0;
    const tax = bilingualData.tax_amount || 0;
    const insurance = bilingualData.insurance_amount || 0;
    const additionalFees = bilingualData.additional_fees || 0;
    const finalAmount = subtotal - discount + tax + insurance + additionalFees;

    return {
      contract_number: contractNumber,
      customer_id: bilingualData.customer_id,
      vehicle_id: bilingualData.vehicle_id,
      start_date: bilingualData.start_date.toISOString().split('T')[0],
      end_date: bilingualData.end_date.toISOString().split('T')[0],
      rental_days: rentalDays,
      contract_type: bilingualData.contract_type,
      daily_rate: bilingualData.daily_rate,
      total_amount: subtotal,
      discount_amount: discount,
      tax_amount: tax,
      security_deposit: bilingualData.security_deposit || 0,
      insurance_amount: insurance,
      final_amount: finalAmount,
      pickup_location: bilingualData.pickup_location,
      return_location: bilingualData.return_location,
      pickup_mileage: bilingualData.pickup_mileage,
      fuel_level_pickup: bilingualData.fuel_level_pickup,
      special_conditions: bilingualData.special_conditions,
      terms_and_conditions: generateTermsAndConditions(bilingualData.contract_language),
      notes: bilingualData.notes,
      status: 'draft',
    };
  },

  // Load full contract data with relationships
  loadFullContractData: async (contractId: string): Promise<ContractData | null> => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            email,
            national_id,
            address
          ),
          vehicles (
            id,
            make,
            model,
            year,
            license_plate,
            vehicle_number,
            color
          )
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading contract data:', error);
      return null;
    }
  },
};

// Generate terms and conditions based on language preference
const generateTermsAndConditions = (language: 'ar' | 'en' | 'both'): string => {
  const termsAr = `
الشروط والأحكام - عقد إيجار السيارات

1. التعاريف والتفسير:
- "الشركة": شركة تأجير السيارات المرخصة في دولة الكويت
- "المستأجر": الشخص أو الجهة المتعاقدة على استئجار المركبة
- "المركبة": السيارة محل عقد الإيجار

2. مدة الإيجار:
- تبدأ مدة الإيجار من التاريخ والوقت المحددين في العقد
- يجب إعادة المركبة في الموعد المحدد تماماً
- التأخير في الإعادة يترتب عليه رسوم إضافية

3. الالتزامات المالية:
- دفع كامل المبلغ المتفق عليه قبل تسليم المركبة
- دفع مبلغ التأمين القابل للاسترداد
- تحمل أي رسوم إضافية أو غرامات مرورية

4. استخدام المركبة:
- استخدام المركبة للأغراض المشروعة فقط
- عدم تأجير المركبة من الباطن
- عدم استخدامها في أنشطة غير قانونية

5. التأمين والأضرار:
- المركبة مؤمنة ضد الحوادث والسرقة
- المستأجر مسؤول عن الأضرار الناتجة عن الإهمال
- يجب الإبلاغ عن أي حادث فوراً

6. إنهاء العقد:
- يحق للشركة إنهاء العقد في حالة مخالفة الشروط
- يجب إعادة المركبة في نفس حالة التسليم
- التسوية النهائية تتم عند الإعادة

7. القانون الحاكم:
- يخضع هذا العقد لقوانين دولة الكويت
- أي نزاع يحل عبر المحاكم الكويتية المختصة
`;

  const termsEn = `
TERMS AND CONDITIONS - CAR RENTAL AGREEMENT

1. Definitions and Interpretation:
- "Company": The licensed car rental company in Kuwait
- "Renter": The person or entity contracting for vehicle rental
- "Vehicle": The car subject to this rental agreement

2. Rental Period:
- Rental period starts from the specified date and time in the contract
- Vehicle must be returned at the exact specified time
- Late return incurs additional charges

3. Financial Obligations:
- Payment of full agreed amount before vehicle delivery
- Payment of refundable security deposit
- Responsibility for additional fees or traffic violations

4. Vehicle Usage:
- Use vehicle for lawful purposes only
- No subletting of the vehicle
- No use in illegal activities

5. Insurance and Damages:
- Vehicle is insured against accidents and theft
- Renter responsible for damages due to negligence
- Any accident must be reported immediately

6. Contract Termination:
- Company may terminate contract for violation of terms
- Vehicle must be returned in same condition as delivered
- Final settlement upon return

7. Governing Law:
- This contract is governed by Kuwait laws
- Any dispute resolved through Kuwait courts
`;

  switch (language) {
    case 'ar': return termsAr;
    case 'en': return termsEn;
    case 'both': return termsAr + '\n\n' + termsEn;
    default: return termsAr + '\n\n' + termsEn;
  }
};