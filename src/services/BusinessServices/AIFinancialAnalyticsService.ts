import { supabase } from '@/integrations/supabase/client';
import { format, addDays, subDays, startOfMonth, endOfMonth, differenceInDays, startOfYear } from 'date-fns';

export interface PredictiveAnalysis {
  metric: string;
  current_value: number;
  predicted_value: number;
  confidence_level: number;
  prediction_date: string;
  factors: string[];
  accuracy_score: number;
  recommendation: string;
}

export interface CustomerBehaviorAnalysis {
  customer_id: string;
  customer_name: string;
  behavior_score: number;
  churn_probability: number;
  lifetime_value: number;
  next_rental_probability: number;
  preferred_vehicle_type: string;
  seasonal_patterns: string[];
  risk_indicators: string[];
  retention_strategies: string[];
}

export interface DemandForecasting {
  date: string;
  vehicle_category: string;
  forecasted_demand: number;
  seasonal_factor: number;
  trend_factor: number;
  external_factors: string[];
  confidence_interval: {
    lower: number;
    upper: number;
  };
  recommendations: string[];
}

export interface PricingOptimization {
  vehicle_id: string;
  vehicle_category: string;
  current_price: number;
  optimal_price: number;
  demand_elasticity: number;
  competitor_prices: number[];
  market_conditions: string;
  price_sensitivity: number;
  revenue_impact: number;
  utilization_impact: number;
}

export interface FraudDetection {
  transaction_id: string;
  fraud_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  anomaly_indicators: string[];
  detection_methods: string[];
  investigation_priority: number;
  recommended_actions: string[];
}

export interface FinancialForecasting {
  period: string;
  revenue_forecast: number;
  cost_forecast: number;
  profit_forecast: number;
  cash_flow_forecast: number;
  confidence_level: number;
  scenario_analysis: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  key_assumptions: string[];
  risk_factors: string[];
}

export interface CustomerSegmentation {
  segment_id: string;
  segment_name: string;
  customer_count: number;
  characteristics: string[];
  avg_lifetime_value: number;
  profitability_score: number;
  growth_potential: number;
  retention_rate: number;
  marketing_strategies: string[];
}

export interface IntelligentAlerts {
  alert_id: string;
  alert_type: 'revenue' | 'cost' | 'risk' | 'opportunity' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_metrics: string[];
  impact_assessment: number;
  confidence_score: number;
  recommended_actions: string[];
  auto_resolution: boolean;
  created_at: string;
}

class AIFinancialAnalyticsService {
  private tenant_id: string | null = null;

  constructor() {
    this.initializeTenant();
  }

  private async initializeTenant() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      this.tenant_id = data?.tenant_id || null;
    }
  }

  // 1. التحليلات التنبؤية
  async generatePredictiveAnalysis(metrics: string[], period: number = 30): Promise<PredictiveAnalysis[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const analyses: PredictiveAnalysis[] = [];

    for (const metric of metrics) {
      const historicalData = await this.getHistoricalData(metric, 365);
      const prediction = this.predictFutureValue(historicalData, period);
      
      analyses.push({
        metric: metric,
        current_value: historicalData[historicalData.length - 1]?.value || 0,
        predicted_value: prediction.value,
        confidence_level: prediction.confidence,
        prediction_date: format(addDays(new Date(), period), 'yyyy-MM-dd'),
        factors: this.identifyInfluencingFactors(metric),
        accuracy_score: await this.calculateAccuracyScore(metric),
        recommendation: this.generateRecommendation(metric, prediction)
      });
    }

    return analyses;
  }

  // 2. تحليل سلوك العملاء
  async analyzeCustomerBehavior(): Promise<CustomerBehaviorAnalysis[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: customers } = await supabase
      .from('customers')
      .select(`
        id, name, phone, email, created_at,
        contracts(total_amount, start_date, end_date, status, vehicle_id, vehicles(category)),
        invoices(total_amount, status, due_date, paid_date)
      `)
      .eq('tenant_id', this.tenant_id);

    if (!customers) return [];

    const behaviorAnalyses: CustomerBehaviorAnalysis[] = [];

    for (const customer of customers) {
      const contracts = customer.contracts || [];
      const invoices = customer.invoices || [];

      // حساب نقاط السلوك
      const behaviorScore = this.calculateBehaviorScore(contracts, invoices);
      
      // احتمالية فقدان العميل
      const churnProbability = this.calculateChurnProbability(customer, contracts);
      
      // القيمة الدائمة للعميل
      const lifetimeValue = this.calculateLifetimeValue(contracts, invoices);
      
      // احتمالية التأجير التالي
      const nextRentalProbability = this.calculateNextRentalProbability(contracts);
      
      // نوع المركبة المفضل
      const preferredVehicleType = this.getPreferredVehicleType(contracts);
      
      // الأنماط الموسمية
      const seasonalPatterns = this.identifySeasonalPatterns(contracts);
      
      // مؤشرات المخاطر
      const riskIndicators = this.identifyRiskIndicators(customer, contracts, invoices);
      
      // استراتيجيات الاحتفاظ
      const retentionStrategies = this.generateRetentionStrategies(behaviorScore, churnProbability);

      behaviorAnalyses.push({
        customer_id: customer.id,
        customer_name: customer.name,
        behavior_score: behaviorScore,
        churn_probability: churnProbability,
        lifetime_value: lifetimeValue,
        next_rental_probability: nextRentalProbability,
        preferred_vehicle_type: preferredVehicleType,
        seasonal_patterns: seasonalPatterns,
        risk_indicators: riskIndicators,
        retention_strategies: retentionStrategies
      });
    }

    return behaviorAnalyses.sort((a, b) => b.lifetime_value - a.lifetime_value);
  }

  // 3. التنبؤ بالطلب
  async forecastDemand(days: number = 30): Promise<DemandForecasting[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const vehicleCategories = await this.getVehicleCategories();
    const forecasts: DemandForecasting[] = [];

    for (let i = 0; i < days; i++) {
      const forecastDate = addDays(new Date(), i);
      const dateStr = format(forecastDate, 'yyyy-MM-dd');

      for (const category of vehicleCategories) {
        const historicalDemand = await this.getHistoricalDemand(category, 365);
        const forecast = this.forecastDemandForDate(historicalDemand, forecastDate);
        
        forecasts.push({
          date: dateStr,
          vehicle_category: category,
          forecasted_demand: forecast.demand,
          seasonal_factor: forecast.seasonalFactor,
          trend_factor: forecast.trendFactor,
          external_factors: this.identifyExternalFactors(forecastDate),
          confidence_interval: {
            lower: forecast.demand * 0.8,
            upper: forecast.demand * 1.2
          },
          recommendations: this.generateDemandRecommendations(forecast)
        });
      }
    }

    return forecasts;
  }

  // 4. تحسين الأسعار الديناميكي
  async optimizePricing(): Promise<PricingOptimization[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, category, model, year, daily_rate')
      .eq('tenant_id', this.tenant_id)
      .eq('status', 'active');

    if (!vehicles) return [];

    const optimizations: PricingOptimization[] = [];

    for (const vehicle of vehicles) {
      const demandData = await this.getVehicleDemandData(vehicle.id);
      const competitorPrices = await this.getCompetitorPrices(vehicle.category);
      const elasticity = this.calculatePriceElasticity(demandData);
      
      const optimalPrice = this.calculateOptimalPrice(
        vehicle.daily_rate,
        demandData,
        competitorPrices,
        elasticity
      );
      
      const revenueImpact = this.calculateRevenueImpact(
        vehicle.daily_rate,
        optimalPrice,
        demandData
      );
      
      const utilizationImpact = this.calculateUtilizationImpact(
        vehicle.daily_rate,
        optimalPrice,
        elasticity
      );

      optimizations.push({
        vehicle_id: vehicle.id,
        vehicle_category: vehicle.category,
        current_price: vehicle.daily_rate,
        optimal_price: optimalPrice,
        demand_elasticity: elasticity,
        competitor_prices: competitorPrices,
        market_conditions: this.assessMarketConditions(vehicle.category),
        price_sensitivity: this.calculatePriceSensitivity(demandData),
        revenue_impact: revenueImpact,
        utilization_impact: utilizationImpact
      });
    }

    return optimizations.sort((a, b) => b.revenue_impact - a.revenue_impact);
  }

  // 5. كشف الاحتيال
  async detectFraud(): Promise<FraudDetection[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: transactions } = await supabase
      .from('automated_journal_entries')
      .select('*')
      .eq('tenant_id', this.tenant_id)
      .gte('entry_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
      .order('entry_date', { ascending: false });

    if (!transactions) return [];

    const fraudDetections: FraudDetection[] = [];

    for (const transaction of transactions) {
      const fraudScore = this.calculateFraudScore(transaction);
      
      if (fraudScore > 30) { // عتبة الاشتباه
        const anomalyIndicators = this.identifyAnomalyIndicators(transaction);
        const detectionMethods = this.getDetectionMethods(transaction);
        const riskLevel = this.assessFraudRiskLevel(fraudScore);
        
        fraudDetections.push({
          transaction_id: transaction.id,
          fraud_score: fraudScore,
          risk_level: riskLevel,
          anomaly_indicators: anomalyIndicators,
          detection_methods: detectionMethods,
          investigation_priority: this.calculateInvestigationPriority(fraudScore, riskLevel),
          recommended_actions: this.generateFraudActions(riskLevel, anomalyIndicators)
        });
      }
    }

    return fraudDetections.sort((a, b) => b.investigation_priority - a.investigation_priority);
  }

  // 6. التنبؤ المالي المتقدم
  async generateFinancialForecast(months: number = 12): Promise<FinancialForecasting[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const forecasts: FinancialForecasting[] = [];
    const currentDate = new Date();

    for (let i = 0; i < months; i++) {
      const forecastDate = addMonths(currentDate, i);
      const period = format(forecastDate, 'yyyy-MM');
      
      const historicalRevenue = await this.getHistoricalRevenue(12);
      const historicalCosts = await this.getHistoricalCosts(12);
      
      const revenueForecast = this.forecastRevenue(historicalRevenue, i);
      const costForecast = this.forecastCosts(historicalCosts, i);
      const profitForecast = revenueForecast - costForecast;
      const cashFlowForecast = await this.forecastCashFlow(period);
      
      const scenarios = this.generateScenarioAnalysis(revenueForecast, costForecast);
      
      forecasts.push({
        period: period,
        revenue_forecast: Math.round(revenueForecast),
        cost_forecast: Math.round(costForecast),
        profit_forecast: Math.round(profitForecast),
        cash_flow_forecast: Math.round(cashFlowForecast),
        confidence_level: this.calculateForecastConfidence(i),
        scenario_analysis: scenarios,
        key_assumptions: this.getKeyAssumptions(),
        risk_factors: this.identifyRiskFactors()
      });
    }

    return forecasts;
  }

  // 7. تجميع العملاء الذكي
  async performCustomerSegmentation(): Promise<CustomerSegmentation[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const customers = await this.getCustomersWithMetrics();
    const segments = this.clusterCustomers(customers);
    
    const segmentations: CustomerSegmentation[] = [];

    for (const [segmentId, customerGroup] of Object.entries(segments)) {
      const characteristics = this.analyzeSegmentCharacteristics(customerGroup);
      const avgLifetimeValue = this.calculateAvgLifetimeValue(customerGroup);
      const profitabilityScore = this.calculateSegmentProfitability(customerGroup);
      const growthPotential = this.assessGrowthPotential(customerGroup);
      const retentionRate = this.calculateRetentionRate(customerGroup);
      
      segmentations.push({
        segment_id: segmentId,
        segment_name: this.generateSegmentName(characteristics),
        customer_count: customerGroup.length,
        characteristics: characteristics,
        avg_lifetime_value: avgLifetimeValue,
        profitability_score: profitabilityScore,
        growth_potential: growthPotential,
        retention_rate: retentionRate,
        marketing_strategies: this.generateMarketingStrategies(characteristics)
      });
    }

    return segmentations;
  }

  // 8. التنبيهات الذكية
  async generateIntelligentAlerts(): Promise<IntelligentAlerts[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const alerts: IntelligentAlerts[] = [];
    
    // تنبيهات الإيراد
    const revenueAlerts = await this.checkRevenueAnomalies();
    alerts.push(...revenueAlerts);
    
    // تنبيهات التكلفة
    const costAlerts = await this.checkCostAnomalies();
    alerts.push(...costAlerts);
    
    // تنبيهات المخاطر
    const riskAlerts = await this.checkRiskAlerts();
    alerts.push(...riskAlerts);
    
    // تنبيهات الفرص
    const opportunityAlerts = await this.checkOpportunityAlerts();
    alerts.push(...opportunityAlerts);
    
    // تنبيهات الشذوذ
    const anomalyAlerts = await this.checkAnomalyAlerts();
    alerts.push(...anomalyAlerts);

    return alerts.sort((a, b) => b.impact_assessment - a.impact_assessment);
  }

  // Helper Methods

  private async getHistoricalData(metric: string, days: number): Promise<{date: string, value: number}[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    // استرجاع البيانات التاريخية حسب نوع المؤشر
    switch (metric) {
      case 'revenue':
        return await this.getHistoricalRevenueData(startDate, endDate);
      case 'cost':
        return await this.getHistoricalCostData(startDate, endDate);
      case 'contracts':
        return await this.getHistoricalContractsData(startDate, endDate);
      default:
        return [];
    }
  }

  private predictFutureValue(data: {date: string, value: number}[], period: number): {value: number, confidence: number} {
    if (data.length < 7) return { value: 0, confidence: 0 };
    
    // تطبيق نموذج تنبؤ بسيط (يمكن تحسينه بالذكاء الاصطناعي)
    const values = data.map(d => d.value);
    const trend = this.calculateTrend(values);
    const seasonality = this.calculateSeasonality(values);
    
    const lastValue = values[values.length - 1];
    const predictedValue = lastValue + (trend * period) + seasonality;
    
    const confidence = this.calculatePredictionConfidence(values, trend);
    
    return {
      value: Math.max(0, predictedValue),
      confidence: Math.min(100, confidence)
    };
  }

  private identifyInfluencingFactors(metric: string): string[] {
    const factors = {
      'revenue': ['الموسمية', 'المنافسة', 'الاقتصاد العام', 'التسويق', 'جودة الخدمة'],
      'cost': ['التضخم', 'أسعار الوقود', 'أسعار الصيانة', 'الرواتب', 'الإيجارات'],
      'contracts': ['الطلب الموسمي', 'الأسعار', 'توفر المركبات', 'رضا العملاء', 'المنافسة']
    };
    
    return factors[metric as keyof typeof factors] || [];
  }

  private async calculateAccuracyScore(metric: string): Promise<number> {
    // حساب دقة النماذج التنبؤية السابقة
    const historicalPredictions = await this.getHistoricalPredictions(metric);
    const actualValues = await this.getActualValues(metric);
    
    if (historicalPredictions.length === 0) return 75; // دقة افتراضية
    
    const errors = historicalPredictions.map((pred, index) => {
      const actual = actualValues[index]?.value || 0;
      return Math.abs(pred.value - actual) / actual;
    });
    
    const avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    return Math.max(0, 100 - (avgError * 100));
  }

  private generateRecommendation(metric: string, prediction: {value: number, confidence: number}): string {
    const recommendations = {
      'revenue': prediction.value > 0 ? 'اتجاه إيجابي متوقع - استثمر في التوسع' : 'اتجاه سلبي - راجع الاستراتيجيات',
      'cost': prediction.value > 0 ? 'زيادة في التكاليف متوقعة - خطط للتحكم' : 'انخفاض في التكاليف - فرصة للاستثمار',
      'contracts': prediction.value > 0 ? 'زيادة في الطلب متوقعة - جهز الأسطول' : 'انخفاض في الطلب - راجع الأسعار'
    };
    
    return recommendations[metric as keyof typeof recommendations] || 'تحليل إضافي مطلوب';
  }

  private calculateBehaviorScore(contracts: any[], invoices: any[]): number {
    let score = 50; // نقاط أساسية
    
    // عامل تكرار التأجير
    if (contracts.length > 10) score += 20;
    else if (contracts.length > 5) score += 15;
    else if (contracts.length > 2) score += 10;
    
    // عامل سجل الدفع
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const paymentRate = invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 50;
    score += (paymentRate - 50) * 0.5;
    
    // عامل القيمة الإجمالية
    const totalValue = contracts.reduce((sum, contract) => sum + contract.total_amount, 0);
    if (totalValue > 50000) score += 15;
    else if (totalValue > 25000) score += 10;
    else if (totalValue > 10000) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateChurnProbability(customer: any, contracts: any[]): number {
    const daysSinceLastContract = contracts.length > 0 ? 
      differenceInDays(new Date(), new Date(contracts[0].end_date)) : 0;
    
    let churnProb = 0;
    
    if (daysSinceLastContract > 180) churnProb += 40;
    else if (daysSinceLastContract > 90) churnProb += 25;
    else if (daysSinceLastContract > 30) churnProb += 10;
    
    // عامل تكرار التأجير
    if (contracts.length < 2) churnProb += 30;
    else if (contracts.length < 5) churnProb += 15;
    
    // عامل مشاكل الدفع
    const overdueContracts = contracts.filter(c => c.status === 'overdue');
    if (overdueContracts.length > 0) churnProb += 20;
    
    return Math.min(100, churnProb);
  }

  private calculateLifetimeValue(contracts: any[], invoices: any[]): number {
    const totalRevenue = contracts.reduce((sum, contract) => sum + contract.total_amount, 0);
    const contractsPerYear = contracts.length > 0 ? 
      contracts.length / Math.max(1, differenceInDays(new Date(), new Date(contracts[0].start_date)) / 365) : 0;
    
    const avgContractValue = contracts.length > 0 ? totalRevenue / contracts.length : 0;
    const projectedYears = 3; // توقع 3 سنوات
    
    return avgContractValue * contractsPerYear * projectedYears;
  }

  private calculateNextRentalProbability(contracts: any[]): number {
    if (contracts.length === 0) return 20;
    
    const avgDaysBetweenRentals = this.calculateAvgDaysBetweenRentals(contracts);
    const daysSinceLastRental = differenceInDays(new Date(), new Date(contracts[0].end_date));
    
    if (daysSinceLastRental < avgDaysBetweenRentals * 0.5) return 90;
    if (daysSinceLastRental < avgDaysBetweenRentals) return 70;
    if (daysSinceLastRental < avgDaysBetweenRentals * 1.5) return 50;
    if (daysSinceLastRental < avgDaysBetweenRentals * 2) return 30;
    
    return 10;
  }

  private getPreferredVehicleType(contracts: any[]): string {
    const vehicleTypes = contracts.map(c => c.vehicles?.category).filter(Boolean);
    const typeCounts = vehicleTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'غير محدد';
  }

  private identifySeasonalPatterns(contracts: any[]): string[] {
    const monthlyData = contracts.reduce((acc, contract) => {
      const month = new Date(contract.start_date).getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const patterns: string[] = [];
    const avgContracts = Object.values(monthlyData).reduce((sum, count) => sum + count, 0) / 12;
    
    Object.entries(monthlyData).forEach(([month, count]) => {
      if (count > avgContracts * 1.5) {
        const monthName = this.getMonthName(parseInt(month));
        patterns.push(`ذروة في ${monthName}`);
      }
    });
    
    return patterns;
  }

  private identifyRiskIndicators(customer: any, contracts: any[], invoices: any[]): string[] {
    const indicators: string[] = [];
    
    // مؤشرات الدفع
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    if (overdueInvoices.length > 0) {
      indicators.push('متأخرات في الدفع');
    }
    
    // مؤشرات التكرار
    const daysSinceLastContract = contracts.length > 0 ? 
      differenceInDays(new Date(), new Date(contracts[0].end_date)) : 0;
    if (daysSinceLastContract > 180) {
      indicators.push('عدم التعامل لفترة طويلة');
    }
    
    // مؤشرات القيمة
    const avgContractValue = contracts.length > 0 ? 
      contracts.reduce((sum, c) => sum + c.total_amount, 0) / contracts.length : 0;
    if (avgContractValue < 500) {
      indicators.push('قيمة عقود منخفضة');
    }
    
    return indicators;
  }

  private generateRetentionStrategies(behaviorScore: number, churnProbability: number): string[] {
    const strategies: string[] = [];
    
    if (churnProbability > 70) {
      strategies.push('تواصل فوري مع العميل');
      strategies.push('عرض خصم خاص');
      strategies.push('تحسين مستوى الخدمة');
    } else if (churnProbability > 40) {
      strategies.push('برنامج الولاء');
      strategies.push('تذكير بالعروض الجديدة');
      strategies.push('استطلاع رضا العملاء');
    }
    
    if (behaviorScore > 80) {
      strategies.push('عضوية VIP');
      strategies.push('خدمات إضافية مجانية');
    }
    
    return strategies;
  }

  private async getVehicleCategories(): Promise<string[]> {
    const { data: categories } = await supabase
      .from('vehicles')
      .select('category')
      .eq('tenant_id', this.tenant_id)
      .not('category', 'is', null);

    return [...new Set(categories?.map(c => c.category) || [])];
  }

  private async getHistoricalDemand(category: string, days: number): Promise<number[]> {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('start_date, vehicles(category)')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicles.category', category)
      .gte('start_date', format(subDays(new Date(), days), 'yyyy-MM-dd'));

    // تجميع الطلب يومياً
    const dailyDemand: Record<string, number> = {};
    contracts?.forEach(contract => {
      const date = format(new Date(contract.start_date), 'yyyy-MM-dd');
      dailyDemand[date] = (dailyDemand[date] || 0) + 1;
    });

    return Object.values(dailyDemand);
  }

  private forecastDemandForDate(historicalDemand: number[], date: Date): {
    demand: number;
    seasonalFactor: number;
    trendFactor: number;
  } {
    const avgDemand = historicalDemand.reduce((sum, demand) => sum + demand, 0) / historicalDemand.length;
    const trend = this.calculateTrend(historicalDemand);
    const seasonalFactor = this.getSeasonalFactor(date);
    
    return {
      demand: Math.max(0, Math.round(avgDemand * seasonalFactor + trend)),
      seasonalFactor: seasonalFactor,
      trendFactor: trend
    };
  }

  private identifyExternalFactors(date: Date): string[] {
    const factors: string[] = [];
    const month = date.getMonth();
    const dayOfWeek = date.getDay();
    
    // عوامل موسمية
    if (month >= 5 && month <= 7) factors.push('موسم الصيف');
    if (month >= 11 || month <= 1) factors.push('موسم الشتاء');
    
    // عوامل أسبوعية
    if (dayOfWeek === 0 || dayOfWeek === 6) factors.push('نهاية الأسبوع');
    if (dayOfWeek >= 1 && dayOfWeek <= 5) factors.push('أيام العمل');
    
    // عوامل خاصة (يمكن ربطها بقاعدة بيانات الأحداث)
    if (this.isHoliday(date)) factors.push('عطلة رسمية');
    if (this.isSchoolHoliday(date)) factors.push('عطلة مدرسية');
    
    return factors;
  }

  private generateDemandRecommendations(forecast: any): string[] {
    const recommendations: string[] = [];
    
    if (forecast.demand > 10) {
      recommendations.push('زيادة الأسطول المتاح');
      recommendations.push('تحسين عمليات التسليم');
    } else if (forecast.demand < 3) {
      recommendations.push('تقليل الأسطول المتاح');
      recommendations.push('تطبيق عروض ترويجية');
    }
    
    if (forecast.seasonalFactor > 1.2) {
      recommendations.push('التحضير للموسم العالي');
    }
    
    return recommendations;
  }

  // المزيد من الدوال المساعدة...
  
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (val * index), 0);
    const sumXX = values.reduce((sum, val, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private calculateSeasonality(values: number[]): number {
    // حساب الموسمية البسيط
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const recentValues = values.slice(-7); // آخر 7 قيم
    const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    return recentAvg - avgValue;
  }

  private calculatePredictionConfidence(values: number[], trend: number): number {
    const variance = this.calculateVariance(values);
    const trendStrength = Math.abs(trend);
    
    // كلما قل التباين وزاد قوة الاتجاه، زادت الثقة
    let confidence = 90 - (variance / 1000);
    confidence += Math.min(10, trendStrength * 2);
    
    return Math.max(30, Math.min(100, confidence));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    const dayOfWeek = date.getDay();
    
    // عوامل موسمية شهرية
    const monthlyFactors = [0.8, 0.85, 1.0, 1.1, 1.3, 1.5, 1.6, 1.4, 1.2, 1.0, 0.9, 0.8];
    let factor = monthlyFactors[month];
    
    // تعديل حسب يوم الأسبوع
    if (dayOfWeek === 0 || dayOfWeek === 6) factor *= 1.2; // نهاية الأسبوع
    
    return factor;
  }

  private isHoliday(date: Date): boolean {
    // فحص العطل الرسمية (يمكن تحسينها)
    const holidays = [
      '01-01', '09-23', '12-25' // أمثلة
    ];
    
    const dateStr = format(date, 'MM-dd');
    return holidays.includes(dateStr);
  }

  private isSchoolHoliday(date: Date): boolean {
    const month = date.getMonth();
    // العطل المدرسية تقريبية
    return month === 6 || month === 7; // يوليو وأغسطس
  }

  private getMonthName(month: number): string {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month];
  }

  private calculateAvgDaysBetweenRentals(contracts: any[]): number {
    if (contracts.length < 2) return 90; // افتراض 3 أشهر
    
    const sortedContracts = contracts.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    let totalDays = 0;
    for (let i = 1; i < sortedContracts.length; i++) {
      totalDays += differenceInDays(
        new Date(sortedContracts[i].start_date),
        new Date(sortedContracts[i-1].end_date)
      );
    }
    
    return totalDays / (sortedContracts.length - 1);
  }

  private async getHistoricalRevenueData(startDate: Date, endDate: Date): Promise<{date: string, value: number}[]> {
    const { data: entries } = await supabase
      .from('automated_journal_entries')
      .select('entry_date, credit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('credit_account', '411%')
      .gte('entry_date', format(startDate, 'yyyy-MM-dd'))
      .lte('entry_date', format(endDate, 'yyyy-MM-dd'))
      .order('entry_date');

    const dailyRevenue: Record<string, number> = {};
    entries?.forEach(entry => {
      const date = entry.entry_date;
      dailyRevenue[date] = (dailyRevenue[date] || 0) + entry.credit_amount;
    });

    return Object.entries(dailyRevenue).map(([date, value]) => ({ date, value }));
  }

  private async getHistoricalCostData(startDate: Date, endDate: Date): Promise<{date: string, value: number}[]> {
    const { data: entries } = await supabase
      .from('automated_journal_entries')
      .select('entry_date, debit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('debit_account', '5%')
      .gte('entry_date', format(startDate, 'yyyy-MM-dd'))
      .lte('entry_date', format(endDate, 'yyyy-MM-dd'))
      .order('entry_date');

    const dailyCosts: Record<string, number> = {};
    entries?.forEach(entry => {
      const date = entry.entry_date;
      dailyCosts[date] = (dailyCosts[date] || 0) + entry.debit_amount;
    });

    return Object.entries(dailyCosts).map(([date, value]) => ({ date, value }));
  }

  private async getHistoricalContractsData(startDate: Date, endDate: Date): Promise<{date: string, value: number}[]> {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('start_date')
      .eq('tenant_id', this.tenant_id)
      .gte('start_date', format(startDate, 'yyyy-MM-dd'))
      .lte('start_date', format(endDate, 'yyyy-MM-dd'))
      .order('start_date');

    const dailyContracts: Record<string, number> = {};
    contracts?.forEach(contract => {
      const date = format(new Date(contract.start_date), 'yyyy-MM-dd');
      dailyContracts[date] = (dailyContracts[date] || 0) + 1;
    });

    return Object.entries(dailyContracts).map(([date, value]) => ({ date, value }));
  }

  private async getHistoricalPredictions(metric: string): Promise<{value: number, date: string}[]> {
    // في التطبيق الحقيقي، سيتم استرجاع التنبؤات السابقة من قاعدة البيانات
    return [];
  }

  private async getActualValues(metric: string): Promise<{value: number, date: string}[]> {
    // في التطبيق الحقيقي، سيتم استرجاع القيم الفعلية
    return [];
  }

  // المزيد من الدوال المساعدة يمكن إضافتها حسب الحاجة...
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export const aiFinancialAnalyticsService = new AIFinancialAnalyticsService(); 