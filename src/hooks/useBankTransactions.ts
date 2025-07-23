import { useState, useEffect } from 'react';
import { BankTransactionService } from '@/services/bankTransactionService';
import { BankTransaction } from '@/repositories/interfaces/IBankTransactionRepository';
import { BankAccount } from '@/repositories/interfaces/IBankAccountRepository';
import { useToast } from './use-toast';

export const useBankTransactions = (bankAccountId?: string) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  // تحميل الحسابات البنكية النشطة
  const loadBankAccounts = async () => {
    try {
      const accounts = await BankTransactionService.getActiveBankAccounts();
      setBankAccounts(accounts);
    } catch (error: any) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحميل الحسابات البنكية",
        variant: "destructive",
      });
    }
  };

  // تحميل معاملات الحساب البنكي
  const loadTransactions = async (accountId?: string) => {
    if (!accountId) {
      setTransactions([]);
      setBalance(0);
      return;
    }

    try {
      setLoading(true);
      const [transactionsData, currentBalance] = await Promise.all([
        BankTransactionService.getBankTransactions(accountId, 100),
        BankTransactionService.getAccountBalance(accountId)
      ]);
      
      setTransactions(transactionsData);
      setBalance(currentBalance);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحميل المعاملات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // إضافة إيداع جديد
  const addDeposit = async (
    accountId: string,
    amount: number,
    description: string,
    referenceNumber?: string
  ) => {
    try {
      setLoading(true);
      await BankTransactionService.createDeposit(accountId, amount, description, referenceNumber);
      
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الإيداع بنجاح",
      });

      // إعادة تحميل البيانات
      await loadTransactions(accountId);
      return true;
    } catch (error: any) {
      console.error('Error adding deposit:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الإيداع",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // إضافة سحب جديد
  const addWithdrawal = async (
    accountId: string,
    amount: number,
    description: string,
    referenceNumber?: string
  ) => {
    try {
      setLoading(true);
      await BankTransactionService.createWithdrawal(accountId, amount, description, referenceNumber);
      
      toast({
        title: "تم بنجاح",
        description: "تم إضافة السحب بنجاح",
      });

      // إعادة تحميل البيانات
      await loadTransactions(accountId);
      return true;
    } catch (error: any) {
      console.error('Error adding withdrawal:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة السحب",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة المعاملة
  const updateTransactionStatus = async (transactionId: string, status: string) => {
    try {
      await BankTransactionService.updateTransactionStatus(transactionId, status);
      
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة المعاملة بنجاح",
      });

      // إعادة تحميل البيانات
      if (bankAccountId) {
        await loadTransactions(bankAccountId);
      }
      return true;
    } catch (error: any) {
      console.error('Error updating transaction status:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة المعاملة",
        variant: "destructive",
      });
      return false;
    }
  };

  // تحميل البيانات عند تغيير الحساب البنكي
  useEffect(() => {
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (bankAccountId) {
      loadTransactions(bankAccountId);
    }
  }, [bankAccountId]);

  return {
    transactions,
    bankAccounts,
    loading,
    balance,
    loadTransactions,
    addDeposit,
    addWithdrawal,
    updateTransactionStatus,
    refreshData: () => loadTransactions(bankAccountId)
  };
};