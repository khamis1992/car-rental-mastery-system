
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
  error: Error | null;
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
  const [error, setError] = useState<Error | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Set default dates (last month to today)
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

  const loadAccounts = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Loading accounts...');
      
      const accountsData = await accountingService.getActiveAccounts();
      console.log('📊 Raw accounts data:', accountsData);
      
      if (Array.isArray(accountsData)) {
        setAccounts(accountsData);
        console.log('✅ Accounts loaded successfully:', accountsData.length);
        
        if (accountsData.length === 0) {
          console.log('⚠️ No active accounts found');
        }
      } else {
        console.error('❌ Invalid accounts data format:', accountsData);
        setAccounts([]);
        setError(new Error('تنسيق بيانات الحسابات غير صحيح'));
      }
    } catch (error) {
      console.error('❌ Error loading accounts:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل الحسابات');
      setError(errorInstance);
      setAccounts([]);
      
      const result = handleError(errorInstance, 'loadAccounts');
      if (result.shouldLog) {
        console.error('Account loading error details:', errorInstance);
      }
    }
  }, []);

  const loadLedgerEntries = useCallback(async () => {
    if (!selectedAccountId) {
      setError(new Error('يرجى اختيار حساب أولاً'));
      return;
    }

    if (!startDate || !endDate) {
      setError(new Error('يرجى تحديد نطاق تاريخ صحيح'));
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError(new Error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية'));
      return;
    }

    try {
      setLoading(true);
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
        setEntries(entriesData);
        console.log('✅ Ledger entries loaded successfully:', entriesData.length);
        
        if (entriesData.length === 0) {
          console.log('📝 No entries found for the selected criteria');
        }
      } else {
        console.error('❌ Invalid entries data format:', entriesData);
        setEntries([]);
        setError(new Error('تنسيق بيانات القيود غير صحيح'));
      }
    } catch (error) {
      console.error('❌ Error loading ledger entries:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل بيانات دفتر الأستاذ');
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
      setLoading(false);
    }
  }, [selectedAccountId, startDate, endDate]);

  // Auto-load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Filter entries based on search term
  const filteredEntries = entries.filter(entry => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.description.toLowerCase().includes(searchLower) ||
      entry.entry_number.toLowerCase().includes(searchLower)
    );
  });

  // Calculate summary
  const summary = {
    totalDebit: filteredEntries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0),
    totalCredit: filteredEntries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0),
    finalBalance: filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1].running_balance || 0 : 0,
    entriesCount: filteredEntries.length
  };

  return {
    accounts,
    entries,
    loading,
    error,
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
    filteredEntries,
    summary
  };
};
