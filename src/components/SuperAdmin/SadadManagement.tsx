import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings,
  CreditCard,
  BarChart3,
  Webhook,
  Activity
} from "lucide-react";
import SadadSettings from "./SadadSettings";
import SadadPayments from "./SadadPayments";
import SadadStats from "./SadadStats";
import SadadWebhooks from "./SadadWebhooks";
import SadadTransactionLogs from "./SadadTransactionLogs";

const SadadManagement: React.FC = () => {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
            <CreditCard className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              إدارة نظام SADAD
            </h2>
            <p className="text-muted-foreground">
              إدارة شاملة لنظام المدفوعات SADAD والتكامل مع الفوترة
            </p>
          </div>
        </div>
      </div>

      {/* SADAD Management Tabs */}
      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            المدفوعات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            سجل المعاملات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <SadadStats />
        </TabsContent>

        <TabsContent value="payments">
          <SadadPayments />
        </TabsContent>

        <TabsContent value="settings">
          <SadadSettings />
        </TabsContent>

        <TabsContent value="webhooks">
          <SadadWebhooks />
        </TabsContent>

        <TabsContent value="logs">
          <SadadTransactionLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SadadManagement;