import { IRepository } from './IRepository';
import { ViolationPayment } from '@/types/violation';

export interface IViolationPaymentRepository extends IRepository<ViolationPayment> {
  getByViolationId(violationId: string): Promise<ViolationPayment[]>;
  getByStatus(status: string): Promise<ViolationPayment[]>;
  getByDateRange(startDate: string, endDate: string): Promise<ViolationPayment[]>;
}