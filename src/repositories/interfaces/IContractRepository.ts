import { IRepositoryWithQuery } from './IRepository';
import { ContractWithDetails } from '@/services/contractService';

export interface IContractRepository extends IRepositoryWithQuery<ContractWithDetails> {
  getContractsWithDetails(): Promise<ContractWithDetails[]>;
  getContractById(id: string): Promise<any>;
  updateContract(id: string, updates: any): Promise<any>;
  updateContractSignature(id: string, signatureType: 'customer' | 'company', signature: string): Promise<any>;
  markDeliveryCompleted(id: string, deliveryData: any): Promise<any>;
  markPaymentRegistered(id: string, paymentRegisteredAt?: string): Promise<any>;
  activateContract(id: string, actualStartDate: string, pickupMileage?: number): Promise<any>;
  completeContract(id: string, actualEndDate: string, returnMileage?: number, fuelLevelReturn?: string): Promise<any>;
  updateContractStatus(id: string, status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled'): Promise<any>;
  getContractsRequiringInvoices(): Promise<any[]>;
  getContractStats(): Promise<{
    total: number;
    active: number;
    endingToday: number;
    monthlyRevenue: number;
  }>;
  getRecentContracts(limit?: number): Promise<any[]>;
}