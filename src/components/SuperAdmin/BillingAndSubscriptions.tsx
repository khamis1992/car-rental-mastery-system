import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// استيراد نظام الصلاحيات الجديد
import { PermissionGuard, AdminOnly } from '@/components/PermissionGuard';
import { useCurrentRole, useCommonPermissions } from '@/hooks/usePermissionGuard';

// استيراد المكونات المطلوبة
import { SubscriptionPlansTab } from '@/components/super-admin/billing/SubscriptionPlansTab';
import { SubscriptionsTab } from '@/components/super-admin/billing/SubscriptionsTab';
import { InvoicesTab } from '@/components/super-admin/billing/InvoicesTab';
import { PaymentsTab } from '@/components/super-admin/billing/PaymentsTab';
import { ReportsTab } from '@/components/super-admin/billing/ReportsTab';

const BillingAndSubscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  
  // الحصول على معلومات الدور والصلاحيات
  const { 
    isSuperAdmin, 
    isTenantAdmin, 
    canManageSystem,
    isLoading: roleLoading 
  } = useCurrentRole();
  
  const { 
    canManageAccounting,
    isLoading: permissionsLoading 
  } = useCommonPermissions();

  // إحصائيات وهمية (ستستبدل بالبيانات الحقيقية)
  const stats = {
    total_revenue: 125000,
    monthly_revenue: 32000,
    active_subscriptions: 45,
    trial_subscriptions: 12,
    canceled_subscriptions: 8,
    overdue_invoices: 3,
    total_tenants: 45,
    growth_rate: 15.2
  };

  if (roleLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header مع حماية الصلاحيات */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-right">إدارة الفوترة والاشتراكات</h1>
        
        {/* أزرار الإجراءات محمية بالصلاحيات */}
        <div className="flex gap-2">
          <PermissionGuard 
            permissions="finance.invoices.manage"
            hideOnNoAccess
          >
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              فاتورة جديدة
            </Button>
          </PermissionGuard>
          
          <AdminOnly level="super" hideOnNoAccess>
            <Button className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              إعدادات الفوترة
            </Button>
          </AdminOnly>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{stats.total_revenue.toLocaleString()} د.ك</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الإيرادات الشهرية</p>
                <p className="text-2xl font-bold">{stats.monthly_revenue.toLocaleString()} د.ك</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الاشتراكات النشطة</p>
                <p className="text-2xl font-bold">{stats.active_subscriptions}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+{stats.growth_rate}%</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <PermissionGuard 
          permissions="finance.reports.view"
          fallback={
            <Card className="opacity-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-center h-16">
                  <Shield className="w-6 h-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          }
        >
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الفواتير المتأخرة</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue_invoices}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>

      {/* تحذيرات للصلاحيات */}
      {!isSuperAdmin && !canManageAccounting && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Shield className="w-5 h-5" />
              <p className="font-medium">
                بعض الميزات محدودة بناءً على دورك الحالي ({
                  isSuperAdmin ? 'مشرف عام' : 
                  isTenantAdmin ? 'مدير مؤسسة' : 
                  'مستخدم عادي'
                })
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* علامات التبويب مع حماية الصلاحيات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          
          <PermissionGuard permissions="system.tenants.manage" hideOnNoAccess>
            <TabsTrigger value="plans">خطط الاشتراك</TabsTrigger>
          </PermissionGuard>
          
          <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
          
          <PermissionGuard permissions="finance.invoices.manage">
            <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          </PermissionGuard>
          
          <PermissionGuard permissions="finance.payments.manage">
            <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          </PermissionGuard>
          
          <PermissionGuard permissions="finance.reports.view">
            <TabsTrigger value="reports">التقارير</TabsTrigger>
          </PermissionGuard>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* إحصائيات تفصيلية */}
            <Card>
              <CardHeader>
                <CardTitle>حالة الاشتراكات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>نشطة</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{stats.active_subscriptions}</Badge>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>تجريبية</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{stats.trial_subscriptions}</Badge>
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ملغاة</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{stats.canceled_subscriptions}</Badge>
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* آخر الأنشطة - محمية بالصلاحيات */}
            <PermissionGuard 
              permissions="finance.reports.view"
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle>آخر الأنشطة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <Shield className="w-8 h-8 mx-auto mb-2" />
                        <p>يتطلب صلاحيات عرض التقارير</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle>آخر الأنشطة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <CreditCard className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">دفعة جديدة</p>
                        <p className="text-xs text-muted-foreground">شركة البشائر - 299 د.ك</p>
                      </div>
                      <span className="text-xs text-muted-foreground">منذ 5 دقائق</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">فاتورة جديدة</p>
                        <p className="text-xs text-muted-foreground">شركة النجاح - 599 د.ك</p>
                      </div>
                      <span className="text-xs text-muted-foreground">منذ ساعة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PermissionGuard>
          </div>
        </TabsContent>

        {/* خطط الاشتراك - للمشرفين العامين فقط */}
        <TabsContent value="plans">
          <AdminOnly 
            level="super"
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4" />
                    <p>إدارة خطط الاشتراك متاحة للمشرفين العامين فقط</p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <SubscriptionPlansTab />
          </AdminOnly>
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionsTab />
        </TabsContent>

        <TabsContent value="invoices">
          <PermissionGuard 
            permissions="finance.invoices.manage"
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4" />
                    <p>يتطلب صلاحيات إدارة الفواتير</p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <InvoicesTab />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="payments">
          <PermissionGuard 
            permissions="finance.payments.manage"
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4" />
                    <p>يتطلب صلاحيات إدارة المدفوعات</p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <PaymentsTab />
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="reports">
          <PermissionGuard 
            permissions="finance.reports.view"
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4" />
                    <p>يتطلب صلاحيات عرض التقارير</p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ReportsTab />
          </PermissionGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingAndSubscriptions;