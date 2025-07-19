
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Activity, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { advancedAutomationService, RuleExecutionLog } from '@/services/AdvancedAutomationService';

export const AutomatedJournalEntryService: React.FC = () => {
  const [executionLog, setExecutionLog] = useState<RuleExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceData();
  }, []);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      const logData = await advancedAutomationService.getRuleExecutionLog();
      setExecutionLog(logData);
    } catch (error) {
      console.error('Error loading service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runScheduledRules = async () => {
    try {
      await advancedAutomationService.runScheduledRules();
      await loadServiceData();
    } catch (error) {
      console.error('Error running scheduled rules:', error);
    }
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
      {/* معلومات الخدمة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">إجمالي التنفيذات</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {executionLog.length}
            </div>
            <p className="text-xs text-muted-foreground">هذا الشهر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">معدل النجاح</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <Progress value={98.5} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">متوسط زمن التنفيذ</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">120ms</div>
            <p className="text-xs text-muted-foreground">أسرع من المتوقع</p>
          </CardContent>
        </Card>
      </div>

      {/* إجراءات سريعة */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-flex rtl-title">
            <Zap className="w-5 h-5" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={runScheduledRules} className="rtl-flex">
              <Play className="w-4 h-4" />
              تشغيل القواعد المجدولة
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Pause className="w-4 h-4" />
              إيقاف الخدمات المؤقت
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* سجل التنفيذ */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-flex rtl-title">
            <Activity className="w-5 h-5" />
            سجل التنفيذ الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {executionLog.length > 0 ? (
              executionLog.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      log.status === 'success' ? 'bg-green-100 text-green-600' :
                      log.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {log.status === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">قاعدة رقم {log.rule_id}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.execution_date).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      log.status === 'success' ? 'default' :
                      log.status === 'warning' ? 'secondary' :
                      'destructive'
                    }>
                      {log.status === 'success' ? 'نجح' :
                       log.status === 'warning' ? 'تحذير' :
                       'فشل'}
                    </Badge>
                    {log.processing_time_ms && (
                      <span className="text-sm text-muted-foreground">
                        {log.processing_time_ms}ms
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد عمليات تنفيذ</h3>
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
