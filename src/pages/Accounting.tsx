import React from 'react';
import { TrendingUp, DollarSign, FileText, Calendar, CreditCard, Receipt, RefreshCw, Calculator, Download, AlertTriangle, Bell, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { JournalEntriesTab } from '@/components/Accounting/JournalEntriesTab';
import { FinancialReportsTab } from '@/components/Accounting/FinancialReportsTab';
import { AccountingBackfillTab } from '@/components/Accounting/AccountingBackfillTab';
import { AccountingDataRefresh } from '@/components/Accounting/AccountingDataRefresh';
import { AccountingMaintenanceTools } from '@/components/Accounting/AccountingMaintenanceTools';
import { ChartOfAccountsSetup } from '@/components/Accounting/ChartOfAccountsSetup';
import { EnhancedAccountingDashboard } from '@/components/Accounting/EnhancedAccountingDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrencyKWD } from '@/lib/currency';
import { useAccountingData } from '@/hooks/useAccountingData';
import { cn } from '@/lib/utils';

const Accounting = () => {
  const { financialStats, recentTransactions, loading, error, refetch } = useAccountingData();

  // Smart Alerts Component
  const SmartAlerts = () => {
    const alerts = [
      {
        id: 1,
        type: 'warning',
        title: 'تحذير من التدفق النقدي',
        message: 'المدفوعات المعلقة تتجاوز 50% من الإيرادات الشهرية',
        priority: 'high',
        timestamp: '2024-01-15T10:30:00Z',
        category: 'cash_flow',
        isRead: false
      },
      {
        id: 2,
        type: 'info',
        title: 'تم تصنيف معاملة جديدة تلقائياً',
        message: 'تم تصنيف إيداع بقيمة 500 د.ك كإيراد تأجير',
        priority: 'medium',
        timestamp: '2024-01-15T09:15:00Z',
        category: 'ai_classification',
        isRead: true
      }
    ];

    const getAlertIcon = (type: string) => {
      switch (type) {
        case 'warning': return AlertTriangle;
        case 'error': return AlertCircle;
        case 'success': return CheckCircle2;
        default: return Info;
      }
    };

    const getAlertStyles = (type: string) => {
      switch (type) {
        case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
        case 'error': return 'border-red-200 bg-red-50 text-red-800';
        case 'success': return 'border-green-200 bg-green-50 text-green-800';
        default: return 'border-blue-200 bg-blue-50 text-blue-800';
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            التنبيهات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div 
                key={alert.id} 
                className={cn(
                  "p-4 rounded-lg border",
                  getAlertStyles(alert.type),
                  !alert.isRead && "ring-2 ring-primary/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{alert.title}</h4>
                    <p className="text-sm opacity-80">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {alert.priority === 'high' ? 'عالي' : 'متوسط'}
                      </Badge>
                      <span className="text-xs opacity-60">
                        {new Date(alert.timestamp).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

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

      {/* Smart Alerts */}
      <SmartAlerts />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">لوحة التحكم المتقدمة</TabsTrigger>
          <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          <TabsTrigger value="journal">القيود المحاسبية</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <EnhancedAccountingDashboard />
        </TabsContent>


        <TabsContent value="accounts" className="space-y-4">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <JournalEntriesTab />
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

      </Tabs>
    </div>
  );
};

export default Accounting;