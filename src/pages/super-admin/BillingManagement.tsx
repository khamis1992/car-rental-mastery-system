import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { SubscriptionPlansTab } from '@/components/super-admin/billing/SubscriptionPlansTab';
import { SubscriptionsTab } from '@/components/super-admin/billing/SubscriptionsTab';
import { InvoicesTab } from '@/components/super-admin/billing/InvoicesTab';
import { PaymentsTab } from '@/components/super-admin/billing/PaymentsTab';
import { UsageTab } from '@/components/super-admin/billing/UsageTab';

export default function BillingManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Mock data - replace with real data from API
  const stats = {
    total_revenue: 125750.50,
    monthly_revenue: 18250.75,
    active_subscriptions: 42,
    trial_subscriptions: 8,
    canceled_subscriptions: 5,
    overdue_invoices: 3,
    total_tenants: 55,
    growth_rate: 12.5
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفوترة والاشتراكات</h1>
          <p className="text-muted-foreground mt-2">
            إدارة خطط الاشتراك والفواتير والمدفوعات
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.growth_rate}%</span> من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthly_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">هذا الشهر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.trial_subscriptions} في فترة تجريبية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المتأخرة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue_invoices}</div>
            <p className="text-xs text-muted-foreground">تحتاج متابعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="plans">خطط الاشتراك</TabsTrigger>
          <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="usage">الاستخدام</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أحدث الاشتراكات</CardTitle>
                <CardDescription>آخر 5 اشتراكات جديدة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Recent subscriptions list */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">شركة التميز للتجارة</p>
                      <p className="text-sm text-muted-foreground">الخطة المتقدمة - شهرية</p>
                    </div>
                    <Badge>نشط</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">مؤسسة الخليج للاستثمار</p>
                      <p className="text-sm text-muted-foreground">خطة المؤسسات - سنوية</p>
                    </div>
                    <Badge variant="secondary">تجريبي</Badge>
                  </div>
                  {/* Add more items as needed */}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الفواتير المتأخرة</CardTitle>
                <CardDescription>فواتير تحتاج متابعة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Overdue invoices list */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SAAS-000123</p>
                      <p className="text-sm text-muted-foreground">متأخرة 15 يوم</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">$59.99</p>
                      <Button size="sm" variant="outline">متابعة</Button>
                    </div>
                  </div>
                  {/* Add more items as needed */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans">
          <SubscriptionPlansTab />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionsTab />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>

        <TabsContent value="usage">
          <UsageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}