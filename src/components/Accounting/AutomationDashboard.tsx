import React, { useState, useEffect } from 'react';
import { Play, Pause, Settings, Activity, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { automationService, AutomationRule, AutomationLog } from '@/services/AutomationService';
import { useToast } from '@/hooks/use-toast';

export const AutomationDashboard = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setRules(automationService.getRules());
    setLogs(automationService.getLogs());
  };

  const handleStartAutomation = async () => {
    try {
      await automationService.startAutomation();
      setIsRunning(true);
      toast({
        title: 'تم بنجاح',
        description: 'تم بدء تشغيل نظام الأتمتة',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في بدء تشغيل نظام الأتمتة',
        variant: 'destructive',
      });
    }
  };

  const handleStopAutomation = async () => {
    try {
      await automationService.stopAutomation();
      setIsRunning(false);
      toast({
        title: 'تم بنجاح',
        description: 'تم إيقاف نظام الأتمتة',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إيقاف نظام الأتمتة',
        variant: 'destructive',
      });
    }
  };

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    automationService.updateRule(ruleId, { isActive });
    loadData();
    
    toast({
      title: 'تم التحديث',
      description: `تم ${isActive ? 'تفعيل' : 'إيقاف'} القاعدة`,
    });
  };

  const handleTriggerRule = async (ruleId: string) => {
    try {
      await automationService.triggerRule(ruleId);
      loadData();
      toast({
        title: 'تم بنجاح',
        description: 'تم تشغيل المهمة يدوياً',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تشغيل المهمة',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSuccessRate = (rule: AutomationRule) => {
    if (rule.runCount === 0) return 0;
    return Math.round((rule.successCount / rule.runCount) * 100);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}ث`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}د`;
  };

  return (
    <div className="space-y-6">
      {/* لوحة التحكم الرئيسية */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {isRunning ? (
                <Button onClick={handleStopAutomation} variant="outline" className="rtl-flex">
                  <Pause className="w-4 h-4" />
                  إيقاف الأتمتة
                </Button>
              ) : (
                <Button onClick={handleStartAutomation} className="rtl-flex">
                  <Play className="w-4 h-4" />
                  تشغيل الأتمتة
                </Button>
              )}
            </div>
            <CardTitle className="rtl-title flex items-center gap-2">
              <Activity className="w-5 h-5" />
              لوحة تحكم الأتمتة المحاسبية
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{rules.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي القواعد</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rules.filter(r => r.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">قواعد نشطة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {rules.reduce((sum, r) => sum + r.runCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي التشغيلات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {logs.filter(l => l.status === 'running').length}
              </div>
              <div className="text-sm text-muted-foreground">مهام قيد التشغيل</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">سجل العمليات</TabsTrigger>
          <TabsTrigger value="rules">قواعد الأتمتة</TabsTrigger>
        </TabsList>

        {/* قواعد الأتمتة */}
        <TabsContent value="rules">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>قواعد الأتمتة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الإجراءات</TableHead>
                    <TableHead className="text-right">معدل النجاح</TableHead>
                    <TableHead className="text-right">عدد التشغيلات</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">اسم القاعدة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTriggerRule(rule.id)}
                            disabled={!rule.isActive}
                          >
                            تشغيل الآن
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRule(rule.id)}
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm font-medium">
                            {getSuccessRate(rule)}%
                          </span>
                          <Progress 
                            value={getSuccessRate(rule)} 
                            className="w-16"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-center">
                          <div className="font-medium">{rule.runCount}</div>
                          <div className="text-xs text-muted-foreground">
                            نجح: {rule.successCount} | فشل: {rule.errorCount}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {rule.type === 'scheduled' ? 'مجدولة' : 
                           rule.type === 'trigger' ? 'مشروطة' : 'يدوية'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                          />
                          <span className="text-sm">
                            {rule.isActive ? 'نشطة' : 'متوقفة'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* سجل العمليات */}
        <TabsContent value="logs">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>سجل العمليات التلقائية</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المدة</TableHead>
                    <TableHead className="text-right">الوقت</TableHead>
                    <TableHead className="text-right">الرسالة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المهمة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 20).map((log) => {
                    const rule = rules.find(r => r.id === log.ruleId);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-right">
                          {formatDuration(log.duration)}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.startTime.toLocaleString('ar-KW')}
                        </TableCell>
                        <TableCell className="text-right max-w-xs truncate">
                          {log.message}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {getStatusIcon(log.status)}
                            <span className="text-sm">
                              {log.status === 'success' ? 'نجح' :
                               log.status === 'error' ? 'فشل' :
                               log.status === 'running' ? 'قيد التشغيل' : log.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {rule?.name || 'مهمة غير معروفة'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد عمليات مسجلة بعد
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};