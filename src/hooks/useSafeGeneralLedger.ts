
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { accountingService, GeneralLedgerEntry } from '@/services/accountingService';
import { handleError } from '@/utils/errorHandling';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
}

interface UseSafeGeneralLedgerReturn {
  accounts: Account[];
  entries: GeneralLedgerEntry[];
  loading: boolean;
  accountsLoading: boolean;
  entriesLoading: boolean;
  error: Error | null;
  accountsError: Error | null;
  entriesError: Error | null;
  selectedAccountId: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
  setSelectedAccountId: (id: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSearchTerm: (term: string) => void;
  loadAccounts: () => Promise<void>;
  loadLedgerEntries: () => Promise<void>;
  clearError: () => void;
  clearAccountsError: () => void;
  clearEntriesError: () => void;
  filteredEntries: GeneralLedgerEntry[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    finalBalance: number;
    entriesCount: number;
  };
}

// دالة للتحقق من صحة بيانات الحساب
const validateAccount = (account: any): account is Account => {
  return (
    account &&
    typeof account === 'object' &&
    typeof account.id === 'string' &&
    typeof account.account_code === 'string' &&
    typeof account.account_name === 'string' &&
    typeof account.account_type === 'string' &&
    account.id.length > 0 &&
    account.account_code.length > 0 &&
    account.account_name.length > 0
  );
};

// دالة لتطهير بيانات الحسابات
const sanitizeAccountsData = (data: any): Account[] => {
  try {
    console.log('🔍 Sanitizing accounts data:', data);
    
    if (!data) {
      console.log('⚠️ No accounts data provided');
      return [];
    }

    if (!Array.isArray(data)) {
      console.warn('⚠️ Accounts data is not an array:', typeof data);
      return [];
    }

    const validAccounts = data.filter((account, index) => {
      const isValid = validateAccount(account);
      if (!isValid) {
        console.warn(`⚠️ Invalid account at index ${index}:`, account);
      }
      return isValid;
    });

    console.log(`✅ Processed ${validAccounts.length} valid accounts from ${data.length} total`);
    return validAccounts;

  } catch (error) {
    console.error('❌ Error sanitizing accounts data:', error);
    return [];
  }
};

// دالة للتحقق من صحة بيانات القيود
const validateEntry = (entry: any): entry is GeneralLedgerEntry => {
  return (
    entry &&
    typeof entry === 'object' &&
    typeof entry.id === 'string' &&
    entry.id.length > 0
  );
};

export const useSafeGeneralLedger = (): UseSafeGeneralLedgerReturn => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<GeneralLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [accountsError, setAccountsError] = useState<Error | null>(null);
  const [entriesError, setEntriesError] = useState<Error | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // تعيين التواريخ الافتراضية بطريقة آمنة
  const [startDate, setStartDate] = useState<string>(() => {
    try {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('❌ Error setting start date:', error);
      return new Date().toISOString().split('T')[0];
    }
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('❌ Error setting end date:', error);
      return new Date().toISOString().split('T')[0];
    }
  });

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAccountsError = useCallback(() => {
    setAccountsError(null);
  }, []);

  const clearEntriesError = useCallback(() => {
    setEntriesError(null);
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      setAccountsError(null);
      setError(null);
      console.log('🔄 Loading accounts with enhanced safety...');
      
      const accountsData = await accountingService.getActiveAccounts();
      console.log('📊 Raw accounts response:', accountsData);
      
      // طبقة الحماية: تطهير البيانات
      const sanitizedAccounts = sanitizeAccountsData(accountsData);
      
      // طبقة الحماية: التحقق من النتيجة النهائية
      if (sanitizedAccounts.length === 0 && Array.isArray(accountsData) && accountsData.length > 0) {
        console.warn('⚠️ All accounts were filtered out due to invalid data');
        const error = new Error('تم العثور على بيانات حسابات غير صالحة');
        setAccountsError(error);
        setError(error);
      }
      
      setAccounts(sanitizedAccounts);
      console.log('✅ Successfully loaded and sanitized accounts:', sanitizedAccounts.length);
      
    } catch (error) {
      console.error('❌ Error loading accounts:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل الحسابات');
      setAccountsError(errorInstance);
      setError(errorInstance);
      setAccounts([]); // تعيين مصفوفة فارغة كقيمة افتراضية آمنة
      
      handleError(errorInstance, 'loadAccounts');
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const loadLedgerEntries = useCallback(async () => {
    // طبقة الحماية: التحقق من المدخلات
    if (!selectedAccountId?.trim()) {
      const error = new Error('يرجى اختيار حساب أولاً');
      setEntriesError(error);
      return;
    }

    if (!startDate || !endDate) {
      const error = new Error('يرجى تحديد نطاق تاريخ صحيح');
      setEntriesError(error);
      return;
    }

    try {
      if (new Date(startDate) > new Date(endDate)) {
        const error = new Error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        setEntriesError(error);
        return;
      }
    } catch (dateError) {
      const error = new Error('تنسيق التاريخ غير صحيح');
      setEntriesError(error);
      return;
    }

    try {
      setEntriesLoading(true);
      setEntriesError(null);
      setError(null);
      console.log('🔄 Loading ledger entries with enhanced safety...');
      
      const entriesData = await accountingService.getGeneralLedgerEntries(
        selectedAccountId,
        startDate,
        endDate
      );
      
      console.log('📊 Raw entries response:', entriesData);
      
      // طبقة الحماية: التحقق من البيانات
      if (!Array.isArray(entriesData)) {
        console.error('❌ Entries data is not an array:', entriesData);
        setEntries([]);
        const error = new Error('تنسيق بيانات القيود غير صحيح');
        setEntriesError(error);
        return;
      }

      // طبقة الحماية: فلترة القيود الصحيحة
      const validEntries = entriesData.filter((entry, index) => {
        const isValid = validateEntry(entry);
        if (!isValid) {
          console.warn(`⚠️ Invalid entry at index ${index}:`, entry);
        }
        return isValid;
      });
      
      setEntries(validEntries);
      console.log('✅ Successfully loaded and validated entries:', validEntries.length);
      
    } catch (error) {
      console.error('❌ Error loading ledger entries:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل بيانات دفتر الأستاذ');
      setEntriesError(errorInstance);
      setError(errorInstance);
      setEntries([]); // تعيين مصفوفة فارغة كقيمة افتراضية آمنة
      
      handleError(errorInstance, 'loadLedgerEntries');
    } finally {
      setEntriesLoading(false);
    }
  }, [selectedAccountId, startDate, endDate]);

  // تحديث حالة التحميل العامة
  useEffect(() => {
    setLoading(accountsLoading || entriesLoading);
  }, [accountsLoading, entriesLoading]);

  // تحميل الحسابات تلقائياً عند التحميل
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // فلترة البيانات بناءً على مصطلح البحث مع طبقة حماية
  const filteredEntries = useMemo(() => {
    try {
      if (!Array.isArray(entries)) {
        console.warn('⚠️ Entries is not an array in filtering');
        return [];
      }

      if (!searchTerm?.trim()) return entries;
      
      const searchLower = searchTerm.toLowerCase();
      return entries.filter(entry => {
        try {
          return (
            entry.description?.toLowerCase().includes(searchLower) ||
            entry.entry_number?.toLowerCase().includes(searchLower)
          );
        } catch (error) {
          console.warn('⚠️ Error filtering entry:', entry, error);
          return false;
        }
      });
    } catch (error) {
      console.error('❌ Error in filteredEntries:', error);
      return [];
    }
  }, [entries, searchTerm]);

  // حساب الملخص مع طبقة حماية
  const summary = useMemo(() => {
    try {
      if (!Array.isArray(filteredEntries)) {
        return {
          totalDebit: 0,
          totalCredit: 0,
          finalBalance: 0,
          entriesCount: 0
        };
      }

      const totalDebit = filteredEntries.reduce((sum, entry) => {
        try {
          return sum + (Number(entry.debit_amount) || 0);
        } catch (error) {
          console.warn('⚠️ Error calculating debit for entry:', entry);
          return sum;
        }
      }, 0);

      const totalCredit = filteredEntries.reduce((sum, entry) => {
        try {
          return sum + (Number(entry.credit_amount) || 0);
        } catch (error) {
          console.warn('⚠️ Error calculating credit for entry:', entry);
          return sum;
        }
      }, 0);

      const finalBalance = filteredEntries.length > 0 
        ? (Number(filteredEntries[filteredEntries.length - 1]?.running_balance) || 0) 
        : 0;

      return {
        totalDebit,
        totalCredit,
        finalBalance,
        entriesCount: filteredEntries.length
      };
    } catch (error) {
      console.error('❌ Error calculating summary:', error);
      return {
        totalDebit: 0,
        totalCredit: 0,
        finalBalance: 0,
        entriesCount: 0
      };
    }
  }, [filteredEntries]);

  return {
    accounts: Array.isArray(accounts) ? accounts : [], // طبقة حماية إضافية
    entries: Array.isArray(entries) ? entries : [], // طبقة حماية إضافية
    loading,
    accountsLoading,
    entriesLoading,
    error,
    accountsError,
    entriesError,
    selectedAccountId,
    startDate,
    endDate,
    searchTerm,
    setSelectedAccountId,
    setStartDate,
    setEndDate,
    setSearchTerm,
    loadAccounts,
    loadLedgerEntries,
    clearError,
    clearAccountsError,
    clearEntriesError,
    filteredEntries,
    summary
  };
};
