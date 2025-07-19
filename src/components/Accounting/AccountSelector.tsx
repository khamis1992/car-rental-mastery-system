
import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Clock, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  level: number;
  allow_posting: boolean;
  current_balance?: number;
}

interface AccountSelectorProps {
  accounts: Account[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showBalance?: boolean;
  recentAccounts?: string[];
}

const ACCOUNT_TYPE_LABELS = {
  asset: 'الأصول',
  liability: 'الالتزامات',
  equity: 'حقوق الملكية',
  revenue: 'الإيرادات',
  expense: 'المصروفات'
};

const ACCOUNT_TYPE_ICONS = {
  asset: '🏦',
  liability: '📊',
  equity: '💼',
  revenue: '💰',
  expense: '💸'
};

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  value,
  onValueChange,
  placeholder = "اختر الحساب",
  disabled = false,
  className,
  showBalance = false,
  recentAccounts = []
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter accounts that allow posting
  const postingAccounts = useMemo(() => 
    accounts.filter(account => account.allow_posting),
    [accounts]
  );

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const filtered = postingAccounts.filter(account =>
      account.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.account_code.includes(searchQuery)
    );

    return Object.entries(
      filtered.reduce((groups, account) => {
        const type = account.account_type;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(account);
        return groups;
      }, {} as Record<string, Account[]>)
    ).sort(([a], [b]) => {
      const order = ['asset', 'liability', 'equity', 'revenue', 'expense'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [postingAccounts, searchQuery]);

  // Recent accounts
  const recentAccountsData = useMemo(() => {
    return recentAccounts
      .map(id => postingAccounts.find(acc => acc.id === id))
      .filter(Boolean)
      .slice(0, 5);
  }, [postingAccounts, recentAccounts]);

  const selectedAccount = postingAccounts.find(account => account.id === value);

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(balance);
  };

  const handleSelect = (accountId: string) => {
    onValueChange(accountId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between rtl-flex",
            !selectedAccount && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-row-reverse">
            {selectedAccount ? (
              <>
                <span className="font-medium">
                  {selectedAccount.account_code} - {selectedAccount.account_name}
                </span>
                {showBalance && selectedAccount.current_balance !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {formatBalance(selectedAccount.current_balance)}
                  </Badge>
                )}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command className="max-h-[400px]">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="البحث بالكود أو اسم الحساب..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calculator className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد حسابات متاحة</p>
              </div>
            </CommandEmpty>

            {/* Recent Accounts */}
            {recentAccountsData.length > 0 && (
              <CommandGroup heading="الحسابات المستخدمة مؤخراً">
                {recentAccountsData.map((account) => (
                  <CommandItem
                    key={`recent-${account.id}`}
                    value={account.id}
                    onSelect={() => handleSelect(account.id)}
                    className="rtl-flex"
                  >
                    <div className="flex items-center gap-2 flex-row-reverse w-full">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 text-right">
                        <div className="font-medium">
                          {account.account_code} - {account.account_name}
                        </div>
                        {showBalance && account.current_balance !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            الرصيد: {formatBalance(account.current_balance)}
                          </div>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === account.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Grouped Accounts */}
            {groupedAccounts.map(([type, accounts]) => (
              <CommandGroup
                key={type}
                heading={
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <span>{ACCOUNT_TYPE_ICONS[type as keyof typeof ACCOUNT_TYPE_ICONS]}</span>
                    <span>{ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS]}</span>
                    <Badge variant="outline" className="text-xs">
                      {accounts.length}
                    </Badge>
                  </div>
                }
              >
                {accounts.map((account) => (
                  <CommandItem
                    key={account.id}
                    value={account.id}
                    onSelect={() => handleSelect(account.id)}
                    className="rtl-flex"
                  >
                    <div className="flex items-center gap-2 flex-row-reverse w-full">
                      <div 
                        className="w-2 h-2 rounded-full bg-muted-foreground opacity-60"
                        style={{ marginRight: `${(account.level - 1) * 12}px` }}
                      />
                      <div className="flex-1 text-right">
                        <div className="font-medium">
                          {account.account_code} - {account.account_name}
                        </div>
                        {showBalance && account.current_balance !== undefined && (
                          <div className="text-xs text-muted-foreground">
                            الرصيد: {formatBalance(account.current_balance)}
                          </div>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === account.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
