import { supabase } from '@/integrations/supabase/client';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

export interface FinancialRisk {
  id: string;
  risk_type: 'credit' | 'liquidity' | 'market' | 'operational' | 'regulatory';
  risk_code: string;
  risk_description: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  risk_score: number; // impact × probability
  current_exposure: number;
  maximum_exposure: number;
  mitigation_strategies: string[];
  responsible_party: string;
  review_date: string;
  status: 'active' | 'mitigated' | 'accepted' | 'transferred';
}

export interface CreditRisk {
  customer_id: string;
  customer_name: string;
  credit_score: number;
  credit_limit: number;
  current_exposure: number;
  overdue_amount: number;
  payment_history_score: number;
  risk_rating: 'A' | 'B' | 'C' | 'D' | 'E';
  default_probability: number;
  collection_efficiency: number;
  recommended_action: string;
}

export interface LiquidityRisk {
  date: string;
  cash_position: number;
  short_term_obligations: number;
  liquidity_ratio: number;
  stress_test_scenario: string;
  minimum_cash_requirement: number;
  liquidity_gap: number;
  funding_sources: string[];
  risk_level: 'low' | 'medium' | 'high';
}

export interface MarketRisk {
  risk_factor: string;
  current_rate: number;
  historical_volatility: number;
  value_at_risk: number;
  confidence_level: number;
  time_horizon: number;
  stress_test_loss: number;
  hedge_effectiveness: number;
}

export interface RiskDashboard {
  total_risk_score: number;
  risk_distribution: {
    credit: number;
    liquidity: number;
    market: number;
    operational: number;
    regulatory: number;
  };
  critical_risks: FinancialRisk[];
  risk_trend: 'increasing' | 'stable' | 'decreasing';
  compliance_status: 'compliant' | 'non_compliant' | 'needs_review';
  recommendations: string[];
}

export interface StressTestScenario {
  scenario_name: string;
  description: string;
  assumptions: {
    revenue_decline: number;
    cost_increase: number;
    credit_loss_rate: number;
    market_shock: number;
  };
  impact_analysis: {
    revenue_impact: number;
    cost_impact: number;
    credit_loss_impact: number;
    net_impact: number;
    survival_months: number;
  };
  mitigation_plan: string[];
}

class RiskManagementService {
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

  // 1. تقييم المخاطر الائتمانية
  async assessCreditRisk(): Promise<CreditRisk[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: customers } = await supabase
      .from('customers')
      .select(`
        id, name, phone, email, 
        contracts(total_amount, status, start_date, end_date),
        invoices(total_amount, status, due_date, created_at)
      `)
      .eq('tenant_id', this.tenant_id);

    if (!customers) return [];

    const creditRisks: CreditRisk[] = [];

    for (const customer of customers) {
      const contracts = customer.contracts || [];
      const invoices = customer.invoices || [];

      // حساب التعرض الحالي
      const currentExposure = invoices
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      // حساب المتأخرات
      const overdueAmount = invoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      // حساب نقاط السجل الائتماني
      const paymentHistoryScore = this.calculatePaymentHistoryScore(invoices);
      
      // حساب النقاط الائتمانية
      const creditScore = this.calculateCreditScore(customer, contracts, invoices);
      
      // تحديد التصنيف الائتماني
      const riskRating = this.getCreditRating(creditScore);
      
      // حساب احتمالية التعثر
      const defaultProbability = this.calculateDefaultProbability(creditScore, paymentHistoryScore);
      
      // حساب كفاءة التحصيل
      const collectionEfficiency = this.calculateCollectionEfficiency(invoices);
      
      // تحديد الحد الائتماني المقترح
      const creditLimit = this.calculateCreditLimit(creditScore, currentExposure);
      
      // التوصية بالإجراء
      const recommendedAction = this.getRecommendedAction(riskRating, currentExposure, overdueAmount);

      creditRisks.push({
        customer_id: customer.id,
        customer_name: customer.name,
        credit_score: creditScore,
        credit_limit: creditLimit,
        current_exposure: currentExposure,
        overdue_amount: overdueAmount,
        payment_history_score: paymentHistoryScore,
        risk_rating: riskRating,
        default_probability: defaultProbability,
        collection_efficiency: collectionEfficiency,
        recommended_action: recommendedAction
      });
    }

    return creditRisks.sort((a, b) => b.risk_score - a.risk_score);
  }

  // 2. تحليل مخاطر السيولة
  async analyzeLiquidityRisk(days: number = 90): Promise<LiquidityRisk[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const liquidityRisks: LiquidityRisk[] = [];
    const currentDate = new Date();

    for (let i = 0; i < days; i++) {
      const date = addDays(currentDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      // حساب الوضع النقدي
      const cashPosition = await this.calculateCashPosition(dateStr);
      
      // حساب الالتزامات قصيرة الأجل
      const shortTermObligations = await this.calculateShortTermObligations(dateStr);
      
      // حساب نسبة السيولة
      const liquidityRatio = shortTermObligations > 0 ? cashPosition / shortTermObligations : 0;
      
      // الحد الأدنى للنقد المطلوب
      const minimumCashRequirement = await this.getMinimumCashRequirement();
      
      // فجوة السيولة
      const liquidityGap = cashPosition - minimumCashRequirement;
      
      // مصادر التمويل
      const fundingSources = await this.getFundingSources();
      
      // تحديد مستوى المخاطر
      const riskLevel = this.assessLiquidityRiskLevel(liquidityRatio, liquidityGap);

      liquidityRisks.push({
        date: dateStr,
        cash_position: Math.round(cashPosition * 100) / 100,
        short_term_obligations: Math.round(shortTermObligations * 100) / 100,
        liquidity_ratio: Math.round(liquidityRatio * 100) / 100,
        stress_test_scenario: 'normal',
        minimum_cash_requirement: minimumCashRequirement,
        liquidity_gap: Math.round(liquidityGap * 100) / 100,
        funding_sources: fundingSources,
        risk_level: riskLevel
      });
    }

    return liquidityRisks;
  }

  // 3. تحليل مخاطر السوق
  async analyzeMarketRisk(): Promise<MarketRisk[]> {
    const marketRisks: MarketRisk[] = [];

    // مخاطر أسعار الفائدة
    const interestRateRisk = await this.calculateInterestRateRisk();
    marketRisks.push(interestRateRisk);

    // مخاطر أسعار الوقود
    const fuelPriceRisk = await this.calculateFuelPriceRisk();
    marketRisks.push(fuelPriceRisk);

    // مخاطر أسعار الصرف
    const exchangeRateRisk = await this.calculateExchangeRateRisk();
    marketRisks.push(exchangeRateRisk);

    // مخاطر أسعار السيارات
    const vehiclePriceRisk = await this.calculateVehiclePriceRisk();
    marketRisks.push(vehiclePriceRisk);

    return marketRisks;
  }

  // 4. اختبارات الإجهاد
  async performStressTests(): Promise<StressTestScenario[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const scenarios: StressTestScenario[] = [];

    // السيناريو الأول: ركود اقتصادي
    const recessionScenario = await this.createRecessionScenario();
    scenarios.push(recessionScenario);

    // السيناريو الثاني: أزمة سيولة
    const liquidityCrisisScenario = await this.createLiquidityCrisisScenario();
    scenarios.push(liquidityCrisisScenario);

    // السيناريو الثالث: زيادة أسعار الوقود
    const fuelCrisisScenario = await this.createFuelCrisisScenario();
    scenarios.push(fuelCrisisScenario);

    // السيناريو الرابع: منافسة شديدة
    const competitionScenario = await this.createCompetitionScenario();
    scenarios.push(competitionScenario);

    return scenarios;
  }

  // 5. مراقبة المخاطر في الوقت الفعلي
  async getRiskDashboard(): Promise<RiskDashboard> {
    if (!this.tenant_id) await this.initializeTenant();

    // تحميل جميع المخاطر
    const allRisks = await this.getAllRisks();
    
    // حساب النقاط الإجمالية للمخاطر
    const totalRiskScore = allRisks.reduce((sum, risk) => sum + risk.risk_score, 0);
    
    // توزيع المخاطر حسب النوع
    const riskDistribution = this.calculateRiskDistribution(allRisks);
    
    // المخاطر الحرجة
    const criticalRisks = allRisks.filter(risk => risk.impact_level === 'critical');
    
    // اتجاه المخاطر
    const riskTrend = await this.calculateRiskTrend();
    
    // حالة الامتثال
    const complianceStatus = await this.getComplianceStatus();
    
    // التوصيات
    const recommendations = this.generateRiskRecommendations(allRisks);

    return {
      total_risk_score: Math.round(totalRiskScore),
      risk_distribution: riskDistribution,
      critical_risks: criticalRisks,
      risk_trend: riskTrend,
      compliance_status: complianceStatus,
      recommendations: recommendations
    };
  }

  // 6. إدارة الحدود الائتمانية
  async manageCreditLimits(): Promise<{
    customer_id: string;
    current_limit: number;
    recommended_limit: number;
    utilization_rate: number;
    adjustment_reason: string;
  }[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const creditRisks = await this.assessCreditRisk();
    const adjustments = [];

    for (const risk of creditRisks) {
      const utilizationRate = risk.credit_limit > 0 ? (risk.current_exposure / risk.credit_limit) * 100 : 0;
      let recommendedLimit = risk.credit_limit;
      let adjustmentReason = 'لا توجد تغييرات مطلوبة';

      // منطق تعديل الحدود
      if (risk.risk_rating === 'A' && utilizationRate > 80) {
        recommendedLimit = risk.credit_limit * 1.2;
        adjustmentReason = 'عميل ممتاز مع استخدام عالي للحد';
      } else if (risk.risk_rating === 'B' && utilizationRate > 90) {
        recommendedLimit = risk.credit_limit * 1.1;
        adjustmentReason = 'عميل جيد يحتاج زيادة طفيفة';
      } else if (risk.risk_rating === 'D' || risk.risk_rating === 'E') {
        recommendedLimit = risk.credit_limit * 0.5;
        adjustmentReason = 'عميل عالي المخاطر يحتاج تقليل الحد';
      } else if (risk.overdue_amount > 0) {
        recommendedLimit = risk.credit_limit * 0.8;
        adjustmentReason = 'وجود متأخرات يستدعي الحذر';
      }

      adjustments.push({
        customer_id: risk.customer_id,
        current_limit: Math.round(risk.credit_limit * 100) / 100,
        recommended_limit: Math.round(recommendedLimit * 100) / 100,
        utilization_rate: Math.round(utilizationRate * 100) / 100,
        adjustment_reason: adjustmentReason
      });
    }

    return adjustments;
  }

  // Helper Methods

  private calculatePaymentHistoryScore(invoices: any[]): number {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalInvoices = invoices.length;
    
    if (totalInvoices === 0) return 50; // نقاط متوسطة للعملاء الجدد
    
    const paymentRate = (paidInvoices.length / totalInvoices) * 100;
    
    // حساب متوسط تأخير الدفع
    const averageDelay = this.calculateAveragePaymentDelay(paidInvoices);
    
    let score = paymentRate;
    
    // خصم نقاط للتأخير
    if (averageDelay > 30) {
      score -= 20;
    } else if (averageDelay > 15) {
      score -= 10;
    } else if (averageDelay > 7) {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateCreditScore(customer: any, contracts: any[], invoices: any[]): number {
    let score = 100;
    
    // عامل تاريخ التعامل
    const relationshipDuration = this.calculateRelationshipDuration(contracts);
    if (relationshipDuration > 12) score += 10;
    else if (relationshipDuration > 6) score += 5;
    
    // عامل حجم الأعمال
    const businessVolume = contracts.reduce((sum, contract) => sum + contract.total_amount, 0);
    if (businessVolume > 50000) score += 15;
    else if (businessVolume > 25000) score += 10;
    else if (businessVolume > 10000) score += 5;
    
    // عامل تنوع الأعمال
    const contractFrequency = contracts.length;
    if (contractFrequency > 10) score += 10;
    else if (contractFrequency > 5) score += 5;
    
    // عامل سجل الدفع
    const paymentScore = this.calculatePaymentHistoryScore(invoices);
    score = (score + paymentScore) / 2;
    
    return Math.max(0, Math.min(100, score));
  }

  private getCreditRating(creditScore: number): 'A' | 'B' | 'C' | 'D' | 'E' {
    if (creditScore >= 80) return 'A';
    if (creditScore >= 70) return 'B';
    if (creditScore >= 60) return 'C';
    if (creditScore >= 50) return 'D';
    return 'E';
  }

  private calculateDefaultProbability(creditScore: number, paymentHistoryScore: number): number {
    const baseRate = 100 - creditScore;
    const paymentAdjustment = (100 - paymentHistoryScore) * 0.5;
    
    return Math.min(95, Math.max(1, baseRate + paymentAdjustment));
  }

  private calculateCollectionEfficiency(invoices: any[]): number {
    const totalInvoices = invoices.length;
    const collectedInvoices = invoices.filter(inv => inv.status === 'paid').length;
    
    return totalInvoices > 0 ? (collectedInvoices / totalInvoices) * 100 : 0;
  }

  private calculateCreditLimit(creditScore: number, currentExposure: number): number {
    const baseLimit = 10000; // حد أساسي
    const scoreMultiplier = creditScore / 100;
    const exposureMultiplier = currentExposure > 0 ? Math.min(2, currentExposure / 5000) : 1;
    
    return Math.round(baseLimit * scoreMultiplier * exposureMultiplier);
  }

  private getRecommendedAction(rating: string, exposure: number, overdue: number): string {
    if (overdue > 0) {
      return 'متابعة فورية للمتأخرات وإيقاف التسليم حتى السداد';
    }
    
    switch (rating) {
      case 'A':
        return 'عميل ممتاز - يمكن زيادة الحد الائتماني';
      case 'B':
        return 'عميل جيد - مراقبة عادية';
      case 'C':
        return 'عميل متوسط - مراقبة مشددة';
      case 'D':
        return 'عميل عالي المخاطر - تقليل الحد والمراقبة اليومية';
      case 'E':
        return 'عميل خطر جداً - إيقاف التعامل والمطالبة بالضمانات';
      default:
        return 'تحليل إضافي مطلوب';
    }
  }

  private async calculateCashPosition(date: string): Promise<number> {
    // حساب الوضع النقدي في تاريخ محدد
    const { data: cashEntries } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount, credit_amount, debit_account, credit_account')
      .eq('tenant_id', this.tenant_id)
      .lte('entry_date', date)
      .or('debit_account.like.111%,credit_account.like.111%');

    let cashPosition = 0;
    cashEntries?.forEach(entry => {
      if (entry.debit_account?.startsWith('111')) {
        cashPosition += entry.debit_amount;
      } else if (entry.credit_account?.startsWith('111')) {
        cashPosition -= entry.credit_amount;
      }
    });

    return cashPosition;
  }

  private async calculateShortTermObligations(date: string): Promise<number> {
    // حساب الالتزامات قصيرة الأجل
    const { data: obligations } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('status', 'pending')
      .lte('due_date', date);

    return obligations?.reduce((sum, obligation) => sum + obligation.total_amount, 0) || 0;
  }

  private async getMinimumCashRequirement(): Promise<number> {
    // حساب الحد الأدنى للنقد المطلوب (عادة 30 يوم من التكاليف التشغيلية)
    const { data: monthlyCosts } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('debit_account', '5%')
      .gte('entry_date', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
      .lte('entry_date', format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    const monthlyOperatingCosts = monthlyCosts?.reduce((sum, cost) => sum + cost.debit_amount, 0) || 0;
    return monthlyOperatingCosts; // شهر واحد كحد أدنى
  }

  private async getFundingSources(): Promise<string[]> {
    // مصادر التمويل المتاحة
    return [
      'الأرصدة النقدية الحالية',
      'التسهيلات البنكية',
      'تحصيل الذمم المدينة',
      'بيع الأصول غير المستخدمة',
      'التمويل من المساهمين'
    ];
  }

  private assessLiquidityRiskLevel(liquidityRatio: number, liquidityGap: number): 'low' | 'medium' | 'high' {
    if (liquidityRatio >= 1.5 && liquidityGap > 0) return 'low';
    if (liquidityRatio >= 1.0 && liquidityGap >= 0) return 'medium';
    return 'high';
  }

  private async calculateInterestRateRisk(): Promise<MarketRisk> {
    // مخاطر أسعار الفائدة
    const currentRate = 5.5; // معدل فائدة حالي
    const historicalVolatility = 1.2; // التقلبات التاريخية
    
    return {
      risk_factor: 'Interest Rate',
      current_rate: currentRate,
      historical_volatility: historicalVolatility,
      value_at_risk: 50000, // القيمة المعرضة للخطر
      confidence_level: 95,
      time_horizon: 30,
      stress_test_loss: 75000,
      hedge_effectiveness: 0
    };
  }

  private async calculateFuelPriceRisk(): Promise<MarketRisk> {
    // مخاطر أسعار الوقود
    return {
      risk_factor: 'Fuel Price',
      current_rate: 0.35, // سعر حالي للتر
      historical_volatility: 15.5,
      value_at_risk: 30000,
      confidence_level: 95,
      time_horizon: 30,
      stress_test_loss: 45000,
      hedge_effectiveness: 0
    };
  }

  private async calculateExchangeRateRisk(): Promise<MarketRisk> {
    // مخاطر أسعار الصرف
    return {
      risk_factor: 'Exchange Rate',
      current_rate: 3.75, // معدل الصرف الحالي
      historical_volatility: 2.1,
      value_at_risk: 15000,
      confidence_level: 95,
      time_horizon: 30,
      stress_test_loss: 25000,
      hedge_effectiveness: 0
    };
  }

  private async calculateVehiclePriceRisk(): Promise<MarketRisk> {
    // مخاطر أسعار السيارات
    return {
      risk_factor: 'Vehicle Price',
      current_rate: 100000, // متوسط أسعار السيارات
      historical_volatility: 8.5,
      value_at_risk: 200000,
      confidence_level: 95,
      time_horizon: 365,
      stress_test_loss: 350000,
      hedge_effectiveness: 0
    };
  }

  private async createRecessionScenario(): Promise<StressTestScenario> {
    const currentRevenue = await this.getCurrentRevenue();
    const currentCosts = await this.getCurrentCosts();
    
    const assumptions = {
      revenue_decline: -30,
      cost_increase: 5,
      credit_loss_rate: 15,
      market_shock: -25
    };

    const revenueImpact = currentRevenue * (assumptions.revenue_decline / 100);
    const costImpact = currentCosts * (assumptions.cost_increase / 100);
    const creditLossImpact = currentRevenue * (assumptions.credit_loss_rate / 100);
    const netImpact = revenueImpact - costImpact - creditLossImpact;
    
    const currentCashFlow = await this.getCurrentCashFlow();
    const survivalMonths = currentCashFlow > 0 ? Math.abs(currentCashFlow / (netImpact / 12)) : 0;

    return {
      scenario_name: 'ركود اقتصادي',
      description: 'تراجع الطلب بنسبة 30% مع زيادة التكاليف والخسائر الائتمانية',
      assumptions,
      impact_analysis: {
        revenue_impact: Math.round(revenueImpact),
        cost_impact: Math.round(costImpact),
        credit_loss_impact: Math.round(creditLossImpact),
        net_impact: Math.round(netImpact),
        survival_months: Math.round(survivalMonths)
      },
      mitigation_plan: [
        'تقليل التكاليف التشغيلية بنسبة 20%',
        'تأجيل الاستثمارات غير الضرورية',
        'تشديد سياسات الائتمان',
        'البحث عن مصادر تمويل إضافية',
        'تنويع مصادر الدخل'
      ]
    };
  }

  private async createLiquidityCrisisScenario(): Promise<StressTestScenario> {
    const assumptions = {
      revenue_decline: -15,
      cost_increase: 0,
      credit_loss_rate: 25,
      market_shock: -10
    };

    const currentRevenue = await this.getCurrentRevenue();
    const currentCosts = await this.getCurrentCosts();
    
    const revenueImpact = currentRevenue * (assumptions.revenue_decline / 100);
    const costImpact = currentCosts * (assumptions.cost_increase / 100);
    const creditLossImpact = currentRevenue * (assumptions.credit_loss_rate / 100);
    const netImpact = revenueImpact - costImpact - creditLossImpact;

    return {
      scenario_name: 'أزمة سيولة',
      description: 'تأخر في التحصيل وزيادة الخسائر الائتمانية',
      assumptions,
      impact_analysis: {
        revenue_impact: Math.round(revenueImpact),
        cost_impact: Math.round(costImpact),
        credit_loss_impact: Math.round(creditLossImpact),
        net_impact: Math.round(netImpact),
        survival_months: 6
      },
      mitigation_plan: [
        'تشديد سياسات التحصيل',
        'تقديم خصومات للدفع المبكر',
        'ترتيب تسهيلات ائتمانية طارئة',
        'تسريع دورة التحصيل',
        'تقليل المخزون'
      ]
    };
  }

  private async createFuelCrisisScenario(): Promise<StressTestScenario> {
    const assumptions = {
      revenue_decline: -10,
      cost_increase: 40,
      credit_loss_rate: 5,
      market_shock: 0
    };

    const currentRevenue = await this.getCurrentRevenue();
    const currentCosts = await this.getCurrentCosts();
    
    const revenueImpact = currentRevenue * (assumptions.revenue_decline / 100);
    const costImpact = currentCosts * (assumptions.cost_increase / 100);
    const creditLossImpact = currentRevenue * (assumptions.credit_loss_rate / 100);
    const netImpact = revenueImpact - costImpact - creditLossImpact;

    return {
      scenario_name: 'أزمة وقود',
      description: 'ارتفاع أسعار الوقود بنسبة 40% مع تراجع الطلب',
      assumptions,
      impact_analysis: {
        revenue_impact: Math.round(revenueImpact),
        cost_impact: Math.round(costImpact),
        credit_loss_impact: Math.round(creditLossImpact),
        net_impact: Math.round(netImpact),
        survival_months: 8
      },
      mitigation_plan: [
        'رفع الأسعار تدريجياً',
        'تحسين كفاءة استهلاك الوقود',
        'التفاوض على خصومات مع موردي الوقود',
        'تقليل الرحلات غير الضرورية',
        'الاستثمار في تقنيات توفير الوقود'
      ]
    };
  }

  private async createCompetitionScenario(): Promise<StressTestScenario> {
    const assumptions = {
      revenue_decline: -25,
      cost_increase: 10,
      credit_loss_rate: 8,
      market_shock: -15
    };

    const currentRevenue = await this.getCurrentRevenue();
    const currentCosts = await this.getCurrentCosts();
    
    const revenueImpact = currentRevenue * (assumptions.revenue_decline / 100);
    const costImpact = currentCosts * (assumptions.cost_increase / 100);
    const creditLossImpact = currentRevenue * (assumptions.credit_loss_rate / 100);
    const netImpact = revenueImpact - costImpact - creditLossImpact;

    return {
      scenario_name: 'منافسة شديدة',
      description: 'دخول منافسين جدد بأسعار منخفضة',
      assumptions,
      impact_analysis: {
        revenue_impact: Math.round(revenueImpact),
        cost_impact: Math.round(costImpact),
        credit_loss_impact: Math.round(creditLossImpact),
        net_impact: Math.round(netImpact),
        survival_months: 10
      },
      mitigation_plan: [
        'تحسين جودة الخدمة',
        'تطوير خدمات مضافة',
        'برامج الولاء للعملاء',
        'تحسين الكفاءة التشغيلية',
        'التمايز في السوق'
      ]
    };
  }

  private async getAllRisks(): Promise<FinancialRisk[]> {
    // في التطبيق الحقيقي، سيتم استرجاع هذه البيانات من قاعدة البيانات
    return [
      {
        id: '1',
        risk_type: 'credit',
        risk_code: 'CR001',
        risk_description: 'مخاطر تعثر العملاء في السداد',
        impact_level: 'high',
        probability: 25,
        risk_score: 75,
        current_exposure: 150000,
        maximum_exposure: 200000,
        mitigation_strategies: ['تشديد سياسات الائتمان', 'تحسين التحصيل'],
        responsible_party: 'مدير الائتمان',
        review_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'active'
      },
      {
        id: '2',
        risk_type: 'liquidity',
        risk_code: 'LR001',
        risk_description: 'مخاطر نقص السيولة',
        impact_level: 'medium',
        probability: 15,
        risk_score: 45,
        current_exposure: 75000,
        maximum_exposure: 100000,
        mitigation_strategies: ['ترتيب تسهيلات ائتمانية', 'تحسين التحصيل'],
        responsible_party: 'المدير المالي',
        review_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'active'
      }
    ];
  }

  private calculateRiskDistribution(risks: FinancialRisk[]): {
    credit: number;
    liquidity: number;
    market: number;
    operational: number;
    regulatory: number;
  } {
    const distribution = {
      credit: 0,
      liquidity: 0,
      market: 0,
      operational: 0,
      regulatory: 0
    };

    risks.forEach(risk => {
      distribution[risk.risk_type] += risk.risk_score;
    });

    return distribution;
  }

  private async calculateRiskTrend(): Promise<'increasing' | 'stable' | 'decreasing'> {
    // تحليل اتجاه المخاطر بناءً على البيانات التاريخية
    // في التطبيق الحقيقي، سيتم مقارنة المخاطر مع الفترات السابقة
    return 'stable';
  }

  private async getComplianceStatus(): Promise<'compliant' | 'non_compliant' | 'needs_review'> {
    // فحص حالة الامتثال للمتطلبات التنظيمية
    return 'compliant';
  }

  private generateRiskRecommendations(risks: FinancialRisk[]): string[] {
    const recommendations: string[] = [];
    
    const criticalRisks = risks.filter(r => r.impact_level === 'critical');
    const highRisks = risks.filter(r => r.impact_level === 'high');
    
    if (criticalRisks.length > 0) {
      recommendations.push('معالجة فورية للمخاطر الحرجة');
    }
    
    if (highRisks.length > 0) {
      recommendations.push('وضع خطط تخفيف للمخاطر العالية');
    }
    
    const creditRisks = risks.filter(r => r.risk_type === 'credit');
    if (creditRisks.length > 0) {
      recommendations.push('مراجعة وتحديث سياسات الائتمان');
    }
    
    const liquidityRisks = risks.filter(r => r.risk_type === 'liquidity');
    if (liquidityRisks.length > 0) {
      recommendations.push('تحسين إدارة التدفق النقدي');
    }
    
    return recommendations;
  }

  private calculateAveragePaymentDelay(invoices: any[]): number {
    const delays = invoices.map(invoice => {
      const dueDate = new Date(invoice.due_date);
      const paidDate = new Date(invoice.paid_date || invoice.updated_at);
      return Math.max(0, differenceInDays(paidDate, dueDate));
    });
    
    return delays.length > 0 ? delays.reduce((sum, delay) => sum + delay, 0) / delays.length : 0;
  }

  private calculateRelationshipDuration(contracts: any[]): number {
    if (contracts.length === 0) return 0;
    
    const firstContract = contracts.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )[0];
    
    return differenceInDays(new Date(), new Date(firstContract.start_date)) / 30;
  }

  private async getCurrentRevenue(): Promise<number> {
    const { data: revenue } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('credit_account', '411%')
      .gte('entry_date', format(startOfYear(new Date()), 'yyyy-MM-dd'));

    return revenue?.reduce((sum, r) => sum + r.credit_amount, 0) || 0;
  }

  private async getCurrentCosts(): Promise<number> {
    const { data: costs } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('debit_account', '5%')
      .gte('entry_date', format(startOfYear(new Date()), 'yyyy-MM-dd'));

    return costs?.reduce((sum, c) => sum + c.debit_amount, 0) || 0;
  }

  private async getCurrentCashFlow(): Promise<number> {
    const revenue = await this.getCurrentRevenue();
    const costs = await this.getCurrentCosts();
    return revenue - costs;
  }
}

export const riskManagementService = new RiskManagementService(); 