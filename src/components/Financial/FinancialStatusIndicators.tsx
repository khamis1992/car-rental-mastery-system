import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';

interface SystemStatus {
  id: string;
  title: string;
  status: 'healthy' | 'warning' | 'error' | 'processing';
  value: number;
  maxValue?: number;
  unit: string;
  description: string;
  lastUpdated: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

export const FinancialStatusIndicators: React.FC = () => {
  const [statusData, setStatusData] = useState<SystemStatus[]>([
    {
      id: 'balance-accuracy',
      title: 'دقة الأرصدة',
      status: 'healthy',
      value: 99.8,
      maxValue: 100,
      unit: '%',
      description: 'نسبة توازن القيود المحاسبية',
      lastUpdated: new Date().toLocaleString('ar-KW'),
      trend: 'stable',
      trendValue: 0.1
    },
    {
      id: 'pending-entries',
      title: 'القيود المعلقة',
      status: 'warning',
      value: 12,
      unit: 'قيد',
      description: 'قيود تحتاج للمراجعة والموافقة',
      lastUpdated: new Date().toLocaleString('ar-KW'),
      trend: 'up',
      trendValue: 3
    },
    {
      id: 'automated-processing',
      title: 'المعالجة التلقائية',
      status: 'processing',
      value: 78,
      maxValue: 100,
      unit: '%',
      description: 'تقدم معالجة القيود التلقائية',
      lastUpdated: new Date().toLocaleString('ar-KW'),
      trend: 'up',
      trendValue: 15
    },
    {
      id: 'data-integrity',
      title: 'سلامة البيانات',
      status: 'healthy',
      value: 100,
      maxValue: 100,
      unit: '%',
      description: 'سلامة واتساق البيانات المحاسبية',
      lastUpdated: new Date().toLocaleString('ar-KW'),
      trend: 'stable',
      trendValue: 0
    },
    {
      id: 'sync-status',
      title: 'حالة المزامنة',
      status: 'healthy',
      value: 100,
      maxValue: 100,
      unit: '%',
      description: 'مزامنة البيانات مع الوحدات الأخرى',
      lastUpdated: new Date().toLocaleString('ar-KW'),
      trend: 'stable',
      trendValue: 0
    },
    {
      id: 'monthly-processing',
      title: 'المعالجة الشهرية',
      status: 'error',
      value: 0,
      maxValue: 100,
      unit: '%',
      description: 'تقدم إقفال الشهر الحالي',
      lastUpdated: new Date().toLocaleString('ar-KW'),
      trend: 'down',
      trendValue: 5
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const getOverallHealth = () => {
    const healthyCount = statusData.filter(item => item.status === 'healthy').length;
    const totalCount = statusData.length;
    return Math.round((healthyCount / totalCount) * 100);
  };

  const overallHealth = getOverallHealth();

  return (
    <div className="space-y-6">
      {/* Overall Health Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="rtl-title flex items-center gap-3">
              <div className={`p-2 rounded-lg ${overallHealth >= 80 ? 'bg-green-500' : overallHealth >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                {overallHealth >= 80 ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-white" />
                )}
              </div>
              حالة النظام المالي
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshStatus}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">الصحة العامة</span>
                <span className="text-sm font-medium">{overallHealth}%</span>
              </div>
              <Progress value={overallHealth} className="h-2" />
            </div>
            <Badge 
              variant={overallHealth >= 80 ? "default" : overallHealth >= 60 ? "secondary" : "destructive"}
              className="px-3 py-1"
            >
              {overallHealth >= 80 ? 'ممتاز' : overallHealth >= 60 ? 'جيد' : 'يحتاج انتباه'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Individual Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statusData.map((item) => (
          <Card 
            key={item.id} 
            className={`transition-all duration-200 hover:shadow-md ${getStatusColor(item.status)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                {getStatusIcon(item.status)}
                <div className="flex items-center gap-1">
                  {getTrendIcon(item.trend)}
                  {item.trendValue && (
                    <span className="text-xs text-muted-foreground">
                      {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}
                      {item.trendValue}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{item.title}</h4>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold">
                    {item.value}
                  </span>
                  <span className="text-sm text-muted-foreground mb-0.5">
                    {item.unit}
                  </span>
                  {item.maxValue && (
                    <span className="text-sm text-muted-foreground mb-0.5">
                      / {item.maxValue}
                    </span>
                  )}
                </div>
                
                {item.maxValue && (
                  <Progress 
                    value={(item.value / item.maxValue) * 100} 
                    className="h-1.5" 
                  />
                )}
                
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/50">
                  <span className="text-xs text-muted-foreground">
                    آخر تحديث: {item.lastUpdated}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};