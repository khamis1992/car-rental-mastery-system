import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, 
  BarChart3, PieChart, Target, Zap, RefreshCw, Download,
  DollarSign, Calendar, Users, Building2, Activity
} from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { AIInsight } from '@/types/accounting';
import { formatCurrencyKWD } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  insights: AIInsight[];
  trends: {
    revenue_trend: number;
    expense_trend: number;
    profit_margin_trend: number;
    cash_flow_trend: number;
  };
  predictions: {
    next_month_revenue: number;
    next_month_expenses: number;
    cash_flow_forecast: number[];
    risk_factors: string[];
  };
  recommendations: {
    cost_optimization: string[];
    revenue_enhancement: string[];
    cash_management: string[];
    risk_mitigation: string[];
  };
}

export const AIFinancialAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('insights');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // محاكاة بيانات التحليلات الذكية
      const mockAnalytics: AnalyticsData = {
        insights: [
          {
            id: '1',
            insight_type: 'warning',
            insight_title: 'تحذير من انخفاض التدفق النقدي',
            insight_description: 'يُتوقع انخفاض التدفق النقدي بنسبة 15% خلال الشهر القادم بناءً على الاتجاهات الحالية',
            priority_level: 'high',
            affected_accounts: ['1110101', '1110201'],
            recommended_actions: [
              'تسريع عملية تحصيل الديون',
              'تأجيل المدفوعات غير الضرورية',
              'مراجعة شروط الدفع مع العملاء'
            ],
            created_at: new Date().toISOString(),
            is_dismissed: false
          },
          {
            id: '2',
            insight_type: 'opportunity',
            insight_title: 'فرصة لزيادة الإيرادات',
            insight_description: 'تحليل البيانات يُظهر إمكانية زيادة إيرادات تأجير السيارات الفاخرة بنسبة 25%',
            priority_level: 'medium',
            affected_accounts: ['4110101'],
            recommended_actions: [
              'توسيع أسطول السيارات الفاخرة',
              'تحسين استراتيجية التسعير',
              'زيادة جهود التسويق المستهدف'
            ],
            created_at: new Date().toISOString(),
            is_dismissed: false
          },
          {
            id: '3',
            insight_type: 'recommendation',
            insight_title: 'تحسين تكاليف الصيانة',
            insight_description: 'يمكن توفير 12% من تكاليف الصيانة من خلال تطبيق الصيانة الوقائية المجدولة',
            priority_level: 'medium',
            affected_accounts: ['5102'],
            recommended_actions: [
              'تطبيق برنامج صيانة وقائية',
              'تدريب الفنيين على أحدث التقنيات',
              'استخدام قطع غيار أصلية'
            ],
            created_at: new Date().toISOString(),
            is_dismissed: false
          }
        ],
        trends: {
          revenue_trend: 8.5,
          expense_trend: -3.2,
          profit_margin_trend: 12.3,
          cash_flow_trend: 5.7
        },
        predictions: {
          next_month_revenue: 125000,
          next_month_expenses: 85000,
          cash_flow_forecast: [15000, 18000, 22000, 19000, 25000],
          risk_factors: [
            'انخفاض في الطلب خلال فصل الصيف',
            'زيادة أسعار الوقود',
            'تأخير في تحصيل الديون'
          ]
        },
        recommendations: {
          cost_optimization: [
            'تحسين كفاءة استهلاك الوقود',
            'إعادة تفاوض عقود التأمين',
            'تحسين عمليات الجرد'
          ],
          revenue_enhancement: [
            'تطوير خدمات إضافية',
            'تحسين تجربة العملاء',
            'توسيع قنوات التسويق الرقمي'
          ],
          cash_management: [
            'تقصير دورة التحصيل',
            'تحسين إدارة المخزون',
            'استخدام أدوات التمويل قصير الأجل'
          ],
          risk_mitigation: [
            'تنويع مصادر الإيرادات',
            'إنشاء احتياطي نقدي',
            'تطوير خطط الطوارئ'
          ]
        }
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل التحليلات المالية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      if (analytics) {
        const updatedInsights = analytics.insights.map(insight =>
          insight.id === insightId ? { ...insight, is_dismissed: true } : insight
        );
        setAnalytics({ ...analytics, insights: updatedInsights });
      }
      toast({
        title: "تم",
        description: "تم تجاهل الرؤية",
      });
    } catch (error) {
      console.error('Error dismissing insight:', error);
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'غير محدد';
    }
  };

  const getTrendIcon = (value: number) => {
    return value > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
            <p>جاري تحليل البيانات المالية...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          لا توجد بيانات تحليلية متاحة حالياً
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            التحليلات المالية الذكية
          </h2>
          <p className="text-muted-foreground">تحليلات وتوقعات مدعومة بالذكاء الاصطناعي</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث التحليلات
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">اتجاه الإيرادات</p>
                <p className="text-xl font-bold text-green-600">
                  +{analytics.trends.revenue_trend.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(analytics.trends.revenue_trend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">اتجاه المصروفات</p>
                <p className="text-xl font-bold text-green-600">
                  {analytics.trends.expense_trend.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(analytics.trends.expense_trend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">هامش الربح</p>
                <p className="text-xl font-bold text-green-600">
                  +{analytics.trends.profit_margin_trend.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(analytics.trends.profit_margin_trend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">التدفق النقدي</p>
                <p className="text-xl font-bold text-green-600">
                  +{analytics.trends.cash_flow_trend.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(analytics.trends.cash_flow_trend)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">الرؤى الذكية</TabsTrigger>
          <TabsTrigger value="predictions">التنبؤات</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          <TabsTrigger value="risks">المخاطر</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {analytics.insights.filter(insight => !insight.is_dismissed).map((insight) => (
              <Card key={insight.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{insight.insight_title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={cn("border", getPriorityColor(insight.priority_level || 'medium'))}>
                          {getPriorityText(insight.priority_level || 'medium')}
                        </Badge>
                        <Badge variant="outline">{insight.insight_type}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => dismissInsight(insight.id)}
                    >
                      تجاهل
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{insight.insight_description}</p>
                  {insight.recommended_actions && insight.recommended_actions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">الإجراءات المقترحة:</h4>
                      <ul className="space-y-1">
                        {insight.recommended_actions.map((action, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  توقعات الشهر القادم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">الإيرادات المتوقعة</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrencyKWD(analytics.predictions.next_month_revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المصروفات المتوقعة</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrencyKWD(analytics.predictions.next_month_expenses)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الربح المتوقع</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrencyKWD(analytics.predictions.next_month_revenue - analytics.predictions.next_month_expenses)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  توقعات التدفق النقدي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.predictions.cash_flow_forecast.map((amount, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">الأسبوع {index + 1}</span>
                      <span className="font-medium">{formatCurrencyKWD(amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  تحسين التكاليف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.recommendations.cost_optimization.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  تعزيز الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.recommendations.revenue_enhancement.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-green-600" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  إدارة النقدية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.recommendations.cash_management.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  تخفيف المخاطر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analytics.recommendations.risk_mitigation.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-red-600" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                عوامل المخاطر المحتملة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.predictions.risk_factors.map((risk, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{risk}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};