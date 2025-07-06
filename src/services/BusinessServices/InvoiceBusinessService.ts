import { IInvoiceRepository } from '@/repositories/interfaces/IInvoiceRepository';
import { Invoice, InvoiceWithDetails, InvoiceFormData } from '@/types/invoice';
import { AccountingIntegrationService } from './AccountingIntegrationService';
import { supabase } from '@/integrations/supabase/client';

export class InvoiceBusinessService {
  private accountingService: AccountingIntegrationService;

  constructor(private invoiceRepository: IInvoiceRepository) {
    this.accountingService = new AccountingIntegrationService();
  }

  async getAllInvoices(): Promise<InvoiceWithDetails[]> {
    return await this.invoiceRepository.getInvoicesWithDetails();
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return await this.invoiceRepository.getInvoiceById(id);
  }

  async createInvoice(invoiceData: InvoiceFormData): Promise<Invoice> {
    try {
      // Business logic for invoice creation
      this.validateInvoiceData(invoiceData);
      
      // الحصول على اسم العميل مسبقاً
      const customerName = await this.getCustomerName(invoiceData.customer_id);
      
      // إنشاء الفاتورة
      const invoice = await this.invoiceRepository.createInvoice(invoiceData);
      
<<<<<<< HEAD
      // إنشاء القيد المحاسبي - إجباري
=======
      // Create receivable entry for the invoice (no revenue recorded yet)
>>>>>>> 4f25b4f138ad579f7b53236824abd7472f545afc
      try {
        const journalEntryId = await this.accountingService.createInvoiceAccountingEntry(invoice.id, {
          customer_name: customerName,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount || 0,
          tax_amount: invoice.tax_amount || 0,
          discount_amount: invoice.discount_amount || 0
        });
        
<<<<<<< HEAD
        if (!journalEntryId) {
          throw new Error('فشل في إنشاء القيد المحاسبي للفاتورة');
        }
        
        // تحديث الفاتورة بمعرف القيد
        await this.updateInvoiceWithJournalEntry(invoice.id, journalEntryId);
        
      } catch (accountingError) {
        // حذف الفاتورة إذا فشل إنشاء القيد المحاسبي
        try {
          await this.invoiceRepository.deleteInvoice(invoice.id);
        } catch (deleteError) {
          console.error('Failed to rollback invoice after accounting error:', deleteError);
        }
        
        throw new Error(`فشل في إنشاء القيد المحاسبي: ${accountingError.message}`);
=======
        if (journalEntryId) {
          console.log(`✅ Invoice receivable entry created successfully: ${journalEntryId}`);
        }
      } catch (accountingError: any) {
        console.error('❌ Failed to create receivable entry for invoice:', accountingError);
        // Don't fail the entire invoice creation if accounting fails - log error for later reconciliation
        console.warn(`⚠️ Invoice ${invoice.invoice_number} created but receivable entry failed. Manual reconciliation may be needed.`);
>>>>>>> 4f25b4f138ad579f7b53236824abd7472f545afc
      }
      
      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error(`فشل في إنشاء الفاتورة: ${error.message}`);
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const existingInvoice = await this.invoiceRepository.getInvoiceById(id);
    if (!existingInvoice) {
      throw new Error('Invoice not found');
    }

    if (existingInvoice.status === 'paid') {
      throw new Error('Cannot update a paid invoice');
    }

    return await this.invoiceRepository.updateInvoice(id, updates);
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
    const invoice = await this.invoiceRepository.getInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Validate status transitions
    this.validateStatusTransition(invoice.status, status);
    
    await this.invoiceRepository.updateInvoiceStatus(id, status);
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.invoiceRepository.getInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot delete a paid invoice');
    }

    await this.invoiceRepository.deleteInvoice(id);
  }

  async generateRentalInvoice(contractId: string): Promise<Invoice> {
    return await this.invoiceRepository.generateRentalInvoice(contractId);
  }

  async getInvoiceStats() {
    return await this.invoiceRepository.getInvoiceStats();
  }

  async getOverdueInvoices() {
    return await this.invoiceRepository.getOverdueInvoices();
  }

  private validateInvoiceData(invoiceData: InvoiceFormData): void {
    if (!invoiceData.contract_id || !invoiceData.customer_id) {
      throw new Error('Contract and customer are required');
    }

    if (!invoiceData.due_date) {
      throw new Error('Due date is required');
    }

    if (new Date(invoiceData.due_date) < new Date()) {
      throw new Error('Due date cannot be in the past');
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new Error('At least one invoice item is required');
    }
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'draft': ['sent', 'cancelled'],
      'sent': ['paid', 'overdue', 'cancelled'],
      'overdue': ['paid', 'cancelled'],
      'paid': [],
      'cancelled': []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
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

  // وظيفة جديدة لتحديث الفاتورة بمعرف القيد
  private async updateInvoiceWithJournalEntry(invoiceId: string, journalEntryId: string): Promise<void> {
    try {
      await this.invoiceRepository.updateInvoiceJournalEntry(invoiceId, journalEntryId);
    } catch (error) {
      console.error('Failed to update invoice with journal entry ID:', error);
      throw error;
    }
  }
}