import { IRepositoryWithQuery } from './IRepository';
import { QuotationWithDetails } from '@/services/quotationService';

export interface IQuotationRepository extends IRepositoryWithQuery<QuotationWithDetails> {
  getQuotationsWithDetails(): Promise<QuotationWithDetails[]>;
  getQuotationById(id: string): Promise<any>;
  updateQuotationStatus(id: string, status: string): Promise<any>;
  deleteQuotation(id: string): Promise<void>;
  getActiveQuotations(): Promise<any[]>;
  getQuotationStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    totalValue: number;
  }>;
}