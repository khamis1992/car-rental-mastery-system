import { IAdditionalChargeRepository } from '@/repositories/interfaces/IAdditionalChargeRepository';
import { AdditionalCharge } from '@/types/invoice';

export class AdditionalChargeBusinessService {
  constructor(private additionalChargeRepository: IAdditionalChargeRepository) {}

  async getChargesByContract(contractId: string): Promise<AdditionalCharge[]> {
    return await this.additionalChargeRepository.getChargesByContract(contractId);
  }

  async getPendingCharges(): Promise<AdditionalCharge[]> {
    return await this.additionalChargeRepository.getPendingCharges();
  }

  async createCharge(chargeData: Omit<AdditionalCharge, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<AdditionalCharge> {
    // Business logic validation
    this.validateChargeData(chargeData);
    return await this.additionalChargeRepository.createCharge(chargeData);
  }

  async updateChargeStatus(id: string, status: AdditionalCharge['status'], invoiceId?: string): Promise<void> {
    const charge = await this.additionalChargeRepository.getById(id);
    if (!charge) {
      throw new Error('Additional charge not found');
    }

    if (charge.status === 'invoiced' && status !== 'invoiced') {
      throw new Error('Cannot change status of an invoiced charge');
    }

    await this.additionalChargeRepository.updateChargeStatus(id, status, invoiceId);
  }

  async deleteCharge(id: string): Promise<void> {
    const charge = await this.additionalChargeRepository.getById(id);
    if (!charge) {
      throw new Error('Additional charge not found');
    }

    if (charge.status === 'invoiced') {
      throw new Error('Cannot delete an invoiced charge');
    }

    await this.additionalChargeRepository.deleteCharge(id);
  }

  async getChargeStats() {
    return await this.additionalChargeRepository.getChargeStats();
  }

  private validateChargeData(chargeData: Omit<AdditionalCharge, 'id' | 'created_at' | 'updated_at' | 'created_by'>): void {
    if (!chargeData.contract_id || !chargeData.customer_id) {
      throw new Error('Contract and customer are required');
    }

    if (!chargeData.amount || chargeData.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    if (!chargeData.charge_type || !chargeData.description) {
      throw new Error('Charge type and description are required');
    }
  }
}