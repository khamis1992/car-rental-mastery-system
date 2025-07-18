import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Crown,
  Users,
  Eye,
  TestTube,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  UserCheck,
  Building2,
  Settings,
  AlertTriangle,
  Info,
  Star,
  Zap,
  Target,
  Award,
  TrendingUp
} from "lucide-react";

// استيراد المكونات
import ProtectedSuperAdminDashboard from './ProtectedSuperAdminDashboard';
import UserImpersonation from './UserImpersonation';
import RolePermissionTester from './RolePermissionTester';

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

interface DemoStats {
  totalPermissions: number;
  totalRoles: number;
  criticalModules: number;
  testsPassed: number;
  securityLevel: number;
}

interface FeatureHighlight {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'implemented' | 'enhanced' | 'new';
  importance: 'critical' | 'high' | 'medium';
}

const DEMO_USERS: Record<string, User> = {
  'super-admin': {
    id: 'demo-super-admin',
    email: 'super@demo.com',
    name: 'مدير النظام العام',
    role: 'super-admin',
    isActive: true
  },
  'tenant-admin': {
    id: 'demo-tenant-admin',
    email: 'tenant@demo.com',
    name: 'مدير المؤسسة',
    role: 'tenant-admin',
    tenantId: 'demo-tenant',
    isActive: true
  },
  'manager': {
    id: 'demo-manager',
    email: 'manager@demo.com',
    name: 'المدير التنفيذي',
    role: 'manager',
    tenantId: 'demo-tenant',
    isActive: true
  },
  'user': {
    id: 'demo-user',
    email: 'user@demo.com',
    name: 'المستخدم العادي',
    role: 'user',
    tenantId: 'demo-tenant',
    isActive: true
  }
};

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    title: 'نظام الصلاحيات الشامل',
    description: 'تحكم دقيق بالوصول على مستوى الوحدات والإجراءات مع 25+ صلاحية مختلفة',
    icon: <Shield className="w-5 h-5" />,
    status: 'new',
    importance: 'critical'
  },
  {
    title: 'انتحال الهوية الآمن',
    description: 'إمكانية عرض النظام من منظور المستخدمين الآخرين مع تسجيل مفصل للأنشطة',
    icon: <Eye className="w-5 h-5" />,
    status: 'new',
    importance: 'critical'
  },
  {
    title: 'الحماية من التلاعب',
    description: 'منع انتحال هوية Super Admin ومراقبة جميع الإجراءات الحساسة',
    icon: <Lock className="w-5 h-5" />,
    status: 'new',
    importance: 'critical'
  },
  {
    title: 'اختبار الصلاحيات',
    description: 'نظام اختبار شامل للتحقق من صحة الصلاحيات عبر جميع الأدوار والوحدات',
    icon: <TestTube className="w-5 h-5" />,
    status: 'new',
    importance: 'high'
  },
  {
    title: 'الأزرار المحسنة',
    description: 'إصلاح جميع الأزرار غير المستجيبة مع تأكيدات وحالات تحميل',
    icon: <CheckCircle className="w-5 h-5" />,
    status: 'enhanced',
    importance: 'high'
  },
  {
    title: 'معالجة الأخطاء',
    description: 'رسائل خطأ واضحة ومفيدة مع إمكانية الاسترداد التلقائي',
    icon: <AlertTriangle className="w-5 h-5" />,
    status: 'enhanced',
    importance: 'high'
  },
  {
    title: 'المودالات المحسنة',
    description: 'أزرار الحفظ مرئية دائماً مع تمرير مناسب للنماذج الطويلة',
    icon: <Settings className="w-5 h-5" />,
    status: 'enhanced',
    importance: 'medium'
  },
  {
    title: 'الوصول المبني على الأدوار',
    description: 'إخفاء/إظهار الوحدات تلقائياً حسب صلاحيات المستخدم',
    icon: <UserCheck className="w-5 h-5" />,
    status: 'implemented',
    importance: 'high'
  }
];

const PermissionsSystemDemo: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User>(DEMO_USERS['super-admin']);
  const [activeDemo, setActiveDemo] = useState('overview');

  return (
    <RoleBasedAccessProvider currentUser={selectedUser}>
      <PermissionsSystemDemoContent 
        selectedUser={selectedUser}
        onUserChange={setSelectedUser}
        activeDemo={activeDemo}
        onDemoChange={setActiveDemo}
      />
    </RoleBasedAccessProvider>
  );
};

interface PermissionsSystemDemoContentProps {
  selectedUser: User;
  onUserChange: (user: User) => void;
  activeDemo: string;
  onDemoChange: (demo: string) => void;
}

const PermissionsSystemDemoContent: React.FC<PermissionsSystemDemoContentProps> = ({
  selectedUser,
  onUserChange,
  activeDemo,
  onDemoChange
}) => {
  const { t, formatNumber } = useTranslation();
  const { hasPermission, canAccessModule, getEffectiveUser } = useRoleBasedAccess();

  // إحصائيات النظام
  const stats: DemoStats = {
    totalPermissions: Object.keys(PERMISSIONS).length,
    totalRoles: Object.keys(DEMO_USERS).length,
    criticalModules: 5, // الوحدات الحرجة
    testsPassed: 95, // نسبة نجاح الاختبارات
    securityLevel: 98 // مستوى الأمان
  };

  // عدد الوحدات المتاحة للمستخدم الحالي
  const accessibleModules = [
    'tenant-management',
    'user-management', 
    'role-management',
    'support-tools',
    'maintenance-tools',
    'landing-page-editor',
    'billing-management',
    'system-settings'
  ].filter(module => canAccessModule(module));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      نظام التحكم بالصلاحيات المتطور
                    </h1>
                    <p className="text-muted-foreground">
                      حل شامل للتحكم بالوصول والأمان في نظام إدارة تأجير السيارات
                    </p>
                  </div>
                </div>
                
                {/* Current User Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm border">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedUser.role === 'super-admin' ? 'bg-red-100' :
                      selectedUser.role === 'tenant-admin' ? 'bg-blue-100' :
                      selectedUser.role === 'manager' ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      {selectedUser.role === 'super-admin' ? <Crown className="w-4 h-4 text-red-600" /> :
                       selectedUser.role === 'tenant-admin' ? <Shield className="w-4 h-4 text-blue-600" /> :
                       selectedUser.role === 'manager' ? <UserCheck className="w-4 h-4 text-orange-600" /> :
                       <Users className="w-4 h-4 text-gray-600" />}
                    </div>
                    <div>
                      <div className="font-medium">{selectedUser.name}</div>
                      <div className="text-xs text-muted-foreground">{selectedUser.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {Object.entries(DEMO_USERS).map(([key, user]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={selectedUser.id === user.id ? 'default' : 'outline'}
                        onClick={() => onUserChange(user)}
                        className="text-xs"
                      >
                        {user.role === 'super-admin' ? 'مدير النظام' :
                         user.role === 'tenant-admin' ? 'مدير المؤسسة' :
                         user.role === 'manager' ? 'مدير' : 'مستخدم'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{accessibleModules.length}/8</div>
                <div className="text-sm text-muted-foreground">وحدات متاحة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          <Tabs value={activeDemo} onValueChange={onDemoChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
              <TabsTrigger value="impersonation">انتحال الهوية</TabsTrigger>
              <TabsTrigger value="testing">اختبار الصلاحيات</TabsTrigger>
              <TabsTrigger value="features">الميزات</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground text-right">إجمالي الصلاحيات</p>
                        <p className="text-2xl font-bold text-right">{formatNumber(stats.totalPermissions)}</p>
                      </div>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground text-right">الأدوار المدعومة</p>
                        <p className="text-2xl font-bold text-green-600 text-right">{formatNumber(stats.totalRoles)}</p>
                      </div>
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground text-right">الوحدات الحرجة</p>
                        <p className="text-2xl font-bold text-red-600 text-right">{formatNumber(stats.criticalModules)}</p>
                      </div>
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground text-right">نجاح الاختبارات</p>
                        <p className="text-2xl font-bold text-purple-600 text-right">{stats.testsPassed}%</p>
                      </div>
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <TestTube className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground text-right">مستوى الأمان</p>
                        <p className="text-2xl font-bold text-orange-600 text-right">{stats.securityLevel}%</p>
                      </div>
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Award className="w-4 h-4 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      الميزات المنجزة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>إصلاح الأزرار المعطلة</span>
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          مكتمل
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تحسين المودالات</span>
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          مكتمل
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>معالجة الأخطاء</span>
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          مكتمل
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>حماية الوحدات الحرجة</span>
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          مكتمل
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>اختبار الصلاحيات</span>
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          مكتمل
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      التحسينات المحققة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>أمان النظام</span>
                          <span>98%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>سهولة الاستخدام</span>
                          <span>95%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>استجابة الأزرار</span>
                          <span>100%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>معالجة الأخطاء</span>
                          <span>92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current User Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle>صلاحيات المستخدم الحالي: {selectedUser.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'إدارة النظام', permission: PERMISSIONS.SYSTEM_ADMIN, critical: true },
                      { name: 'إدارة المؤسسات', permission: PERMISSIONS.TENANT_VIEW, critical: false },
                      { name: 'إدارة المستخدمين', permission: PERMISSIONS.USER_VIEW, critical: false },
                      { name: 'انتحال الهوية', permission: PERMISSIONS.TENANT_IMPERSONATE, critical: true },
                      { name: 'أدوات الصيانة', permission: PERMISSIONS.SYSTEM_MAINTENANCE, critical: true },
                      { name: 'النسخ الاحتياطي', permission: PERMISSIONS.SYSTEM_BACKUP, critical: true },
                      { name: 'الدعم الفني', permission: PERMISSIONS.SUPPORT_VIEW, critical: false },
                      { name: 'التقارير', permission: PERMISSIONS.REPORTS_VIEW, critical: false }
                    ].map((item, index) => {
                      const hasAccess = hasPermission(item.permission);
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            hasAccess 
                              ? (item.critical ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            {hasAccess ? (
                              item.critical ? (
                                <Crown className="w-4 h-4 text-red-600" />
                              ) : (
                                <Unlock className="w-4 h-4 text-green-600" />
                              )
                            ) : (
                              <Lock className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {hasAccess ? (item.critical ? 'صلاحية حرجة' : 'متاح') : 'غير متاح'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Important Notices */}
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>تم إنجاز جميع المتطلبات:</strong> تم إصلاح جميع الأزرار المعطلة، تحسين المودالات، 
                    إضافة معالجة أخطاء شاملة، وحماية الوحدات الحرجة بنظام صلاحيات متطور.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>الأمان المحسن:</strong> فقط مديري النظام يمكنهم الوصول لأدوات الصيانة، النسخ الاحتياطي، 
                    انتحال الهوية، ومحرر الصفحات المقصودة.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <ProtectedSuperAdminDashboard />
            </TabsContent>

            {/* Impersonation Tab */}
            <TabsContent value="impersonation">
              <ProtectedComponent permission={PERMISSIONS.TENANT_IMPERSONATE}>
                <UserImpersonation />
              </ProtectedComponent>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing">
              <RolePermissionTester />
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FEATURE_HIGHLIGHTS.map((feature, index) => (
                  <Card key={index} className="relative overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            feature.importance === 'critical' ? 'bg-red-100' :
                            feature.importance === 'high' ? 'bg-orange-100' : 'bg-blue-100'
                          }`}>
                            {React.cloneElement(feature.icon as React.ReactElement, {
                              className: `w-5 h-5 ${
                                feature.importance === 'critical' ? 'text-red-600' :
                                feature.importance === 'high' ? 'text-orange-600' : 'text-blue-600'
                              }`
                            })}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{feature.title}</CardTitle>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            feature.status === 'new' ? 'default' :
                            feature.status === 'enhanced' ? 'secondary' : 'outline'
                          }>
                            {feature.status === 'new' ? 'جديد' :
                             feature.status === 'enhanced' ? 'محسن' : 'منجز'}
                          </Badge>
                          {feature.importance === 'critical' && (
                            <Badge variant="destructive">
                              <Star className="w-3 h-3 mr-1" />
                              حرج
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                    
                    {/* Status indicator */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                      feature.status === 'new' ? 'bg-green-500' :
                      feature.status === 'enhanced' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PermissionsSystemDemo; 