import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Shield,
  Users,
  Building2,
  Settings,
  Database,
  HeadphonesIcon,
  Layout,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  LogOut,
  Bell,
  RefreshCw,
  BarChart3,
  FileText,
  Zap,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// استيراد المكونات
import AdvancedTenantManagement from './AdvancedTenantManagement';
import AdvancedPermissions from './AdvancedPermissions';
import SupportTools from './SupportTools';
import MaintenanceTools from './MaintenanceTools';
import LandingPageEditor from './LandingPageEditor';
import UserImpersonation from './UserImpersonation';

// استيراد المكونات المحسنة ونظام الصلاحيات
import { ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation } from '@/utils/translationUtils';
import { 
  RoleBasedAccessProvider, 
  useRoleBasedAccess, 
  ProtectedComponent,
  PERMISSIONS,
  User 
} from '@/hooks/useRoleBasedAccess';

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  requiredPermissions: string[];
  isCritical?: boolean;
}

interface DashboardStats {
  totalTenants: number;
  activeUsers: number;
  openTickets: number;
  systemHealth: number;
  todayRevenue: number;
  pendingTasks: number;
}

const ProtectedSuperAdminDashboard: React.FC = () => {
  // محاكاة المستخدم الحالي - في التطبيق الحقيقي، سيأتي من نظام المصادقة
  const [currentUser] = useState<User>({
    id: 'admin-1',
    email: 'admin@system.com',
    name: 'مدير النظام الرئيسي',
    role: 'super-admin',
    isActive: true,
    permissions: Object.values(PERMISSIONS) // Super Admin له جميع الصلاحيات
  });

  return (
    <RoleBasedAccessProvider currentUser={currentUser}>
      <SuperAdminDashboardContent />
    </RoleBasedAccessProvider>
  );
};

const SuperAdminDashboardContent: React.FC = () => {
  const { toast } = useToast();
  const { t, formatNumber } = useTranslation();
  const {
    currentUser,
    impersonatedUser,
    isImpersonating,
    hasPermission,
    canAccessModule,
    stopImpersonation,
    getEffectiveUser
  } = useRoleBasedAccess();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      // محاكاة تحميل الإحصائيات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalTenants: 45,
        activeUsers: 1237,
        openTickets: 23,
        systemHealth: 98,
        todayRevenue: 15450,
        pendingTasks: 8
      });
    } catch (error) {
      toast({
        title: 'خطأ في تحميل الإحصائيات',
        description: 'حدث خطأ أثناء تحميل بيانات لوحة التحكم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // تعريف الوحدات مع صلاحياتها المطلوبة
  const dashboardModules: DashboardModule[] = [
    {
      id: 'tenant-management',
      title: 'إدارة المؤسسات',
      description: 'إدارة المؤسسات المشتركة وإعداداتها',
      icon: <Building2 className="w-5 h-5" />,
      component: AdvancedTenantManagement,
      requiredPermissions: [PERMISSIONS.TENANT_VIEW],
      isCritical: true
    },
    {
      id: 'user-impersonation',
      title: 'انتحال هوية المستخدمين',
      description: 'عرض النظام من منظور المستخدمين الآخرين',
      icon: <Eye className="w-5 h-5" />,
      component: UserImpersonation,
      requiredPermissions: [PERMISSIONS.TENANT_IMPERSONATE],
      isCritical: true
    },
    {
      id: 'permissions',
      title: 'إدارة الصلاحيات',
      description: 'إدارة الأدوار وصلاحيات المستخدمين',
      icon: <Shield className="w-5 h-5" />,
      component: AdvancedPermissions,
      requiredPermissions: [PERMISSIONS.ROLE_VIEW],
      isCritical: true
    },
    {
      id: 'support-tools',
      title: 'أدوات الدعم الفني',
      description: 'إدارة طلبات الدعم والإشعارات',
      icon: <HeadphonesIcon className="w-5 h-5" />,
      component: SupportTools,
      requiredPermissions: [PERMISSIONS.SUPPORT_ADMIN]
    },
    {
      id: 'maintenance-tools',
      title: 'أدوات الصيانة',
      description: 'إدارة مهام الصيانة ومراقبة النظام',
      icon: <Database className="w-5 h-5" />,
      component: MaintenanceTools,
      requiredPermissions: [PERMISSIONS.SYSTEM_MAINTENANCE],
      isCritical: true
    },
    {
      id: 'landing-editor',
      title: 'محرر الصفحات المقصودة',
      description: 'إنشاء وتحرير الصفحات المقصودة',
      icon: <Layout className="w-5 h-5" />,
      component: LandingPageEditor,
      requiredPermissions: [PERMISSIONS.LANDING_EDIT],
      isCritical: true
    }
  ];

  // فلترة الوحدات حسب الصلاحيات
  const accessibleModules = dashboardModules.filter(module =>
    module.requiredPermissions.some(permission => hasPermission(permission))
  );

  const effectiveUser = getEffectiveUser();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">لوحة تحكم مدير النظام</h1>
                    <p className="text-sm text-muted-foreground">
                      إدارة شاملة لنظام تأجير السيارات
                    </p>
                  </div>
                </div>
                
                {/* Current User Info */}
                <div className="flex items-center gap-3 mr-8">
                  <div className="text-right">
                    <div className="text-sm font-medium">{effectiveUser?.name}</div>
                    <div className="text-xs text-muted-foreground">{effectiveUser?.role}</div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    effectiveUser?.role === 'super-admin' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {effectiveUser?.role === 'super-admin' ? 
                      <Crown className="w-4 h-4 text-red-600" /> : 
                      <Shield className="w-4 h-4 text-blue-600" />
                    }
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Impersonation Status */}
                {isImpersonating && impersonatedUser && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 rounded-lg border border-yellow-200">
                    <EyeOff className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      منتحل هوية: {impersonatedUser.name}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={stopImpersonation}
                      className="h-6 px-2 text-xs border-yellow-300 text-yellow-700"
                    >
                      <LogOut className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadDashboardStats}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-auto">
              <TabsTrigger value="overview">النظرة العامة</TabsTrigger>
              {accessibleModules.map(module => (
                <TabsTrigger key={module.id} value={module.id}>
                  <div className="flex items-center gap-2">
                    {module.icon}
                    {module.title}
                    {module.isCritical && (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <ProtectedComponent permission={PERMISSIONS.TENANT_VIEW}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground text-right">المؤسسات</p>
                            <p className="text-2xl font-bold text-right">{formatNumber(stats.totalTenants)}</p>
                          </div>
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ProtectedComponent>

                  <ProtectedComponent permission={PERMISSIONS.USER_VIEW}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground text-right">المستخدمين النشطين</p>
                            <p className="text-2xl font-bold text-green-600 text-right">{formatNumber(stats.activeUsers)}</p>
                          </div>
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ProtectedComponent>

                  <ProtectedComponent permission={PERMISSIONS.SUPPORT_VIEW}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground text-right">طلبات الدعم</p>
                            <p className="text-2xl font-bold text-orange-600 text-right">{formatNumber(stats.openTickets)}</p>
                          </div>
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <HeadphonesIcon className="w-4 h-4 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ProtectedComponent>

                  <ProtectedComponent permission={PERMISSIONS.SYSTEM_ADMIN}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground text-right">صحة النظام</p>
                            <p className="text-2xl font-bold text-green-600 text-right">{stats.systemHealth}%</p>
                          </div>
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Activity className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ProtectedComponent>

                  <ProtectedComponent permission={PERMISSIONS.BILLING_VIEW}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground text-right">إيرادات اليوم</p>
                            <p className="text-2xl font-bold text-purple-600 text-right">{formatNumber(stats.todayRevenue)} ر.س</p>
                          </div>
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ProtectedComponent>

                  <ProtectedComponent permission={PERMISSIONS.SYSTEM_MAINTENANCE}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground text-right">مهام معلقة</p>
                            <p className="text-2xl font-bold text-red-600 text-right">{formatNumber(stats.pendingTasks)}</p>
                          </div>
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ProtectedComponent>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accessibleModules.slice(0, 6).map(module => (
                  <ProtectedComponent
                    key={module.id}
                    permissions={module.requiredPermissions}
                  >
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            module.isCritical ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {React.cloneElement(module.icon as React.ReactElement, {
                              className: `w-6 h-6 ${module.isCritical ? 'text-red-600' : 'text-blue-600'}`
                            })}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{module.title}</h3>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                            {module.isCritical && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                وصول محدود
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ProtectedComponent>
                ))}
              </div>

              {/* System Status */}
              <ProtectedComponent permission={PERMISSIONS.SYSTEM_ADMIN}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>حالة النظام</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>خادم التطبيق</span>
                          <Badge variant="default">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            يعمل بشكل طبيعي
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>قاعدة البيانات</span>
                          <Badge variant="default">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            متصلة
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>خدمات خارجية</span>
                          <Badge variant="secondary">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            تحقق مطلوب
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>الأنشطة الأخيرة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm">تسجيل مؤسسة جديدة</p>
                            <p className="text-xs text-muted-foreground">منذ 5 دقائق</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm">تحديث صلاحيات المستخدم</p>
                            <p className="text-xs text-muted-foreground">منذ 15 دقيقة</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm">طلب دعم فني جديد</p>
                            <p className="text-xs text-muted-foreground">منذ 30 دقيقة</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ProtectedComponent>
            </TabsContent>

            {/* Module Tabs */}
            {accessibleModules.map(module => (
              <TabsContent key={module.id} value={module.id}>
                <ProtectedComponent
                  permissions={module.requiredPermissions}
                  fallback={
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">ليس لديك صلاحية</h3>
                        <p className="text-muted-foreground">
                          أنت بحاجة لصلاحيات خاصة للوصول إلى هذه الوحدة
                        </p>
                      </CardContent>
                    </Card>
                  }
                >
                  <module.component />
                </ProtectedComponent>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProtectedSuperAdminDashboard; 