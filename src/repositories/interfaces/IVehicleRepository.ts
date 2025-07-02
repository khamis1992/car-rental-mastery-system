import { IRepository } from './IRepository';

export interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicle_type: string;
  license_plate: string;
  vin_number?: string;
  daily_rate: number;
  weekly_rate?: number;
  monthly_rate?: number;
  engine_size?: string;
  fuel_type: string;
  transmission: string;
  mileage: number;
  status: 'available' | 'rented' | 'maintenance' | 'out_of_service';
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  registration_expiry?: string;
  last_maintenance_date?: string;
  next_maintenance_due?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface IVehicleRepository extends IRepository<Vehicle> {
  getAvailableVehicles(): Promise<Vehicle[]>;
  getByStatus(status: string): Promise<Vehicle[]>;
  getByVehicleNumber(vehicleNumber: string): Promise<Vehicle | null>;
  getByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  generateVehicleNumber(): Promise<string>;
}