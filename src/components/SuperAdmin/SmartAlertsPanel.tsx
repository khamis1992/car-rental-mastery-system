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
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!systemHealth) {
    return (
      <div className="text-center p-8" dir="rtl">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">غير متاح حالياً</h3>
        <p className="text-muted-foreground">لا يمكن تحميل بيانات النظام</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">التنبيهات الذكية</h2>
          <p className="text-muted-foreground">
            {getUnreadCount()} تنبيه جديد - آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="w-3 h-3" />
            {getUnreadCount()}
          </Badge>
          <Button 
            onClick={refresh}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              {getHealthIcon(systemHealth.overall_score)}
              <div>
                <p className="text-sm text-muted-foreground">الصحة العامة</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemHealth.overall_score)}`}>
                  {systemHealth.overall_score}%
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
                <p className={`text-lg font-semibold ${getHealthColor(systemHealth.api_health)}`}>
                  {systemHealth.api_health}%
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
                <p className={`text-lg font-semibold ${getHealthColor(systemHealth.security_health)}`}>
                  {systemHealth.security_health}%
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
                <p className={`text-lg font-semibold ${getHealthColor(systemHealth.database_health)}`}>
                  {systemHealth.database_health}%
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
                <p className="text-sm text-muted-foreground">التخزين</p>
                <p className={`text-lg font-semibold ${getHealthColor(systemHealth.storage_health)}`}>
                  {systemHealth.storage_health}%
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
            <CardTitle className="text-sm flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              تنبيهات عالية الأهمية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {getAlertsBySeverity('high').length}
            </div>
            <div className="text-xs text-muted-foreground">
              {getAlertsBySeverity('critical').length} حرج
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-4 h-4" />
              تنبيهات متوسطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {getAlertsBySeverity('medium').length}
            </div>
            <div className="text-xs text-muted-foreground">
              تتطلب مراجعة
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              تنبيهات منخفضة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {getAlertsBySeverity('low').length}
            </div>
            <div className="text-xs text-muted-foreground">
              للمراجعة لاحقاً
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            التنبيهات الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد تنبيهات</h3>
                <p className="text-muted-foreground">جميع الأنظمة تعمل بشكل طبيعي</p>
              </div>
            ) : (
              alerts.slice(0, 10).map((alert) => (
                <div 
                  key={alert.id}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    alert.resolved ? 'bg-gray-50' : 'bg-white'
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
                        <h4 className={`text-sm font-medium ${alert.resolved ? 'text-gray-600' : 'text-gray-900'}`}>
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
                      <p className={`text-sm ${alert.resolved ? 'text-gray-500' : 'text-gray-700'}`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(alert.created_at).toLocaleString('ar-SA')}</span>
                        <span>المصدر: {alert.source}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!alert.resolved && (
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
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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