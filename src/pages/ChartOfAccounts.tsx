
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialBreadcrumb } from '@/components/Financial/FinancialBreadcrumb';
import { ModernChartOfAccountsTree } from '@/components/Accounting/ModernChartOfAccountsTree';
import { GeneralLedgerReport } from '@/components/Financial/GeneralLedgerReport';
import { AddAccountDialog } from '@/components/Accounting/AddAccountDialog';
import { EditAccountDialog } from '@/components/Accounting/EditAccountDialog';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  current_balance: number;
  level: number;
  parent_account_id?: string;
  allow_posting: boolean;
  is_active: boolean;
}

const ChartOfAccounts = () => {
  const [activeTab, setActiveTab] = useState("accounts");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [parentAccountId, setParentAccountId] = useState<string | undefined>();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .order('account_code');
      
      if (error) throw error;
      return data as Account[];
    }
  });

  const handleAddAccount = (parentId?: string) => {
    setParentAccountId(parentId);
    setShowAddDialog(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowEditDialog(true);
  };

  const handleViewLedger = (account: Account) => {
    setSelectedAccount(account);
    setActiveTab("ledger");
  };

  return (
    <div className="space-y-6">
      <FinancialBreadcrumb />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="ledger">دفتر الأستاذ العام</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <ModernChartOfAccountsTree
            accounts={accounts || []}
            loading={isLoading}
            onAddAccount={handleAddAccount}
            onEditAccount={handleEditAccount}
            onViewLedger={handleViewLedger}
          />
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          <GeneralLedgerReport selectedAccount={selectedAccount} />
        </TabsContent>
      </Tabs>

      <AddAccountDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        parentAccountId={parentAccountId}
      />

      <EditAccountDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        account={editingAccount}
      />
    </div>
  );
};

export default ChartOfAccounts;
