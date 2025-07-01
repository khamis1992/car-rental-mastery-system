import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Database, 
  Wifi, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Activity
} from 'lucide-react';

const SystemStatus = () => {
  const systemHealth = [
    {
      component: 'خادم النظام',
      status: 'active',
      uptime: '99.9%',
      icon: <Server className="w-5 h-5" />,
      color: 'text-green-500'
    },
    {
      component: 'قاعدة البيانات',
      status: 'active', 
      uptime: '99.8%',
      icon: <Database className="w-5 h-5" />,
      color: 'text-green-500'
    },
    {
      component: 'الاتصال بالإنترنت',
      status: 'active',
      uptime: '100%',
      icon: <Wifi className="w-5 h-5" />,
      color: 'text-green-500'
    },
    {
      component: 'نظام الأمان',
      status: 'warning',
      uptime: '95.2%',
      icon: <Shield className="w-5 h-5" />,
      color: 'text-orange-500'
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'مساحة التخزين تقترب من الامتلاء (85%)',
      time: '5 دقائق مضت',
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />
    },
    {
      id: 2,
      type: 'info',
      message: 'تم تحديث النظام بنجاح إلى الإصدار 2.1.0',
      time: '2 ساعة مضت',
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      id: 3,
      type: 'info',
      message: 'تم إنشاء نسخة احتياطية تلقائية',
      time: '6 ساعات مضت',
      icon: <CheckCircle className="w-4 h-4 text-blue-500" />
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">نشط</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500 text-white">تحذير</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">خطأ</Badge>;
      default:
        return <Badge variant="secondary">غير معروف</Badge>;
    }
  };

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            حالة النظام
          </CardTitle>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            إعدادات المراقبة
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* حالة المكونات */}
        <div>
          <h3 className="font-medium mb-3">مكونات النظام</h3>
          <div className="space-y-3">
            {systemHealth.map((component, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={component.color}>
                    {component.icon}
                  </div>
                  <div>
                    <p className="font-medium">{component.component}</p>
                    <p className="text-sm text-muted-foreground">وقت التشغيل: {component.uptime}</p>
                  </div>
                </div>
                {getStatusBadge(component.status)}
              </div>
            ))}
          </div>
        </div>

        {/* التنبيهات الأخيرة */}
        <div>
          <h3 className="font-medium mb-3">التنبيهات الأخيرة</h3>
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                {alert.icon}
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div>
          <h3 className="font-medium mb-3">إحصائيات الأداء</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-green-500">99.9%</p>
              <p className="text-sm text-muted-foreground">وقت التشغيل الإجمالي</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-blue-500">1.2s</p>
              <p className="text-sm text-muted-foreground">متوسط وقت الاستجابة</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;