
import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Clock, Star, TrendingUp } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
}

interface SmartAccountSelectorProps {
  accounts: Account[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showBalance?: boolean;
  recentAccounts?: string[];
  suggestedAccounts?: string[];
  transactionType?: 'debit' | 'credit';
  context?: string; // Additional context for smart suggestions
}

export const SmartAccountSelector: React.FC<SmartAccountSelectorProps> = ({
  accounts = [],
  value,
  onValueChange,
  placeholder = "اختر الحساب...",
  disabled = false,
  showBalance = true,
  recentAccounts = [],
  suggestedAccounts = [],
  transactionType,
  context
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAccount = accounts.find(account => account?.id === value);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  // Smart account categorization and suggestions
  const categorizedAccounts = useMemo(() => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return {
        suggested: [],
        recent: [],
        frequent: [],
        assets: [],
        liabilities: [],
        equity: [],
        revenue: [],
        expense: []
      };
    }

    const suggested = accounts.filter(acc => suggestedAccounts.includes(acc.id));
    const recent = accounts.filter(acc => recentAccounts.slice(0, 5).includes(acc.id));
    const frequent = accounts.filter(acc => recentAccounts.includes(acc.id) && !recent.includes(acc));

    return {
      suggested,
      recent,
      frequent,
      assets: accounts.filter(acc => acc.account_type === 'asset'),
      liabilities: accounts.filter(acc => acc.account_type === 'liability'),
      equity: accounts.filter(acc => acc.account_type === 'equity'),
      revenue: accounts.filter(acc => acc.account_type === 'revenue'),
      expense: accounts.filter(acc => acc.account_type === 'expense')
    };
  }, [accounts, recentAccounts, suggestedAccounts]);

  // Filter accounts based on search query
  const filteredAccounts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    const filterGroup = (group: Account[]) => 
      group.filter(account => 
        account.account_code.toLowerCase().includes(query) ||
        account.account_name.toLowerCase().includes(query)
      );

    return {
      suggested: filterGroup(categorizedAccounts.suggested),
      recent: filterGroup(categorizedAccounts.recent),
      frequent: filterGroup(categorizedAccounts.frequent),
      assets: filterGroup(categorizedAccounts.assets),
      liabilities: filterGroup(categorizedAccounts.liabilities),
      equity: filterGroup(categorizedAccounts.equity),
      revenue: filterGroup(categorizedAccounts.revenue),
      expense: filterGroup(categorizedAccounts.expense)
    };
  }, [categorizedAccounts, searchQuery]);

  const renderAccountItem = (account: Account, icon?: React.ReactNode, badge?: string) => (
    <CommandItem
      key={account.id}
      value={`${account.account_code}-${account.account_name}`}
      onSelect={() => {
        onValueChange(account.id === value ? "" : account.id);
        setOpen(false);
      }}
      className="rtl-flex justify-between py-3"
    >
      <div className="flex-1 text-right">
        <div className="font-medium rtl-flex gap-2">
          {icon}
          {account.account_code} - {account.account_name}
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground flex justify-between mt-1">
          {showBalance && <span>الرصيد: {formatCurrency(account.current_balance || 0)}</span>}
          <span className="text-blue-600">{
            account.account_type === 'asset' ? 'أصول' :
            account.account_type === 'liability' ? 'خصوم' :
            account.account_type === 'equity' ? 'حقوق ملكية' :
            account.account_type === 'revenue' ? 'إيرادات' :
            account.account_type === 'expense' ? 'مصروفات' : account.account_type
          }</span>
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

  const renderAccountGroup = (title: string, accounts: Account[], icon: React.ReactNode, badge?: string) => {
    if (accounts.length === 0) return null;
    
    return (
      <CommandGroup heading={title}>
        {accounts.map(account => renderAccountItem(account, icon, badge))}
      </CommandGroup>
    );
  };

  if (!Array.isArray(accounts) || accounts.length === 0) {
    return (
      <Button variant="outline" className="w-full rtl-flex text-right" disabled>
        <span className="text-muted-foreground">لا توجد حسابات متاحة</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full rtl-flex text-right"
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
        <Command>
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="ابحث بالكود أو الاسم..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div className="max-h-80 overflow-auto">
            {renderAccountGroup(
              "حسابات مقترحة", 
              filteredAccounts.suggested, 
              <Star className="h-3 w-3 text-yellow-500" />,
              "مقترح"
            )}
            
            {renderAccountGroup(
              "مستخدمة مؤخراً", 
              filteredAccounts.recent, 
              <Clock className="h-3 w-3 text-blue-500" />,
              "حديث"
            )}
            
            {renderAccountGroup(
              "الأكثر استخداماً", 
              filteredAccounts.frequent, 
              <TrendingUp className="h-3 w-3 text-green-500" />,
              "شائع"
            )}
            
            {renderAccountGroup("الأصول", filteredAccounts.assets, null)}
            {renderAccountGroup("الخصوم", filteredAccounts.liabilities, null)}
            {renderAccountGroup("حقوق الملكية", filteredAccounts.equity, null)}
            {renderAccountGroup("الإيرادات", filteredAccounts.revenue, null)}
            {renderAccountGroup("المصروفات", filteredAccounts.expense, null)}
            
            <CommandEmpty>لا توجد نتائج</CommandEmpty>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
