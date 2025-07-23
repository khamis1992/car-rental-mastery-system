import { BaseRepository } from './base/BaseRepository';
import type { CheckFormData } from '@/types/checks';

export interface CheckRow {
  id: string;
  tenant_id?: string; // Optional since it's handled by trigger
  checkbook_id?: string;
  check_number: string;
  payee_name: string;
  amount: number;
  check_date: string;
  check_category: string;
  check_type: string;
  currency: string;
  bank_account_id: string;
  status: string;
  memo?: string;
  reference_type?: string;
  reference_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export class ChecksRepository extends BaseRepository<CheckRow> {
  protected tableName = 'checks';

  async createPaidCheck(data: CheckFormData, bankAccountId: string): Promise<CheckRow> {
    const checkData = {
      checkbook_id: data.checkbook_id,
      check_number: data.check_number,
      payee_name: data.payee_name,
      amount: data.amount,
      check_date: data.check_date,
      memo: data.memo || '',
      reference_type: data.reference_type || '',
      reference_id: data.reference_id || '',
      bank_account_id: bankAccountId,
      check_type: 'personal',
      currency: 'KWD',
      check_category: 'outgoing',
      status: 'issued'
      // tenant_id will be handled by RLS trigger
    };

    return this.create(checkData);
  }

  async getPaidChecks(): Promise<CheckRow[]> {
    return this.query({
      filters: { check_category: 'outgoing' },
      orderBy: 'check_date',
      orderDirection: 'desc'
    });
  }
}