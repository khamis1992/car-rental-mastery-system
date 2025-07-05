import React from 'react';
import { TrendingUp, DollarSign, FileText, Calendar, CreditCard, Receipt } from 'lucide-react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { JournalEntriesTab } from '@/components/Accounting/JournalEntriesTab';
import { FinancialReportsTab } from '@/components/Accounting/FinancialReportsTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrencyKWD } from '@/lib/currency';

const Accounting = () => {
  const financialStats = [
    {
      title: "الإيرادات الشهرية",
      value: formatCurrencyKWD(0),
      change: "0%",
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      trend: "up"
    },
    {
      title: "المدفوعات المعلقة",
      value: formatCurrencyKWD(0),
      change: "0%",
      icon: <CreditCard className="w-6 h-6 text-orange-500" />,
      trend: "down"
    },
    {
      title: "إجمالي المصروفات",
      value: formatCurrencyKWD(0),
      change: "0%",
      icon: <Receipt className="w-6 h-6 text-red-500" />,
      trend: "up"
    },
    {
      title: "صافي الربح",
      value: formatCurrencyKWD(0),
      change: "0%",
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      trend: "up"
    }
  ];

  const recentTransactions: any[] = [];

  const monthlyReports: any[] = [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المحاسبة والتقارير</h1>
          <p className="text-muted-foreground">إدارة الشؤون المالية والتقارير المحاسبية</p>
        </div>
        
        <div className="flex items-center gap-2">
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
        {financialStats.map((stat, index) => (
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          <TabsTrigger value="journal">القيود المحاسبية</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <JournalEntriesTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            إعدادات النظام المحاسبي - قريباً
          </div>
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
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'إيراد' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.id} • {transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`font-bold ${
                           transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                         }`}>
                           {transaction.amount > 0 ? '+' : ''}{formatCurrencyKWD(Math.abs(transaction.amount))}
                         </p>
                        <Badge variant={transaction.status === 'مكتمل' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
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