
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { AutomatedJournalEntries } from '@/components/Accounting/AutomatedJournalEntries';
import { AccountingDataRefresh } from '@/components/Accounting/AccountingDataRefresh';
import { AccountingMaintenanceTools } from '@/components/Accounting/AccountingMaintenanceTools';
import { AccountingBackfillTab } from '@/components/Accounting/AccountingBackfillTab';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Settings, Clock, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AccountingAutomation = () => {
  const automationStats = [
    {
      title: "القيود التلقائية",
      value: "45",
      description: "تم إنشاؤها هذا الشهر",
      icon: <Zap className="w-5 h-5 text-yellow-500" />
    },
    {
      title: "المعاملات المعالجة",
      value: "1,234",
      description: "معاملة تلقائية",
      icon: <Activity className="w-5 h-5 text-blue-500" />
    },
    {
      title: "الوقت المُوفر",
      value: "24 ساعة",
      description: "من العمل اليدوي",
      icon: <Clock className="w-5 h-5 text-green-500" />
    },
    {
      title: "نسبة الدقة",
      value: "99.8%",
      description: "في المعالجة التلقائية",
      icon: <Settings className="w-5 h-5 text-purple-500" />
    }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="rtl-title">
            <h1 className="text-3xl font-bold text-foreground">أتمتة المحاسبة</h1>
            <p className="text-muted-foreground">إدارة العمليات المحاسبية التلقائية والصيانة</p>
          </div>
          
          <div className="rtl-flex gap-2">
            <Button variant="outline" className="rtl-flex">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Settings className="w-4 h-4" />
              إعدادات الأتمتة
            </Button>
            <Button className="btn-primary rtl-flex">
              <Zap className="w-4 h-4" />
              تشغيل الأتمتة
            </Button>
          </div>
        </div>

        {/* Automation Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {automationStats.map((stat, index) => (
            <Card key={index} className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="rtl-content">
                    <p className="text-sm text-muted-foreground rtl-label">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="automated-entries" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="automated-entries">القيود التلقائية</TabsTrigger>
            <TabsTrigger value="data-refresh">تحديث البيانات</TabsTrigger>
            <TabsTrigger value="backfill">ملء البيانات السابقة</TabsTrigger>
            <TabsTrigger value="maintenance">أدوات الصيانة</TabsTrigger>
          </TabsList>

          <TabsContent value="automated-entries" className="space-y-4">
            <AutomatedJournalEntries />
          </TabsContent>

          <TabsContent value="data-refresh" className="space-y-4">
            <AccountingDataRefresh />
          </TabsContent>

          <TabsContent value="backfill" className="space-y-4">
            <AccountingBackfillTab />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <AccountingMaintenanceTools />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AccountingAutomation;
