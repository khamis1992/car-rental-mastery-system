
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Play, 
  Pause, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Shield,
  Zap,
  Target,
  Activity,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { advancedAutomationService, AdvancedAutomationRule, AccountingKPI, ErrorCorrectionTool } from '@/services/AdvancedAutomationService';

export const AdvancedAutomationDashboard: React.FC = () => {
  const [rules, setRules] = useState<AdvancedAutomationRule[]>([]);
  const [kpis, setKpis] = useState<AccountingKPI[]>([]);
  const [tools, setTools] = useState<ErrorCorrectionTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [rulesData, kpisData, toolsData] = await Promise.all([
        advancedAutomationService.getAutomationRules(),
        advancedAutomationService.getAccountingKPIs(),
        advancedAutomationService.getErrorCorrectionTools()
      ]);

      setRules(rulesData);
      setKpis(kpisData);
      setTools(toolsData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      await advancedAutomationService.updateAutomationRule(ruleId, { is_active: !isActive });
      await loadDashboardData();
      toast.success(isActive ? 'تم إيقاف القاعدة' : 'تم تفعيل القاعدة');
    } catch (error) {
      toast.error('حدث خطأ في تحديث القاعدة');
    }
  };

  const executeRule = async (ruleId: string) => {
    try {
      setLoading(true);
      await advancedAutomationService.executeAutomationRule(ruleId);
      await loadDashboardData();
      toast.success('تم تنفيذ القاعدة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في تنفيذ القاعدة');
    } finally {
      setLoading(false);
    }
  };

  const getKPIIcon = (kpiType: string) => {
    switch (kpiType) {
      case 'automation_rate':
        return <Zap className="w-4 h-4" />;
      case 'error_rate':
        return <AlertTriangle className="w-4 h-4" />;
      case 'processing_time':
        return <Clock className="w-4 h-4" />;
      case 'accuracy_score':
        return <Target className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getKPIColor = (current: number, target?: number) => {
    if (!target) return 'text-blue-600';
    
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <Pause className="w-4 h-4 text-gray-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-600" />;
    }
  };

  // حساب الإحصائيات
  const activeRulesCount = rules.filter(r => r.is_active).length;
  const totalExecutions = rules.reduce((sum, r) => sum + r.execution_count, 0);
  const totalSuccesses = rules.reduce((sum, r) => sum + r.success_count, 0);
  const successRate = totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لوحة تحكم الأتمتة المتقدمة</h2>
          <p className="text-muted-foreground">مراقبة وإدارة نظام المعاملات المحاسبية الآلية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData} disabled={loading} className="rtl-flex">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" className="rtl-flex">
            <Settings className="w-4 h-4" />
            الإعدادات
          </Button>
        </div>
      </div>

      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">القواعد النشطة</p>
                <p className="text-2xl font-bold">{activeRulesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التنفيذات</p>
                <p className="text-2xl font-bold">{totalExecutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">معدل النجاح</p>
                <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">أدوات التصحيح</p>
                <p className="text-2xl font-bold">{tools.filter(t => t.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="rules">القواعد</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="correction">التصحيح</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* مؤشرات الأداء الرئيسية */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-flex">
                <TrendingUp className="w-5 h-5" />
                مؤشرات الأداء الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                  <div key={kpi.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getKPIIcon(kpi.kpi_type)}
                        <span className="font-medium">{kpi.kpi_name}</span>
                      </div>
                      <span className={`text-lg font-bold ${getKPIColor(kpi.current_value || 0, kpi.target_value)}`}>
                        {kpi.current_value?.toFixed(1)}%
                      </span>
                    </div>
                    {kpi.target_value && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>الهدف: {kpi.target_value}%</span>
                          <span>{((kpi.current_value || 0) / kpi.target_value * 100).toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={(kpi.current_value || 0) / kpi.target_value * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>قواعد الأتمتة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(rule.is_active ? 'active' : 'inactive')}
                      <div>
                        <h4 className="font-medium">{rule.rule_name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.rule_description}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">
                            {rule.trigger_event}
                          </Badge>
                          {rule.schedule_type && (
                            <Badge variant="outline">
                              {rule.schedule_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {rule.success_count}
                        </div>
                        <div className="text-xs text-muted-foreground">نجح</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {rule.failure_count}
                        </div>
                        <div className="text-xs text-muted-foreground">فشل</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeRule(rule.id)}
                          disabled={loading || !rule.is_active}
                          className="rtl-flex"
                        >
                          <Play className="w-4 h-4" />
                          تنفيذ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                          disabled={loading}
                        >
                          {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معدل الأتمتة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {kpis.find(k => k.kpi_type === 'automation_rate')?.current_value?.toFixed(1) || '0.0'}%
                </div>
                <p className="text-sm text-muted-foreground">
                  من إجمالي القيود المحاسبية يتم إنشاؤها تلقائياً
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معدل الأخطاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {kpis.find(k => k.kpi_type === 'error_rate')?.current_value?.toFixed(1) || '0.0'}%
                </div>
                <p className="text-sm text-muted-foreground">
                  معدل فشل تنفيذ القواعد الآلية
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="correction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-flex">
                <Shield className="w-5 h-5" />
                أدوات التصحيح والمراقبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <div key={tool.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{tool.tool_name}</h4>
                      <Badge variant={tool.is_active ? 'default' : 'secondary'}>
                        {tool.is_active ? 'نشط' : 'متوقف'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">الاكتشافات:</span>
                        <span className="font-medium ml-1">{tool.findings_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الإصلاحات:</span>
                        <span className="font-medium ml-1">{tool.fixes_applied}</span>
                      </div>
                    </div>
                    {tool.last_run_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        آخر تشغيل: {new Date(tool.last_run_date).toLocaleDateString('ar-SA')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
