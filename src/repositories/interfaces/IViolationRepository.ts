import { IRepository } from './IRepository';
import { TrafficViolation, ViolationWithDetails } from '@/types/violation';

export interface IViolationRepository extends IRepository<TrafficViolation> {
  getViolationsWithDetails(): Promise<ViolationWithDetails[]>;
  getByCustomerId(customerId: string): Promise<ViolationWithDetails[]>;
  getByVehicleId(vehicleId: string): Promise<ViolationWithDetails[]>;
  getByStatus(status: string): Promise<ViolationWithDetails[]>;
  searchViolations(filters: {
    status?: string;
    payment_status?: string;
    liability_determination?: string;
    vehicle_id?: string;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ViolationWithDetails[]>;
}