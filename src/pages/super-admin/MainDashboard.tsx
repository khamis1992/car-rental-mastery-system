import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Database,
  TrendingUp,
  Globe,
  Crown,
  RefreshCw,
  Shield,
  Server
} from "lucide-react";
import SuperAdminStats from "@/components/SuperAdmin/SuperAdminStats";
import { useSubscriptionRevenue } from "@/hooks/useSubscriptionRevenue";
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';

const MainDashboard: React.FC = () => {
  const { currentUserRole } = useTenant();
  const { user } = useAuth();
  const { data: revenueData, isLoading: revenueLoading } = useSubscriptionRevenue();
  const { data: systemStats, isLoading: statsLoading } = useSuperAdminStats();

  // التحقق من صلاحيات الوصول
  if (currentUserRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">غير مصرح بالوصول</h3>
            <p className="text-muted-foreground text-center">
              تحتاج إلى صلاحيات مدير النظام العام للوصول إلى هذه الصفحة
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
              <BarChart3 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                لوحة التحكم الرئيسية
              </h1>
              <p className="text-muted-foreground">
                نظرة عامة شاملة على أداء النظام والإحصائيات الرئيسية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground text-right">
            <Globe className="w-4 h-4" />
            <span>النظام العام</span>
          </div>
        </div>

        {/* Statistics Overview */}
        <SuperAdminStats />

        {/* Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Server className="w-5 h-5 text-primary" />
                أداء النظام العام
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">معدل الأداء</span>
                    <span className="font-medium">{systemStats?.systemPerformance || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">حجم البيانات</span>
                    <span className="font-medium">{systemStats?.dataSize || "0 GB"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">حالة الأمان</span>
                    <span className={`font-medium ${systemStats?.securityStatus === 'آمن' ? 'text-success' : 'text-warning'}`}>
                      {systemStats?.securityStatus || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">المناطق النشطة</span>
                    <span className="font-medium">{systemStats?.activeRegions || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right flex-row-reverse justify-end">
                <Database className="w-5 h-5 text-primary" />
                إحصائيات النشاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">إجمالي المؤسسات</span>
                    <span className="font-medium">{systemStats?.totalTenants || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">إجمالي المستخدمين</span>
                    <span className="font-medium">{systemStats?.totalUsers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">المعاملات النشطة</span>
                    <span className="font-medium">{systemStats?.activeTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">نمو المؤسسات</span>
                    <span className="font-medium text-success">{systemStats?.tenantGrowth || "0 هذا الشهر"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <TrendingUp className="w-5 h-5 text-primary" />
                إيرادات الاشتراكات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">هذا الشهر</span>
                    <span className="font-medium text-success">
                      {revenueData?.currentMonth?.toFixed(3) || "0.000"} د.ك
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الشهر السابق</span>
                    <span className="font-medium">
                      {revenueData?.previousMonth?.toFixed(3) || "0.000"} د.ك
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">معدل النمو</span>
                    <span className={`font-medium ${revenueData?.growthPercentage && revenueData.growthPercentage > 0 ? 'text-success' : revenueData?.growthPercentage && revenueData.growthPercentage < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {revenueData?.growth || "لا توجد بيانات"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">إجمالي الإيرادات</span>
                    <span className="font-medium">
                      {systemStats?.totalRevenue?.toFixed(3) || "0.000"} د.ك
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Crown className="w-5 h-5 text-primary" />
                نشاط المطورين
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">نمو المستخدمين</span>
                    <span className="font-medium text-success">{systemStats?.userGrowth || "0% نمو"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">نمو المعاملات</span>
                    <span className="font-medium">{systemStats?.transactionGrowth || "0% اليوم"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Shield className="w-5 h-5 text-primary" />
                حالة الأنظمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">خدمات الويب</span>
                    <span className="font-medium text-success">متاحة</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">قاعدة البيانات</span>
                    <span className="font-medium text-success">متاحة</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">حالة الأمان</span>
                    <span className={`font-medium ${systemStats?.securityStatus === 'آمن' ? 'text-success' : 'text-warning'}`}>
                      {systemStats?.securityStatus || "غير محدد"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">نمو الإيرادات</span>
                    <span className="font-medium text-success">{systemStats?.revenueGrowth || "0% هذا الشهر"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard; 