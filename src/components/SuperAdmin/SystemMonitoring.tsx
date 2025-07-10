import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  MemoryStick,
  RefreshCw
} from "lucide-react";
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';

const SystemMonitoring: React.FC = () => {
  const { metrics, loading, error, refetch } = useSystemMonitoring();

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">مراقبة النظام</h2>
          <p className="text-muted-foreground">جاري تحميل بيانات المراقبة...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center p-6">
                <div className="w-8 h-8 bg-gray-200 rounded mr-3 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مراقبة النظام</h2>
          <p className="text-muted-foreground">
            مراقبة أداء الخوادم وقواعد البيانات والتنبيهات
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Server className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">الخوادم النشطة</p>
              <p className="text-2xl font-bold">
                {metrics.serverStats.activeServers}/{metrics.serverStats.totalServers}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Database className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">قواعد البيانات</p>
              <p className="text-2xl font-bold">{metrics.serverStats.databaseCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Wifi className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">زمن الاستجابة</p>
              <p className="text-2xl font-bold">{metrics.serverStats.responseTime}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Activity className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">معدل التوفر</p>
              <p className="text-2xl font-bold">{metrics.serverStats.uptime}</p>
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
            {metrics.servers.map((server, index) => (
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
              {metrics.databases.map((db, index) => (
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
              {metrics.alerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    ) : alert.type === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
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