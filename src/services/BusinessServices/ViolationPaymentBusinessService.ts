import { IViolationPaymentRepository } from '@/repositories/interfaces/IViolationPaymentRepository';
import { ViolationPayment } from '@/types/violation';

export class ViolationPaymentBusinessService {
  constructor(private violationPaymentRepository: IViolationPaymentRepository) {}

  async getAllViolationPayments(): Promise<ViolationPayment[]> {
    return this.violationPaymentRepository.getAll();
  }

  async getViolationPaymentById(id: string): Promise<ViolationPayment | null> {
    return this.violationPaymentRepository.getById(id);
  }

  async createViolationPayment(paymentData: Omit<ViolationPayment, 'id' | 'created_at' | 'updated_at'>): Promise<ViolationPayment> {
    return this.violationPaymentRepository.create(paymentData);
  }

  async updateViolationPayment(id: string, updates: Partial<ViolationPayment>): Promise<ViolationPayment> {
    return this.violationPaymentRepository.update(id, updates);
  }

  async deleteViolationPayment(id: string): Promise<void> {
    return this.violationPaymentRepository.delete(id);
  }

  async getViolationPayments(violationId: string): Promise<ViolationPayment[]> {
    return this.violationPaymentRepository.getByViolationId(violationId);
  }

  async getPaymentsByStatus(status: string): Promise<ViolationPayment[]> {
    return this.violationPaymentRepository.getByStatus(status);
  }

  async getPaymentsByDateRange(startDate: string, endDate: string): Promise<ViolationPayment[]> {
    return this.violationPaymentRepository.getByDateRange(startDate, endDate);
  }
}