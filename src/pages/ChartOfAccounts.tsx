import React from 'react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { ChartOfAccountsSetup } from '@/components/Accounting/ChartOfAccountsSetup';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Upload, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ChartOfAccounts = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">دليل الحسابات</h1>
          <p className="text-muted-foreground">إدارة وتنظيم دليل الحسابات المحاسبي</p>
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
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            حساب جديد
          </Button>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="setup">إعداد الحسابات</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <ChartOfAccountsSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartOfAccounts;