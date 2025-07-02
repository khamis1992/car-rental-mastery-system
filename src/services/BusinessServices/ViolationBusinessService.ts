import { IViolationRepository } from '@/repositories/interfaces/IViolationRepository';
import { TrafficViolation, ViolationWithDetails } from '@/types/violation';

export class ViolationBusinessService {
  constructor(private violationRepository: IViolationRepository) {}

  async getAllViolations(): Promise<TrafficViolation[]> {
    return this.violationRepository.getAll();
  }

  async getViolationById(id: string): Promise<TrafficViolation | null> {
    return this.violationRepository.getById(id);
  }

  async createViolation(violationData: Omit<TrafficViolation, 'id' | 'created_at' | 'updated_at'>): Promise<TrafficViolation> {
    return this.violationRepository.create(violationData);
  }

  async updateViolation(id: string, updates: Partial<TrafficViolation>): Promise<TrafficViolation> {
    return this.violationRepository.update(id, updates);
  }

  async deleteViolation(id: string): Promise<void> {
    return this.violationRepository.delete(id);
  }

  async getViolationsWithDetails(): Promise<ViolationWithDetails[]> {
    return this.violationRepository.getViolationsWithDetails();
  }

  async getCustomerViolations(customerId: string): Promise<ViolationWithDetails[]> {
    return this.violationRepository.getByCustomerId(customerId);
  }

  async getVehicleViolations(vehicleId: string): Promise<ViolationWithDetails[]> {
    return this.violationRepository.getByVehicleId(vehicleId);
  }

  async getViolationsByStatus(status: string): Promise<ViolationWithDetails[]> {
    return this.violationRepository.getByStatus(status);
  }

  async searchViolations(filters: {
    status?: string;
    payment_status?: string;
    liability_determination?: string;
    vehicle_id?: string;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ViolationWithDetails[]> {
    return this.violationRepository.searchViolations(filters);
  }

  async determineViolationLiability(
    id: string, 
    liability: 'customer' | 'company' | 'shared',
    percentage: number,
    reason?: string
  ): Promise<TrafficViolation> {
    const updates = {
      liability_determination: liability,
      liability_percentage: percentage,
      liability_reason: reason,
      liability_determined_at: new Date().toISOString()
    };
    
    return this.violationRepository.update(id, updates);
  }

  async markAsNotified(id: string): Promise<TrafficViolation> {
    const updates = {
      status: 'notified' as any,
      customer_notified_at: new Date().toISOString()
    };
    
    return this.violationRepository.update(id, updates);
  }
}