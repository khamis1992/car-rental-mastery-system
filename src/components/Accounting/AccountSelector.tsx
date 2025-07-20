
import React from 'react';
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
  value,
  onValueChange,
  placeholder = "اختر الحساب...",
  disabled = false,
  showBalance = true,
  recentAccounts = []
}) => {
  const [open, setOpen] = React.useState(false);

  // Add debugging and early return for invalid data
  console.log('AccountSelector render:', { 
    accounts: accounts?.length, 
    accountsType: typeof accounts,
    isArray: Array.isArray(accounts),
    value,
    recentAccounts: recentAccounts?.length 
  });

  // Early return if accounts is not a valid array
  if (!Array.isArray(accounts)) {
    console.error('AccountSelector: accounts prop is not an array:', accounts);
    return (
      <Button variant="outline" className="w-full justify-between text-right" disabled>
        <span className="text-muted-foreground">خطأ: بيانات الحسابات غير صحيحة</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  const selectedAccount = accounts.find(account => account?.id === value);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  // Sort accounts with recent accounts first, then by account code
  const sortedAccounts = [...accounts].sort((a, b) => {
    const aIsRecent = recentAccounts.includes(a.id);
    const bIsRecent = recentAccounts.includes(b.id);
    
    if (aIsRecent && !bIsRecent) return -1;
    if (!aIsRecent && bIsRecent) return 1;
    
    // If both are recent or both are not recent, sort by account code
    return a.account_code.localeCompare(b.account_code);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-right"
          disabled={disabled}
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
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        {accounts.length > 0 ? (
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
              {sortedAccounts.length > 0 && sortedAccounts.map((account) => (
                account && account.id ? (
                  <CommandItem
                    key={account.id}
                    value={`${account.account_code || ''} ${account.account_name || ''}`}
                    onSelect={() => {
                      onValueChange(account.id === value ? "" : account.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex-1 text-right">
                      <div className="font-medium">
                        {account.account_code} - {account.account_name}
                      </div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        {showBalance && <span>الرصيد: {formatCurrency(account.current_balance || 0)}</span>}
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
                ) : null
              ))}
            </CommandGroup>
          </Command>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            لا توجد حسابات متاحة
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
