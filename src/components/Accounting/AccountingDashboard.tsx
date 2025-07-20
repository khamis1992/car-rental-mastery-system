import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  PieChart,
  BarChart3,
  Shield
} from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';

interface FinancialMetric {
  title: string;
  value: number;
  previousValue: number;
  change: number;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface AccountingTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
}

interface ValidationAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  count: number;
  urgency: 'critical' | 'medium' | 'low';
}

export const AccountingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [tasks, setTasks] = useState<AccountingTask[]>([]);
  const [validationAlerts, setValidationAlerts] = useState<ValidationAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data - في التطبيق الحقيقي سيتم جلب البيانات من الـ API
      setMetrics([
        {
          title: 'إجمالي الإيرادات',
          value: 125000,
          previousValue: 110000,
          change: 13.6,
          changeType: 'up',
          icon: <DollarSign className="w-6 h-6" />,
          color: 'text-green-600'
        },
        {
          title: 'إجمالي المصروفات',
          value: 85000,
          previousValue: 90000,
          change: -5.6,
          changeType: 'down',
          icon: <TrendingDown className="w-6 h-6" />,
          color: 'text-red-600'
        },
        {
          title: 'صافي الربح',
          value: 40000,
          previousValue: 20000,
          change: 100,
          changeType: 'up',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'text-blue-600'
        },
        {
          title: 'القيود المعلقة',
          value: 15,
          previousValue: 25,
          change: -40,
          changeType: 'down',
          icon: <FileText className="w-6 h-6" />,
          color: 'text-orange-600'
        }
      ]);

      setTasks([
        {
          id: '1',
          title: 'مراجعة قيود شهر يناير',
          description: 'مراجعة وإقفال جميع قيود شهر يناير 2024',
          priority: 'high',
          dueDate: '2024-02-05',
          status: 'pending',
          assignee: 'أحمد المحاسب'
        },
        {
          id: '2',
          title: 'إعداد التقرير الشهري',
          description: 'إعداد التقرير المالي الشهري للإدارة',
          priority: 'medium',
          dueDate: '2024-02-10',
          status: 'in_progress',
          assignee: 'فاطمة المالية'
        },
        {
          id: '3',
          title: 'تحديث دليل الحسابات',
          description: 'إضافة حسابات جديدة للقسم الجديد',
          priority: 'low',
          dueDate: '2024-02-15',
          status: 'pending'
        },
        {
          id: '4',
          title: 'مطابقة حسابات البنك',
          description: 'مطابقة كشوف الحساب البنكي مع السجلات',
          priority: 'high',
          dueDate: '2024-02-03',
          status: 'completed',
          assignee: 'سارة المراجعة'
        }
      ]);

      setValidationAlerts([
        {
          id: '1',
          type: 'error',
          title: 'عدم توازن في القيود',
          description: 'يوجد 3 قيود محاسبية غير متوازنة تحتاج مراجعة فورية',
          count: 3,
          urgency: 'critical'
        },
        {
          id: '2',
          type: 'warning',
          title: 'حسابات غير مستخدمة',
          description: 'يوجد 12 حساب في دليل الحسابات لم يتم استخدامها مؤخراً',
          count: 12,
          urgency: 'medium'
        },
        {
          id: '3',
          type: 'info',
          title: 'تحديثات النظام',
          description: 'يوجد تحديثات جديدة للنظام المحاسبي',
          count: 1,
          urgency: 'low'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-muted-foreground">جاري تحميل لوحة القيادة المحاسبية...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* المؤشرات المالية الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">
                    {metric.title.includes('الربح') || metric.title.includes('الإيرادات') || metric.title.includes('المصروفات') 
                      ? formatCurrencyKWD(metric.value) 
                      : metric.value.toLocaleString()
                    }
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${
                      metric.changeType === 'up' ? 'text-green-600' : 
                      metric.changeType === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.changeType === 'up' ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">من الشهر السابق</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-br ${
                  metric.changeType === 'up' ? 'from-green-100 to-green-200' : 
                  metric.changeType === 'down' ? 'from-red-100 to-red-200' : 'from-gray-100 to-gray-200'
                }`}>
                  <div className={metric.color}>{metric.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* إنذارات التحقق */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <Shield className="w-5 h-5" />
            تنبيهات النظام المحاسبي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validationAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg border ${getUrgencyColor(alert.urgency)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <h4 className="font-medium text-foreground">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <Badge variant="outline" className="mt-2">
                        {alert.count} عنصر
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/accounting-validation')}
                  >
                    عرض التفاصيل
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* المهام المحاسبية */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 rtl-flex">
              <Calculator className="w-5 h-5" />
              المهام المحاسبية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 4).map((task) => (
                <div key={task.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={getPriorityColor(task.priority)}
                        >
                          {task.priority === 'high' ? 'عالية' : 
                           task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>تاريخ الانتهاء: {new Date(task.dueDate).toLocaleDateString('ar-SA')}</span>
                        {task.assignee && <span>المسؤول: {task.assignee}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/journal-entries')}
            >
              عرض جميع المهام
            </Button>
          </CardContent>
        </Card>

        {/* الإجراءات السريعة */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate('/journal-entries')}
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm">قيد جديد</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate('/chart-of-accounts')}
              >
                <Calculator className="w-6 h-6" />
                <span className="text-sm">دليل الحسابات</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate('/financial-reports')}
              >
                <BarChart3 className="w-6 h-6" />
                <span className="text-sm">التقارير</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate('/accounting-validation')}
              >
                <Shield className="w-6 h-6" />
                <span className="text-sm">التدقيق</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تقدم المهام الشهرية */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>تقدم المهام الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">إقفال القيود</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">المطابقات البنكية</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">إعداد التقارير</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">المراجعة النهائية</span>
                <span className="text-sm text-muted-foreground">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};