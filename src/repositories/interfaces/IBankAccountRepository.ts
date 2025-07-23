import { IRepository } from './IRepository';

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  account_type: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  account_id?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface IBankAccountRepository extends IRepository<BankAccount> {
  getActiveBankAccounts(): Promise<BankAccount[]>;
  updateBalance(accountId: string, newBalance: number): Promise<void>;
  getByAccountNumber(accountNumber: string): Promise<BankAccount | null>;
}