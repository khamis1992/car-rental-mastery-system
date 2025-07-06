import { IRepositoryWithQuery } from './IRepository';
import { Payment, PaymentFormData } from '@/types/invoice';

export interface IPaymentRepository extends IRepositoryWithQuery<Payment> {
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(paymentData: PaymentFormData): Promise<Payment>;
  updatePaymentStatus(id: string, status: Payment['status']): Promise<void>;
  updatePaymentJournalEntry(paymentId: string, journalEntryId: string): Promise<void>;
  deletePayment(id: string): Promise<void>;
  getPaymentStats(): Promise<{
    totalCount: number;
    totalAmount: number;
    monthlyAmount: number;
  }>;
  getRecentPayments(limit?: number): Promise<any[]>;
}