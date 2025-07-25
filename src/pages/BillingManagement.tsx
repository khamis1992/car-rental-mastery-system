
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign,
  Building2,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Receipt,
  Clock
} from "lucide-react";
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import BillingOverview from "@/components/Billing/BillingOverview";
import TenantSubscriptions from "@/components/Billing/TenantSubscriptions";
import PaymentMethods from "@/components/Billing/PaymentMethods";
import BillingInvoicesTab from "@/components/Billing/BillingInvoicesTab";
import BillingReports from "@/components/Billing/BillingReports";
import BillingSettings from "@/components/Billing/BillingSettings";
import SubscriptionPlansManagement from "@/components/Billing/SubscriptionPlansManagement";
import AutoBillingManager from "@/components/Billing/AutoBillingManager";
import { CollectiveInvoicesTab } from "@/components/Billing/CollectiveInvoicesTab";
import { CollectionRecordsTab } from "@/components/Billing/CollectionRecordsTab";

const BillingManagement: React.FC = () => {
  const { currentUserRole } = useTenant();
  const { user } = useAuth();

  // التحقق من صلاحيات الوصول
  if (currentUserRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">غير مصرح بالوصول</h3>
            <p className="text-muted-foreground text-center">
              تحتاج إلى صلاحيات مدير النظام العام للوصول إلى إدارة الفوترة والاشتراكات
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-row-reverse">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                إدارة الفوترة والاشتراكات
              </h1>
              <p className="text-muted-foreground">
                إدارة شاملة لفوترة المؤسسات والاشتراكات
              </p>
            </div>
            <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
              <DollarSign className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-row-reverse">
            <span>النظام العام</span>
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* Main Billing Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-9">
            <TabsTrigger value="overview" className="flex items-center gap-2 flex-row-reverse">
              <BarChart3 className="w-4 h-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2 flex-row-reverse">
              <Settings className="w-4 h-4" />
              خطط الاشتراك
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2 flex-row-reverse">
              <Building2 className="w-4 h-4" />
              الاشتراكات
            </TabsTrigger>
            <TabsTrigger value="automated" className="flex items-center gap-2 flex-row-reverse">
              <Clock className="w-4 h-4" />
              الفوترة التلقائية
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2 flex-row-reverse">
              <CreditCard className="w-4 h-4" />
              طرق الدفع
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 flex-row-reverse">
              <FileText className="w-4 h-4" />
              الفواتير
            </TabsTrigger>
            <TabsTrigger value="collective" className="flex items-center gap-2 flex-row-reverse">
              <Receipt className="w-4 h-4" />
              الفواتير الجماعية
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2 flex-row-reverse">
              <Receipt className="w-4 h-4" />
              سجلات التحصيل
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 flex-row-reverse">
              <BarChart3 className="w-4 h-4" />
              التقارير
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <BillingOverview />
          </TabsContent>

          <TabsContent value="plans">
            <SubscriptionPlansManagement />
          </TabsContent>

          <TabsContent value="subscriptions">
            <TenantSubscriptions />
          </TabsContent>

          <TabsContent value="automated">
            <AutoBillingManager />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentMethods />
          </TabsContent>

          <TabsContent value="invoices">
            <BillingInvoicesTab />
          </TabsContent>

          <TabsContent value="collective">
            <CollectiveInvoicesTab />
          </TabsContent>

          <TabsContent value="collections">
            <CollectionRecordsTab />
          </TabsContent>

          <TabsContent value="reports">
            <BillingReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BillingManagement;
