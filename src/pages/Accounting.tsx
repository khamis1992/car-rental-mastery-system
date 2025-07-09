import React from 'react';
import { TrendingUp, DollarSign, FileText, Calendar, CreditCard, Receipt, RefreshCw } from 'lucide-react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { JournalEntriesTab } from '@/components/Accounting/JournalEntriesTab';
import { FinancialReportsTab } from '@/components/Accounting/FinancialReportsTab';
import { AccountingBackfillTab } from '@/components/Accounting/AccountingBackfillTab';
import { PaymentReconciliationTab } from '@/components/Accounting/PaymentReconciliationTab';
import { SystemIntegrityTab } from '@/components/Accounting/SystemIntegrityTab';
import { AccountingEventMonitoringDashboard } from '@/components/Accounting/AccountingEventMonitoringDashboard';
import { AccountingDataRefresh } from '@/components/Accounting/AccountingDataRefresh';
import { AccountingMaintenanceTools } from '@/components/Accounting/AccountingMaintenanceTools';
import { AutomationSettingsTab } from '@/components/Accounting/AutomationSettingsTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrencyKWD } from '@/lib/currency';
import { useAccountingData } from '@/hooks/useAccountingData';

const Accounting = () => {
  const { financialStats, recentTransactions, loading, error, refetch } = useAccountingData();

  const displayStats = [
    {
      title: "الإيرادات الشهرية",
      value: formatCurrencyKWD(financialStats.monthlyRevenue),
      change: "0%",
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      trend: "up"
    },
    {
      title: "المدفوعات المعلقة", 
      value: formatCurrencyKWD(financialStats.pendingPayments),
      change: "0%",
      icon: <CreditCard className="w-6 h-6 text-orange-500" />,
      trend: "down"
    },
    {
      title: "إجمالي المصروفات",
      value: formatCurrencyKWD(financialStats.totalExpenses),
      change: "0%",
      icon: <Receipt className="w-6 h-6 text-red-500" />,
      trend: "up"
    },
    {
      title: "صافي الربح",
      value: formatCurrencyKWD(financialStats.netProfit),
      change: "0%",
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      trend: financialStats.netProfit >= 0 ? "up" : "down"
    }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="mr-2">جاري تحميل البيانات المحاسبية...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المحاسبة والتقارير</h1>
          <p className="text-muted-foreground">إدارة الشؤون المالية والتقارير المحاسبية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث البيانات
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تقرير شهري
          </Button>
          <Button className="btn-primary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* الإحصائيات المالية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">من الشهر الماضي</span>
                  </div>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="monitoring">المراقبة المباشرة</TabsTrigger>
          <TabsTrigger value="integrity">سلامة النظام</TabsTrigger>
          <TabsTrigger value="reconciliation">التسوية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="automation">الأتمتة</TabsTrigger>
          <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          <TabsTrigger value="journal">القيود المحاسبية</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <AccountingEventMonitoringDashboard />
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <SystemIntegrityTab />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <PaymentReconciliationTab />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <JournalEntriesTab />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <AutomationSettingsTab />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="text-right">المعاملات الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="text-left">
                         <p className={`font-bold text-lg ${
                           transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                         }`}>
                           {transaction.amount > 0 ? '+' : ''}{formatCurrencyKWD(Math.abs(transaction.amount))}
                         </p>
                        <Badge variant={transaction.status === 'مكتمل' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.id} • {transaction.date}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'إيراد' ? 'bg-red-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد معاملات مالية
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReportsTab />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            التحليلات المالية - سيتم عرض البيانات عند وجود معاملات مالية
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Accounting;