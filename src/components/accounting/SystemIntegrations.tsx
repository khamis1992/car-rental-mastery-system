import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Link, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Zap, 
  Database, 
  Cloud, 
  Smartphone,
  Globe,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Clock,
  Activity
} from "lucide-react";
import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  type: 'bank' | 'erp' | 'government' | 'payment' | 'api';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  syncFrequency: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  settings?: any;
  dataTypes: string[];
  syncStats: {
    total: number;
    successful: number;
    failed: number;
  };
}

interface SyncActivity {
  id: string;
  integrationName: string;
  type: 'sync' | 'error' | 'warning' | 'success';
  message: string;
  timestamp: string;
  details?: any;
}

export const SystemIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'بنك الكويت الوطني',
      type: 'bank',
      status: 'connected',
      lastSync: '2024-01-15 14:30',
      syncFrequency: 'كل ساعة',
      description: 'ربط مباشر مع API البنك لاستيراد كشوف الحساب والمعاملات المالية',
      icon: '🏦',
      isEnabled: true,
      dataTypes: ['كشوف الحساب', 'المعاملات', 'الأرصدة'],
      syncStats: { total: 1250, successful: 1245, failed: 5 }
    },
    {
      id: '2',
      name: 'بنك الخليج',
      type: 'bank',
      status: 'connected',
      lastSync: '2024-01-15 14:15',
      syncFrequency: 'كل ساعة',
      description: 'تكامل مع نظام البنك لاستيراد البيانات المصرفية',
      icon: '🏛️',
      isEnabled: true,
      dataTypes: ['كشوف الحساب', 'المعاملات'],
      syncStats: { total: 850, successful: 848, failed: 2 }
    },
    {
      id: '3',
      name: 'هيئة الزكاة والضريبة',
      type: 'government',
      status: 'connected',
      lastSync: '2024-01-15 12:00',
      syncFrequency: 'يومياً',
      description: 'تكامل مع نظام ZATCA لتقديم الإقرارات الضريبية والفواتير الإلكترونية',
      icon: '🏛️',
      isEnabled: true,
      dataTypes: ['الفواتير الإلكترونية', 'الإقرارات الضريبية'],
      syncStats: { total: 125, successful: 120, failed: 5 }
    },
    {
      id: '4',
      name: 'SAP ERP',
      type: 'erp',
      status: 'syncing',
      lastSync: '2024-01-15 13:45',
      syncFrequency: 'كل 4 ساعات',
      description: 'تكامل مع نظام SAP لتبادل البيانات المحاسبية والمالية',
      icon: '💼',
      isEnabled: true,
      dataTypes: ['القيود المحاسبية', 'الفواتير', 'أوامر الشراء'],
      syncStats: { total: 2450, successful: 2440, failed: 10 }
    },
    {
      id: '5',
      name: 'K-Net',
      type: 'payment',
      status: 'error',
      lastSync: '2024-01-15 10:30',
      syncFrequency: 'فوري',
      description: 'تكامل مع بوابة الدفع الكويتية لمعالجة المدفوعات الإلكترونية',
      icon: '💳',
      isEnabled: false,
      dataTypes: ['المدفوعات', 'المرتجعات'],
      syncStats: { total: 340, successful: 320, failed: 20 }
    },
    {
      id: '6',
      name: 'Microsoft Dynamics',
      type: 'erp',
      status: 'disconnected',
      lastSync: '2024-01-10 16:20',
      syncFrequency: 'يومياً',
      description: 'تكامل مع نظام Microsoft Dynamics للمحاسبة والإدارة المالية',
      icon: '🔗',
      isEnabled: false,
      dataTypes: ['البيانات المالية', 'تقارير الأداء'],
      syncStats: { total: 0, successful: 0, failed: 0 }
    }
  ]);

  const [syncActivities] = useState<SyncActivity[]>([
    {
      id: '1',
      integrationName: 'بنك الكويت الوطني',
      type: 'success',
      message: 'تم استيراد 45 معاملة جديدة بنجاح',
      timestamp: '2024-01-15 14:30:22'
    },
    {
      id: '2',
      integrationName: 'هيئة الزكاة والضريبة',
      type: 'success',
      message: 'تم إرسال الفواتير الإلكترونية - 12 فاتورة',
      timestamp: '2024-01-15 14:15:18'
    },
    {
      id: '3',
      integrationName: 'K-Net',
      type: 'error',
      message: 'فشل في الاتصال - انتهت صلاحية الشهادة',
      timestamp: '2024-01-15 14:10:45',
      details: 'SSL Certificate expired. Needs renewal.'
    },
    {
      id: '4',
      integrationName: 'SAP ERP',
      type: 'warning',
      message: 'تم العثور على 3 قيود محاسبية مكررة',
      timestamp: '2024-01-15 13:45:30'
    },
    {
      id: '5',
      integrationName: 'بنك الخليج',
      type: 'success',
      message: 'تم تحديث أرصدة الحسابات',
      timestamp: '2024-01-15 13:30:12'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'syncing': return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'disconnected': return <WifiOff className="h-5 w-5 text-gray-500" />;
      default: return <Wifi className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-green-100 text-green-800">متصل</Badge>;
      case 'syncing': return <Badge className="bg-blue-100 text-blue-800">يتم المزامنة</Badge>;
      case 'error': return <Badge variant="destructive">خطأ</Badge>;
      case 'disconnected': return <Badge variant="secondary">غير متصل</Badge>;
      default: return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bank': return '🏦';
      case 'erp': return '💼';
      case 'government': return '🏛️';
      case 'payment': return '💳';
      case 'api': return '🔗';
      default: return '📊';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'sync': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, isEnabled: !integration.isEnabled }
        : integration
    ));
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;
  const totalSyncs = integrations.reduce((acc, i) => acc + i.syncStats.total, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">التكاملات النشطة</p>
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
              </div>
              <Link className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">أخطاء التكامل</p>
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">عمليات المزامنة</p>
                <p className="text-2xl font-bold">{totalSyncs.toLocaleString()}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">معدل النجاح</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((integrations.reduce((acc, i) => acc + i.syncStats.successful, 0) / totalSyncs) * 100)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">التكاملات</TabsTrigger>
          <TabsTrigger value="activity">النشاط</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="marketplace">المتجر</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="rtl-title flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  التكاملات المتاحة
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة تكامل جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {integrations.map((integration) => (
                  <div key={integration.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTypeIcon(integration.type)}</span>
                        <div>
                          <h4 className="font-medium">{integration.name}</h4>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.status)}
                        {getStatusIcon(integration.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">آخر مزامنة</p>
                        <p className="font-medium">{integration.lastSync}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">تكرار المزامنة</p>
                        <p className="font-medium">{integration.syncFrequency}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">أنواع البيانات:</p>
                      <div className="flex flex-wrap gap-1">
                        {integration.dataTypes.map((type, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>معدل النجاح</span>
                        <span>{Math.round((integration.syncStats.successful / integration.syncStats.total) * 100)}%</span>
                      </div>
                      <Progress value={(integration.syncStats.successful / integration.syncStats.total) * 100} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{integration.syncStats.successful} نجح</span>
                        <span>{integration.syncStats.failed} فشل</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.isEnabled}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                        />
                        <Label className="text-sm">تفعيل</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Activity className="h-5 w-5" />
                نشاط المزامنة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {syncActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{activity.integrationName}</span>
                          <span className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.message}
                        </p>
                        {activity.details && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                            {activity.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات التكامل العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>مهلة الاتصال (ثواني)</Label>
                    <Input type="number" defaultValue="30" />
                  </div>
                  <div className="space-y-2">
                    <Label>عدد محاولات إعادة الاتصال</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <Label>فترة الانتظار بين المحاولات (ثواني)</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>تسجيل العمليات التفصيلي</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>إرسال تنبيهات الأخطاء</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>مزامنة تلقائية</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>تشفير البيانات المنقولة</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button>
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-4xl">🏦</div>
                <div>
                  <h3 className="font-medium">البنك التجاري الكويتي</h3>
                  <p className="text-sm text-muted-foreground">تكامل مباشر مع API البنك</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-4xl">📊</div>
                <div>
                  <h3 className="font-medium">Oracle NetSuite</h3>
                  <p className="text-sm text-muted-foreground">نظام ERP متقدم</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-4xl">📱</div>
                <div>
                  <h3 className="font-medium">بوابة الحكومة الرقمية</h3>
                  <p className="text-sm text-muted-foreground">خدمات حكومية متكاملة</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};