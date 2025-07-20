
import { useState, useEffect, useCallback } from 'react';
import { accountingService, GeneralLedgerEntry } from '@/services/accountingService';
import { handleError } from '@/utils/errorHandling';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
}

interface UseGeneralLedgerReturn {
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

export const useGeneralLedger = (): UseGeneralLedgerReturn => {
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
  
  // تعيين التواريخ الافتراضية
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
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
      console.log('🔄 Loading accounts...');
      
      const accountsData = await accountingService.getActiveAccounts();
      console.log('📊 Raw accounts data:', accountsData);
      
      if (Array.isArray(accountsData)) {
        // فلترة الحسابات للتأكد من صحة البيانات
        const validAccounts = accountsData.filter(account => 
          account && 
          typeof account === 'object' &&
          account.id && 
          account.account_code && 
          account.account_name
        );
        
        setAccounts(validAccounts);
        console.log('✅ Accounts loaded successfully:', validAccounts.length);
        
        if (validAccounts.length === 0) {
          console.log('⚠️ No valid accounts found');
          setAccountsError(new Error('لا توجد حسابات صالحة'));
        }
      } else {
        console.error('❌ Invalid accounts data format:', accountsData);
        setAccounts([]);
        const error = new Error('تنسيق بيانات الحسابات غير صحيح');
        setAccountsError(error);
        setError(error);
      }
    } catch (error) {
      console.error('❌ Error loading accounts:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل الحسابات');
      setAccountsError(errorInstance);
      setError(errorInstance);
      setAccounts([]);
      
      const result = handleError(errorInstance, 'loadAccounts');
      if (result.shouldLog) {
        console.error('Account loading error details:', errorInstance);
      }
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const loadLedgerEntries = useCallback(async () => {
    if (!selectedAccountId) {
      const error = new Error('يرجى اختيار حساب أولاً');
      setEntriesError(error);
      setError(error);
      return;
    }

    if (!startDate || !endDate) {
      const error = new Error('يرجى تحديد نطاق تاريخ صحيح');
      setEntriesError(error);
      setError(error);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      const error = new Error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      setEntriesError(error);
      setError(error);
      return;
    }

    try {
      setEntriesLoading(true);
      setEntriesError(null);
      setError(null);
      console.log('🔄 Loading ledger entries for account:', selectedAccountId);
      console.log('📅 Date range:', { startDate, endDate });
      
      const entriesData = await accountingService.getGeneralLedgerEntries(
        selectedAccountId,
        startDate,
        endDate
      );
      
      console.log('📊 Raw entries data:', entriesData);
      
      if (Array.isArray(entriesData)) {
        // فلترة البيانات للتأكد من صحتها
        const validEntries = entriesData.filter(entry => 
          entry && 
          typeof entry === 'object' &&
          entry.id && 
          entry.entry_number
        );
        
        setEntries(validEntries);
        console.log('✅ Ledger entries loaded successfully:', validEntries.length);
        
        if (validEntries.length === 0) {
          console.log('📝 No entries found for the selected criteria');
        }
      } else {
        console.error('❌ Invalid entries data format:', entriesData);
        setEntries([]);
        const error = new Error('تنسيق بيانات القيود غير صحيح');
        setEntriesError(error);
        setError(error);
      }
    } catch (error) {
      console.error('❌ Error loading ledger entries:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل بيانات دفتر الأستاذ');
      setEntriesError(errorInstance);
      setError(errorInstance);
      setEntries([]);
      
      const result = handleError(errorInstance, 'loadLedgerEntries');
      if (result.shouldLog) {
        console.error('Ledger entries loading error details:', {
          selectedAccountId,
          startDate,
          endDate,
          error: errorInstance
        });
      }
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

  // فلترة البيانات بناءً على مصطلح البحث
  const filteredEntries = entries.filter(entry => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.description?.toLowerCase().includes(searchLower) ||
      entry.entry_number?.toLowerCase().includes(searchLower)
    );
  });

  // حساب الملخص
  const summary = {
    totalDebit: filteredEntries.reduce((sum, entry) => sum + (Number(entry.debit_amount) || 0), 0),
    totalCredit: filteredEntries.reduce((sum, entry) => sum + (Number(entry.credit_amount) || 0), 0),
    finalBalance: filteredEntries.length > 0 ? (Number(filteredEntries[filteredEntries.length - 1].running_balance) || 0) : 0,
    entriesCount: filteredEntries.length
  };

  return {
    accounts: accounts || [],
    entries,
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
