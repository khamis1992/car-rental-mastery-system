
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { ChartOfAccount } from '@/types/accounting';

interface AccountHierarchyDisplayProps {
  account: ChartOfAccount;
  allAccounts: ChartOfAccount[];
}

export const AccountHierarchyDisplay: React.FC<AccountHierarchyDisplayProps> = ({
  account,
  allAccounts
}) => {
  const getAccountPath = (currentAccount: ChartOfAccount): ChartOfAccount[] => {
    const path: ChartOfAccount[] = [currentAccount];
    let parentId = currentAccount.parent_account_id;
    
    while (parentId) {
      const parent = allAccounts.find(acc => acc.id === parentId);
      if (parent) {
        path.unshift(parent);
        parentId = parent.parent_account_id;
      } else {
        break;
      }
    }
    
    return path;
  };

  const accountPath = getAccountPath(account);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md flex-row-reverse">
      {accountPath.map((pathAccount, index) => (
        <div key={pathAccount.id} className="flex items-center gap-2">
          {index > 0 && <ChevronLeft className="w-3 h-3" />}
          <span className={index === accountPath.length - 1 ? 'font-medium text-foreground' : ''}>
            {pathAccount.account_code} - {pathAccount.account_name}
          </span>
        </div>
      ))}
    </div>
  );
};
