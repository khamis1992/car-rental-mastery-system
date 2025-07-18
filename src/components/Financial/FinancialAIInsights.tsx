import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'trend' | 'alert' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

interface FinancialAIInsightsProps {
  className?: string;
}

export const FinancialAIInsights: React.FC<FinancialAIInsightsProps> = ({ className = '' }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenInsights, setHiddenInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    // محاكاة جلب الرؤى الذكية
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'trend',
        title: 'اتجاه متزايد في الإيرادات',
        description: 'الإيرادات تتزايد بنسبة 15% شهرياً في الربع الحالي',
        confidence: 92,
        impact: 'high',
        actionable: true,
        data: { trend: 'increasing', percentage: 15 }
      },
      {
        id: '2',
        type: 'alert',
        title: 'تنبيه: زيادة في المصروفات',
        description: 'المصروفات التشغيلية تجاوزت الميزانية بنسبة 8%',
        confidence: 87,
        impact: 'medium',
        actionable: true,
        data: { category: 'operational', overBudget: 8 }
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'فرصة تحسين التدفق النقدي',
        description: 'يمكن تحسين التدفق النقدي بتقليل فترة التحصيل إلى 30 يوم',
        confidence: 78,
        impact: 'high',
        actionable: true,
        data: { currentDays: 45, targetDays: 30 }
      },
      {
        id: '4',
        type: 'recommendation',
        title: 'توصية: إعادة تقييم الاستثمارات',
        description: 'بعض الاستثمارات تحتاج إعادة تقييم لتحسين العائد',
        confidence: 65,
        impact: 'medium',
        actionable: false,
        data: { portfolioPerformance: 'below_average' }
      }
    ];

    setTimeout(() => {
      setInsights(mockInsights);
      setLoading(false);
    }, 1000);
  }, []);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'opportunity': return Target;
      case 'recommendation': return Lightbulb;
      default: return Brain;
    }
  };

  const getInsightColor = (type: AIInsight['type'], impact: AIInsight['impact']) => {
    if (type === 'alert') return 'text-red-500';
    if (type === 'opportunity') return 'text-green-500';
    if (impact === 'high') return 'text-blue-500';
    return 'text-yellow-500';
  };

  const hideInsight = (insightId: string) => {
    setHiddenInsights(prev => new Set([...prev, insightId]));
  };

  const showInsight = (insightId: string) => {
    setHiddenInsights(prev => {
      const newSet = new Set(prev);
      newSet.delete(insightId);
      return newSet;
    });
  };

  const visibleInsights = insights.filter(insight => !hiddenInsights.has(insight.id));
  const hiddenCount = hiddenInsights.size;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Brain className="w-5 h-5" />
            الرؤى الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
            <span>جاري تحليل البيانات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="rtl-title flex items-center gap-2">
            <Brain className="w-5 h-5" />
            الرؤى الذكية
            <Badge variant="secondary">{visibleInsights.length}</Badge>
          </CardTitle>
          {hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHiddenInsights(new Set())}
            >
              <Eye className="w-4 h-4 ml-1" />
              إظهار المخفية ({hiddenCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleInsights.map((insight) => {
          const Icon = getInsightIcon(insight.type);
          const colorClass = getInsightColor(insight.type, insight.impact);
          
          return (
            <div
              key={insight.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`w-5 h-5 mt-0.5 ${colorClass}`} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge 
                        variant={insight.impact === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.impact === 'high' ? 'تأثير عالي' : 
                         insight.impact === 'medium' ? 'تأثير متوسط' : 'تأثير منخفض'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>الثقة: {insight.confidence}%</span>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-xs">قابل للتنفيذ</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => hideInsight(insight.id)}
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                  {insight.actionable && (
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {visibleInsights.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد رؤى جديدة في الوقت الحالي</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};