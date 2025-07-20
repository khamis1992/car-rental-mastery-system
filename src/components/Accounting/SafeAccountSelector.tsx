
import React from 'react';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ErrorDisplay } from './ErrorDisplay';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
}

interface SafeAccountSelectorProps {
  accounts?: Account[] | null | undefined;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showBalance?: boolean;
  recentAccounts?: string[];
  loading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
}

// دالة للتحقق من صحة بيانات الحساب
const isValidAccount = (account: any): account is Account => {
  return (
    account &&
    typeof account === 'object' &&
    typeof account.id === 'string' &&
    typeof account.account_code === 'string' &&
    typeof account.account_name === 'string' &&
    account.id.length > 0 &&
    account.account_code.length > 0 &&
    account.account_name.length > 0
  );
};

// دالة لتطهير وفلترة الحسابات
const sanitizeAccounts = (accounts: any): Account[] => {
  try {
    console.log('🔍 Sanitizing accounts:', accounts);
    
    // التحقق من النوع الأساسي
    if (!accounts) {
      console.log('⚠️ Accounts is null/undefined');
      return [];
    }

    // التحقق من كونها مصفوفة
    if (!Array.isArray(accounts)) {
      console.warn('⚠️ Accounts is not an array:', typeof accounts, accounts);
      return [];
    }

    // فلترة الحسابات الصحيحة فقط
    const validAccounts = accounts.filter((account, index) => {
      const isValid = isValidAccount(account);
      if (!isValid) {
        console.warn(`⚠️ Invalid account at index ${index}:`, account);
      }
      return isValid;
    });

    console.log(`✅ Sanitized ${validAccounts.length} valid accounts from ${accounts.length} total`);
    return validAccounts;

  } catch (error) {
    console.error('❌ Error sanitizing accounts:', error);
    return [];
  }
};

export const SafeAccountSelector: React.FC<SafeAccountSelectorProps> = ({
  accounts,
  value,
  onValueChange,
  placeholder = "اختر الحساب...",
  disabled = false,
  showBalance = true,
  recentAccounts = [],
  loading = false,
  error = null,
  onRetry
}) => {
  const [open, setOpen] = React.useState(false);

  // طبقة الحماية الأولى: تطهير البيانات
  const safeAccounts = React.useMemo(() => {
    return sanitizeAccounts(accounts);
  }, [accounts]);

  // طبقة الحماية الثانية: التحقق من الحساب المحدد
  const selectedAccount = React.useMemo(() => {
    try {
      if (!value || safeAccounts.length === 0) return null;
      return safeAccounts.find(account => account?.id === value) || null;
    } catch (error) {
      console.error('❌ Error finding selected account:', error);
      return null;
    }
  }, [safeAccounts, value]);

  // طبقة الحماية الثالثة: تطهير الحسابات الحديثة
  const safeRecentAccounts = React.useMemo(() => {
    try {
      return Array.isArray(recentAccounts) ? recentAccounts.filter(id => typeof id === 'string') : [];
    } catch (error) {
      console.error('❌ Error sanitizing recent accounts:', error);
      return [];
    }
  }, [recentAccounts]);

  // دالة آمنة لتنسيق العملة
  const formatCurrency = React.useCallback((amount: number | null | undefined) => {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) return '0.000 د.ك';
      return new Intl.NumberFormat('ar-KW', {
        style: 'currency',
        currency: 'KWD',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(amount);
    } catch (error) {
      console.error('❌ Error formatting currency:', error);
      return '0.000 د.ك';
    }
  }, []);

  // طبقة الحماية الرابعة: ترتيب آمن للحسابات
  const sortedAccounts = React.useMemo(() => {
    try {
      if (safeAccounts.length === 0) return [];

      return [...safeAccounts].sort((a, b) => {
        try {
          const aIsRecent = safeRecentAccounts.includes(a.id);
          const bIsRecent = safeRecentAccounts.includes(b.id);
          
          if (aIsRecent && !bIsRecent) return -1;
          if (!aIsRecent && bIsRecent) return 1;
          
          return (a.account_code || '').localeCompare(b.account_code || '');
        } catch (error) {
          console.error('❌ Error sorting accounts:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('❌ Error in sortedAccounts:', error);
      return safeAccounts;
    }
  }, [safeAccounts, safeRecentAccounts]);

  // معالج آمن لتغيير القيمة
  const handleValueChange = React.useCallback((accountId: string) => {
    try {
      console.log('🔄 Account selection changed:', accountId);
      onValueChange?.(accountId === value ? "" : accountId);
      setOpen(false);
    } catch (error) {
      console.error('❌ Error handling value change:', error);
    }
  }, [onValueChange, value]);

  // عرض الخطأ إذا وجد
  if (error) {
    return (
      <div className="w-full">
        <ErrorDisplay
          error={error}
          title="خطأ في تحميل الحسابات"
          onRetry={onRetry}
          className="mb-2"
        />
        <Button
          variant="outline"
          className="w-full justify-between text-right rtl-flex"
          disabled={true}
        >
          <span className="text-muted-foreground">فشل في تحميل الحسابات</span>
          <AlertCircle className="ml-2 h-4 w-4 shrink-0 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-right rtl-flex"
          disabled={disabled || loading}
        >
          <div className="flex items-center gap-2 flex-row-reverse w-full">
            {selectedAccount ? (
              <div className="flex flex-col items-end text-right flex-1">
                <span className="font-medium">
                  {selectedAccount.account_code} - {selectedAccount.account_name}
                </span>
                {showBalance && (
                  <span className="text-xs text-muted-foreground">
                    الرصيد: {formatCurrency(selectedAccount.current_balance)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground flex-1 text-right">
                {loading ? 'جاري التحميل...' : placeholder}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50 bg-popover border shadow-lg" align="start">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              جاري تحميل الحسابات...
            </div>
          </div>
        ) : (
          <Command className="max-h-96">
            <CommandInput 
              placeholder="ابحث بالكود أو الاسم..." 
              className="h-9"
            />
            <CommandEmpty>
              {safeAccounts.length === 0 ? 'لا توجد حسابات متاحة' : 'لا توجد نتائج'}
            </CommandEmpty>
            {sortedAccounts.length > 0 && (
              <CommandGroup className="max-h-64 overflow-auto">
                {sortedAccounts.map((account) => (
                  <CommandItem
                    key={account.id}
                    value={`${account.account_code} ${account.account_name}`}
                    onSelect={() => handleValueChange(account.id)}
                    className="flex items-center justify-between py-3 rtl-flex text-right"
                  >
                    <div className="flex-1 text-right">
                      <div className="font-medium">
                        {account.account_code} - {account.account_name}
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        {showBalance && (
                          <span>الرصيد: {formatCurrency(account.current_balance)}</span>
                        )}
                        <span>{account.account_type}</span>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === account.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
};
