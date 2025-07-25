import { IRepositoryWithQuery } from './IRepository';
import { Payment, PaymentFormData } from '@/types/invoice';

export interface IPaymentRepository extends IRepositoryWithQuery<Payment> {
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(paymentData: PaymentFormData): Promise<Payment>;
  updatePaymentStatus(id: string, status: Payment['status']): Promise<void>;
  deletePayment(id: string): Promise<void>;
  generatePaymentNumber(): Promise<string>;
  getPaymentsByContract(contractId: string): Promise<Payment[]>;
  getPaymentStats(): Promise<{
    totalCount: number;
    totalAmount: number;
    monthlyAmount: number;
  }>;
  getRecentPayments(limit?: number): Promise<any[]>;
}