import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, 
  ComposedChart, Legend, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  DollarSign, Users, Car, Calculator, Activity, Shield,
  Brain, Target, BarChart3, PieChart as PieChartIcon,
  ArrowUp, ArrowDown, Clock, Zap, Star, Warning
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// استيراد الخدمات
import { advancedCostingService } from '@/services/BusinessServices/AdvancedCostingService';
import { budgetingService } from '@/services/BusinessServices/BudgetingService';
import { riskManagementService } from '@/services/BusinessServices/RiskManagementService';
import { aiFinancialAnalyticsService } from '@/services/BusinessServices/AIFinancialAnalyticsService';

const CFODashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // تحميل البيانات من جميع الخدمات
      const [
        costingData,
        budgetData,
        riskData,
        aiData
      ] = await Promise.all([
        loadCostingData(),
        loadBudgetData(),
        loadRiskData(),
        loadAIData()
      ]);

      setDashboardData({
        costing: costingData,
        budget: budgetData,
        risk: riskData,
        ai: aiData,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCostingData = async () => {
    const period = format(new Date(), 'yyyy-MM');
    const [
      abcCosts,
      costCenters,
      costDrivers,
      vehicleProfitability
    ] = await Promise.all([
      advancedCostingService.calculateActivityBasedCosts(period),
      advancedCostingService.analyzeCostCenterPerformance(period),
      advancedCostingService.performCostDriverAnalysis(period),
      Promise.all([
        advancedCostingService.analyzeVehicleProfitability('vehicle-1', period),
        advancedCostingService.analyzeVehicleProfitability('vehicle-2', period),
        advancedCostingService.analyzeVehicleProfitability('vehicle-3', period)
      ])
    ]);

    return {
      abcCosts,
      costCenters,
      costDrivers,
      vehicleProfitability,
      totalCost: abcCosts.reduce((sum, cost) => sum + cost.activity_cost, 0),
      costEfficiency: 85.5,
      costTrend: 'improving'
    };
  };

  const loadBudgetData = async () => {
    const currentYear = new Date().getFullYear();
    const [
      salesforecast,
      cashFlowforecast,
      varianceAnalysis,
      budgetHealth
    ] = await Promise.all([
      budgetingService.generateSalesforecast(currentYear, {
        market_growth_rate: 15,
        competitive_position: 1.1,
        seasonal_factors: [0.8, 0.85, 1.1, 1.2, 1.3, 1.4, 1.5, 1.3, 1.1, 0.9, 0.8, 0.75],
        pricing_strategy: 'competitive'
      }),
      budgetingService.generateCashFlowForecast(currentYear, {
        collection_period: 30,
        payment_period: 15,
        capital_expenditure: 500000,
        loan_repayments: 120000
      }),
      budgetingService.performVarianceAnalysis('budget-1', format(new Date(), 'yyyy-MM-dd')),
      budgetingService.monitorBudgetPerformance('budget-1')
    ]);

    return {
      salesforecast,
      cashFlowforecast,
      varianceAnalysis,
      budgetHealth,
      budgetAccuracy: 92.3,
      forecastReliability: 88.7
    };
  };

  const loadRiskData = async () => {
    const [
      creditRisks,
      liquidityRisks,
      marketRisks,
      riskDashboard,
      stressTests
    ] = await Promise.all([
      riskManagementService.assessCreditRisk(),
      riskManagementService.analyzeLiquidityRisk(30),
      riskManagementService.analyzeMarketRisk(),
      riskManagementService.getRiskDashboard(),
      riskManagementService.performStressTests()
    ]);

    return {
      creditRisks,
      liquidityRisks,
      marketRisks,
      riskDashboard,
      stressTests,
      overallRiskScore: riskDashboard.total_risk_score,
      riskTrend: riskDashboard.risk_trend
    };
  };

  const loadAIData = async () => {
    const [
      predictiveAnalysis,
      customerBehavior,
      demandforecast,
      pricingOptimization,
      fraudDetection,
      financialforecast,
      intelligentAlerts
    ] = await Promise.all([
      aiFinancialAnalyticsService.generatePredictiveAnalysis(['revenue', 'cost', 'contracts'], 30),
      aiFinancialAnalyticsService.analyzeCustomerBehavior(),
      aiFinancialAnalyticsService.forecastDemand(30),
      aiFinancialAnalyticsService.optimizePricing(),
      aiFinancialAnalyticsService.detectFraud(),
      aiFinancialAnalyticsService.generateFinancialForecast(12),
      aiFinancialAnalyticsService.generateIntelligentAlerts()
    ]);

    return {
      predictiveAnalysis,
      customerBehavior,
      demandforecast,
      pricingOptimization,
      fraudDetection,
      financialforecast,
      intelligentAlerts,
      aiConfidence: 91.2,
      automationLevel: 78.5
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">جاري تحميل لوحة التحكم المالية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المدير المالي</h1>
            <p className="text-gray-600 mt-1">
              آخر تحديث: {format(dashboardData?.lastUpdated || new Date(), 'PPpp', { locale: ar })}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              {refreshing ? <Clock className="h-4 w-4 animate-spin ml-2" /> : <Zap className="h-4 w-4 ml-2" />}
              تحديث البيانات
            </Button>
            <Button variant="default" size="sm">
              <Brain className="h-4 w-4 ml-2" />
              تحليل ذكي
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold">
                  {dashboardData?.budget.salesforecast
                    ?.reduce((sum: number, item: any) => sum + item.forecasted_revenue, 0)
                    ?.toLocaleString('ar-KW') || 0} د.ك
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 ml-1" />
                  <span className="text-sm">+12.5% عن الشهر السابق</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">الربح الصافي</p>
                <p className="text-3xl font-bold">
                  {dashboardData?.ai.financialforecast?.[0]?.profit_forecast?.toLocaleString('ar-KW') || 0} د.ك
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="h-4 w-4 ml-1" />
                  <span className="text-sm">+8.3% عن المتوقع</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">نقاط المخاطر</p>
                <p className="text-3xl font-bold">
                  {dashboardData?.risk.overallRiskScore || 0}
                </p>
                <div className="flex items-center mt-2">
                  <Shield className="h-4 w-4 ml-1" />
                  <span className="text-sm">
                    {dashboardData?.risk.riskTrend === 'decreasing' ? 'متحسن' : 'مستقر'}
                  </span>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">الأتمتة الذكية</p>
                <p className="text-3xl font-bold">
                  {dashboardData?.ai.automationLevel?.toFixed(1) || 0}%
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 ml-1" />
                  <span className="text-sm">+5.2% هذا الشهر</span>
                </div>
              </div>
              <Brain className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Alerts */}
      {dashboardData?.ai.intelligentAlerts && dashboardData.ai.intelligentAlerts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 ml-2" />
              التنبيهات الذكية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.ai.intelligentAlerts.slice(0, 3).map((alert: any, index: number) => (
                <Alert key={index} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alert.description}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          التأثير: {alert.impact_assessment}% | الثقة: {alert.confidence_score}%
                        </p>
                      </div>
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'high' ? 'default' :
                        'secondary'
                      }>
                        {alert.severity === 'critical' ? 'حرج' :
                         alert.severity === 'high' ? 'عالي' :
                         alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="costing">التكاليف</TabsTrigger>
          <TabsTrigger value="budget">الموازنات</TabsTrigger>
          <TabsTrigger value="risk">المخاطر</TabsTrigger>
          <TabsTrigger value="ai">الذكاء الاصطناعي</TabsTrigger>
          <TabsTrigger value="forecasting">التنبؤات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData?.ai.financialforecast?.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value?.toLocaleString('ar-KW')} د.ك`} />
                      <Line type="monotone" dataKey="revenue_forecast" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="cost_forecast" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cost Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع التكاليف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.costing.abcCosts?.map((cost: any) => ({
                          name: cost.activity_name,
                          value: cost.activity_cost,
                          percentage: cost.resource_consumption * 100
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData?.costing.abcCosts?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value?.toLocaleString('ar-KW')} د.ك`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Costing Tab */}
        <TabsContent value="costing" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ABC Costing */}
            <Card>
              <CardHeader>
                <CardTitle>التكاليف المبنية على الأنشطة (ABC)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.costing.abcCosts?.map((cost: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <h4 className="font-medium">{cost.activity_name}</h4>
                        <p className="text-sm text-gray-600">
                          محرك التكلفة: {cost.cost_driver} | الحجم: {cost.cost_driver_volume}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{cost.activity_cost.toLocaleString('ar-KW')} د.ك</p>
                        <p className="text-sm text-gray-600">
                          {cost.cost_per_driver.toLocaleString('ar-KW')} د.ك/وحدة
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Centers Performance */}
            <Card>
              <CardHeader>
                <CardTitle>أداء مراكز التكلفة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.costing.costCenters}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value?.toLocaleString('ar-KW')} د.ك`} />
                      <Bar dataKey="budget_amount" fill="#3b82f6" name="الموازنة" />
                      <Bar dataKey="actual_amount" fill="#ef4444" name="الفعلي" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Health */}
            <Card>
              <CardHeader>
                <CardTitle>صحة الموازنة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {dashboardData?.budget.budgetHealth?.budget_health_score || 0}
                    </div>
                    <p className="text-gray-600">نقاط الصحة المالية</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>الأداء العام</span>
                        <span>{dashboardData?.budget.budgetHealth?.overall_performance?.toFixed(1) || 0}%</span>
                      </div>
                      <Progress value={dashboardData?.budget.budgetHealth?.overall_performance || 0} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>دقة الموازنة</span>
                        <span>{dashboardData?.budget.budgetAccuracy || 0}%</span>
                      </div>
                      <Progress value={dashboardData?.budget.budgetAccuracy || 0} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>موثوقية التنبؤ</span>
                        <span>{dashboardData?.budget.forecastReliability || 0}%</span>
                      </div>
                      <Progress value={dashboardData?.budget.forecastReliability || 0} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>توقع التدفق النقدي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dashboardData?.budget.cashFlowforecast?.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value?.toLocaleString('ar-KW')} د.ك`} />
                      <Bar dataKey="operating_cash_inflow" fill="#22c55e" name="التدفق الداخل" />
                      <Bar dataKey="operating_cash_outflow" fill="#ef4444" name="التدفق الخارج" />
                      <Line type="monotone" dataKey="net_cash_flow" stroke="#3b82f6" strokeWidth={2} name="الصافي" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع المخاطر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { subject: 'مخاطر ائتمانية', value: dashboardData?.risk.riskDashboard?.risk_distribution?.credit || 0 },
                      { subject: 'مخاطر سيولة', value: dashboardData?.risk.riskDashboard?.risk_distribution?.liquidity || 0 },
                      { subject: 'مخاطر السوق', value: dashboardData?.risk.riskDashboard?.risk_distribution?.market || 0 },
                      { subject: 'مخاطر تشغيلية', value: dashboardData?.risk.riskDashboard?.risk_distribution?.operational || 0 },
                      { subject: 'مخاطر تنظيمية', value: dashboardData?.risk.riskDashboard?.risk_distribution?.regulatory || 0 }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis />
                      <Radar name="المخاطر" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Credit Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>تحليل المخاطر الائتمانية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.risk.creditRisks?.slice(0, 5).map((risk: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <h4 className="font-medium">{risk.customer_name}</h4>
                        <p className="text-sm text-gray-600">
                          التعرض: {risk.current_exposure.toLocaleString('ar-KW')} د.ك
                        </p>
                      </div>
                      <div className="text-left">
                        <Badge variant={
                          risk.risk_rating === 'A' ? 'default' :
                          risk.risk_rating === 'B' ? 'secondary' :
                          risk.risk_rating === 'C' ? 'outline' :
                          'destructive'
                        }>
                          {risk.risk_rating}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          احتمالية التعثر: {risk.default_probability.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictive Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>التحليل التنبؤي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.ai.predictiveAnalysis?.map((analysis: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{analysis.metric}</h4>
                        <Badge variant="outline">{analysis.confidence_level}% ثقة</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">القيمة الحالية</p>
                          <p className="font-bold">{analysis.current_value?.toLocaleString('ar-KW')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">القيمة المتوقعة</p>
                          <p className="font-bold">{analysis.predicted_value?.toLocaleString('ar-KW')}</p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-600 mt-2">{analysis.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Behavior */}
            <Card>
              <CardHeader>
                <CardTitle>تحليل سلوك العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.ai.customerBehavior?.slice(0, 5).map((customer: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{customer.customer_name}</h4>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 ml-1" />
                          <span className="text-sm">{customer.behavior_score}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">القيمة الدائمة:</span>
                          <span className="font-medium ml-1">{customer.lifetime_value?.toLocaleString('ar-KW')} د.ك</span>
                        </div>
                        <div>
                          <span className="text-gray-600">خطر الفقدان:</span>
                          <span className="font-medium ml-1">{customer.churn_probability?.toFixed(1)}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        المفضل: {customer.preferred_vehicle_type}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>التنبؤ المالي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData?.ai.financialforecast?.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value?.toLocaleString('ar-KW')} د.ك`} />
                      <Area type="monotone" dataKey="revenue_forecast" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                      <Area type="monotone" dataKey="cost_forecast" stackId="1" stroke="#ef4444" fill="#ef4444" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Demand Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>توقع الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData?.ai.demandforecast?.slice(0, 30)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="forecasted_demand" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CFODashboard; 