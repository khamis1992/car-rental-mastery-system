import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon,
  AlertTriangle, CheckCircle, Clock, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  currentAssets: number;
  currentLiabilities: number;
  liquidityRatio: number;
  debtToEquityRatio: number;
  profitMargin: number;
  returnOnAssets: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashAndBanks: number;
  revenueGrowth: number;
}

interface AIInsight {
  id: string;
  insight_title: string;
  insight_description: string;
  insight_type: string;
  priority_level: string;
  is_dismissed: boolean;
  created_at: string;
  recommended_actions: string[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function AdvancedFinancialDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinancialMetrics = async () => {
    try {
      setRefreshing(true);
      
      // Call the edge function to calculate metrics
      const { data, error } = await supabase.functions.invoke('calculate-financial-metrics', {
        body: {
          tenantId: 'current', // This would be dynamic in production
          startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
          endDate: new Date().toISOString()
        }
      });

      if (error) throw error;
      
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      toast.error('فشل في تحميل المؤشرات المالية');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', insightId);

      if (error) throw error;
      
      setInsights(insights.filter(insight => insight.id !== insightId));
      toast.success('تم تجاهل الرؤية');
    } catch (error) {
      console.error('Error dismissing insight:', error);
      toast.error('فشل في تجاهل الرؤية');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFinancialMetrics(), fetchAIInsights()]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="mr-2">جارٍ تحميل البيانات...</span>
      </div>
    );
  }

  const pieData = metrics ? [
    { name: 'الأصول', value: metrics.totalAssets },
    { name: 'الخصوم', value: metrics.totalLiabilities },
    { name: 'حقوق الملكية', value: metrics.totalEquity }
  ] : [];

  const monthlyData = [
    { month: 'يناير', revenue: 15000, expenses: 10000 },
    { month: 'فبراير', revenue: 18000, expenses: 12000 },
    { month: 'مارس', revenue: 22000, expenses: 14000 },
    { month: 'أبريل', revenue: 19000, expenses: 13000 },
    { month: 'مايو', revenue: 25000, expenses: 16000 },
    { month: 'يونيو', revenue: 28000, expenses: 18000 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-right">لوحة المؤشرات المالية المتقدمة</h2>
        <Button 
          onClick={fetchFinancialMetrics} 
          disabled={refreshing}
          className="rtl-flex"
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right">{metrics.totalRevenue.toLocaleString()} د.ك</div>
              <p className="text-xs text-muted-foreground text-right">
                {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}% من الفترة السابقة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">صافي الدخل</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right">{metrics.netIncome.toLocaleString()} د.ك</div>
              <p className="text-xs text-muted-foreground text-right">
                هامش ربح: {metrics.profitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">نسبة السيولة</CardTitle>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right">{metrics.liquidityRatio.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground text-right">
                نسبة صحية: {metrics.liquidityRatio > 1 ? '✓' : '⚠️'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">النقد والبنوك</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right">{metrics.cashAndBanks.toLocaleString()} د.ك</div>
              <p className="text-xs text-muted-foreground text-right">
                السيولة النقدية المتاحة
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
          <TabsTrigger value="insights">الرؤى الذكية</TabsTrigger>
          <TabsTrigger value="analysis">التحليل المالي</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">الإيرادات مقابل المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="الإيرادات" />
                    <Bar dataKey="expenses" fill="hsl(var(--secondary))" name="المصروفات" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Balance Sheet Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">توزيع الميزانية العمومية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cash Flow Trend */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-right">اتجاه التدفق النقدي</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      name="الإيرادات"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2"
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive))" 
                      name="المصروفات"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-right">الرؤى الذكية والتنبيهات</h3>
            
            {insights.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">لا توجد تنبيهات في الوقت الحالي</p>
                </CardContent>
              </Card>
            ) : (
              insights.map((insight) => (
                <Card key={insight.id} className="border-r-4 border-r-primary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center space-x-2 flex-row-reverse">
                      <Badge variant={insight.priority_level === 'high' ? 'destructive' : 'secondary'}>
                        {insight.priority_level === 'high' ? 'عالي' : 
                         insight.priority_level === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                      {insight.insight_type === 'alert' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => dismissInsight(insight.id)}
                    >
                      تجاهل
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold text-right mb-2">{insight.insight_title}</h4>
                    <p className="text-muted-foreground text-right mb-4">{insight.insight_description}</p>
                    
                    {insight.recommended_actions && insight.recommended_actions.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-right mb-2">الإجراءات المقترحة:</h5>
                        <ul className="list-disc list-inside space-y-1 text-right">
                          {insight.recommended_actions.map((action, index) => (
                            <li key={index} className="text-sm text-muted-foreground">{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">نسب الربحية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.profitMargin.toFixed(1)}%</span>
                    <span className="text-right">هامش الربح الصافي</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.returnOnAssets.toFixed(1)}%</span>
                    <span className="text-right">العائد على الأصول</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-right">نسب السيولة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.liquidityRatio.toFixed(2)}</span>
                    <span className="text-right">نسبة السيولة الجارية</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.debtToEquityRatio.toFixed(2)}</span>
                    <span className="text-right">نسبة الدين إلى حقوق الملكية</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-right">الذمم المدينة والدائنة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.accountsReceivable.toLocaleString()} د.ك</span>
                    <span className="text-right">الذمم المدينة</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.accountsPayable.toLocaleString()} د.ك</span>
                    <span className="text-right">الذمم الدائنة</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-right">ملخص المراكز المالية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.totalAssets.toLocaleString()} د.ك</span>
                    <span className="text-right">إجمالي الأصول</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.totalLiabilities.toLocaleString()} د.ك</span>
                    <span className="text-right">إجمالي الخصوم</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{metrics.totalEquity.toLocaleString()} د.ك</span>
                    <span className="text-right">حقوق الملكية</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}