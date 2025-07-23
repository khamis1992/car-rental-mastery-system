import { BaseRepository } from './base/BaseRepository';
import type { ReceivedCheckFormData } from '@/types/checks';

export interface ReceivedCheckRow {
  id: string;
  tenant_id?: string; // Optional since it's handled by trigger
  check_number: string;
  drawer_name: string;
  drawer_account?: string;
  amount: number;
  check_date: string;
  received_date: string;
  due_date?: string;
  bank_name: string;
  status: string;
  deposit_bank_account_id?: string;
  deposited_at?: string;
  cleared_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
  reference_type?: string;
  reference_id?: string;
  journal_entry_id?: string;
  memo?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export class ReceivedChecksRepository extends BaseRepository<ReceivedCheckRow> {
  protected tableName = 'received_checks';

  async createReceivedCheck(data: ReceivedCheckFormData): Promise<ReceivedCheckRow> {
    const checkData = {
      check_number: data.check_number,
      drawer_name: data.drawer_name,
      drawer_account: data.drawer_account || '',
      amount: data.amount,
      check_date: data.check_date,
      received_date: data.received_date,
      due_date: data.due_date || '',
      bank_name: data.bank_name,
      memo: data.memo || '',
      reference_type: data.reference_type || '',
      reference_id: data.reference_id || '',
      status: 'received'
      // tenant_id will be handled by RLS trigger
    };

    return this.create(checkData);
  }

  async getReceivedChecks(): Promise<ReceivedCheckRow[]> {
    return this.query({
      orderBy: 'received_date',
      orderDirection: 'desc'
    });
  }
}