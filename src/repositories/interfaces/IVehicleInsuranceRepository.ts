import { IRepository } from './IRepository';

export interface VehicleInsurance {
  id: string;
  vehicle_id: string;
  insurance_type: 'comprehensive' | 'third_party' | 'basic' | 'collision' | 'theft' | 'fire' | 'natural_disasters';
  insurance_company?: string;
  policy_number?: string;
  start_date?: string;
  expiry_date?: string;
  premium_amount?: number;
  coverage_amount?: number;
  deductible_amount?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface IVehicleInsuranceRepository extends IRepository<VehicleInsurance> {
  getByVehicleId(vehicleId: string): Promise<VehicleInsurance[]>;
  getActiveByVehicleId(vehicleId: string): Promise<VehicleInsurance[]>;
  getExpiringInsurance(days: number): Promise<VehicleInsurance[]>;
  deactivateInsurance(id: string): Promise<void>;
  activateInsurance(id: string): Promise<void>;
}