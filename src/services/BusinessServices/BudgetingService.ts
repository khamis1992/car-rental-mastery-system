import { supabase } from '@/integrations/supabase/client';
import { format, addMonths, startOfYear, endOfYear, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';

export interface Budget {
  id: string;
  budget_name: string;
  budget_year: number;
  budget_type: 'master' | 'sales' | 'operational' | 'capital' | 'cash_flow';
  status: 'draft' | 'approved' | 'active' | 'closed';
  total_budget: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
  created_by: string;
  approved_by?: string;
  approved_date?: string;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  account_code: string;
  account_name: string;
  budget_category: string;
  jan_budget: number;
  feb_budget: number;
  mar_budget: number;
  apr_budget: number;
  may_budget: number;
  jun_budget: number;
  jul_budget: number;
  aug_budget: number;
  sep_budget: number;
  oct_budget: number;
  nov_budget: number;
  dec_budget: number;
  total_budget: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
}

export interface CashFlowForecast {
  month: string;
  opening_balance: number;
  operating_cash_inflow: number;
  operating_cash_outflow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  net_cash_flow: number;
  closing_balance: number;
}

export interface Salesforecast {
  month: string;
  vehicle_category: string;
  forecasted_contracts: number;
  average_daily_rate: number;
  utilization_rate: number;
  forecasted_revenue: number;
  confidence_level: number;
}

export interface VarianceAnalysis {
  account_code: string;
  account_name: string;
  budget_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  variance_type: 'favorable' | 'unfavorable';
  significance_level: 'low' | 'medium' | 'high';
  analysis_notes: string;
}

export interface ScenarioPlanning {
  scenario_name: string;
  scenario_type: 'optimistic' | 'realistic' | 'pessimistic';
  growth_rate: number;
  cost_inflation_rate: number;
  market_share_change: number;
  forecasted_revenue: number;
  forecasted_costs: number;
  forecasted_profit: number;
  probability: number;
}

class BudgetingService {
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

  // 1. إنشاء الموازنة الرئيسية
  async createMasterBudget(budgetData: {
    budget_name: string;
    budget_year: number;
    assumptions: {
      revenue_growth_rate: number;
      cost_inflation_rate: number;
      fleet_expansion_rate: number;
      utilization_target: number;
    };
  }): Promise<Budget> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // إنشاء الموازنة الرئيسية
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        budget_name: budgetData.budget_name,
        budget_year: budgetData.budget_year,
        budget_type: 'master',
        status: 'draft',
        total_budget: 0,
        actual_amount: 0,
        variance: 0,
        variance_percentage: 0,
        created_by: userId,
        tenant_id: this.tenant_id
      })
      .select()
      .single();

    if (error) throw error;

    // إنشاء بنود الموازنة التفصيلية
    await this.createBudgetItems(budget.id, budgetData.assumptions);

    return budget;
  }

  // 2. إنشاء بنود الموازنة التفصيلية
  private async createBudgetItems(budgetId: string, assumptions: any): Promise<void> {
    const chartOfAccounts = await this.getChartOfAccounts();
    
    for (const account of chartOfAccounts) {
      const monthlyBudgets = await this.calculateMonthlyBudgets(account, assumptions);
      const totalBudget = Object.values(monthlyBudgets).reduce((sum, amount) => sum + amount, 0);

      await supabase
        .from('budget_items')
        .insert({
          budget_id: budgetId,
          account_code: account.code,
          account_name: account.name,
          budget_category: this.getBudgetCategory(account.code),
          jan_budget: monthlyBudgets.jan,
          feb_budget: monthlyBudgets.feb,
          mar_budget: monthlyBudgets.mar,
          apr_budget: monthlyBudgets.apr,
          may_budget: monthlyBudgets.may,
          jun_budget: monthlyBudgets.jun,
          jul_budget: monthlyBudgets.jul,
          aug_budget: monthlyBudgets.aug,
          sep_budget: monthlyBudgets.sep,
          oct_budget: monthlyBudgets.oct,
          nov_budget: monthlyBudgets.nov,
          dec_budget: monthlyBudgets.dec,
          total_budget: totalBudget,
          actual_amount: 0,
          variance: 0,
          variance_percentage: 0,
          tenant_id: this.tenant_id
        });
    }
  }

  // 3. توقعات المبيعات
  async generateSalesforecast(year: number, assumptions: {
    market_growth_rate: number;
    competitive_position: number;
    seasonal_factors: number[];
    pricing_strategy: 'aggressive' | 'competitive' | 'premium';
  }): Promise<SalesforecastItem[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const vehicleCategories = await this.getVehicleCategories();
    const historicalData = await this.getHistoricalSalesData(year - 1);
    const forecastResults: SalesforecastItem[] = [];

    for (let month = 1; month <= 12; month++) {
      for (const category of vehicleCategories) {
        const historicalRevenue = this.getHistoricalRevenue(historicalData, category, month);
        const seasonalFactor = assumptions.seasonal_factors[month - 1] || 1;
        const growthFactor = 1 + (assumptions.market_growth_rate / 100);
        const competitiveFactor = assumptions.competitive_position;
        
        const baseforecast = historicalRevenue * growthFactor * seasonalFactor * competitiveFactor;
        const averageDailyRate = await this.getAverageDailyRate(category, month);
        const forecastedContracts = Math.round(baseforecast / averageDailyRate);
        const utilizationRate = await this.calculateUtilizationRate(category, forecastedContracts);

        forecastResults.push({
          month: format(new Date(year, month - 1), 'yyyy-MM'),
          vehicle_category: category,
          forecasted_contracts: forecastedContracts,
          average_daily_rate: averageDailyRate,
          utilization_rate: utilizationRate,
          forecasted_revenue: baseforecast,
          confidence_level: this.calculateConfidenceLevel(historicalRevenue, baseforecast)
        });
      }
    }

    return forecastResults;
  }

  // 4. توقعات التدفق النقدي
  async generateCashFlowForecast(year: number, assumptions: {
    collection_period: number;
    payment_period: number;
    capital_expenditure: number;
    loan_repayments: number;
  }): Promise<CashFlowForecast[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const forecast: CashFlowForecast[] = [];
    let openingBalance = await this.getCurrentCashBalance();

    for (let month = 1; month <= 12; month++) {
      const monthStr = format(new Date(year, month - 1), 'yyyy-MM');
      
      // التدفقات النقدية التشغيلية
      const operatingInflow = await this.calculateOperatingInflow(monthStr, assumptions.collection_period);
      const operatingOutflow = await this.calculateOperatingOutflow(monthStr, assumptions.payment_period);
      
      // التدفقات الاستثمارية
      const investingCashFlow = -assumptions.capital_expenditure / 12;
      
      // التدفقات التمويلية
      const financingCashFlow = -assumptions.loan_repayments / 12;
      
      const netCashFlow = operatingInflow - operatingOutflow + investingCashFlow + financingCashFlow;
      const closingBalance = openingBalance + netCashFlow;

      forecast.push({
        month: monthStr,
        opening_balance: Math.round(openingBalance * 100) / 100,
        operating_cash_inflow: Math.round(operatingInflow * 100) / 100,
        operating_cash_outflow: Math.round(operatingOutflow * 100) / 100,
        investing_cash_flow: Math.round(investingCashFlow * 100) / 100,
        financing_cash_flow: Math.round(financingCashFlow * 100) / 100,
        net_cash_flow: Math.round(netCashFlow * 100) / 100,
        closing_balance: Math.round(closingBalance * 100) / 100
      });

      openingBalance = closingBalance;
    }

    return forecast;
  }

  // 5. تحليل الانحرافات
  async performVarianceAnalysis(budgetId: string, periodEnd: string): Promise<VarianceAnalysis[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: budgetItems } = await supabase
      .from('budget_items')
      .select('*')
      .eq('budget_id', budgetId);

    if (!budgetItems) return [];

    const analysisResults: VarianceAnalysis[] = [];

    for (const item of budgetItems) {
      const actualAmount = await this.getActualAmount(item.account_code, periodEnd);
      const varianceAmount = actualAmount - item.total_budget;
      const variancePercentage = item.total_budget > 0 ? (varianceAmount / item.total_budget) * 100 : 0;
      
      const varianceType = varianceAmount >= 0 ? 'favorable' : 'unfavorable';
      const significanceLevel = this.getSignificanceLevel(Math.abs(variancePercentage));
      const analysisNotes = this.generateAnalysisNotes(item.account_code, varianceAmount, variancePercentage);

      analysisResults.push({
        account_code: item.account_code,
        account_name: item.account_name,
        budget_amount: item.total_budget,
        actual_amount: actualAmount,
        variance_amount: Math.round(varianceAmount * 100) / 100,
        variance_percentage: Math.round(variancePercentage * 100) / 100,
        variance_type: varianceType,
        significance_level: significanceLevel,
        analysis_notes: analysisNotes
      });
    }

    return analysisResults;
  }

  // 6. تخطيط السيناريوهات
  async createScenarioPlanning(baseYear: number, scenarios: {
    optimistic: { growth_rate: number; cost_inflation: number; market_share: number };
    realistic: { growth_rate: number; cost_inflation: number; market_share: number };
    pessimistic: { growth_rate: number; cost_inflation: number; market_share: number };
  }): Promise<ScenarioPlanning[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const baseRevenue = await this.getBaseRevenue(baseYear);
    const baseCosts = await this.getBaseCosts(baseYear);
    const scenarioResults: ScenarioPlanning[] = [];

    for (const [scenarioName, params] of Object.entries(scenarios)) {
      const revenueGrowth = 1 + (params.growth_rate / 100);
      const costInflation = 1 + (params.cost_inflation / 100);
      const marketShare = 1 + (params.market_share / 100);

      const forecastedRevenue = baseRevenue * revenueGrowth * marketShare;
      const forecastedCosts = baseCosts * costInflation;
      const forecastedProfit = forecastedRevenue - forecastedCosts;

      scenarioResults.push({
        scenario_name: scenarioName,
        scenario_type: scenarioName as 'optimistic' | 'realistic' | 'pessimistic',
        growth_rate: params.growth_rate,
        cost_inflation_rate: params.cost_inflation,
        market_share_change: params.market_share,
        forecasted_revenue: Math.round(forecastedRevenue * 100) / 100,
        forecasted_costs: Math.round(forecastedCosts * 100) / 100,
        forecasted_profit: Math.round(forecastedProfit * 100) / 100,
        probability: this.getScenarioProbability(scenarioName)
      });
    }

    return scenarioResults;
  }

  // 7. مراقبة الموازنة في الوقت الفعلي
  async monitorBudgetPerformance(budgetId: string): Promise<{
    overall_performance: number;
    critical_variances: VarianceAnalysis[];
    recommendations: string[];
    budget_health_score: number;
  }> {
    if (!this.tenant_id) await this.initializeTenant();

    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const variances = await this.performVarianceAnalysis(budgetId, currentDate);
    
    const totalBudget = variances.reduce((sum, v) => sum + v.budget_amount, 0);
    const totalActual = variances.reduce((sum, v) => sum + v.actual_amount, 0);
    const overallPerformance = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    const criticalVariances = variances.filter(v => v.significance_level === 'high');
    const recommendations = this.generateBudgetRecommendations(variances);
    const budgetHealthScore = this.calculateBudgetHealthScore(variances);

    return {
      overall_performance: Math.round(overallPerformance * 100) / 100,
      critical_variances: criticalVariances,
      recommendations: recommendations,
      budget_health_score: budgetHealthScore
    };
  }

  // Helper Methods
  private async getChartOfAccounts(): Promise<{ code: string; name: string }[]> {
    // قائمة الحسابات الرئيسية
    return [
      { code: '4110101', name: 'إيرادات التأجير - سيارات اقتصادية' },
      { code: '4110201', name: 'إيرادات التأجير - سيارات متوسطة' },
      { code: '4110301', name: 'إيرادات التأجير - سيارات فاخرة' },
      { code: '5110101', name: 'إيجار المباني' },
      { code: '5110201', name: 'مصاريف الكهرباء' },
      { code: '5110202', name: 'مصاريف الماء' },
      { code: '5120101', name: 'رواتب الموظفين' },
      { code: '5120102', name: 'تأمينات اجتماعية' },
      { code: '5120103', name: 'تأمين طبي' },
      { code: '5130101', name: 'إهلاك المركبات' },
      { code: '5130102', name: 'إهلاك المعدات' },
      { code: '5130103', name: 'إهلاك الأثاث' },
      { code: '5140101', name: 'أتعاب قانونية' },
      { code: '5140102', name: 'أتعاب مهنية' },
      { code: '5140103', name: 'تأمين المركبات' },
      { code: '5140104', name: 'رسوم الترخيص' },
      { code: '5150101', name: 'مصاريف اتصالات' },
      { code: '5150102', name: 'مصاريف تسويق' },
      { code: '5210201', name: 'صيانة المركبات' },
      { code: '5210202', name: 'قطع غيار' },
      { code: '5210207', name: 'وقود' },
      { code: '5210208', name: 'زيوت ومواد تشحيم' }
    ];
  }

  private async calculateMonthlyBudgets(account: { code: string; name: string }, assumptions: any): Promise<any> {
    const historicalData = await this.getHistoricalAccountData(account.code);
    const baseBudget = this.calculateBaseBudget(account.code, historicalData, assumptions);
    
    // توزيع الموازنة شهرياً مع مراعاة العوامل الموسمية
    const seasonalFactors = this.getSeasonalFactors(account.code);
    
    return {
      jan: Math.round(baseBudget * seasonalFactors[0] * 100) / 100,
      feb: Math.round(baseBudget * seasonalFactors[1] * 100) / 100,
      mar: Math.round(baseBudget * seasonalFactors[2] * 100) / 100,
      apr: Math.round(baseBudget * seasonalFactors[3] * 100) / 100,
      may: Math.round(baseBudget * seasonalFactors[4] * 100) / 100,
      jun: Math.round(baseBudget * seasonalFactors[5] * 100) / 100,
      jul: Math.round(baseBudget * seasonalFactors[6] * 100) / 100,
      aug: Math.round(baseBudget * seasonalFactors[7] * 100) / 100,
      sep: Math.round(baseBudget * seasonalFactors[8] * 100) / 100,
      oct: Math.round(baseBudget * seasonalFactors[9] * 100) / 100,
      nov: Math.round(baseBudget * seasonalFactors[10] * 100) / 100,
      dec: Math.round(baseBudget * seasonalFactors[11] * 100) / 100
    };
  }

  private getBudgetCategory(accountCode: string): string {
    if (accountCode.startsWith('411')) return 'revenue';
    if (accountCode.startsWith('511')) return 'fixed_costs';
    if (accountCode.startsWith('512')) return 'personnel_costs';
    if (accountCode.startsWith('513')) return 'depreciation';
    if (accountCode.startsWith('514')) return 'professional_services';
    if (accountCode.startsWith('515')) return 'marketing_communication';
    if (accountCode.startsWith('521')) return 'variable_costs';
    return 'other';
  }

  private async getHistoricalAccountData(accountCode: string): Promise<number[]> {
    const { data: entries } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount, credit_amount, entry_date')
      .eq('tenant_id', this.tenant_id)
      .or(`debit_account.eq.${accountCode},credit_account.eq.${accountCode}`)
      .gte('entry_date', format(new Date(new Date().getFullYear() - 1, 0, 1), 'yyyy-MM-dd'))
      .order('entry_date');

    // تجميع البيانات شهرياً
    const monthlyData: number[] = Array(12).fill(0);
    
    entries?.forEach(entry => {
      const month = new Date(entry.entry_date).getMonth();
      const amount = accountCode.startsWith('4') ? entry.credit_amount : entry.debit_amount;
      monthlyData[month] += amount;
    });

    return monthlyData;
  }

  private calculateBaseBudget(accountCode: string, historicalData: number[], assumptions: any): number {
    const averageMonthly = historicalData.reduce((sum, amount) => sum + amount, 0) / 12;
    
    if (accountCode.startsWith('4')) {
      // الإيرادات
      return averageMonthly * (1 + assumptions.revenue_growth_rate / 100);
    } else if (accountCode.startsWith('5')) {
      // المصروفات
      return averageMonthly * (1 + assumptions.cost_inflation_rate / 100);
    }
    
    return averageMonthly;
  }

  private getSeasonalFactors(accountCode: string): number[] {
    // عوامل موسمية افتراضية (يمكن تحسينها بناءً على البيانات التاريخية)
    const revenueFactors = [0.8, 0.85, 1.1, 1.2, 1.3, 1.4, 1.5, 1.3, 1.1, 0.9, 0.8, 0.75];
    const costFactors = [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.3, 1.1, 1.0, 0.9, 0.8];
    
    if (accountCode.startsWith('4')) {
      return revenueFactors;
    } else {
      return costFactors;
    }
  }

  private async getVehicleCategories(): Promise<string[]> {
    const { data: categories } = await supabase
      .from('vehicles')
      .select('category')
      .eq('tenant_id', this.tenant_id)
      .not('category', 'is', null);

    return [...new Set(categories?.map(c => c.category) || [])];
  }

  private async getHistoricalSalesData(year: number): Promise<any[]> {
    const { data: sales } = await supabase
      .from('contracts')
      .select('total_amount, start_date, vehicle_id, vehicles(category)')
      .eq('tenant_id', this.tenant_id)
      .gte('start_date', `${year}-01-01`)
      .lte('start_date', `${year}-12-31`);

    return sales || [];
  }

  private getHistoricalRevenue(data: any[], category: string, month: number): number {
    return data
      .filter(item => 
        item.vehicles?.category === category && 
        new Date(item.start_date).getMonth() + 1 === month
      )
      .reduce((sum, item) => sum + item.total_amount, 0);
  }

  private async getAverageDailyRate(category: string, month: number): Promise<number> {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('daily_rate, vehicles(category)')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicles.category', category);

    const rates = contracts?.map(c => c.daily_rate) || [];
    return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  }

  private async calculateUtilizationRate(category: string, forecastedContracts: number): Promise<number> {
    const { count: vehicleCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenant_id)
      .eq('category', category)
      .eq('status', 'active');

    const totalCapacity = (vehicleCount || 0) * 30; // 30 يوم في الشهر
    const utilisedDays = forecastedContracts * 7; // افتراض 7 أيام متوسط لكل عقد
    
    return totalCapacity > 0 ? (utilisedDays / totalCapacity) * 100 : 0;
  }

  private calculateConfidenceLevel(historical: number, forecasted: number): number {
    const variance = Math.abs(forecasted - historical) / historical;
    
    if (variance <= 0.1) return 95;
    if (variance <= 0.2) return 85;
    if (variance <= 0.3) return 75;
    return 65;
  }

  private async getCurrentCashBalance(): Promise<number> {
    const { data: balance } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount, credit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('debit_account', '111%')
      .or('credit_account.like.111%')
      .order('entry_date', { ascending: false });

    // حساب الرصيد الحالي
    let cashBalance = 0;
    balance?.forEach(entry => {
      if (entry.debit_account?.startsWith('111')) {
        cashBalance += entry.debit_amount;
      } else if (entry.credit_account?.startsWith('111')) {
        cashBalance -= entry.credit_amount;
      }
    });

    return cashBalance;
  }

  private async calculateOperatingInflow(month: string, collectionPeriod: number): Promise<number> {
    // حساب التدفقات النقدية الداخلة من العمليات
    const { data: sales } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('credit_account', '411%')
      .gte('entry_date', `${month}-01`)
      .lte('entry_date', `${month}-31`);

    const monthlySales = sales?.reduce((sum, sale) => sum + sale.credit_amount, 0) || 0;
    
    // تأثير فترة التحصيل
    const collectionFactor = 1 - (collectionPeriod / 100);
    return monthlySales * collectionFactor;
  }

  private async calculateOperatingOutflow(month: string, paymentPeriod: number): Promise<number> {
    // حساب التدفقات النقدية الخارجة من العمليات
    const { data: expenses } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('debit_account', '5%')
      .gte('entry_date', `${month}-01`)
      .lte('entry_date', `${month}-31`);

    const monthlyExpenses = expenses?.reduce((sum, expense) => sum + expense.debit_amount, 0) || 0;
    
    // تأثير فترة الدفع
    const paymentFactor = 1 + (paymentPeriod / 100);
    return monthlyExpenses * paymentFactor;
  }

  private async getActualAmount(accountCode: string, periodEnd: string): Promise<number> {
    const { data: entries } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount, credit_amount')
      .eq('tenant_id', this.tenant_id)
      .or(`debit_account.eq.${accountCode},credit_account.eq.${accountCode}`)
      .lte('entry_date', periodEnd);

    let actualAmount = 0;
    entries?.forEach(entry => {
      if (entry.debit_account === accountCode) {
        actualAmount += entry.debit_amount;
      } else if (entry.credit_account === accountCode) {
        actualAmount += entry.credit_amount;
      }
    });

    return actualAmount;
  }

  private getSignificanceLevel(variancePercentage: number): 'low' | 'medium' | 'high' {
    if (variancePercentage <= 5) return 'low';
    if (variancePercentage <= 15) return 'medium';
    return 'high';
  }

  private generateAnalysisNotes(accountCode: string, varianceAmount: number, variancePercentage: number): string {
    const accountName = this.getAccountName(accountCode);
    const isPositive = varianceAmount > 0;
    const significance = this.getSignificanceLevel(Math.abs(variancePercentage));
    
    if (significance === 'high') {
      return `انحراف كبير في ${accountName} بنسبة ${Math.abs(variancePercentage).toFixed(1)}%. يتطلب تحليلاً فورياً وإجراءات تصحيحية.`;
    } else if (significance === 'medium') {
      return `انحراف متوسط في ${accountName}. يُنصح بمراجعة الأسباب ووضع خطة للتحسين.`;
    } else {
      return `انحراف طفيف في ${accountName} ضمن المعدلات المقبولة.`;
    }
  }

  private getAccountName(accountCode: string): string {
    const accounts = {
      '4110101': 'إيرادات التأجير - اقتصادية',
      '4110201': 'إيرادات التأجير - متوسطة',
      '4110301': 'إيرادات التأجير - فاخرة',
      '5110101': 'إيجار المباني',
      '5120101': 'رواتب الموظفين',
      '5130101': 'إهلاك المركبات',
      '5210201': 'صيانة المركبات',
      '5210207': 'وقود'
    };

    return accounts[accountCode as keyof typeof accounts] || 'حساب غير محدد';
  }

  private async getBaseRevenue(year: number): Promise<number> {
    const { data: revenue } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('credit_account', '411%')
      .gte('entry_date', `${year}-01-01`)
      .lte('entry_date', `${year}-12-31`);

    return revenue?.reduce((sum, r) => sum + r.credit_amount, 0) || 0;
  }

  private async getBaseCosts(year: number): Promise<number> {
    const { data: costs } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('debit_account', '5%')
      .gte('entry_date', `${year}-01-01`)
      .lte('entry_date', `${year}-12-31`);

    return costs?.reduce((sum, c) => sum + c.debit_amount, 0) || 0;
  }

  private getScenarioProbability(scenarioName: string): number {
    const probabilities = {
      'optimistic': 20,
      'realistic': 60,
      'pessimistic': 20
    };

    return probabilities[scenarioName as keyof typeof probabilities] || 33;
  }

  private generateBudgetRecommendations(variances: VarianceAnalysis[]): string[] {
    const recommendations: string[] = [];
    
    const revenueVariances = variances.filter(v => v.account_code.startsWith('4'));
    const costVariances = variances.filter(v => v.account_code.startsWith('5'));
    
    // توصيات الإيرادات
    const negativeRevenueVariances = revenueVariances.filter(v => v.variance_amount < 0);
    if (negativeRevenueVariances.length > 0) {
      recommendations.push('مراجعة استراتيجيات التسعير والتسويق لتحسين الإيرادات');
      recommendations.push('تحسين معدلات الإشغال والاستفادة من الطاقة الكاملة للأسطول');
    }

    // توصيات التكاليف
    const highCostVariances = costVariances.filter(v => v.variance_amount > 0 && v.significance_level === 'high');
    if (highCostVariances.length > 0) {
      recommendations.push('مراجعة سياسات التحكم في التكاليف وتطبيق إجراءات توفير');
      recommendations.push('تحسين كفاءة العمليات وتقليل الهدر');
    }

    // توصيات الصيانة
    const maintenanceVariances = variances.filter(v => v.account_code.startsWith('521'));
    if (maintenanceVariances.some(v => v.variance_amount > 0)) {
      recommendations.push('تطبيق برامج الصيانة الوقائية لتقليل تكاليف الصيانة الطارئة');
    }

    return recommendations;
  }

  private calculateBudgetHealthScore(variances: VarianceAnalysis[]): number {
    let score = 100;
    
    variances.forEach(variance => {
      const absVariancePercentage = Math.abs(variance.variance_percentage);
      
      if (variance.significance_level === 'high') {
        score -= 10;
      } else if (variance.significance_level === 'medium') {
        score -= 5;
      } else {
        score -= 1;
      }
      
      // خصم إضافي للانحرافات الكبيرة
      if (absVariancePercentage > 25) {
        score -= 15;
      } else if (absVariancePercentage > 15) {
        score -= 10;
      }
    });

    return Math.max(0, score);
  }
}

export const budgetingService = new BudgetingService(); 