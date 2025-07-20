
import React, { useMemo, useCallback } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
}

interface AccountSelectorProps {
  accounts: Account[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showBalance?: boolean;
  recentAccounts?: string[];
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts = [],
  value = '',
  onValueChange,
  placeholder = "اختر الحساب...",
  disabled = false,
  showBalance = true,
  recentAccounts = []
}) => {
  const [open, setOpen] = React.useState(false);

  // حماية البيانات والتحقق من صحتها
  const safeAccounts = useMemo(() => {
    if (!Array.isArray(accounts)) {
      console.warn('AccountSelector: accounts prop is not an array, defaulting to empty array');
      return [];
    }
    
    return accounts.filter(account => {
      if (!account || typeof account !== 'object') {
        console.warn('AccountSelector: Invalid account object found:', account);
        return false;
      }
      
      const hasRequiredFields = account.id && account.account_code && account.account_name;
      if (!hasRequiredFields) {
        console.warn('AccountSelector: Account missing required fields:', account);
        return false;
      }
      
      return true;
    });
  }, [accounts]);

  const selectedAccount = useMemo(() => {
    if (!value || !safeAccounts.length) return null;
    
    const account = safeAccounts.find(account => account.id === value);
    if (!account) {
      console.log('AccountSelector: Selected account not found in accounts list:', value);
    }
    return account;
  }, [safeAccounts, value]);

  const formatCurrency = useCallback((amount: number | null | undefined) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    
    try {
      return new Intl.NumberFormat('ar-KW', {
        style: 'currency',
        currency: 'KWD',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(safeAmount);
    } catch (error) {
      console.error('AccountSelector: Error formatting currency:', error);
      return `${safeAmount.toFixed(3)} د.ك`;
    }
  }, []);

  // Sort accounts with recent accounts first, then by account code
  const sortedAccounts = useMemo(() => {
    if (!Array.isArray(safeAccounts) || !safeAccounts.length) return [];
    
    try {
      const safeRecentAccounts = Array.isArray(recentAccounts) ? recentAccounts : [];
      
      const result = [...safeAccounts].sort((a, b) => {
        const aIsRecent = safeRecentAccounts.includes(a.id);
        const bIsRecent = safeRecentAccounts.includes(b.id);
        
        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;
        
        // If both are recent or both are not recent, sort by account code
        return (a.account_code || '').localeCompare(b.account_code || '');
      });
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('AccountSelector: Error sorting accounts:', error);
      return Array.isArray(safeAccounts) ? safeAccounts : [];
    }
  }, [safeAccounts, recentAccounts]);

  const handleValueChange = useCallback((newValue: string) => {
    console.log('AccountSelector: Value changing from', value, 'to', newValue);
    
    try {
      const finalValue = newValue === value ? "" : newValue;
      onValueChange(finalValue);
      setOpen(false);
    } catch (error) {
      console.error('AccountSelector: Error in handleValueChange:', error);
      setOpen(false);
    }
  }, [value, onValueChange]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log('AccountSelector: Open state changing to:', newOpen);
    setOpen(newOpen);
  }, []);

  if (!safeAccounts.length && !disabled) {
    console.warn('AccountSelector: No valid accounts available');
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-right"
          disabled={disabled || safeAccounts.length === 0}
        >
          {selectedAccount ? (
            <div className="flex flex-col items-end">
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
            <span className="text-muted-foreground">
              {safeAccounts.length === 0 ? 'لا توجد حسابات متاحة' : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {safeAccounts.length > 0 && (
        <PopoverContent className="w-full p-0" align="start">
          <Command className="max-h-96">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="ابحث بالكود أو الاسم..." 
                className="h-9"
              />
            </div>
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {sortedAccounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={`${account.account_code} ${account.account_name}`}
                  onSelect={() => handleValueChange(account.id)}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex-1 text-right">
                    <div className="font-medium">
                      {account.account_code} - {account.account_name}
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      {showBalance && (
                        <span>الرصيد: {formatCurrency(account.current_balance)}</span>
                      )}
                      <span>{account.account_type || 'غير محدد'}</span>
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
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
};
