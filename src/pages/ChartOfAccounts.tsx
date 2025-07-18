
import React from 'react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { ChartOfAccountsSetup } from '@/components/Accounting/ChartOfAccountsSetup';
import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';
import { AccountingDashboard } from '@/components/Accounting/AccountingDashboard';
import { ModernChartOfAccountsTree } from '@/components/Accounting/ModernChartOfAccountsTree';
import { FinancialBreadcrumb } from '@/components/Financial/FinancialBreadcrumb';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Upload, Download, BarChart3, Settings, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ChartOfAccounts = () => {
  // Mock data for the tree - in real implementation, this would come from a hook
  const mockAccounts = [
    {
      id: '1',
      account_code: '1000',
      account_name: 'الأصول',
      account_type: 'asset' as const,
      current_balance: 150000,
      level: 1,
      allow_posting: false,
      is_active: true,
      children: [
        {
          id: '2',
          account_code: '1100',
          account_name: 'الأصول المتداولة',
          account_type: 'asset' as const,
          current_balance: 75000,
          level: 2,
          parent_account_id: '1',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '3',
              account_code: '1110',
              account_name: 'النقدية والبنوك',
              account_type: 'asset' as const,
              current_balance: 25000,
              level: 3,
              parent_account_id: '2',
              allow_posting: true,
              is_active: true
            }
          ]
        }
      ]
    }
  ];

  const handleAddAccount = (parentId?: string) => {
    console.log('Add account', parentId);
    // Navigate to add account form
  };

  const handleEditAccount = (account: any) => {
    console.log('Edit account', account);
    // Navigate to edit account form
  };

  const handleViewLedger = (account: any) => {
    console.log('View ledger', account);
    // Navigate to ledger view
  };

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Navigation */}
      <FinancialBreadcrumb />
      
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            دليل الحسابات
          </h1>
          <p className="text-muted-foreground mt-2">إدارة وتنظيم دليل الحسابات المحاسبي بطريقة حديثة وسهلة</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            استيراد
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
          <Button className="btn-primary flex items-center gap-2" onClick={() => handleAddAccount()}>
            <Plus className="w-4 h-4" />
            حساب جديد
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">125</p>
                <p className="text-sm text-muted-foreground">إجمالي الحسابات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">89</p>
                <p className="text-sm text-muted-foreground">حسابات نشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">67</p>
                <p className="text-sm text-muted-foreground">قابلة للترحيل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Upload className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">5</p>
                <p className="text-sm text-muted-foreground">مستويات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tree">عرض شجري حديث</TabsTrigger>
          <TabsTrigger value="dashboard">لوحة المعلومات</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="ledger">دفتر الأستاذ</TabsTrigger>
          <TabsTrigger value="setup">إعداد الحسابات</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="space-y-4">
          <ModernChartOfAccountsTree
            accounts={mockAccounts}
            onAddAccount={handleAddAccount}
            onEditAccount={handleEditAccount}
            onViewLedger={handleViewLedger}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <AccountingDashboard />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <GeneralLedgerReport />
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <ChartOfAccountsSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartOfAccounts;
