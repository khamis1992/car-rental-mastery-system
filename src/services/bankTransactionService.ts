import { BankTransactionRepository } from '@/repositories/implementations/BankTransactionRepository';
import { BankAccountRepository } from '@/repositories/implementations/BankAccountRepository';
import { CreateBankTransactionData } from '@/repositories/interfaces/IBankTransactionRepository';

export class BankTransactionService {
  private static bankTransactionRepo = new BankTransactionRepository();
  private static bankAccountRepo = new BankAccountRepository();

  // إضافة إيداع جديد
  static async createDeposit(
    bankAccountId: string,
    amount: number,
    description: string,
    referenceNumber?: string
  ) {
    try {
      // التحقق من وجود الحساب البنكي
      const account = await this.bankAccountRepo.getById(bankAccountId);
      if (!account) {
        throw new Error('الحساب البنكي غير موجود');
      }

      // إنشاء معاملة الإيداع
      const transactionData: CreateBankTransactionData = {
        bank_account_id: bankAccountId,
        transaction_date: new Date().toISOString().split('T')[0],
        description: description || 'إيداع نقدي',
        reference_number: referenceNumber,
        debit_amount: 0,
        credit_amount: amount,
        transaction_type: 'deposit',
        status: 'completed'
      };

      const transaction = await this.bankTransactionRepo.createTransaction(transactionData);
      
      return transaction;
    } catch (error: any) {
      console.error('Error creating deposit:', error);
      throw new Error(error.message || 'فشل في إنشاء الإيداع');
    }
  }

  // إضافة سحب جديد
  static async createWithdrawal(
    bankAccountId: string,
    amount: number,
    description: string,
    referenceNumber?: string
  ) {
    try {
      // التحقق من وجود الحساب البنكي
      const account = await this.bankAccountRepo.getById(bankAccountId);
      if (!account) {
        throw new Error('الحساب البنكي غير موجود');
      }

      // التحقق من كفاية الرصيد
      const currentBalance = await this.bankTransactionRepo.getAccountBalance(bankAccountId);
      if (currentBalance < amount) {
        throw new Error('الرصيد غير كافي لإتمام عملية السحب');
      }

      // إنشاء معاملة السحب
      const transactionData: CreateBankTransactionData = {
        bank_account_id: bankAccountId,
        transaction_date: new Date().toISOString().split('T')[0],
        description: description || 'سحب نقدي',
        reference_number: referenceNumber,
        debit_amount: amount,
        credit_amount: 0,
        transaction_type: 'withdrawal',
        status: 'completed'
      };

      const transaction = await this.bankTransactionRepo.createTransaction(transactionData);
      
      return transaction;
    } catch (error: any) {
      console.error('Error creating withdrawal:', error);
      throw new Error(error.message || 'فشل في إنشاء السحب');
    }
  }

  // جلب معاملات الحساب البنكي
  static async getBankTransactions(bankAccountId: string, limit?: number) {
    try {
      return await this.bankTransactionRepo.getByBankAccount(bankAccountId, limit);
    } catch (error: any) {
      console.error('Error fetching bank transactions:', error);
      throw new Error(error.message || 'فشل في جلب المعاملات البنكية');
    }
  }

  // جلب معاملات حسب الفترة الزمنية
  static async getTransactionsByDateRange(
    bankAccountId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      return await this.bankTransactionRepo.getByDateRange(bankAccountId, startDate, endDate);
    } catch (error: any) {
      console.error('Error fetching transactions by date range:', error);
      throw new Error(error.message || 'فشل في جلب المعاملات حسب الفترة');
    }
  }

  // جلب رصيد الحساب الحالي
  static async getAccountBalance(bankAccountId: string) {
    try {
      return await this.bankTransactionRepo.getAccountBalance(bankAccountId);
    } catch (error: any) {
      console.error('Error fetching account balance:', error);
      throw new Error(error.message || 'فشل في جلب رصيد الحساب');
    }
  }

  // جلب الحسابات البنكية النشطة
  static async getActiveBankAccounts() {
    try {
      return await this.bankAccountRepo.getActiveBankAccounts();
    } catch (error: any) {
      console.error('Error fetching active bank accounts:', error);
      throw new Error(error.message || 'فشل في جلب الحسابات البنكية');
    }
  }

  // تحديث حالة المعاملة
  static async updateTransactionStatus(transactionId: string, status: string) {
    try {
      await this.bankTransactionRepo.updateTransactionStatus(transactionId, status);
    } catch (error: any) {
      console.error('Error updating transaction status:', error);
      throw new Error(error.message || 'فشل في تحديث حالة المعاملة');
    }
  }
}