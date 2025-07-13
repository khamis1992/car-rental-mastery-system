import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, Users, Building2, TrendingUp, TrendingDown, 
  Activity, Shield, CreditCard, BarChart3, Settings, 
  Clock, CheckCircle, AlertTriangle, Star, Zap,
  Database, Eye, ArrowUp, ArrowDown, Calendar
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, RadialBarChart, RadialBar
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

// واجهات البيانات
interface FinancialMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  activeSubscriptions: number;
  totalTenants: number;
  systemHealth: number;
  eventBusActivity: number;
}

interface SubscriptionStats {
  starter: number;
  professional: number;
  enterprise: number;
  ultimate: number;
}

interface EventBusMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  avgProcessingTime: number;
}

const NewFinancialDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeSubscriptions: 0,
    totalTenants: 0,
    systemHealth: 0,
    eventBusActivity: 0
  });

  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats>({
    starter: 0,
    professional: 0,
    enterprise: 0,
    ultimate: 0
  });

  const [eventBusMetrics, setEventBusMetrics] = useState<EventBusMetrics>({
    totalEvents: 0,
    processedEvents: 0,
    failedEvents: 0,
    avgProcessingTime: 0
  });

  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // بيانات تجريبية (ستأتي من قاعدة البيانات)
  const revenueData = [
    { month: 'يناير', revenue: 45000, subscriptions: 90, tenants: 45 },
    { month: 'فبراير', revenue: 52000, subscriptions: 104, tenants: 52 },
    { month: 'مارس', revenue: 61000, subscriptions: 122, tenants: 61 },
    { month: 'أبريل', revenue: 58000, subscriptions: 116, tenants: 58 },
    { month: 'مايو', revenue: 67000, subscriptions: 134, tenants: 67 },
    { month: 'يونيو', revenue: 75000, subscriptions: 150, tenants: 75 }
  ];

  const subscriptionDistribution = [
    { name: 'الأساسية', value: 45, amount: 2250, color: '#8884d8' },
    { name: 'المهنية', value: 30, amount: 4500, color: '#82ca9d' },
    { name: 'التجارية', value: 20, amount: 10000, color: '#ffc658' },
    { name: 'الشاملة', value: 5, amount: 5000, color: '#ff7300' }
  ];

  const eventBusData = [
    { hour: '00:00', events: 45, processed: 44, failed: 1 },
    { hour: '04:00', events: 32, processed: 32, failed: 0 },
    { hour: '08:00', events: 78, processed: 76, failed: 2 },
    { hour: '12:00', events: 95, processed: 93, failed: 2 },
    { hour: '16:00', events: 87, processed: 85, failed: 2 },
    { hour: '20:00', events: 65, processed: 64, failed: 1 }
  ];

  const systemHealth = [
    { component: 'Database', status: 99.9, events: 15420 },
    { component: 'API Gateway', status: 99.7, events: 8930 },
    { component: 'Event Bus', status: 99.8, events: 12340 },
    { component: 'CRM System', status: 99.5, events: 5670 },
    { component: 'Billing', status: 99.9, events: 3450 }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // محاكاة تحميل البيانات من قاعدة البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        totalRevenue: 358000,
        monthlyGrowth: 12.5,
        activeSubscriptions: 150,
        totalTenants: 75,
        systemHealth: 99.7,
        eventBusActivity: 8930
      });

      setSubscriptionStats({
        starter: 45,
        professional: 30,
        enterprise: 20,
        ultimate: 5
      });

      setEventBusMetrics({
        totalEvents: 15420,
        processedEvents: 15398,
        failedEvents: 22,
        avgProcessingTime: 125
      });

    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات النظام المالي',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
    toast({
      title: 'تم التحديث',
      description: 'تم تحديث بيانات النظام المالي',
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل النظام المالي الجديد...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
            <DollarSign className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              النظام المالي المتكامل الجديد
            </h1>
            <p className="text-muted-foreground">
              لوحة تحكم شاملة للنظام المالي المتطور مع 145 جدول و 408 فهرس
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-4 h-4 ml-1" />
            النظام جاهز
          </Badge>
          <Button onClick={refreshData} variant="outline">
            <Activity className="w-4 h-4 ml-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRevenue.toLocaleString()} د.ك</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-500 ml-1" />
              +{metrics.monthlyGrowth}% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
            <div className="text-xs text-muted-foreground">
              عبر 4 خطط اشتراك مختلفة
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستأجرون النشطون</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTenants}</div>
            <div className="text-xs text-muted-foreground">
              مؤسسة مختلفة تستخدم النظام
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صحة النظام</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.systemHealth}%</div>
            <div className="text-xs text-muted-foreground">
              جميع المكونات تعمل بكفاءة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
          <TabsTrigger value="events">Event Bus</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  نمو الإيرادات الشهرية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8884d8" />
                    <Line type="monotone" dataKey="tenants" stroke="#ff7300" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subscription Distribution */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  توزيع خطط الاشتراك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {subscriptionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                حالة مكونات النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((component) => (
                  <div key={component.component} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">{component.component}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {component.events.toLocaleString()} حدث
                      </span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {component.status}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-lg">الخطة الأساسية</CardTitle>
                <p className="text-2xl font-bold text-blue-600">50 د.ك</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المستخدمون:</span>
                    <span className="font-medium">{subscriptionStats.starter}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    10 مركبات، 5 مستخدمين، 100 عقد
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-lg">الخطة المهنية</CardTitle>
                <p className="text-2xl font-bold text-green-600">150 د.ك</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المستخدمون:</span>
                    <span className="font-medium">{subscriptionStats.professional}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    50 مركبة، 15 مستخدم، 500 عقد
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-lg">الخطة التجارية</CardTitle>
                <p className="text-2xl font-bold text-orange-600">500 د.ك</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المستخدمون:</span>
                    <span className="font-medium">{subscriptionStats.enterprise}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    غير محدود، دعم 24/7
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-lg">الخطة الشاملة</CardTitle>
                <p className="text-2xl font-bold text-purple-600">1000 د.ك</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المستخدمون:</span>
                    <span className="font-medium">{subscriptionStats.ultimate}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ذكاء اصطناعي، علامة بيضاء
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Event Bus Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-sm">إجمالي الأحداث</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{eventBusMetrics.totalEvents.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-sm">الأحداث المعالجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{eventBusMetrics.processedEvents.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-sm">الأحداث الفاشلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{eventBusMetrics.failedEvents}</div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-sm">متوسط المعالجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{eventBusMetrics.avgProcessingTime}ms</div>
              </CardContent>
            </Card>
          </div>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                نشاط Event Bus خلال اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={eventBusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="events" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="processed" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="failed" stackId="3" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>الإحصائيات الرئيسية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>عدد الجداول:</span>
                    <Badge variant="outline">145</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>عدد الفهارس:</span>
                    <Badge variant="outline">408</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>عدد المشغلات:</span>
                    <Badge variant="outline">87</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>عدد القيود:</span>
                    <Badge variant="outline">1360</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>الميزات المفعلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    'نظام الأدوار والأذونات المتقدم',
                    'Event Bus للأحداث المالية',
                    'API Gateway المتقدم',
                    'نظام إدارة المستأجرين',
                    'نظام CRM المتطور',
                    'النظام المالي الشامل',
                    'النظام الأمني المتقدم'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              النظام الأمني المتقدم يعمل بكفاءة عالية مع مراقبة شاملة لجميع العمليات
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-sm">الأدوار المفعلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <div className="text-xs text-muted-foreground">أدوار متخصصة</div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-sm">الأذونات المتاحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32</div>
                <div className="text-xs text-muted-foreground">إذن متخصص</div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="text-sm">الجلسات النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <div className="text-xs text-muted-foreground">جلسة مستخدم</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewFinancialDashboard; 