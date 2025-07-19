
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Play,
  Settings,
  BarChart3
} from 'lucide-react';

interface ServiceStats {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_processing_time: number;
  success_rate: number;
}

interface ExecutionLog {
  id: string;
  rule_name: string;
  execution_date: string;
  status: 'success' | 'failed' | 'pending';
  processing_time_ms: number;
  journal_entry_id?: string;
  error_message?: string;
}

export const AutomatedJournalEntryService: React.FC = () => {
  const [stats, setStats] = useState<ServiceStats>({
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
    average_processing_time: 0,
    success_rate: 0
  });
  
  const [executionLog, setExecutionLog] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceData();
  }, []);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      
      // محاكاة تحميل البيانات
      const mockStats: ServiceStats = {
        total_executions: 1247,
        successful_executions: 1198,
        failed_executions: 49,
        average_processing_time: 145,
        success_rate: 96.1
      };

      const mockLog: ExecutionLog[] = [
        {
          id: '1',
          rule_name: 'قيود الفواتير التلقائية',
          execution_date: new Date().toISOString(),
          status: 'success',
          processing_time_ms: 120,
          journal_entry_id: 'JE-2024-001'
        },
        {
          id: '2',
          rule_name: 'قيود المدفوعات النقدية',
          execution_date: new Date(Date.now() - 3600000).toISOString(),
          status: 'success',
          processing_time_ms: 95,
          journal_entry_id: 'JE-2024-002'
        },
        {
          id: '3',
          rule_name: 'قيود صيانة المركبات',
          execution_date: new Date(Date.now() - 7200000).toISOString(),
          status: 'failed',
          processing_time_ms: 200,
          error_message: 'فشل في تحديد الحساب المدين'
        }
      ];

      setStats(mockStats);
      setExecutionLog(mockLog);
    } catch (error) {
      console.error('Error loading service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const statusLabels = {
    success: 'نجح',
    failed: 'فشل',
    pending: 'معلق'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات الخدمة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">إجمالي التنفيذات</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_executions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">منذ بداية الشهر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">معدل النجاح</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.success_rate}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={stats.success_rate} className="flex-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">متوسط وقت المعالجة</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.average_processing_time}ms</div>
            <p className="text-xs text-muted-foreground">أسرع من المتوقع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">التنفيذات الفاشلة</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed_executions}</div>
            <p className="text-xs text-muted-foreground">تحتاج مراجعة</p>
          </CardContent>
        </Card>
      </div>

      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="rtl-title">إدارة الخدمات الآلية</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="rtl-flex">
                <Settings className="w-4 h-4" />
                الإعدادات
              </Button>
              <Button className="rtl-flex">
                <Play className="w-4 h-4" />
                تشغيل يدوي
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <h4 className="font-medium">خدمة القيود التلقائية</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                تولد القيود المحاسبية تلقائياً عند حدوث المعاملات
              </p>
              <Badge variant="default">نشط</Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h4 className="font-medium">خدمة التحقق التلقائي</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                تتحقق من توازن القيود وصحة البيانات
              </p>
              <Badge variant="default">نشط</Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h4 className="font-medium">خدمة التقارير الآلية</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                تولد التقارير المالية بشكل دوري
              </p>
              <Badge variant="secondary">قيد التطوير</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* سجل التنفيذ */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">سجل التنفيذ الأخير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executionLog.length > 0 ? (
              executionLog.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <h4 className="font-medium">{log.rule_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.execution_date).toLocaleString('ar-SA')}
                      </p>
                      {log.error_message && (
                        <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {log.processing_time_ms}ms
                    </span>
                    <Badge variant={getStatusColor(log.status) as any}>
                      {statusLabels[log.status]}
                    </Badge>
                    {log.journal_entry_id && (
                      <Button variant="ghost" size="sm">
                        عرض القيد
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد تنفيذات</h3>
                <p className="text-muted-foreground">
                  لم يتم تنفيذ أي قواعد أتمتة حتى الآن
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
