import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Calculator,
  Target,
  Activity,
  Brain,
  BarChart3,
  Zap,
  Shield,
  FileText,
  Eye,
  Settings
} from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { accountingService } from '@/services/accountingService';
import { 
  AdvancedKPI, 
  AIInsight, 
  FinancialSummary, 
  LiquidityRatios, 
  FixedAsset,
  Budget 
} from '@/types/accounting';

interface DashboardStats {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  profitMargin: number;
}

export const EnhancedAccountingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    netIncome: 0,
    currentRatio: 0,
    quickRatio: 0,
    cashRatio: 0,
    profitMargin: 0
  });
  const [kpis, setKpis] = useState<AdvancedKPI[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [liquidityRatios, setLiquidityRatios] = useState<LiquidityRatios | null>(null);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // تحميل البيانات المتوازي لتحسين الأداء
      const [
        kpisData,
        insightsData,
        financialSummaryData,
        liquidityData,
        assetsData,
        budgetsData
      ] = await Promise.all([
        accountingService.getAdvancedKPIs(),
        accountingService.getAIInsights(),
        accountingService.getFinancialSummary(),
        accountingService.getLiquidityRatios(),
        accountingService.getFixedAssets(),
        accountingService.getBudgets()
      ]);

      setKpis(kpisData);
      setInsights(insightsData);
      setFinancialSummary(financialSummaryData);
      setLiquidityRatios(liquidityData);
      setFixedAssets(assetsData);
      setBudgets(budgetsData);

      // تحديث الإحصائيات
      if (financialSummaryData && liquidityData) {
        setStats({
          totalAssets: financialSummaryData.financial_position.total_assets,
          totalLiabilities: financialSummaryData.financial_position.total_liabilities,
          totalEquity: financialSummaryData.financial_position.total_equity,
          netIncome: financialSummaryData.income_statement.net_income,
          currentRatio: liquidityData.current_ratio,
          quickRatio: liquidityData.quick_ratio,
          cashRatio: liquidityData.cash_ratio,
          profitMargin: financialSummaryData.income_statement.profit_margin_pct
        });
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshKPIs = async () => {
    try {
      await accountingService.calculateAllKPIs();
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing KPIs:', error);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      await accountingService.dismissAIInsight(insightId);
      setInsights(insights.filter(insight => insight.id !== insightId));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const getKPIStatusColor = (kpi: AdvancedKPI) => {
    if (!kpi.current_value || !kpi.target_value) return 'bg-gray-500';
    
    const ratio = kpi.current_value / kpi.target_value;
    if (ratio >= 0.9) return 'bg-green-500';
    if (ratio >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'anomaly': return <Zap className="h-4 w-4 text-red-500" />;
      case 'recommendation': return <Brain className="h-4 w-4 text-blue-500" />;
      case 'trend': return <BarChart3 className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const mainStats = [
    {
      title: "إجمالي الأصول",
      value: formatCurrencyKWD(stats.totalAssets),
      icon: <DollarSign className="h-6 w-6 text-green-500" />,
      change: "+0%",
      trend: "up"
    },
    {
      title: "صافي الدخل",
      value: formatCurrencyKWD(stats.netIncome),
      icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
      change: "+0%",
      trend: stats.netIncome >= 0 ? "up" : "down"
    },
    {
      title: "نسبة السيولة الجارية",
      value: stats.currentRatio.toFixed(2),
      icon: <PieChart className="h-6 w-6 text-purple-500" />,
      change: "0%",
      trend: stats.currentRatio >= 1.5 ? "up" : "down"
    },
    {
      title: "هامش الربح",
      value: `${stats.profitMargin.toFixed(2)}%`,
      icon: <Target className="h-6 w-6 text-orange-500" />,
      change: "0%",
      trend: stats.profitMargin >= 15 ? "up" : "down"
    }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="mr-3">جاري تحميل لوحة التحكم المحاسبية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* العنوان والأزرار */}
      <div className="rtl-header mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم المحاسبية المتقدمة</h1>
          <p className="text-muted-foreground">نظرة شاملة على الوضع المالي والمؤشرات المحاسبية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshKPIs} className="rtl-button">
            <Calculator className="w-4 h-4" />
            تحديث المؤشرات
          </Button>
          <Button variant="outline" className="rtl-button">
            <FileText className="w-4 h-4" />
            تصدير التقرير
          </Button>
          <Button className="btn-primary rtl-button">
            <Settings className="w-4 h-4" />
            الإعدادات المتقدمة
          </Button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-4">
              <div className="rtl-info-item justify-between">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="rtl-stats mt-1">
                    <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">من الشهر الماضي</span>
                  </div>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="kpis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="kpis">المؤشرات المالية</TabsTrigger>
          <TabsTrigger value="insights">رؤى الذكاء الاصطناعي</TabsTrigger>
          <TabsTrigger value="assets">الأصول الثابتة</TabsTrigger>
          <TabsTrigger value="budgets">الميزانيات</TabsTrigger>
          <TabsTrigger value="analysis">التحليل المتقدم</TabsTrigger>
        </TabsList>

        {/* المؤشرات المالية */}
        <TabsContent value="kpis" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">
                <BarChart3 className="w-5 h-5" />
                المؤشرات المالية الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                  <Card key={kpi.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="rtl-info-item justify-between">
                          <div className="text-right">
                            <h4 className="font-medium">{kpi.kpi_name_ar}</h4>
                            <p className="text-sm text-muted-foreground">{kpi.category}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getKPIStatusColor(kpi)}`} />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="rtl-info-item justify-between">
                            <span className="text-sm">القيمة الحالية:</span>
                            <span className="font-bold text-lg">
                              {kpi.current_value?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          
                          <div className="rtl-info-item justify-between">
                            <span className="text-sm">الهدف:</span>
                            <span className="text-sm text-muted-foreground">
                              {kpi.target_value?.toFixed(2) || 'غير محدد'}
                            </span>
                          </div>
                          
                          {kpi.target_value && kpi.current_value && (
                            <Progress 
                              value={(kpi.current_value / kpi.target_value) * 100} 
                              className="h-2"
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* رؤى الذكاء الاصطناعي */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">
                <Brain className="w-5 h-5" />
                رؤى الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p>لا توجد رؤى جديدة - النظام يعمل بشكل مثالي!</p>
                  </div>
                ) : (
                  insights.map((insight) => (
                    <Card key={insight.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="rtl-info-item justify-between">
                          <div className="space-y-2">
                            <div className="rtl-info-item">
                              {getInsightIcon(insight.insight_type)}
                              <h4 className="font-medium">{insight.insight_title}</h4>
                              <Badge variant={getPriorityBadgeVariant(insight.priority_level)}>
                                {insight.priority_level}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {insight.insight_description}
                            </p>
                            {insight.recommended_actions && insight.recommended_actions.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-2">الإجراءات المقترحة:</p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                  {insight.recommended_actions.map((action, index) => (
                                    <li key={index}>{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => dismissInsight(insight.id)}
                            className="rtl-button"
                          >
                            <Eye className="w-4 h-4" />
                            تم الاطلاع
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الأصول الثابتة */}
        <TabsContent value="assets" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">
                <Shield className="w-5 h-5" />
                ملخص الأصول الثابتة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-lg font-bold text-green-600">
                      {formatCurrencyKWD(fixedAssets.reduce((sum, asset) => sum + asset.purchase_cost, 0))}
                    </h3>
                    <p className="text-sm text-muted-foreground">إجمالي تكلفة الأصول</p>
                  </CardContent>
                </Card>
                
                <Card className="border">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-lg font-bold text-blue-600">
                      {formatCurrencyKWD(fixedAssets.reduce((sum, asset) => sum + asset.book_value, 0))}
                    </h3>
                    <p className="text-sm text-muted-foreground">القيمة الدفترية</p>
                  </CardContent>
                </Card>
                
                <Card className="border">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-lg font-bold text-orange-600">
                      {fixedAssets.length}
                    </h3>
                    <p className="text-sm text-muted-foreground">عدد الأصول</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">توزيع الأصول حسب الفئة:</h4>
                {Object.entries(
                  fixedAssets.reduce((acc, asset) => {
                    acc[asset.asset_category] = (acc[asset.asset_category] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([category, count]) => (
                  <div key={category} className="rtl-info-item justify-between p-2 bg-muted rounded">
                    <span>{category}</span>
                    <Badge variant="outline">{count} أصل</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الميزانيات */}
        <TabsContent value="budgets" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">
                <Target className="w-5 h-5" />
                ملخص الميزانيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-16 h-16 mx-auto mb-4" />
                  <p>لم يتم إنشاء أي ميزانيات بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.slice(0, 3).map((budget) => (
                    <Card key={budget.id} className="border">
                      <CardContent className="p-4">
                        <div className="rtl-info-item justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{budget.budget_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {budget.budget_year} - {budget.budget_period}
                            </p>
                          </div>
                          <Badge variant={budget.status === 'active' ? 'default' : 'secondary'}>
                            {budget.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">إيرادات مخططة:</span>
                            <p className="font-medium">
                              {formatCurrencyKWD(budget.total_revenue_budget || 0)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">مصروفات مخططة:</span>
                            <p className="font-medium">
                              {formatCurrencyKWD(budget.total_expense_budget || 0)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* التحليل المتقدم */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">
                  <PieChart className="w-5 h-5" />
                  نسب السيولة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liquidityRatios && (
                  <div className="space-y-4">
                    <div className="rtl-info-item justify-between">
                      <span>نسبة السيولة الجارية:</span>
                      <span className="font-bold">{liquidityRatios.current_ratio.toFixed(2)}</span>
                    </div>
                    <div className="rtl-info-item justify-between">
                      <span>نسبة السيولة السريعة:</span>
                      <span className="font-bold">{liquidityRatios.quick_ratio.toFixed(2)}</span>
                    </div>
                    <div className="rtl-info-item justify-between">
                      <span>نسبة السيولة النقدية:</span>
                      <span className="font-bold">{liquidityRatios.cash_ratio.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">
                  <Activity className="w-5 h-5" />
                  المركز المالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialSummary && (
                  <div className="space-y-4">
                    <div className="rtl-info-item justify-between">
                      <span>إجمالي الأصول:</span>
                      <span className="font-bold">
                        {formatCurrencyKWD(financialSummary.financial_position.total_assets)}
                      </span>
                    </div>
                    <div className="rtl-info-item justify-between">
                      <span>إجمالي الخصوم:</span>
                      <span className="font-bold">
                        {formatCurrencyKWD(financialSummary.financial_position.total_liabilities)}
                      </span>
                    </div>
                    <div className="rtl-info-item justify-between">
                      <span>حقوق الملكية:</span>
                      <span className="font-bold">
                        {formatCurrencyKWD(financialSummary.financial_position.total_equity)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAccountingDashboard;