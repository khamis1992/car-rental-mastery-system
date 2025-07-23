import { IRepository } from './IRepository';

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  description: string;
  reference_number?: string;
  debit_amount: number;
  credit_amount: number;
  balance_after: number;
  transaction_type: string;
  status: string;
  journal_entry_id?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateBankTransactionData {
  bank_account_id: string;
  transaction_date: string;
  description: string;
  reference_number?: string;
  debit_amount: number;
  credit_amount: number;
  transaction_type: string;
  status?: string;
  journal_entry_id?: string;
}

export interface IBankTransactionRepository extends IRepository<BankTransaction> {
  getByBankAccount(bankAccountId: string, limit?: number): Promise<BankTransaction[]>;
  getByDateRange(bankAccountId: string, startDate: string, endDate: string): Promise<BankTransaction[]>;
  createTransaction(data: CreateBankTransactionData): Promise<BankTransaction>;
  updateTransactionStatus(transactionId: string, status: string): Promise<void>;
  getAccountBalance(bankAccountId: string): Promise<number>;
}