import React from 'react';
import { TrendingUp, DollarSign, FileText, Calendar, CreditCard, Receipt } from 'lucide-react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { JournalEntriesTab } from '@/components/Accounting/JournalEntriesTab';
import { FinancialReportsTab } from '@/components/Accounting/FinancialReportsTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Accounting = () => {
  const financialStats = [
    {
      title: "الإيرادات الشهرية",
      value: "45,000 ر.س",
      change: "+12%",
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      trend: "up"
    },
    {
      title: "المدفوعات المعلقة",
      value: "8,500 ر.س",
      change: "-5%",
      icon: <CreditCard className="w-6 h-6 text-orange-500" />,
      trend: "down"
    },
    {
      title: "إجمالي المصروفات",
      value: "12,300 ر.س",
      change: "+3%",
      icon: <Receipt className="w-6 h-6 text-red-500" />,
      trend: "up"
    },
    {
      title: "صافي الربح",
      value: "32,700 ر.س",
      change: "+18%",
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      trend: "up"
    }
  ];

  const recentTransactions = [
    {
      id: "TRX001",
      type: "إيراد",
      description: "دفعة عقد إيجار - CON000001",
      amount: 2500,
      date: "2025-01-01",
      status: "مكتمل"
    },
    {
      id: "TRX002", 
      type: "مصروف",
      description: "صيانة مركبة VEH0001",
      amount: -800,
      date: "2024-12-30",
      status: "مكتمل"
    },
    {
      id: "TRX003",
      type: "إيراد",
      description: "تأمين مركبة",
      amount: 500,
      date: "2024-12-29",
      status: "معلق"
    }
  ];

  const monthlyReports = [
    {
      month: "ديسمبر 2024",
      revenue: 42000,
      expenses: 15000,
      contracts: 28,
      status: "مكتمل"
    },
    {
      month: "نوفمبر 2024", 
      revenue: 38000,
      expenses: 13500,
      contracts: 25,
      status: "مكتمل"
    },
    {
      month: "أكتوبر 2024",
      revenue: 35000,
      expenses: 12000,
      contracts: 22,
      status: "مكتمل"
    }
  ];

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
          <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="journal">القيود المحاسبية</TabsTrigger>
          <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
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
              <CardTitle>المعاملات الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
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
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} ر.س
                      </p>
                      <Badge variant={transaction.status === 'مكتمل' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReportsTab />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>توزيع الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>إيجارات يومية</span>
                    <span className="font-bold">65%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>إيجارات شهرية</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>رسوم إضافية</span>
                    <span className="font-bold">10%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>توزيع المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>صيانة المركبات</span>
                    <span className="font-bold">40%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>التأمين</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>مصروفات إدارية</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Accounting;