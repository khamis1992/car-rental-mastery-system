import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollList } from '@/components/payroll/PayrollList';
import { PayrollSettings } from '@/components/payroll/PayrollSettings';
import { AutomationRules } from '@/components/payroll/AutomationRules';
import { PayrollApprovals } from '@/components/payroll/PayrollApprovals';
import { PayrollJournalEntries } from '@/components/payroll/PayrollJournalEntries';
import { Users, Settings, Zap, CheckCircle, BookOpen } from 'lucide-react';

export const Payroll = () => {
  return (
    <div className="container mx-auto p-6 space-y-6 rtl-layout">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold rtl-title">إدارة الرواتب</h1>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="list" className="rtl-flex">
            <Users className="h-4 w-4 ml-2" />
            قائمة الرواتب
          </TabsTrigger>
          <TabsTrigger value="settings" className="rtl-flex">
            <Settings className="h-4 w-4 ml-2" />
            الإعدادات
          </TabsTrigger>
          <TabsTrigger value="automation" className="rtl-flex">
            <Zap className="h-4 w-4 ml-2" />
            قواعد الأتمتة
          </TabsTrigger>
          <TabsTrigger value="approvals" className="rtl-flex">
            <CheckCircle className="h-4 w-4 ml-2" />
            الموافقات
          </TabsTrigger>
          <TabsTrigger value="journal" className="rtl-flex">
            <BookOpen className="h-4 w-4 ml-2" />
            القيود المحاسبية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <PayrollList />
        </TabsContent>

        <TabsContent value="settings">
          <PayrollSettings />
        </TabsContent>

        <TabsContent value="automation">
          <AutomationRules />
        </TabsContent>

        <TabsContent value="approvals">
          <PayrollApprovals />
        </TabsContent>

        <TabsContent value="journal">
          <PayrollJournalEntries />
        </TabsContent>
      </Tabs>
    </div>
  );
};