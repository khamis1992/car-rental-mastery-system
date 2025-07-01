import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  CreditCard, 
  Activity,
  Brain,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { integrationService } from '@/services/integrationService';
import { useToast } from '@/hooks/use-toast';

export const IntegratedDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    loadFinancialForecast();
    
    // Setup real-time listeners
    integrationService.setupRealTimeListeners();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await integrationService.getIntegratedDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات لوحة التحكم",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialForecast = async () => {
    try {
      const forecast = await integrationService.generateFinancialForecast('revenue', 3);
      setForecastData(forecast);
    } catch (error) {
      console.error('Error loading forecast:', error);
    }
  };

  const handleAIClassification = async () => {
    try {
      const result = await integrationService.classifyAndCreateEntry({
        description: 'معاملة تجريبية',
        amount: 500,
        transaction_type: 'expense',
        transaction_id: 'test-' + Date.now()
      });

      toast({
        title: "تم التصنيف بالذكاء الاصطناعي",
        description: `تم إنشاء قيد محاسبي بثقة ${(result.classification.confidence_score * 100).toFixed(0)}%`
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في التصنيف بالذكاء الاصطناعي",
        variant: "destructive"
      });
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم الذكية</h1>
          <p className="text-muted-foreground">نظرة شاملة مع التكامل الذكي</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleAIClassification}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            تصنيف ذكي
          </Button>
          <Button 
            onClick={loadDashboardData}
            className="btn-primary flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Smart Alerts */}
      {dashboardData?.alerts?.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alerts.map((alert: any, index: number) => (
            <Alert key={index} className={`border-l-4 ${
              alert.priority === 'high' ? 'border-l-red-500' : 
              alert.priority === 'medium' ? 'border-l-orange-500' : 'border-l-blue-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{alert.title}</strong>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                  <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                    {alert.priority === 'high' ? 'عالي' : alert.priority === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {dashboardData?.kpis?.map((kpi: any, index: number) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{kpi.name}</p>
                  <p className="text-2xl font-bold">{kpi.value} {kpi.unit}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(kpi.trend)}
                    <span className={`text-sm ${getTrendColor(kpi.trend)}`}>
                      {kpi.trend === 'up' ? 'متزايد' : kpi.trend === 'down' ? 'متناقص' : 'مستقر'}
                    </span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">الملخص المالي</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات الحديثة</TabsTrigger>
          <TabsTrigger value="forecast">التنبؤات المالية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات الذكية</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  الملخص المالي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>إجمالي الإيرادات</span>
                  <span className="font-bold text-green-600">
                    {dashboardData?.financial_summary?.total_revenue?.toLocaleString()} د.ك
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>المبالغ المحصلة</span>
                  <span className="font-bold text-blue-600">
                    {dashboardData?.financial_summary?.cash_received?.toLocaleString()} د.ك
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>المستحقات</span>
                  <span className="font-bold text-orange-600">
                    {dashboardData?.financial_summary?.outstanding_receivables?.toLocaleString()} د.ك
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">صافي الدخل</span>
                    <span className="font-bold text-lg text-primary">
                      {dashboardData?.financial_summary?.net_income?.toLocaleString()} د.ك
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  معدل التحصيل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {dashboardData?.financial_summary?.total_revenue > 0 
                        ? ((dashboardData?.financial_summary?.cash_received / dashboardData?.financial_summary?.total_revenue) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">من إجمالي المستحقات</p>
                  </div>
                  <Progress 
                    value={dashboardData?.financial_summary?.total_revenue > 0 
                      ? (dashboardData?.financial_summary?.cash_received / dashboardData?.financial_summary?.total_revenue) * 100
                      : 0} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>محصل</span>
                    <span>مستحق</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>المعاملات الحديثة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recent_transactions?.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.type === 'contract' ? 'bg-green-500' : 
                        transaction.type === 'payment' ? 'bg-blue-500' : 'bg-orange-500'
                      }`} />
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('ar')} • {transaction.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{transaction.amount.toLocaleString()} د.ك</p>
                      <Badge variant={transaction.status === 'posted' ? 'default' : 'secondary'}>
                        {transaction.status === 'posted' ? 'مرحل' : 'مسودة'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                التنبؤات المالية بالذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              {forecastData ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg">توقعات الإيرادات للأشهر القادمة</h3>
                    <p className="text-sm text-muted-foreground">{forecastData.analysis}</p>
                  </div>
                  
                  {forecastData.forecasts?.map((forecast: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{forecast.period}</span>
                        <span className="text-lg font-bold text-primary">
                          {forecast.predicted_value?.toLocaleString()} د.ك
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>نطاق الثقة: {forecast.confidence_low?.toLocaleString()} - {forecast.confidence_high?.toLocaleString()} د.ك</span>
                        <span>دقة متوقعة: {(forecast.accuracy_estimate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}

                  {forecastData.recommendations?.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        التوصيات الذكية
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {forecastData.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>جاري تحميل التنبؤات المالية...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>تحليل الأداء المالي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>العقود الجديدة هذا الشهر</span>
                    <span className="font-bold">+15%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span>معدل تجديد العقود</span>
                    <span className="font-bold">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span>رضا العملاء</span>
                    <span className="font-bold">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>التحليل الذكي للاتجاهات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">اتجاه إيجابي</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                      نمو الإيرادات يتسارع مقارنة بالفترة السابقة
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-700 dark:text-blue-400">توصية</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                      يُنصح بزيادة الاستثمار في التسويق الرقمي
                    </p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-orange-700 dark:text-orange-400">تنبيه</span>
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                      ارتفاع طفيف في تكاليف الصيانة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};