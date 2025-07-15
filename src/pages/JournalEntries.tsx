import React from 'react';
import { EnhancedJournalEntriesTab } from '@/components/Accounting/EnhancedJournalEntriesTab';
import { AutomatedJournalEntries } from '@/components/Accounting/AutomatedJournalEntries';
import { ExpenseVouchersTab } from '@/components/Accounting/ExpenseVouchersTab';
import { ChecksTab } from '@/components/Accounting/ChecksTab';
import BankReconciliation from '@/components/BankReconciliation/BankReconciliation';
import { CostCenterBudgetAlerts } from '@/components/Accounting/CostCenterBudgetAlerts';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Calendar, Filter, CreditCard, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const JournalEntries = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">القيود المحاسبية</h1>
          <p className="text-muted-foreground">إدارة وتسجيل القيود المحاسبية اليومية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            فلترة
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تقرير شهري
          </Button>
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            قيد جديد
          </Button>
        </div>
      </div>

      {/* تنبيهات مراكز التكلفة */}
      <div className="mb-4">
        <CostCenterBudgetAlerts showOnlyUnread={true} maxAlerts={5} />
      </div>

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="entries">القيود المحاسبية المحسّنة</TabsTrigger>
          <TabsTrigger value="expenses">سندات المصروفات</TabsTrigger>
          <TabsTrigger value="checks">إدارة الشيكات</TabsTrigger>
          <TabsTrigger value="automated">القيود التلقائية</TabsTrigger>
          <TabsTrigger value="reconciliation">المطابقة البنكية</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <EnhancedJournalEntriesTab />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseVouchersTab />
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <ChecksTab />
        </TabsContent>

        <TabsContent value="automated" className="space-y-4">
          <AutomatedJournalEntries />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <BankReconciliation />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JournalEntries;