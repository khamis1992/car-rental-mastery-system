import { IPaymentRepository } from '@/repositories/interfaces/IPaymentRepository';
import { IInvoiceRepository } from '@/repositories/interfaces/IInvoiceRepository';
import { Payment, PaymentFormData } from '@/types/invoice';
import { AccountingIntegrationService } from './AccountingIntegrationService';
import { supabase } from '@/integrations/supabase/client';

export class PaymentBusinessService {
  private accountingService: AccountingIntegrationService;

  constructor(
    private paymentRepository: IPaymentRepository,
    private invoiceRepository: IInvoiceRepository
  ) {
    this.accountingService = new AccountingIntegrationService();
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return await this.paymentRepository.getPaymentsByInvoice(invoiceId);
  }

  async createPayment(paymentData: PaymentFormData): Promise<Payment> {
    try {
      // Business logic for payment creation
      await this.validatePaymentData(paymentData);
      const payment = await this.paymentRepository.createPayment(paymentData);
      
      // Create accounting entry for the payment with improved error handling
      try {
        const invoice = await this.invoiceRepository.getInvoiceById(paymentData.invoice_id);
        if (invoice) {
          const customerName = await this.getCustomerName(invoice.customer_id);
          const journalEntryId = await this.accountingService.createPaymentAccountingEntry(payment.id, {
            customer_name: customerName,
            invoice_number: invoice.invoice_number,
            payment_amount: payment.amount,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date
          });
          
          if (journalEntryId) {
            console.log(`✅ Payment accounting entry created successfully: ${journalEntryId} for payment ${payment.id}`);
          }
        }
      } catch (accountingError: any) {
        console.error(`❌ Failed to create accounting entry for payment ${payment.id}:`, accountingError);
        // Don't fail the entire payment creation if accounting fails - log error for later reconciliation
        console.warn(`⚠️ Payment for invoice ${paymentData.invoice_id} created but accounting entry failed. This payment can be reprocessed using the System Integrity tools.`);
      }
      
      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error(`فشل في إنشاء الدفعة: ${error.message}`);
    }
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

  private async getCustomerName(customerId: string): Promise<string> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single();

      if (error || !customer) {
        return 'غير محدد';
      }

      return customer.name;
    } catch (error) {
      return 'غير محدد';
    }
  }
}