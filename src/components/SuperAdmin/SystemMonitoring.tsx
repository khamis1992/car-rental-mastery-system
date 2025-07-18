import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw,
  Bell,
  Shield
} from "lucide-react";
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';
import SmartAlertsPanel from './SmartAlertsPanel';

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
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">متصل</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">صيانة</Badge>;
      case 'offline':
      case 'error':
        return <Badge variant="destructive">غير متصل</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return 'bg-red-500';
    if (value >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">جارٍ تحميل بيانات النظام...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مراقبة النظام</h1>
          <p className="text-muted-foreground">
            مراقبة شاملة لأداء النظام وحالة الخوادم
          </p>
        </div>
        <Button onClick={refetch} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <Server className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">وحدة المعالجة</p>
                  <p className="text-2xl font-bold">
                    {metrics.server.cpu_usage.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <MemoryStick className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">الذاكرة</p>
                  <p className="text-2xl font-bold">{metrics.server.memory_usage.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <HardDrive className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">مساحة القرص</p>
                  <p className="text-2xl font-bold">{metrics.server.disk_usage.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Activity className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">زمن الاستجابة</p>
                  <p className="text-2xl font-bold">{metrics.api.responseTime}ms</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Database Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                أداء قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الاتصالات النشطة</span>
                    <span className="font-medium">{metrics.database.connections}/{metrics.database.maxConnections}</span>
                  </div>
                  <Progress 
                    value={(metrics.database.connections / metrics.database.maxConnections) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الاستعلامات في الثانية</span>
                    <span className="font-medium">{metrics.database.queries_per_second}</span>
                  </div>
                  <Progress value={metrics.database.performance} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">متوسط زمن الاستجابة</span>
                    <span className="font-medium">{metrics.database.avg_response_time}ms</span>
                  </div>
                  <Progress value={100 - (metrics.database.avg_response_time / 10)} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage & Cache */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  التخزين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">المساحة المستخدمة</span>
                    <span className="font-medium">{metrics.storage.used}% من {metrics.storage.total}GB</span>
                  </div>
                  <Progress value={metrics.storage.used} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">الرفوعات</p>
                    <p className="font-medium">{metrics.storage.uploads}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">النسخ الاحتياطية</p>
                    <p className="font-medium">{metrics.storage.backups}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  الذاكرة المؤقتة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">معدل النجاح</span>
                    <span className="font-medium">{metrics.cache.hitRate}%</span>
                  </div>
                  <Progress value={metrics.cache.hitRate} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">الذاكرة</p>
                    <p className="font-medium">{metrics.cache.memory}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المفاتيح</p>
                    <p className="font-medium">{metrics.cache.keys.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tenants & Users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات المؤسسات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{metrics.tenants.total}</p>
                    <p className="text-sm text-muted-foreground">إجمالي المؤسسات</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{metrics.tenants.active}</p>
                    <p className="text-sm text-muted-foreground">نشطة</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{metrics.tenants.trial}</p>
                    <p className="text-sm text-muted-foreground">تجريبية</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{metrics.tenants.suspended}</p>
                    <p className="text-sm text-muted-foreground">معلقة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">إجمالي المستخدمين</span>
                    <span className="text-lg font-bold">{metrics.users.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">متصل الآن</span>
                    <span className="text-lg font-bold text-green-600">{metrics.users.online}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">نشط في آخر 24 ساعة</span>
                    <span className="text-lg font-bold text-blue-600">{metrics.users.last_24h}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <SmartAlertsPanel />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                مراقبة الأمان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">قريباً</h3>
                <p className="text-muted-foreground">
                  سيتم إضافة مراقبة شاملة للأمان والحماية
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitoring;