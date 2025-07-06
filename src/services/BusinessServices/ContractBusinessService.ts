import { IContractRepository } from '@/repositories/interfaces/IContractRepository';
import { ContractWithDetails } from '@/services/contractService';
import { contractAccountingService, ContractAccountingData } from '@/services/contractAccountingService';

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

  async updateContract(id: string, updates: any) {
    // Business logic for contract updates
    const contract = await this.contractRepository.getContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    return await this.contractRepository.updateContract(id, updates);
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

  async updateSignature(id: string, signatureType: 'customer' | 'company', signature: string) {
    const contract = await this.contractRepository.getContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    return await this.contractRepository.updateContractSignature(id, signatureType, signature);
  }

  async markDeliveryCompleted(id: string, deliveryData: any) {
    const contract = await this.contractRepository.getContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'pending') {
      throw new Error('Contract must be in pending status to mark delivery as completed');
    }

    return await this.contractRepository.markDeliveryCompleted(id, deliveryData);
  }

  async registerPayment(id: string) {
    const contract = await this.contractRepository.getContractById(id);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'pending') {
      throw new Error('Contract must be in pending status to register payment');
    }

    if (!contract.delivery_completed_at) {
      throw new Error('Delivery must be completed before registering payment');
    }

    // Register payment and set status to active
    const result = await this.contractRepository.updateContract(id, {
      payment_registered_at: new Date().toISOString(),
      status: 'active',
      updated_at: new Date().toISOString()
    });

    // إنشاء القيد المحاسبي عند تفعيل العقد
    try {
      await this.createAccountingEntry(contract);
    } catch (error) {
      console.error('فشل في إنشاء القيد المحاسبي للعقد:', error);
      // لا نريد فشل العملية بسبب خطأ المحاسبة
    }

    return result;
  }

  // طرق تكامل المحاسبة
  async createAccountingEntry(contract: any): Promise<string> {
    const contractAccountingData: ContractAccountingData = {
      contract_id: contract.id,
      customer_name: contract.customers?.name || 'غير محدد',
      vehicle_info: contract.vehicles ? 
        `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.vehicle_number}` : 'غير محدد',
      contract_number: contract.contract_number,
      total_amount: contract.total_amount || 0,
      security_deposit: contract.security_deposit || 0,
      insurance_amount: contract.insurance_amount || 0,
      tax_amount: contract.tax_amount || 0,
      discount_amount: contract.discount_amount || 0,
      start_date: contract.start_date,
      end_date: contract.end_date
    };

    const journalEntryId = await contractAccountingService.createContractAccountingEntry(contractAccountingData);
    
    if (!journalEntryId) {
      throw new Error('فشل في إنشاء القيد المحاسبي للعقد');
    }
    
    return journalEntryId;
  }

  async hasAccountingEntries(contractId: string): Promise<boolean> {
    return await contractAccountingService.hasAccountingEntries(contractId);
  }

  async getContractAccountingEntries(contractId: string) {
    return await contractAccountingService.getContractAccountingEntries(contractId);
  }

  async getContractJournalEntry(contractId: string) {
    return await contractAccountingService.getContractJournalEntry(contractId);
  }

  async createPaymentEntry(contractId: string, paymentData: {
    customer_name: string;
    vehicle_info: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'check';
    payment_date?: string;
    bank_account_id?: string;
    reference_number?: string;
  }): Promise<string> {
    return await contractAccountingService.createContractPaymentEntry(contractId, paymentData);
  }

  async createDepositReturnEntry(contractId: string, depositData: {
    customer_name: string;
    vehicle_info: string;
    deposit_amount: number;
    deductions: number;
    net_return: number;
    return_date?: string;
  }): Promise<string> {
    return await contractAccountingService.createDepositReturnEntry(contractId, depositData);
  }

  async getContractAccountingReport(filters: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    status?: string;
  }) {
    return await contractAccountingService.getContractAccountingReport(filters);
  }

  async getContractAccountingSummary(period: { year: number; month?: number }) {
    return await contractAccountingService.getContractAccountingSummary(period);
  }

  // TODO: إضافة دالة createContract عند الحاجة

  // وظيفة تحديث العقد بمعرف القيد
  private async updateContractWithJournalEntry(contractId: string, journalEntryId: string): Promise<void> {
    try {
      await this.contractRepository.updateContract(contractId, {
        journal_entry_id: journalEntryId,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update contract with journal entry ID:', error);
      throw error;
    }
  }
}