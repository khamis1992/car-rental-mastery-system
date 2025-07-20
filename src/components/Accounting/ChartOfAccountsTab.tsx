
import React from 'react';
import { SimpleChartOfAccountsTable } from './SimpleChartOfAccountsTable';
import { ChartOfAccount } from '@/types/accounting';
import { useToast } from '@/hooks/use-toast';

export const ChartOfAccountsTab: React.FC = () => {
  const { toast } = useToast();

  const handleAccountSelect = (account: ChartOfAccount) => {
    console.log('Selected account:', account);
    toast({
      title: "تم اختيار الحساب",
      description: `${account.account_code} - ${account.account_name}`,
    });
  };

  return (
    <div className="space-y-6">
      <SimpleChartOfAccountsTable onAccountSelect={handleAccountSelect} />
    </div>
  );
};
