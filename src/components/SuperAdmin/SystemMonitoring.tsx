import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Server, 
  Database, 
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick
} from "lucide-react";

const SystemMonitoring: React.FC = () => {
  // في التطبيق الحقيقي، سيتم جلب هذه البيانات من APIs مراقبة الخوادم
  const systemMetrics = {
    servers: [
      {
        name: 'خادم التطبيق الرئيسي',
        status: 'online',
        cpu: 45,
        memory: 67,
        disk: 34,
        uptime: '99.9%'
      },
      {
        name: 'خادم قاعدة البيانات',
        status: 'online',
        cpu: 32,
        memory: 78,
        disk: 56,
        uptime: '99.8%'
      },
      {
        name: 'خادم النسخ الاحتياطي',
        status: 'maintenance',
        cpu: 12,
        memory: 23,
        disk: 89,
        uptime: '98.5%'
      }
    ],
    databases: [
      {
        name: 'قاعدة البيانات الرئيسية',
        status: 'healthy',
        connections: 24,
        size: '2.3 GB',
        lastBackup: '2024-01-10 03:00:00'
      },
      {
        name: 'قاعدة بيانات التحليلات',
        status: 'healthy',
        connections: 8,
        size: '890 MB',
        lastBackup: '2024-01-10 03:30:00'
      }
    ],
    alerts: [
      {
        id: 1,
        type: 'warning',
        message: 'استخدام الذاكرة مرتفع في خادم قاعدة البيانات',
        timestamp: '2024-01-10 14:30:00'
      },
      {
        id: 2,
        type: 'info',
        message: 'تم إكمال النسخة الاحتياطية بنجاح',
        timestamp: '2024-01-10 03:00:00'
      }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'maintenance':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'offline':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">متصل</Badge>;
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">سليم</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">صيانة</Badge>;
      case 'offline':
        return <Badge variant="destructive">غير متصل</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">مراقبة النظام</h2>
        <p className="text-muted-foreground">
          مراقبة أداء الخوادم وقواعد البيانات والتنبيهات
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Server className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">الخوادم النشطة</p>
              <p className="text-2xl font-bold">
                {systemMetrics.servers.filter(s => s.status === 'online').length}/
                {systemMetrics.servers.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Database className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">قواعد البيانات</p>
              <p className="text-2xl font-bold">{systemMetrics.databases.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Wifi className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">زمن الاستجابة</p>
              <p className="text-2xl font-bold">127ms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">معدل التوفر</p>
              <p className="text-2xl font-bold">99.8%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servers Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            مراقبة الخوادم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemMetrics.servers.map((server, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(server.status)}
                    <h4 className="font-medium">{server.name}</h4>
                  </div>
                  {getStatusBadge(server.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        المعالج
                      </span>
                      <span className="text-sm">{server.cpu}%</span>
                    </div>
                    <Progress value={server.cpu} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1">
                        <MemoryStick className="w-3 h-3" />
                        الذاكرة
                      </span>
                      <span className="text-sm">{server.memory}%</span>
                    </div>
                    <Progress value={server.memory} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        القرص الصلب
                      </span>
                      <span className="text-sm">{server.disk}%</span>
                    </div>
                    <Progress value={server.disk} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">وقت التشغيل</span>
                      <span className="text-sm font-medium">{server.uptime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              مراقبة قواعد البيانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemMetrics.databases.map((db, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{db.name}</h4>
                    {getStatusBadge(db.status)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الاتصالات:</span>
                      <span>{db.connections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الحجم:</span>
                      <span>{db.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">آخر نسخة احتياطية:</span>
                      <span>{db.lastBackup}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تنبيهات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemMetrics.alerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemMonitoring;