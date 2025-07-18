
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock, 
  Database, 
  Memory, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useFinancialPerformance } from '@/hooks/useFinancialPerformance';

interface FinancialPerformanceMonitorProps {
  componentName: string;
  showDetails?: boolean;
}

export const FinancialPerformanceMonitor: React.FC<FinancialPerformanceMonitorProps> = ({
  componentName,
  showDetails = false
}) => {
  const { metrics, isMonitoring, getPerformanceReport } = useFinancialPerformance(componentName);
  const [showReport, setShowReport] = useState(false);

  const getPerformanceStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value > thresholds.critical) return { status: 'critical', color: 'bg-red-500', icon: AlertCircle };
    if (value > thresholds.warning) return { status: 'warning', color: 'bg-yellow-500', icon: Clock };
    return { status: 'good', color: 'bg-green-500', icon: CheckCircle };
  };

  const renderTimeStatus = getPerformanceStatus(metrics.renderTime, { warning: 50, critical: 100 });
  const dataLoadStatus = getPerformanceStatus(metrics.dataLoadTime, { warning: 500, critical: 1000 });
  const memoryStatus = getPerformanceStatus(metrics.memoryUsage, { warning: 30, critical: 50 });

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="w-4 h-4" />
        <span>مراقب الأداء</span>
        {isMonitoring && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs">نشط</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4" />
          مراقب الأداء - {componentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <renderTimeStatus.icon className={`w-4 h-4 text-white rounded-full p-0.5 ${renderTimeStatus.color}`} />
              <span className="text-xs font-medium">وقت الرسم</span>
            </div>
            <p className="text-sm font-bold">{metrics.renderTime.toFixed(1)}ms</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <dataLoadStatus.icon className={`w-4 h-4 text-white rounded-full p-0.5 ${dataLoadStatus.color}`} />
              <span className="text-xs font-medium">تحميل البيانات</span>
            </div>
            <p className="text-sm font-bold">{metrics.dataLoadTime.toFixed(1)}ms</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <memoryStatus.icon className={`w-4 h-4 text-white rounded-full p-0.5 ${memoryStatus.color}`} />
              <span className="text-xs font-medium">الذاكرة</span>
            </div>
            <p className="text-sm font-bold">{metrics.memoryUsage}MB</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isMonitoring ? "default" : "secondary"}>
              {isMonitoring ? "نشط" : "متوقف"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              آخر قياس: {metrics.lastMeasurement.toLocaleTimeString('ar-SA')}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReport(!showReport)}
          >
            {showReport ? 'إخفاء التقرير' : 'عرض التقرير'}
          </Button>
        </div>

        {showReport && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">تقرير الأداء</h4>
            <div className="space-y-2 text-sm">
              {getPerformanceReport().recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                  <span>{rec}</span>
                </div>
              ))}
              {getPerformanceReport().recommendations.length === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>الأداء ممتاز! لا توجد توصيات</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
