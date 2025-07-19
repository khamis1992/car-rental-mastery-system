
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChartOfAccount } from '@/types/accounting';
import { AccountHierarchyDisplay } from './AccountHierarchyDisplay';

interface ParentAccountSelectorProps {
  accounts: ChartOfAccount[];
  selectedParentId: string;
  onParentSelect: (parentId: string, level: number) => void;
  disabled?: boolean;
}

export const ParentAccountSelector: React.FC<ParentAccountSelectorProps> = ({
  accounts = [],
  selectedParentId,
  onParentSelect,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // تصفية الحسابات التي يُسمح لها بأن تكون حسابات أب (مستوى أقل من 5)
  const eligibleParentAccounts = useMemo(() => {
    if (!Array.isArray(accounts)) return [];
    
    let filtered = accounts.filter(account => 
      account && 
      account.level < 5 && 
      account.is_active
    );

    // تصفية حسب البحث إذا وجد
    if (searchValue.trim()) {
      filtered = filtered.filter(account =>
        account.account_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        account.account_code.includes(searchValue)
      );
    }

    return filtered.sort((a, b) => {
      if (!a?.account_code || !b?.account_code) return 0;
      return a.account_code.localeCompare(b.account_code);
    });
  }, [accounts, searchValue]);

  const selectedParent = Array.isArray(accounts) ? accounts.find(acc => acc?.id === selectedParentId) : null;

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleSelect = (accountId: string) => {
    const account = accounts.find(acc => acc?.id === accountId);
    if (account) {
      onParentSelect(accountId, account.level + 1);
      setOpen(false);
      setSearchValue('');
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="parent-account" className="rtl-label">الحساب الأب</Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rtl-flex"
            disabled={disabled}
          >
            {selectedParent ? (
              <span className="flex items-center gap-2 flex-row-reverse">
                <Building2 className="w-4 h-4" />
                <span>{selectedParent.account_code} - {selectedParent.account_name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">اختر الحساب الأب...</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="البحث في الحسابات..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>لا توجد حسابات مطابقة</CommandEmpty>
              <CommandGroup>
                {eligibleParentAccounts.map((account) => (
                  <CommandItem
                    key={account.id}
                    value={account.id}
                    onSelect={() => handleSelect(account.id)}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full flex-row-reverse">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">
                        {account.account_code} - {account.account_name}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        مستوى {account.level}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground text-right w-full">
                      نوع: {getAccountTypeLabel(account.account_type)} | 
                      المستوى التالي سيكون: {account.level + 1}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedParent && (
        <div className="mt-2">
          <AccountHierarchyDisplay account={selectedParent} allAccounts={accounts} />
        </div>
      )}
    </div>
  );
};
