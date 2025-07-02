import { IPaymentRepository } from '@/repositories/interfaces/IPaymentRepository';
import { IInvoiceRepository } from '@/repositories/interfaces/IInvoiceRepository';
import { Payment, PaymentFormData } from '@/types/invoice';

export class PaymentBusinessService {
  constructor(
    private paymentRepository: IPaymentRepository,
    private invoiceRepository: IInvoiceRepository
  ) {}

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return await this.paymentRepository.getPaymentsByInvoice(invoiceId);
  }

  async createPayment(paymentData: PaymentFormData): Promise<Payment> {
    // Business logic for payment creation
    await this.validatePaymentData(paymentData);
    return await this.paymentRepository.createPayment(paymentData);
  }

  async updatePaymentStatus(id: string, status: Payment['status']): Promise<void> {
    const payment = await this.paymentRepository.getById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    await this.paymentRepository.updatePaymentStatus(id, status);
  }

  async deletePayment(id: string): Promise<void> {
    const payment = await this.paymentRepository.getById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'completed') {
      throw new Error('Cannot delete a completed payment');
    }

    await this.paymentRepository.deletePayment(id);
  }

  async getPaymentStats() {
    return await this.paymentRepository.getPaymentStats();
  }

  async getRecentPayments(limit?: number) {
    return await this.paymentRepository.getRecentPayments(limit);
  }

  private async validatePaymentData(paymentData: PaymentFormData): Promise<void> {
    if (!paymentData.invoice_id || !paymentData.amount) {
      throw new Error('Invoice and amount are required');
    }

    if (paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Check if invoice exists and is not fully paid
    const invoice = await this.invoiceRepository.getInvoiceById(paymentData.invoice_id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Invoice is already fully paid');
    }

    // Check if payment amount doesn't exceed outstanding amount
    const outstandingAmount = invoice.outstanding_amount || invoice.total_amount;
    if (paymentData.amount > outstandingAmount) {
      throw new Error(`Payment amount cannot exceed outstanding amount of ${outstandingAmount}`);
    }

    // Validate payment method specific fields
    if (paymentData.payment_method === 'check' && !paymentData.check_number) {
      throw new Error('Check number is required for check payments');
    }

    if (paymentData.payment_method === 'bank_transfer' && !paymentData.transaction_reference) {
      throw new Error('Transaction reference is required for bank transfers');
    }
  }
}