import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Shield,
  Database,
  Wifi,
  Bell,
  BellOff,
  X,
  Eye,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useSmartAlerts } from '@/hooks/useSmartAlerts';

const SmartAlertsPanel: React.FC = () => {
  const { 
    alerts, 
    systemHealth, 
    loading, 
    markAsRead, 
    dismissAlert, 
    getUnreadCount,
    getAlertsBySeverity,
    refresh 
  } = useSmartAlerts();

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'high') {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    if (severity === 'medium') {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
    
    switch (type) {
      case 'security':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'database':
        return <Database className="w-4 h-4 text-purple-600" />;
      case 'performance':
        return <Activity className="w-4 h-4 text-orange-600" />;
      case 'system':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold rtl-title">التنبيهات الذكية</h2>
          <p className="text-muted-foreground">
            مراقبة متقدمة وتنبيهات تلقائية لحالة النظام
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rtl-flex">
            <Bell className="w-3 h-3 ml-1" />
            {getUnreadCount()} غير مقروء
          </Badge>
          <Button onClick={refresh} variant="outline" size="sm" className="rtl-flex">
            <Activity className="w-4 h-4 ml-1" />
            تحديث
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              {getHealthIcon(systemHealth?.overall_score || 0)}
              <div>
                <p className="text-sm text-muted-foreground">الصحة العامة</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemHealth?.overall_score || 0)}`}>
                  {systemHealth?.overall_score || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Activity className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">الأداء</p>
                <p className={`text-lg font-semibold ${getHealthColor(systemHealth?.api_health || 0)}`}>
                  {systemHealth?.api_health || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Shield className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">الأمان</p>
                <p className={`text-lg font-semibold ${getHealthColor(systemHealth?.security_health || 0)}`}>
                  {systemHealth?.security_health || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Database className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">قاعدة البيانات</p>
                <p className={`text-lg font-semibold ${getHealthColor(systemHealth?.database_health || 0)}`}>
                  {systemHealth?.database_health || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Wifi className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">الاتصال</p>
                <p className={`text-lg font-semibold ${getHealthColor(systemHealth?.storage_health || 0)}`}>
                  {systemHealth?.storage_health || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts by Severity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 rtl-title">
              تنبيهات عالية الأهمية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {getAlertsBySeverity('high').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              تتطلب إجراءً فورياً
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 rtl-title">
              تنبيهات متوسطة الأهمية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {getAlertsBySeverity('medium').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              تحتاج للمراجعة
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 rtl-title">
              تنبيهات منخفضة الأهمية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getAlertsBySeverity('low').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              للمعلومات العامة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">التنبيهات الحديثة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد تنبيهات حالياً</p>
              </div>
            ) : (
              alerts.slice(0, 10).map((alert) => (
                <div 
                  key={alert.id}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    (alert as any).read_at ? 'bg-gray-50' : 'bg-white'
                  } ${
                    alert.severity === 'high' ? 'border-red-200' :
                    alert.severity === 'medium' ? 'border-yellow-200' :
                    'border-green-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type, alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${(alert as any).read_at ? 'text-gray-600' : 'text-gray-900'}`}>
                          {alert.title}
                        </h4>
                        <Badge 
                          variant={
                            alert.severity === 'high' ? 'destructive' :
                            alert.severity === 'medium' ? 'default' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {alert.severity === 'high' ? 'عالي' :
                           alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        {alert.actions && alert.actions.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            يتطلب إجراء
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${(alert as any).read_at ? 'text-gray-500' : 'text-gray-700'}`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(alert.created_at).toLocaleString('ar-SA')}</span>
                        <span>المصدر: {alert.source}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!(alert as any).read_at && (
                      <Button
                        onClick={() => markAsRead(alert.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      onClick={() => dismissAlert(alert.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartAlertsPanel;