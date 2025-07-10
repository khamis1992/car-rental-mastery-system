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
  Shield
} from "lucide-react";
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import BillingOverview from "@/components/Billing/BillingOverview";
import TenantSubscriptions from "@/components/Billing/TenantSubscriptions";
import PaymentMethods from "@/components/Billing/PaymentMethods";
import BillingInvoices from "@/components/Billing/BillingInvoices";
import BillingReports from "@/components/Billing/BillingReports";
import BillingSettings from "@/components/Billing/BillingSettings";
import SubscriptionPlansManagement from "@/components/Billing/SubscriptionPlansManagement";
import AutomatedBilling from "@/components/Billing/AutomatedBilling";

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
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
              <DollarSign className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                إدارة الفوترة والاشتراكات
              </h1>
              <p className="text-muted-foreground">
                إدارة شاملة لفوترة المؤسسات والاشتراكات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span>النظام العام</span>
          </div>
        </div>

        {/* Main Billing Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              خطط الاشتراك
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              الاشتراكات
            </TabsTrigger>
            <TabsTrigger value="automated" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              الفوترة التلقائية
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              طرق الدفع
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              الفواتير
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              التقارير
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              الإعدادات
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
            <AutomatedBilling />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentMethods />
          </TabsContent>

          <TabsContent value="invoices">
            <BillingInvoices />
          </TabsContent>

          <TabsContent value="reports">
            <BillingReports />
          </TabsContent>

          <TabsContent value="settings">
            <BillingSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BillingManagement;