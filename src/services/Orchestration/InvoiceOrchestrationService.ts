import { BaseOrchestrationService } from './BaseOrchestrationService';
import { OrchestrationResult, TransactionStep, EventBus } from './types';
import { InvoiceBusinessService } from '../BusinessServices/InvoiceBusinessService';
import { PaymentBusinessService } from '../BusinessServices/PaymentBusinessService';
import { AdditionalChargeBusinessService } from '../BusinessServices/AdditionalChargeBusinessService';

export interface InvoicePaymentRequest {
  invoiceId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  bankName?: string;
  checkNumber?: string;
  notes?: string;
}

export interface InvoiceWithAdditionalChargesRequest {
  contractId: string;
  customerId: string;
  additionalCharges: Array<{
    type: string;
    amount: number;
    description: string;
    chargeDate?: string;
    notes?: string;
  }>;
  dueDate: string;
  notes?: string;
}

export class InvoiceOrchestrationService extends BaseOrchestrationService {
  constructor(
    eventBus: EventBus,
    private invoiceService: InvoiceBusinessService,
    private paymentService: PaymentBusinessService,
    private additionalChargeService: AdditionalChargeBusinessService
  ) {
    super(eventBus);
  }

  async processInvoicePayment(request: InvoicePaymentRequest): Promise<OrchestrationResult> {
    let createdPaymentId: string | null = null;

    const steps: TransactionStep[] = [
      {
        name: 'validateInvoice',
        execute: async () => {
          const invoice = await this.invoiceService.getInvoiceById(request.invoiceId);
          if (!invoice) {
            throw new Error('Invoice not found');
          }
          if (invoice.status === 'paid') {
            throw new Error('Invoice is already paid');
          }
          if (invoice.outstanding_amount < request.paymentAmount) {
            throw new Error('Payment amount exceeds outstanding amount');
          }
          return invoice;
        },
        rollback: async () => {
          // No rollback needed for validation
        },
      },
      {
        name: 'createPayment',
        execute: async () => {
          const payment = await this.paymentService.createPayment({
            invoice_id: request.invoiceId,
            amount: request.paymentAmount,
            payment_date: request.paymentDate,
            payment_method: request.paymentMethod as 'cash' | 'card' | 'bank_transfer' | 'check' | 'online',
            transaction_reference: request.transactionReference,
            bank_name: request.bankName,
            check_number: request.checkNumber,
            notes: request.notes,
          });
          createdPaymentId = payment.id;
          return payment;
        },
        rollback: async () => {
          if (createdPaymentId) {
            await this.paymentService.deletePayment(createdPaymentId);
          }
        },
      },
      {
        name: 'updateInvoiceStatus',
        execute: async () => {
          const invoice = await this.invoiceService.getInvoiceById(request.invoiceId);
          const newOutstandingAmount = invoice!.outstanding_amount - request.paymentAmount;
          
          let newStatus = invoice!.status;
          if (newOutstandingAmount <= 0) {
            newStatus = 'paid';
          } else if (newOutstandingAmount < invoice!.total_amount) {
            newStatus = 'partially_paid';
          }

          await this.invoiceService.updateInvoiceStatus(request.invoiceId, newStatus);
        },
        rollback: async () => {
          // Invoice status will be automatically updated when payment is deleted
        },
      },
    ];

    const result = await this.executeWithRollback(steps);
    
    if (result.success) {
      await this.emitEvent({
        type: 'INVOICE_PAYMENT_PROCESSED',
        payload: { 
          invoiceId: request.invoiceId,
          paymentId: createdPaymentId,
          amount: request.paymentAmount 
        },
        timestamp: new Date(),
        source: 'InvoiceOrchestrationService',
      });
    }

    return result;
  }

  async createInvoiceWithAdditionalCharges(request: InvoiceWithAdditionalChargesRequest): Promise<OrchestrationResult> {
    let createdInvoiceId: string | null = null;
    const createdChargeIds: string[] = [];

    const steps: TransactionStep[] = [
      {
        name: 'createAdditionalCharges',
        execute: async () => {
          for (const charge of request.additionalCharges) {
            const createdCharge = await this.additionalChargeService.createCharge({
              contract_id: request.contractId,
              customer_id: request.customerId,
              charge_type: charge.type as 'fuel' | 'cleaning' | 'damage' | 'penalty' | 'extension' | 'insurance' | 'other',
              amount: charge.amount,
              description: charge.description,
              charge_date: charge.chargeDate || new Date().toISOString().split('T')[0],
              notes: charge.notes,
              status: 'pending',
            });
            createdChargeIds.push(createdCharge.id);
          }
        },
        rollback: async () => {
          for (const chargeId of createdChargeIds) {
            try {
              await this.additionalChargeService.deleteCharge(chargeId);
            } catch (error) {
              console.error(`Failed to rollback additional charge ${chargeId}:`, error);
            }
          }
        },
      },
      {
        name: 'createInvoice',
        execute: async () => {
          const totalChargeAmount = request.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
          
          const invoice = await this.invoiceService.createInvoice({
            contract_id: request.contractId,
            customer_id: request.customerId,
            due_date: request.dueDate,
            invoice_type: 'additional',
            tax_amount: 0,
            discount_amount: 0,
            payment_terms: 'استحقاق خلال 30 يوم',
            notes: request.notes,
            terms_and_conditions: 'شروط وأحكام الرسوم الإضافية',
            items: request.additionalCharges.map((charge, index) => ({
              description: charge.description,
              item_type: 'other' as const,
              quantity: 1,
              unit_price: charge.amount,
            })),
          });
          
          createdInvoiceId = invoice.id;
          return invoice;
        },
        rollback: async () => {
          if (createdInvoiceId) {
            await this.invoiceService.deleteInvoice(createdInvoiceId);
          }
        },
      },
      {
        name: 'linkChargesToInvoice',
        execute: async () => {
          for (const chargeId of createdChargeIds) {
            await this.additionalChargeService.updateChargeStatus(chargeId, 'invoiced', createdInvoiceId);
          }
        },
        rollback: async () => {
          for (const chargeId of createdChargeIds) {
            try {
              await this.additionalChargeService.updateChargeStatus(chargeId, 'pending');
            } catch (error) {
              console.error(`Failed to unlink additional charge ${chargeId}:`, error);
            }
          }
        },
      },
    ];

    const result = await this.executeWithRollback(steps);
    
    if (result.success) {
      await this.emitEvent({
        type: 'INVOICE_WITH_CHARGES_CREATED',
        payload: { 
          invoiceId: createdInvoiceId,
          contractId: request.contractId,
          chargeIds: createdChargeIds,
          totalAmount: request.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
        },
        timestamp: new Date(),
        source: 'InvoiceOrchestrationService',
      });
    }

    return result;
  }

  async voidInvoice(invoiceId: string, reason: string): Promise<OrchestrationResult> {
    const steps: TransactionStep[] = [
      {
        name: 'validateInvoice',
        execute: async () => {
          const invoice = await this.invoiceService.getInvoiceById(invoiceId);
          if (!invoice) {
            throw new Error('Invoice not found');
          }
          if (invoice.status === 'paid') {
            throw new Error('Cannot void a paid invoice');
          }
          if (invoice.paid_amount > 0) {
            throw new Error('Cannot void an invoice with payments');
          }
          return invoice;
        },
        rollback: async () => {
          // No rollback needed for validation
        },
      },
      {
        name: 'voidInvoice',
        execute: async () => {
          await this.invoiceService.updateInvoiceStatus(invoiceId, 'cancelled');
        },
        rollback: async () => {
          await this.invoiceService.updateInvoiceStatus(invoiceId, 'draft');
        },
      },
      {
        name: 'updateLinkedCharges',
        execute: async () => {
          // Update any linked additional charges back to pending status
          const invoice = await this.invoiceService.getInvoiceById(invoiceId);
          if (invoice?.invoice_type === 'additional') {
            // This would require a method to get charges by invoice ID
            // For now, we'll emit an event that can be handled by other services
            await this.emitEvent({
              type: 'INVOICE_VOIDED_UPDATE_CHARGES',
              payload: { invoiceId, reason },
              timestamp: new Date(),
              source: 'InvoiceOrchestrationService',
            });
          }
        },
        rollback: async () => {
          // Rollback handled by invoice status rollback
        },
      },
    ];

    const result = await this.executeWithRollback(steps);
    
    if (result.success) {
      await this.emitEvent({
        type: 'INVOICE_VOIDED',
        payload: { invoiceId, reason },
        timestamp: new Date(),
        source: 'InvoiceOrchestrationService',
      });
    }

    return result;
  }
}