import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaintenanceOverview } from '@/components/Maintenance/MaintenanceOverview';
import { MaintenanceScheduler } from '@/components/Maintenance/MaintenanceScheduler';
import { MaintenanceHistory } from '@/components/Maintenance/MaintenanceHistory';
import { MaintenanceAlerts } from '@/components/Maintenance/MaintenanceAlerts';
import { MaintenanceCostTracker } from '@/components/Maintenance/MaintenanceCostTracker';

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
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
  );
};

export default Maintenance;