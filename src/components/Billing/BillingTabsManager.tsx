
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  FileText, 
  CreditCard, 
  Settings,
  TrendingUp,
  Clock,
  Receipt
} from "lucide-react";
import TenantSubscriptions from "./TenantSubscriptions";
import InvoiceGenerator from "./InvoiceGenerator";
import AutoBillingManager from "./AutoBillingManager";
import BillingOverview from "./BillingOverview";
import { CollectiveInvoicesTab } from "./CollectiveInvoicesTab";
import { CollectionRecordsTab } from "./CollectionRecordsTab";

const BillingTabsManager: React.FC = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2 flex-row-reverse">
            <TrendingUp className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2 flex-row-reverse">
            <Building2 className="w-4 h-4" />
            الاشتراكات
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2 flex-row-reverse">
            <FileText className="w-4 h-4" />
            الفواتير
          </TabsTrigger>
          <TabsTrigger value="collective" className="flex items-center gap-2 flex-row-reverse">
            <Receipt className="w-4 h-4" />
            الفواتير الجماعية
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2 flex-row-reverse">
            <Clock className="w-4 h-4" />
            الفوترة التلقائية
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2 flex-row-reverse">
            <CreditCard className="w-4 h-4" />
            سجلات التحصيل
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

        <TabsContent value="collective" className="space-y-6">
          <CollectiveInvoicesTab />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <AutoBillingManager />
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <CollectionRecordsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingTabsManager;
