import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Activity, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Server, 
  Database, 
  Shield, 
  AlertTriangle,
  Settings,
  BarChart3,
  UserCheck,
  CreditCard,
  Globe,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Cloud,
  Lock
} from 'lucide-react';

// واجهة مقاييس النظام
interface SystemMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemUptime: number;
  apiCalls: number;
  dataStorage: number;
  performanceScore: number;
}

// واجهة إحصائيات الخدمات
interface ServiceStats {
  eventBus: {
    totalEvents: number;
    eventsToday: number;
    averageProcessingTime: number;
    errorRate: number;
  };
  apiGateway: {
    requestsPerSecond: number;
    averageResponseTime: number;
    cacheHitRate: number;
    activeConnections: number;
  };
  auth: {
    activeUsers: number;
    mfaEnabled: number;
    suspiciousActivities: number;
    securityScore: number;
  };
  tenants: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    churnRate: number;
  };
  data: {
    totalEntities: number;
    syncOperations: number;
    dataQuality: number;
    storageUsage: number;
  };
}

// إحصائيات في الوقت الفعلي
interface RealTimeStats {
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
  errors: number;
  warnings: number;
}

// تنبيهات النظام
interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

const IntegratedAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadRealTimeData, 5000); // تحديث كل 5 ثواني
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // محاكاة تحميل البيانات
      const [metricsData, serviceData, alertsData] = await Promise.all([
        fetchSystemMetrics(),
        fetchServiceStats(),
        fetchSystemAlerts()
      ]);

      setMetrics(metricsData);
      setServiceStats(serviceData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const realTimeData = await fetchRealTimeStats();
      setRealTimeStats(realTimeData);
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  // دوال محاكاة لجلب البيانات
  const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
    return {
      totalTenants: 147,
      activeTenants: 132,
      totalUsers: 2847,
      activeUsers: 1523,
      totalRevenue: 2450000,
      monthlyRevenue: 185000,
      systemUptime: 99.97,
      apiCalls: 1250000,
      dataStorage: 2.4, // TB
      performanceScore: 94.5
    };
  };

  const fetchServiceStats = async (): Promise<ServiceStats> => {
    return {
      eventBus: {
        totalEvents: 25000,
        eventsToday: 1250,
        averageProcessingTime: 45,
        errorRate: 0.02
      },
      apiGateway: {
        requestsPerSecond: 150,
        averageResponseTime: 120,
        cacheHitRate: 0.85,
        activeConnections: 523
      },
      auth: {
        activeUsers: 1523,
        mfaEnabled: 1245,
        suspiciousActivities: 3,
        securityScore: 96.8
      },
      tenants: {
        totalTenants: 147,
        activeTenants: 132,
        trialTenants: 15,
        churnRate: 0.05
      },
      data: {
        totalEntities: 1250000,
        syncOperations: 450,
        dataQuality: 94.2,
        storageUsage: 2.4
      }
    };
  };

  const fetchRealTimeStats = async (): Promise<RealTimeStats> => {
    return {
      systemLoad: Math.random() * 100,
      memoryUsage: 65 + Math.random() * 20,
      diskUsage: 45 + Math.random() * 10,
      networkIO: Math.random() * 100,
      errors: Math.floor(Math.random() * 10),
      warnings: Math.floor(Math.random() * 25)
    };
  };

  const fetchSystemAlerts = async (): Promise<SystemAlert[]> => {
    return [
      {
        id: '1',
        type: 'warning',
        title: 'High Memory Usage',
        message: 'System memory usage is above 80%',
        timestamp: new Date(),
        service: 'system',
        severity: 'medium',
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        title: 'Scheduled Backup Completed',
        message: 'Daily backup completed successfully',
        timestamp: new Date(Date.now() - 3600000),
        service: 'backup',
        severity: 'low',
        resolved: true
      },
      {
        id: '3',
        type: 'error',
        title: 'API Rate Limit Exceeded',
        message: 'Tenant ABC123 exceeded API rate limit',
        timestamp: new Date(Date.now() - 7200000),
        service: 'api-gateway',
        severity: 'high',
        resolved: false
      }
    ];
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم الإدارية المتكاملة</h1>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            النظام نشط
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            آخر تحديث: {new Date().toLocaleTimeString('ar-KW')}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="services">الخدمات</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="tenants">المستأجرين</TabsTrigger>
          <TabsTrigger value="data">البيانات</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* المقاييس الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المستأجرين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalTenants}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.activeTenants} نشط
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.activeUsers} نشط
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.monthlyRevenue.toLocaleString()} د.ك
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% من الشهر الماضي
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مدة تشغيل النظام</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.systemUptime}%</div>
                <p className="text-xs text-muted-foreground">
                  99.95% هذا الشهر
                </p>
              </CardContent>
            </Card>
          </div>

          {/* الإحصائيات في الوقت الفعلي */}
          <Card>
            <CardHeader>
              <CardTitle>الإحصائيات في الوقت الفعلي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">حمولة النظام</span>
                    <span className={`text-sm ${getStatusColor(realTimeStats?.systemLoad || 0, { good: 20, warning: 50 })}`}>
                      {realTimeStats?.systemLoad?.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={realTimeStats?.systemLoad || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">استخدام الذاكرة</span>
                    <span className={`text-sm ${getStatusColor(100 - (realTimeStats?.memoryUsage || 0), { good: 50, warning: 20 })}`}>
                      {realTimeStats?.memoryUsage?.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={realTimeStats?.memoryUsage || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">استخدام القرص</span>
                    <span className={`text-sm ${getStatusColor(100 - (realTimeStats?.diskUsage || 0), { good: 50, warning: 20 })}`}>
                      {realTimeStats?.diskUsage?.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={realTimeStats?.diskUsage || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">دخل/خرج الشبكة</span>
                    <span className="text-sm text-blue-600">
                      {realTimeStats?.networkIO?.toFixed(1)} MB/s
                    </span>
                  </div>
                  <Progress value={realTimeStats?.networkIO || 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الرسوم البيانية */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الإيرادات الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { month: 'يناير', revenue: 145000, growth: 5 },
                    { month: 'فبراير', revenue: 152000, growth: 8 },
                    { month: 'مارس', revenue: 168000, growth: 12 },
                    { month: 'أبريل', revenue: 175000, growth: 15 },
                    { month: 'مايو', revenue: 182000, growth: 18 },
                    { month: 'يونيو', revenue: 185000, growth: 20 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع المستأجرين</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'مستأجرين نشطين', value: 132, color: '#10b981' },
                        { name: 'مستأجرين تجريبيين', value: 15, color: '#f59e0b' },
                        { name: 'مستأجرين معلقين', value: 8, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'مستأجرين نشطين', value: 132, color: '#10b981' },
                        { name: 'مستأجرين تجريبيين', value: 15, color: '#f59e0b' },
                        { name: 'مستأجرين معلقين', value: 8, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Event Bus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Event Bus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>إجمالي الأحداث</span>
                  <span className="font-bold">{serviceStats?.eventBus.totalEvents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>أحداث اليوم</span>
                  <span className="font-bold">{serviceStats?.eventBus.eventsToday.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط المعالجة</span>
                  <span className="font-bold">{serviceStats?.eventBus.averageProcessingTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>معدل الخطأ</span>
                  <span className={`font-bold ${serviceStats?.eventBus.errorRate! < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                    {(serviceStats?.eventBus.errorRate! * 100).toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* API Gateway */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  API Gateway
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>طلبات/ثانية</span>
                  <span className="font-bold">{serviceStats?.apiGateway.requestsPerSecond}</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط الاستجابة</span>
                  <span className="font-bold">{serviceStats?.apiGateway.averageResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>معدل التخزين المؤقت</span>
                  <span className="font-bold">{(serviceStats?.apiGateway.cacheHitRate! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>الاتصالات النشطة</span>
                  <span className="font-bold">{serviceStats?.apiGateway.activeConnections}</span>
                </div>
              </CardContent>
            </Card>

            {/* Auth Service */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  خدمة المصادقة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>المستخدمون النشطون</span>
                  <span className="font-bold">{serviceStats?.auth.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>MFA مفعل</span>
                  <span className="font-bold">{serviceStats?.auth.mfaEnabled}</span>
                </div>
                <div className="flex justify-between">
                  <span>الأنشطة المشبوهة</span>
                  <span className={`font-bold ${serviceStats?.auth.suspiciousActivities! > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {serviceStats?.auth.suspiciousActivities}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>نقاط الأمان</span>
                  <span className="font-bold text-green-600">{serviceStats?.auth.securityScore.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء النظام</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { time: '00:00', cpu: 25, memory: 65, disk: 45 },
                    { time: '04:00', cpu: 20, memory: 62, disk: 46 },
                    { time: '08:00', cpu: 45, memory: 70, disk: 48 },
                    { time: '12:00', cpu: 60, memory: 75, disk: 50 },
                    { time: '16:00', cpu: 55, memory: 78, disk: 52 },
                    { time: '20:00', cpu: 40, memory: 72, disk: 51 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="disk" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>استجابة API</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { endpoint: '/api/auth', responseTime: 120, requests: 1500 },
                    { endpoint: '/api/customers', responseTime: 85, requests: 2300 },
                    { endpoint: '/api/contracts', responseTime: 95, requests: 1800 },
                    { endpoint: '/api/vehicles', responseTime: 75, requests: 1200 },
                    { endpoint: '/api/reports', responseTime: 250, requests: 800 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="endpoint" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="responseTime" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  حالة الأمان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>نقاط الأمان الإجمالية</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {serviceStats?.auth.securityScore.toFixed(1)}
                    </Badge>
                  </div>
                  <Progress value={serviceStats?.auth.securityScore || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  التهديدات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>محاولات دخول فاشلة</span>
                    <span className="font-bold text-red-600">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>أنشطة مشبوهة</span>
                    <span className="font-bold text-yellow-600">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حسابات معلقة</span>
                    <span className="font-bold text-orange-600">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  المصادقة المتعددة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>المستخدمون مع MFA</span>
                    <span className="font-bold">{serviceStats?.auth.mfaEnabled}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {((serviceStats?.auth.mfaEnabled || 0) / (serviceStats?.auth.activeUsers || 1) * 100).toFixed(1)}% من المستخدمين النشطين
                  </div>
                  <Progress value={((serviceStats?.auth.mfaEnabled || 0) / (serviceStats?.auth.activeUsers || 1) * 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إجمالي المستأجرين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{serviceStats?.tenants.totalTenants}</div>
                <div className="text-sm text-gray-600">+5 هذا الشهر</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المستأجرين النشطين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{serviceStats?.tenants.activeTenants}</div>
                <div className="text-sm text-gray-600">
                  {((serviceStats?.tenants.activeTenants || 0) / (serviceStats?.tenants.totalTenants || 1) * 100).toFixed(1)}% من الإجمالي
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المستأجرين التجريبيين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{serviceStats?.tenants.trialTenants}</div>
                <div className="text-sm text-gray-600">انتهاء خلال 30 يوم</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معدل الانقطاع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {(serviceStats?.tenants.churnRate! * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">آخر 30 يوم</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  إجمالي البيانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{serviceStats?.data.totalEntities.toLocaleString()}</div>
                <div className="text-sm text-gray-600">سجل بيانات</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>عمليات المزامنة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{serviceStats?.data.syncOperations}</div>
                <div className="text-sm text-gray-600">آخر 24 ساعة</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>جودة البيانات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{serviceStats?.data.dataQuality.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">معدل الجودة</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>استخدام التخزين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{serviceStats?.data.storageUsage.toFixed(1)} TB</div>
                <div className="text-sm text-gray-600">من أصل 10 TB</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={`${alert.type === 'error' ? 'border-red-200' : 
                alert.type === 'warning' ? 'border-yellow-200' : 'border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{alert.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {alert.service}
                        </Badge>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                    <AlertDescription className="mt-1">
                      {alert.message}
                    </AlertDescription>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{alert.timestamp.toLocaleString('ar-KW')}</span>
                      {alert.resolved ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          تم الحل
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="h-6">
                          حل
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedAdminDashboard; 