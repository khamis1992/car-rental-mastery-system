import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Shield, 
  BarChart3, 
  Database,
  Activity,
  Crown,
  Settings,
  TrendingUp,
  Globe,
  DollarSign,
  CreditCard
} from "lucide-react";
import SuperAdminStats from "@/components/SuperAdmin/SuperAdminStats";
import AdvancedTenantManagement from "@/components/SuperAdmin/AdvancedTenantManagement";
import AdvancedPermissions from "@/components/SuperAdmin/AdvancedPermissions";
import MaintenanceTools from "@/components/SuperAdmin/MaintenanceTools";
import SupportTools from "@/components/SuperAdmin/SupportTools";
import SystemMonitoring from "@/components/SuperAdmin/SystemMonitoring";
import GlobalSettings from "@/components/SuperAdmin/GlobalSettings";
import BillingAndSubscriptions from "@/components/SuperAdmin/BillingAndSubscriptions";
import SadadManagement from "@/components/SuperAdmin/SadadManagement";
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

const SuperAdminDashboard: React.FC = () => {
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
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                لوحة تحكم مدير النظام العام
              </h1>
              <p className="text-muted-foreground">
                إدارة شاملة لجميع المؤسسات والإعدادات العامة
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

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:grid-cols-8">
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              المراقبة
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              الدعم
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              الصيانة
            </TabsTrigger>
            <TabsTrigger value="sadad" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              SADAD
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              الفوترة والاشتراكات
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              الصلاحيات
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              المؤسسات
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              نظرة عامة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-right">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    أداء النظام العام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-right">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">معدل الاستخدام</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">زمن الاستجابة</span>
                      <span className="font-medium">127ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">حالة الخوادم</span>
                      <span className="font-medium text-success">مستقرة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-right">
                    <Database className="w-5 h-5 text-primary" />
                    إحصائيات قاعدة البيانات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-right">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">حجم البيانات</span>
                      <span className="font-medium">2.3 GB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">النسخ الاحتياطية</span>
                      <span className="font-medium text-success">محدثة</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الاتصالات النشطة</span>
                      <span className="font-medium">24</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tenants">
            <AdvancedTenantManagement />
          </TabsContent>

          <TabsContent value="permissions">
            <AdvancedPermissions />
          </TabsContent>

          <TabsContent value="billing">
            <BillingAndSubscriptions />
          </TabsContent>

          <TabsContent value="sadad">
            <SadadManagement />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceTools />
          </TabsContent>

          <TabsContent value="support">
            <SupportTools />
          </TabsContent>

          <TabsContent value="monitoring">
            <SystemMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;