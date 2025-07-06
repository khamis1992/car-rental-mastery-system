import { IRepositoryWithQuery } from './IRepository';
import { Invoice, InvoiceWithDetails, InvoiceFormData } from '@/types/invoice';

export interface IInvoiceRepository extends IRepositoryWithQuery<Invoice> {
  getInvoicesWithDetails(): Promise<InvoiceWithDetails[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(invoiceData: InvoiceFormData): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void>;
  updateInvoiceJournalEntry(invoiceId: string, journalEntryId: string): Promise<void>;
  deleteInvoice(id: string): Promise<void>;
  generateRentalInvoice(contractId: string): Promise<Invoice>;
  getInvoiceStats(): Promise<{
    total: number;
    paid: number;
    overdue: number;
    totalRevenue: number;
    outstandingRevenue: number;
  }>;
  getOverdueInvoices(): Promise<any[]>;
}