import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Lightbulb,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";

interface AIInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'trend' | 'anomaly';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  recommendation: string;
  action?: string;
  amount?: number;
  date: string;
}

interface PredictiveAnalysis {
  metric: string;
  current: number;
  predicted: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  period: string;
}

export const AIInsights = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictiveAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    // محاكاة تحليل البيانات بالذكاء الاصطناعي
    const loadInsights = async () => {
      setIsAnalyzing(true);
      
      // محاكاة تأخير التحليل
      setTimeout(() => {
        setInsights([
          {
            id: '1',
            type: 'warning',
            title: 'ارتفاع غير طبيعي في مصروفات الوقود',
            description: 'تم رصد زيادة بنسبة 35% في مصروفات الوقود مقارنة بالشهر الماضي',
            impact: 'high',
            confidence: 92,
            recommendation: 'مراجعة استهلاك المركبات وأسعار الوقود',
            action: 'تحقق من سجلات الاستهلاك',
            amount: 2450,
            date: '2024-01-15'
          },
          {
            id: '2',
            type: 'opportunity',
            title: 'فرصة توفير في تكاليف الصيانة',
            description: 'يمكن تقليل تكاليف الصيانة بنسبة 20% من خلال جدولة الصيانة الوقائية',
            impact: 'medium',
            confidence: 85,
            recommendation: 'تطبيق نظام الصيانة الوقائية المجدولة',
            action: 'إنشاء خطة صيانة شهرية',
            amount: 1200,
            date: '2024-01-14'
          },
          {
            id: '3',
            type: 'trend',
            title: 'نمو مستقر في الإيرادات',
            description: 'نمو ثابت بمعدل 8% شهرياً في إيرادات تأجير السيارات',
            impact: 'high',
            confidence: 96,
            recommendation: 'الاستمرار في الاستراتيجية الحالية مع زيادة الاستثمار',
            amount: 15000,
            date: '2024-01-13'
          },
          {
            id: '4',
            type: 'anomaly',
            title: 'مدفوعات غير اعتيادية',
            description: 'رصد معاملات مالية غير اعتيادية في حساب المصروفات الإدارية',
            impact: 'medium',
            confidence: 78,
            recommendation: 'مراجعة فورية للمعاملات المشبوهة',
            action: 'فحص السجلات المالية',
            amount: 850,
            date: '2024-01-12'
          }
        ]);

        setPredictions([
          {
            metric: 'الإيرادات الشهرية',
            current: 45000,
            predicted: 48600,
            trend: 'up',
            confidence: 89,
            period: 'الشهر القادم'
          },
          {
            metric: 'تكاليف التشغيل',
            current: 28000,
            predicted: 26500,
            trend: 'down',
            confidence: 82,
            period: 'الشهر القادم'
          },
          {
            metric: 'صافي الربح',
            current: 17000,
            predicted: 22100,
            trend: 'up',
            confidence: 91,
            period: 'الشهر القادم'
          },
          {
            metric: 'معدل استخدام الأسطول',
            current: 75,
            predicted: 78,
            trend: 'up',
            confidence: 85,
            period: 'الأسبوع القادم'
          }
        ]);
        
        setIsAnalyzing(false);
      }, 2000);
    };

    loadInsights();
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'opportunity': return <Target className="h-5 w-5 text-green-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'anomaly': return <Zap className="h-5 w-5 text-red-500" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              جاري تحليل البيانات بالذكاء الاصطناعي...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <div className="space-y-2 flex-1">
                <p className="text-sm text-muted-foreground">تحليل الأنماط المالية والاتجاهات...</p>
                <Progress value={75} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الرؤى</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">تنبيهات عالية</p>
                <p className="text-2xl font-bold text-red-600">
                  {insights.filter(i => i.impact === 'high').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">فرص التحسين</p>
                <p className="text-2xl font-bold text-green-600">
                  {insights.filter(i => i.type === 'opportunity').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط الثقة</p>
                <p className="text-2xl font-bold">
                  {Math.round(insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              الرؤى والتوصيات الذكية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h4 className="font-medium">{insight.title}</h4>
                      </div>
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact === 'high' ? 'عالي' : 
                         insight.impact === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>مستوى الثقة: {insight.confidence}%</span>
                      {insight.amount && (
                        <span className="font-medium">
                          {insight.amount.toLocaleString()} د.ك
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-muted/50 rounded p-3 space-y-2">
                      <p className="text-sm font-medium">التوصية:</p>
                      <p className="text-sm">{insight.recommendation}</p>
                      {insight.action && (
                        <Button size="sm" variant="outline" className="mt-2">
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Predictive Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              التنبؤات المالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {predictions.map((prediction, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{prediction.metric}</span>
                    {getTrendIcon(prediction.trend)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">القيمة الحالية</p>
                      <p className="font-bold text-lg">
                        {typeof prediction.current === 'number' && prediction.current > 1000 
                          ? `${prediction.current.toLocaleString()} د.ك`
                          : `${prediction.current}${prediction.metric.includes('معدل') ? '%' : ''}`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">التوقع ({prediction.period})</p>
                      <p className={`font-bold text-lg ${
                        prediction.trend === 'up' ? 'text-green-600' : 
                        prediction.trend === 'down' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {typeof prediction.predicted === 'number' && prediction.predicted > 1000 
                          ? `${prediction.predicted.toLocaleString()} د.ك`
                          : `${prediction.predicted}${prediction.metric.includes('معدل') ? '%' : ''}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>مستوى الثقة</span>
                      <span>{prediction.confidence}%</span>
                    </div>
                    <Progress value={prediction.confidence} className="h-2" />
                  </div>
                  
                  <Separator />
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">آخر تحديث للتنبؤات</span>
              </div>
              <p className="text-xs text-muted-foreground">
                تم تحديث التنبؤات منذ 5 دقائق • التحديث التالي خلال 55 دقيقة
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};