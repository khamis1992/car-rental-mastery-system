
import { useState, useEffect, useCallback, useMemo } from 'react';
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
    try {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('useGeneralLedger: Error setting default start date:', error);
      return new Date().toISOString().split('T')[0];
    }
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('useGeneralLedger: Error setting default end date:', error);
      return new Date().toISOString().split('T')[0];
    }
  });

  const clearError = useCallback(() => {
    console.log('useGeneralLedger: Clearing error');
    setError(null);
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 useGeneralLedger: Loading accounts...');
      
      const accountsData = await accountingService.getActiveAccounts();
      
      // التحقق من صحة البيانات المستلمة
      if (!Array.isArray(accountsData)) {
        throw new Error('البيانات المستلمة ليست مصفوفة صحيحة');
      }

      // فلترة البيانات غير الصحيحة
      const validAccounts = accountsData.filter(account => {
        if (!account || typeof account !== 'object') {
          console.warn('useGeneralLedger: Invalid account object:', account);
          return false;
        }
        
        const hasRequiredFields = account.id && account.account_code && account.account_name;
        if (!hasRequiredFields) {
          console.warn('useGeneralLedger: Account missing required fields:', account);
          return false;
        }
        
        return true;
      });

      setAccounts(validAccounts);
      console.log('✅ useGeneralLedger: Accounts loaded successfully:', validAccounts.length);
      
      if (validAccounts.length === 0) {
        console.log('⚠️ useGeneralLedger: No valid active accounts found');
      }
    } catch (error) {
      console.error('❌ useGeneralLedger: Error loading accounts:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل الحسابات');
      setError(errorInstance);
      setAccounts([]); // التأكد من إعادة تعيين البيانات عند الخطأ
      
      const result = handleError(errorInstance, 'loadAccounts');
      if (result.shouldLog) {
        console.error('useGeneralLedger: Account loading error details:', errorInstance);
      }
    }
  }, []);

  const loadLedgerEntries = useCallback(async () => {
    if (!selectedAccountId) {
      const errorMsg = 'يرجى اختيار حساب أولاً';
      console.warn('useGeneralLedger:', errorMsg);
      setError(new Error(errorMsg));
      return;
    }

    if (!startDate || !endDate) {
      const errorMsg = 'يرجى تحديد نطاق تاريخ صحيح';
      console.warn('useGeneralLedger:', errorMsg);
      setError(new Error(errorMsg));
      return;
    }

    try {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new Error('تواريخ غير صحيحة');
      }
      
      if (startDateObj > endDateObj) {
        throw new Error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      }
    } catch (error) {
      const errorMsg = 'تواريخ غير صحيحة - يرجى التحقق من التواريخ المدخلة';
      console.error('useGeneralLedger: Date validation error:', error);
      setError(new Error(errorMsg));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 useGeneralLedger: Loading ledger entries for account:', selectedAccountId);
      console.log('📅 useGeneralLedger: Date range:', { startDate, endDate });
      
      const entriesData = await accountingService.getGeneralLedgerEntries(
        selectedAccountId,
        startDate,
        endDate
      );
      
      // التحقق من صحة البيانات المستلمة
      if (!Array.isArray(entriesData)) {
        throw new Error('بيانات القيود المستلمة غير صحيحة');
      }

      // فلترة البيانات غير الصحيحة
      const validEntries = entriesData.filter(entry => {
        if (!entry || typeof entry !== 'object') {
          console.warn('useGeneralLedger: Invalid entry object:', entry);
          return false;
        }
        return true;
      });
      
      setEntries(validEntries);
      console.log('✅ useGeneralLedger: Ledger entries loaded successfully:', validEntries.length);
      
      if (validEntries.length === 0) {
        console.log('📝 useGeneralLedger: No entries found for the selected criteria');
      }
    } catch (error) {
      console.error('❌ useGeneralLedger: Error loading ledger entries:', error);
      const errorInstance = error instanceof Error ? error : new Error('فشل في تحميل بيانات دفتر الأستاذ');
      setError(errorInstance);
      setEntries([]); // التأكد من إعادة تعيين البيانات عند الخطأ
      
      const result = handleError(errorInstance, 'loadLedgerEntries');
      if (result.shouldLog) {
        console.error('useGeneralLedger: Ledger entries loading error details:', {
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
    console.log('useGeneralLedger: Mounting, loading accounts...');
    loadAccounts();
  }, [loadAccounts]);

  // Safe account ID setter with validation
  const safeSetSelectedAccountId = useCallback((id: string) => {
    console.log('useGeneralLedger: Setting selected account ID:', id);
    
    if (id && accounts.length > 0) {
      const accountExists = accounts.some(account => account.id === id);
      if (!accountExists) {
        console.warn('useGeneralLedger: Selected account ID not found in accounts list:', id);
        setError(new Error('الحساب المحدد غير موجود في قائمة الحسابات'));
        return;
      }
    }
    
    setSelectedAccountId(id);
    setEntries([]); // Clear entries when account changes
    clearError(); // Clear any previous errors
  }, [accounts, clearError]);

  // Filter entries based on search term with error protection
  const filteredEntries = useMemo(() => {
    if (!Array.isArray(entries)) {
      console.warn('useGeneralLedger: entries is not an array, returning empty array');
      return [];
    }

    if (!searchTerm.trim()) {
      return entries;
    }

    try {
      const term = searchTerm.toLowerCase().trim();
      
      return entries.filter(entry => {
        if (!entry || typeof entry !== 'object') {
          return false;
        }
        
        const description = (entry.description || '').toLowerCase();
        const entryNumber = (entry.entry_number || '').toLowerCase();
        
        return description.includes(term) || entryNumber.includes(term);
      });
    } catch (error) {
      console.error('useGeneralLedger: Error filtering entries:', error);
      return entries; // Return unfiltered entries if filtering fails
    }
  }, [entries, searchTerm]);

  // Calculate summary with error protection
  const summary = useMemo(() => {
    try {
      if (!Array.isArray(filteredEntries) || filteredEntries.length === 0) {
        return {
          totalDebit: 0,
          totalCredit: 0,
          finalBalance: 0,
          entriesCount: 0
        };
      }

      const safeEntries = filteredEntries.filter(entry => entry && typeof entry === 'object');
      
      const totalDebit = safeEntries.reduce((sum, entry) => {
        const debit = typeof entry.debit_amount === 'number' ? entry.debit_amount : 0;
        return sum + debit;
      }, 0);
      
      const totalCredit = safeEntries.reduce((sum, entry) => {
        const credit = typeof entry.credit_amount === 'number' ? entry.credit_amount : 0;
        return sum + credit;
      }, 0);
      
      const finalEntry = safeEntries[safeEntries.length - 1];
      const finalBalance = finalEntry && typeof finalEntry.running_balance === 'number' 
        ? finalEntry.running_balance 
        : 0;

      return {
        totalDebit,
        totalCredit,
        finalBalance,
        entriesCount: safeEntries.length
      };
    } catch (error) {
      console.error('useGeneralLedger: Error calculating summary:', error);
      return {
        totalDebit: 0,
        totalCredit: 0,
        finalBalance: 0,
        entriesCount: 0
      };
    }
  }, [filteredEntries]);

  return {
    accounts,
    entries,
    loading,
    error,
    selectedAccountId,
    startDate,
    endDate,
    searchTerm,
    setSelectedAccountId: safeSetSelectedAccountId,
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
