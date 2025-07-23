import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Trash2, RotateCcw } from 'lucide-react';

interface MemoryMonitorDashboardProps {
  enabled?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export const MemoryMonitorDashboard: React.FC<MemoryMonitorDashboardProps> = ({
  enabled = true,
  warningThreshold = 75,
  criticalThreshold = 90
}) => {
  const {
    metrics,
    history,
    alerts,
    isMonitoring,
    isSupported,
    forceGarbageCollection,
    clearData,
    stats
  } = useMemoryMonitor({
    enabled,
    warningThreshold,
    criticalThreshold,
    onAlert: (alert) => {
      console.log('Memory alert:', alert);
    }
  });

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            مراقب الذاكرة غير مدعوم
          </CardTitle>
          <CardDescription>
            متصفحك لا يدعم مراقبة استخدام الذاكرة
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    switch (stats.trend) {
      case 'increasing':
        return 'متزايد';
      case 'decreasing':
        return 'متناقص';
      default:
        return 'مستقر';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= criticalThreshold) return 'text-red-600';
    if (percentage >= warningThreshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBadgeVariant = (percentage: number) => {
    if (percentage >= criticalThreshold) return 'destructive';
    if (percentage >= warningThreshold) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <div className="rtl-flex">
            <div>
              <CardTitle className="rtl-title">مراقب الذاكرة</CardTitle>
              <CardDescription>
                مراقبة استخدام الذاكرة في الوقت الفعلي
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={forceGarbageCollection}
                disabled={!isMonitoring}
              >
                <RotateCcw className="h-4 w-4 ml-2" />
                تنظيف الذاكرة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearData}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                مسح البيانات
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Usage */}
            <div className="space-y-2">
              <div className="rtl-flex">
                <span className="text-sm text-muted-foreground">الاستخدام الحالي</span>
                {metrics && (
                  <Badge variant={getUsageBadgeVariant(metrics.heapUsagePercent)}>
                    {metrics.heapUsagePercent}%
                  </Badge>
                )}
              </div>
              {metrics && (
                <>
                  <Progress value={metrics.heapUsagePercent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(metrics.usedJSHeapSize)} / {formatBytes(metrics.jsHeapSizeLimit)}
                  </div>
                </>
              )}
            </div>

            {/* Trend */}
            <div className="space-y-2">
              <div className="rtl-flex">
                <span className="text-sm text-muted-foreground">الاتجاه</span>
                <div className="rtl-flex">
                  {getTrendIcon()}
                  <span className="text-sm">{getTrendText()}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                متوسط الاستخدام: {stats.averageUsage}%
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="rtl-flex">
                <span className="text-sm text-muted-foreground">الحالة</span>
                <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                  {isMonitoring ? 'نشط' : 'متوقف'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.measurementCount} قياس
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.measurementCount}</div>
            <p className="text-xs text-muted-foreground">عدد القياسات</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.alertCount}</div>
            <p className="text-xs text-muted-foreground">إجمالي التنبيهات</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.warningAlerts}</div>
            <p className="text-xs text-muted-foreground">تحذيرات</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">تنبيهات حرجة</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">التنبيهات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-r-4 ${
                    alert.type === 'critical'
                      ? 'bg-red-50 border-r-red-500'
                      : 'bg-yellow-50 border-r-yellow-500'
                  }`}
                >
                  <div className="rtl-flex">
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        الحد الأقصى: {alert.threshold}% | الحالي: {alert.current}%
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(alert.timestamp, { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent History (Simple Chart) */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">تاريخ الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 10).map((metric, index) => (
                <div key={index} className="rtl-flex">
                  <div className="flex-1">
                    <Progress value={metric.heapUsagePercent} className="h-2" />
                  </div>
                  <div className="w-16 text-sm text-muted-foreground text-left">
                    {metric.heapUsagePercent}%
                  </div>
                  <div className="w-20 text-xs text-muted-foreground">
                    {formatDistanceToNow(metric.timestamp, { locale: ar })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};