import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Calendar, 
  Bell, 
  FileText, 
  TrendingUp,
  Settings,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  frequency: string;
  lastRun?: Date;
  nextRun?: Date;
  success: boolean;
}

interface FinancialAutomationProps {
  className?: string;
}

export const FinancialAutomation: React.FC<FinancialAutomationProps> = ({ className = '' }) => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'تقارير شهرية تلقائية',
      description: 'إنشاء التقارير المالية الشهرية تلقائياً',
      trigger: 'نهاية كل شهر',
      action: 'إنشاء التقرير وإرساله',
      isActive: true,
      frequency: 'شهرياً',
      lastRun: new Date(2024, 0, 1),
      nextRun: new Date(2024, 1, 1),
      success: true
    },
    {
      id: '2',
      name: 'تنبيهات تجاوز الميزانية',
      description: 'تنبيه عند تجاوز 80% من الميزانية المحددة',
      trigger: 'تجاوز حد الميزانية',
      action: 'إرسال تنبيه للمديرين',
      isActive: true,
      frequency: 'فوري',
      lastRun: new Date(2024, 0, 15),
      success: true
    },
    {
      id: '3',
      name: 'تسوية الحسابات التلقائية',
      description: 'تسوية الحسابات البنكية تلقائياً',
      trigger: 'يومياً في الساعة 6 صباحاً',
      action: 'تسوية البيانات المصرفية',
      isActive: false,
      frequency: 'يومياً',
      lastRun: new Date(2024, 0, 10),
      nextRun: new Date(2024, 0, 18),
      success: false
    },
    {
      id: '4',
      name: 'تذكير بالفواتير المستحقة',
      description: 'تذكير العملاء بالفواتير المستحقة',
      trigger: 'قبل 3 أيام من الاستحقاق',
      action: 'إرسال تذكير بالبريد الإلكتروني',
      isActive: true,
      frequency: 'حسب الاستحقاق',
      lastRun: new Date(2024, 0, 16),
      success: true
    }
  ]);

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ));
  };

  const runRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, lastRun: new Date(), success: true }
        : rule
    ));
  };

  const activeRulesCount = rules.filter(rule => rule.isActive).length;
  const successfulRulesCount = rules.filter(rule => rule.success).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="rtl-title flex items-center gap-2">
            <Zap className="w-5 h-5" />
            الأتمتة المالية
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default">{activeRulesCount} نشط</Badge>
            <Badge variant="secondary">{successfulRulesCount} ناجح</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Play className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">القواعد النشطة</span>
            </div>
            <p className="text-lg font-bold">{activeRulesCount}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">التنفيذ الناجح</span>
            </div>
            <p className="text-lg font-bold">{successfulRulesCount}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">التنفيذ القادم</span>
            </div>
            <p className="text-lg font-bold">2</p>
          </div>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge 
                      variant={rule.isActive ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {rule.isActive ? 'نشط' : 'متوقف'}
                    </Badge>
                    {rule.success && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>المحفز: {rule.trigger}</span>
                    <span>التكرار: {rule.frequency}</span>
                    {rule.lastRun && (
                      <span>آخر تنفيذ: {rule.lastRun.toLocaleDateString('ar-SA')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runRule(rule.id)}
                    disabled={!rule.isActive}
                  >
                    تشغيل الآن
                  </Button>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            إدارة قواعد الأتمتة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};