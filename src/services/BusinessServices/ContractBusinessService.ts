import { IContractRepository } from '@/repositories/interfaces/IContractRepository';
import { ContractWithDetails } from '@/services/contractService';

export class ContractBusinessService {
  constructor(private contractRepository: IContractRepository) {}

  async getAllContracts(): Promise<ContractWithDetails[]> {
    return await this.contractRepository.getContractsWithDetails();
  }

  async getContractById(id: string) {
    return await this.contractRepository.getContractById(id);
  }

  async activateContract(id: string, actualStartDate: string, pickupMileage?: number) {
    // Business logic for contract activation
    const contract = await this.contractRepository.getContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'pending') {
      throw new Error('Contract must be in pending status to activate');
    }

    return await this.contractRepository.activateContract(id, actualStartDate, pickupMileage);
  }

  async completeContract(id: string, actualEndDate: string, returnMileage?: number, fuelLevelReturn?: string) {
    // Business logic for contract completion
    const contract = await this.contractRepository.getContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'active') {
      throw new Error('Contract must be active to complete');
    }

    return await this.contractRepository.completeContract(id, actualEndDate, returnMileage, fuelLevelReturn);
  }

  async updateContractStatus(id: string, status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled') {
    // Business logic for status updates
    const contract = await this.contractRepository.getContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Add status transition validation logic here
    return await this.contractRepository.updateContractStatus(id, status);
  }

  async getContractStats() {
    return await this.contractRepository.getContractStats();
  }

  async getRecentContracts(limit?: number) {
    return await this.contractRepository.getRecentContracts(limit);
  }

  async validateContractDates(startDate: string, endDate: string): Promise<boolean> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  }

  async calculateContractAmount(dailyRate: number, rentalDays: number, discountAmount: number = 0, taxAmount: number = 0): Promise<number> {
    const totalAmount = dailyRate * rentalDays;
    return totalAmount - discountAmount + taxAmount;
  }
}