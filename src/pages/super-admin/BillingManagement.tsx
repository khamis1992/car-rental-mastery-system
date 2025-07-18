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
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { SubscriptionPlansTab } from '@/components/super-admin/billing/SubscriptionPlansTab';
import { SubscriptionsTab } from '@/components/super-admin/billing/SubscriptionsTab';
import { InvoicesTab } from '@/components/super-admin/billing/InvoicesTab';
import { PaymentsTab } from '@/components/super-admin/billing/PaymentsTab';
import { UsageTab } from '@/components/super-admin/billing/UsageTab';
import { AutomaticBillingTab } from '@/components/super-admin/billing/AutomaticBillingTab';
import { useBillingStats } from '@/hooks/useSaasOperations';
import { useSubscriptionRevenue } from '@/hooks/useSubscriptionRevenue';

export default function BillingManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  
  // استخدام hooks حقيقية للحصول على البيانات
  const { stats: billingStats, loading: statsLoading } = useBillingStats();
  const { data: revenueData, isLoading: revenueLoading } = useSubscriptionRevenue();

  // حساب الإحصائيات من البيانات الحقيقية
  const stats = {
    total_revenue: billingStats?.total_revenue || 0,
    monthly_revenue: revenueData?.currentMonth || 0,
    active_subscriptions: billingStats?.active_subscriptions || 0,
    trial_subscriptions: billingStats?.trial_subscriptions || 0,
    canceled_subscriptions: billingStats?.canceled_subscriptions || 0,
    overdue_invoices: billingStats?.overdue_invoices || 0,
    total_tenants: billingStats?.total_tenants || 0,
    growth_rate: revenueData?.growthPercentage || 0
  };

  const isLoading = statsLoading || revenueLoading;

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold">إدارة الفوترة والاشتراكات</h1>
          <p className="text-muted-foreground mt-2">
            إدارة خطط الاشتراك والفواتير والمدفوعات
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.total_revenue.toFixed(3)} د.ك</div>
                <p className="text-xs text-muted-foreground text-right">
                  <span className={stats.growth_rate > 0 ? "text-green-600" : stats.growth_rate < 0 ? "text-red-600" : "text-muted-foreground"}>
                    {stats.growth_rate > 0 ? '+' : ''}{stats.growth_rate.toFixed(1)}%
                  </span> من الشهر الماضي
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">الإيرادات الشهرية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.monthly_revenue.toFixed(3)} د.ك</div>
                <p className="text-xs text-muted-foreground text-right">هذا الشهر</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">الاشتراكات النشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
                <p className="text-xs text-muted-foreground text-right">
                  {stats.trial_subscriptions} في فترة تجريبية
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">الفواتير المتأخرة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">{stats.overdue_invoices}</div>
                <p className="text-xs text-muted-foreground text-right">تحتاج متابعة</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4" dir="rtl">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="plans">خطط الاشتراك</TabsTrigger>
          <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="auto-billing">الفوترة التلقائية</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">الاشتراكات حسب النوع</CardTitle>
                <CardDescription className="text-right">توزيع الاشتراكات الحالية</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="font-medium">النشطة</p>
                        <p className="text-sm text-muted-foreground">{stats.active_subscriptions} اشتراك</p>
                      </div>
                      <Badge variant="default">{stats.active_subscriptions}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="font-medium">تجريبية</p>
                        <p className="text-sm text-muted-foreground">{stats.trial_subscriptions} اشتراك</p>
                      </div>
                      <Badge variant="secondary">{stats.trial_subscriptions}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="font-medium">ملغية</p>
                        <p className="text-sm text-muted-foreground">{stats.canceled_subscriptions} اشتراك</p>
                      </div>
                      <Badge variant="destructive">{stats.canceled_subscriptions}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-right">الفواتير المتأخرة</CardTitle>
                <CardDescription className="text-right">فواتير تحتاج متابعة</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : stats.overdue_invoices > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="font-medium text-destructive">عدد الفواتير المتأخرة</p>
                        <p className="text-sm text-muted-foreground">تحتاج متابعة فورية</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-destructive">{stats.overdue_invoices}</p>
                        <Button size="sm" variant="outline" className="mt-1">
                          عرض التفاصيل
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                    <p className="text-muted-foreground">لا توجد فواتير متأخرة</p>
                  </div>
                )}
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

        <TabsContent value="auto-billing">
          <AutomaticBillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}