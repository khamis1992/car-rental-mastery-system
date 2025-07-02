import { IQuotationRepository } from '@/repositories/interfaces/IQuotationRepository';
import { QuotationWithDetails } from '@/services/quotationService';

export class QuotationBusinessService {
  constructor(private quotationRepository: IQuotationRepository) {}

  async getAllQuotations(): Promise<QuotationWithDetails[]> {
    return await this.quotationRepository.getQuotationsWithDetails();
  }

  async getQuotationById(id: string) {
    return await this.quotationRepository.getQuotationById(id);
  }

  async updateQuotationStatus(id: string, status: string) {
    const quotation = await this.quotationRepository.getQuotationById(id);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Validate status transitions
    this.validateStatusTransition(quotation.status, status);
    
    return await this.quotationRepository.updateQuotationStatus(id, status);
  }

  async deleteQuotation(id: string): Promise<void> {
    const quotation = await this.quotationRepository.getQuotationById(id);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (quotation.status === 'converted') {
      throw new Error('Cannot delete a converted quotation');
    }

    await this.quotationRepository.deleteQuotation(id);
  }

  async getActiveQuotations() {
    return await this.quotationRepository.getActiveQuotations();
  }

  async getQuotationStats() {
    return await this.quotationRepository.getQuotationStats();
  }

  async checkQuotationExpiry(id: string): Promise<boolean> {
    const quotation = await this.quotationRepository.getQuotationById(id);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    const today = new Date();
    const validUntil = new Date(quotation.valid_until);
    return validUntil < today;
  }

  async calculateQuotationAmount(dailyRate: number, rentalDays: number, discountAmount: number = 0, taxAmount: number = 0): Promise<number> {
    const totalAmount = dailyRate * rentalDays;
    return totalAmount - discountAmount + taxAmount;
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'draft': ['sent', 'cancelled'],
      'sent': ['accepted', 'rejected', 'expired'],
      'accepted': ['converted', 'expired'],
      'rejected': [],
      'expired': [],
      'converted': [],
      'cancelled': []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}