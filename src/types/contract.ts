export interface ContractPDFData {
  contract_number: string;
  customers: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    national_id?: string;
  };
  vehicles: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vehicle_number: string;
    color: string;
  };
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  insurance_amount?: number;
  security_deposit?: number;
  final_amount: number;
  pickup_location?: string;
  return_location?: string;
  special_conditions?: string;
  terms_and_conditions?: string;
  customer_signature?: string;
  company_signature?: string;
  customer_signed_at?: string;
  company_signed_at?: string;
  pickup_photos?: string[];
  return_photos?: string[];
  pickup_condition_notes?: string;
  return_condition_notes?: string;
  pickup_damages?: any[];
  return_damages?: any[];
  created_at: string;
}