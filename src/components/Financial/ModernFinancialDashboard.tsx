
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Calculator
} from 'lucide-react';

interface FinancialMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  amount?: string;
  status: 'completed' | 'pending' | 'overdue';
  time: string;
}

export const ModernFinancialDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FinancialMetric[]>([
    {
      title: 'إجمالي الإيرادات',
      value: '45,250.500 د.ك',
      change: '+12.5%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'صافي الربح',
      value: '28,125.750 د.ك',
      change: '+8.3%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'المصروفات',
      value: '17,124.750 د.ك',
      change: '+3.2%',
      changeType: 'negative',
      icon: TrendingDown,
      color: 'text-red-600'
    },
    {
      title: 'العملاء النشطين',
      value: '156',
      change: '+5 هذا الشهر',
      changeType: 'positive',
      icon: Users,
      color: 'text-purple-600'
    }
  ]);

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'invoice',
      description: 'فاتورة جديدة للعميل أحمد محمد',
      amount: '2,450.000 د.ك',
      status: 'pending',
      time: 'منذ 5 دقائق'
    },
    {
      id: '2',
      type: 'payment',
      description: 'دفعة مستلمة من شركة الخليج',
      amount: '8,750.500 د.ك',
      status: 'completed',
      time: 'منذ 15 دقيقة'
    },
    {
      id: '3',
      type: 'expense',
      description: 'مصروف صيانة السيارات',
      amount: '1,200.000 د.ك',
      status: 'completed',
      time: 'منذ ساعة'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      overdue: 'destructive'
    };
    
    const labels = {
      completed: 'مكتمل',
      pending: 'قيد الانتظار',
      overdue: 'متأخر'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">لوحة المعلومات المالية</h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على الوضع المالي للشركة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rtl-flex">
            <BarChart3 className="w-4 h-4" />
            التقارير
          </Button>
          <Button className="rtl-flex">
            <Calculator className="w-4 h-4" />
            قيد محاسبي جديد
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <div className="flex items-center gap-2">
                      <span 
                        className={`text-sm font-medium ${
                          metric.changeType === 'positive' 
                            ? 'text-green-600' 
                            : metric.changeType === 'negative'
                            ? 'text-red-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${metric.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Activities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              الإيرادات والمصروفات - آخر 6 أشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border border-dashed rounded-lg">
              <div className="text-center space-y-2">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">سيتم عرض الرسوم البيانية هنا</p>
                <p className="text-sm text-muted-foreground">
                  تحليل تفاعلي للبيانات المالية
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2">
              <FileText className="w-5 h-5" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="mt-1">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {activity.description}
                  </p>
                  {activity.amount && (
                    <p className="text-lg font-bold text-primary">
                      {activity.amount}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-4">
              عرض جميع الأنشطة
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-16 flex flex-col gap-1 bg-blue-600 hover:bg-blue-700">
              <FileText className="w-5 h-5" />
              <span className="text-sm">فاتورة جديدة</span>
            </Button>
            <Button className="h-16 flex flex-col gap-1 bg-green-600 hover:bg-green-700">
              <Users className="w-5 h-5" />
              <span className="text-sm">عميل جديد</span>
            </Button>
            <Button className="h-16 flex flex-col gap-1 bg-purple-600 hover:bg-purple-700">
              <Calculator className="w-5 h-5" />
              <span className="text-sm">قيد محاسبي</span>
            </Button>
            <Button className="h-16 flex flex-col gap-1 bg-orange-600 hover:bg-orange-700">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm">تقرير سريع</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
