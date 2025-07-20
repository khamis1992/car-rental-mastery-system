
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

interface AccountSelectorProps {
  accounts?: Account[] | null;
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

export const AccountSelector: React.FC<AccountSelectorProps> = ({
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

  // التأكد من أن accounts دائماً مصفوفة صالحة
  const safeAccounts = React.useMemo(() => {
    if (!accounts) return [];
    if (!Array.isArray(accounts)) {
      console.warn('AccountSelector: accounts prop is not an array:', accounts);
      return [];
    }
    return accounts.filter(account => 
      account && 
      typeof account === 'object' && 
      account.id && 
      account.account_code && 
      account.account_name
    );
  }, [accounts]);

  const selectedAccount = safeAccounts.find(account => account?.id === value);

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.000 د.ك';
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  // ترتيب الحسابات مع الحسابات الحديثة أولاً
  const sortedAccounts = React.useMemo(() => {
    if (safeAccounts.length === 0) return [];

    try {
      return [...safeAccounts].sort((a, b) => {
        // التأكد من وجود البيانات المطلوبة
        if (!a?.id || !b?.id) return 0;
        
        const aIsRecent = Array.isArray(recentAccounts) && recentAccounts.includes(a.id);
        const bIsRecent = Array.isArray(recentAccounts) && recentAccounts.includes(b.id);
        
        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;
        
        // ترتيب حسب كود الحساب
        const aCode = a.account_code || '';
        const bCode = b.account_code || '';
        return aCode.localeCompare(bCode);
      });
    } catch (error) {
      console.error('Error sorting accounts:', error);
      return safeAccounts;
    }
  }, [safeAccounts, recentAccounts]);

  // عرض خطأ إذا وجد
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
                {sortedAccounts.map((account) => {
                  if (!account?.id) return null;
                  
                  return (
                    <CommandItem
                      key={account.id}
                      value={`${account.account_code || ''} ${account.account_name || ''}`}
                      onSelect={() => {
                        try {
                          onValueChange(account.id === value ? "" : account.id);
                          setOpen(false);
                        } catch (error) {
                          console.error('Error selecting account:', error);
                        }
                      }}
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
                  );
                })}
              </CommandGroup>
            )}
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
};
