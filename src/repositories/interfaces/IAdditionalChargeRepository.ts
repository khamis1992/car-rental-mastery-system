import { IRepositoryWithQuery } from './IRepository';
import { AdditionalCharge } from '@/types/invoice';

export interface IAdditionalChargeRepository extends IRepositoryWithQuery<AdditionalCharge> {
  getChargesByContract(contractId: string): Promise<AdditionalCharge[]>;
  getPendingCharges(): Promise<AdditionalCharge[]>;
  createCharge(chargeData: Omit<AdditionalCharge, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<AdditionalCharge>;
  updateChargeStatus(id: string, status: AdditionalCharge['status'], invoiceId?: string): Promise<void>;
  deleteCharge(id: string): Promise<void>;
  getChargeStats(): Promise<{
    total: number;
    pending: number;
    totalAmount: number;
  }>;
}