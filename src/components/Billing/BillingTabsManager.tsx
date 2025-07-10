import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  FileText, 
  CreditCard, 
  Settings,
  TrendingUp,
  Clock
} from "lucide-react";
import TenantSubscriptions from "./TenantSubscriptions";
import InvoiceGenerator from "./InvoiceGenerator";
import AutoBillingManager from "./AutoBillingManager";
import BillingOverview from "./BillingOverview";

const BillingTabsManager: React.FC = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            الاشتراكات
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            الفواتير
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            الفوترة التلقائية
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            المدفوعات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BillingOverview />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <TenantSubscriptions />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceGenerator />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <AutoBillingManager />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="text-center p-8">
            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">إدارة المدفوعات</h3>
            <p className="text-muted-foreground">
              سيتم إضافة وحدة إدارة المدفوعات قريباً لتتبع جميع المعاملات المالية
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingTabsManager;