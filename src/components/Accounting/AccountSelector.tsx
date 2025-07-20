
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
  accounts,
  value,
  onValueChange,
  placeholder = "اختر الحساب...",
  disabled = false,
  showBalance = true,
  recentAccounts = []
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedAccount = accounts.find(account => account.id === value);

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
          className="w-full justify-between text-right rtl-flex"
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-row-reverse">
            {selectedAccount ? (
              <div className="flex flex-col items-end text-right">
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
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
        <Command className="max-h-96">
          <CommandInput 
            placeholder="ابحث بالكود أو الاسم..." 
            className="h-9"
          />
          <CommandEmpty>لا توجد نتائج</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {sortedAccounts.map((account) => (
              <CommandItem
                key={account.id}
                value={`${account.account_code} ${account.account_name}`}
                onSelect={() => {
                  onValueChange(account.id === value ? "" : account.id);
                  setOpen(false);
                }}
                className="flex items-center justify-between py-3 rtl-flex text-right"
              >
                <div className="flex-1 text-right">
                  <div className="font-medium">
                    {account.account_code} - {account.account_name}
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    {showBalance && <span>الرصيد: {formatCurrency(account.current_balance)}</span>}
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
        </Command>
      </PopoverContent>
    </Popover>
  );
};
