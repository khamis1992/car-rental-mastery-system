
import React from 'react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { ChartOfAccountsImportDialog } from '@/components/Accounting/ChartOfAccountsImportDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ChartOfAccounts = () => {
  return <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">دليل الحسابات</h1>
          <p className="text-muted-foreground">إدارة وتنظيم دليل الحسابات المحاسبي</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Button variant="outline" className="rtl-flex">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <ChartOfAccountsImportDialog isOpen={false} onClose={() => {}} onImportComplete={() => window.location.reload()} />
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الأصول</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>
        
        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الخصوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">8</div>
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">6</div>
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">15</div>
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart of Accounts Table */}
      <ChartOfAccountsTab />
    </div>;
};

export default ChartOfAccounts;
