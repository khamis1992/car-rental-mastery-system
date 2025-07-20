
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout/Layout';
import { MaintenanceOverview } from '@/components/Maintenance/MaintenanceOverview';
import { MaintenanceScheduler } from '@/components/Maintenance/MaintenanceScheduler';
import { MaintenanceHistory } from '@/components/Maintenance/MaintenanceHistory';
import { MaintenanceAlerts } from '@/components/Maintenance/MaintenanceAlerts';
import { MaintenanceCostTracker } from '@/components/Maintenance/MaintenanceCostTracker';
import { useSearchParams } from 'react-router-dom';

const Maintenance = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'scheduler', 'history', 'alerts', 'costs'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="rtl-title">
            <h1 className="text-3xl font-bold text-foreground">إدارة الصيانة</h1>
            <p className="text-muted-foreground">تتبع وإدارة صيانة جميع مركبات الأسطول</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="costs">التكاليف</TabsTrigger>
            <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
            <TabsTrigger value="history">تاريخ الصيانة</TabsTrigger>
            <TabsTrigger value="scheduler">جدولة الصيانة</TabsTrigger>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <MaintenanceOverview />
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-6">
            <MaintenanceScheduler />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <MaintenanceHistory />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <MaintenanceAlerts />
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <MaintenanceCostTracker />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Maintenance;
