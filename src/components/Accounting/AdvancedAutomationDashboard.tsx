
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { simpleAutomationService, SimpleAutomationRule } from '@/services/SimpleAutomationService';

export const AdvancedAutomationDashboard: React.FC = () => {
  const [rules, setRules] = useState<SimpleAutomationRule[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [rulesData, metricsData] = await Promise.all([
        simpleAutomationService.getAutomationRules(),
        simpleAutomationService.getPerformanceMetrics()
      ]);
      
      setRules(rulesData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await simpleAutomationService.updateAutomationRule(ruleId, { is_active: !isActive });
      await loadDashboardData();
    } catch (error) {
      console.error('Error toggling rule:', error);
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
      {/* مؤشرات الأداء */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">معدل الأتمتة</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.automation_rate || 0}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={metrics?.automation_rate || 0} className="flex-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">معدل الأخطاء</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics?.error_rate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">أقل من المعدل المطلوب</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">متوسط زمن المعالجة</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.processing_time_avg || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">أسرع من المتوقع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">توفير التكاليف</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.cost_savings?.toLocaleString() || 0} د.ك
            </div>
            <p className="text-xs text-muted-foreground">هذا الشهر</p>
          </CardContent>
        </Card>
      </div>

      {/* قواعد الأتمتة النشطة */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="rtl-title">قواعد الأتمتة النشطة</CardTitle>
            <Button variant="outline" size="sm" className="rtl-flex">
              <Settings className="w-4 h-4" />
              إدارة القواعد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.length > 0 ? (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{rule.rule_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {rule.rule_description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'نشط' : 'متوقف'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRule(rule.id, rule.is_active)}
                      className="rtl-flex"
                    >
                      {rule.is_active ? (
                        <>
                          <Pause className="w-4 h-4" />
                          إيقاف
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          تشغيل
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد قواعد أتمتة</h3>
                <p className="text-muted-foreground">
                  ابدأ بإنشاء قواعد لأتمتة القيود المحاسبية
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
