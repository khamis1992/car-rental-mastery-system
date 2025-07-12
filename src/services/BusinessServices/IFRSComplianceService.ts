import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, startOfYear, endOfYear, addYears, parseISO } from 'date-fns';

export interface IAS16AssetClassification {
  asset_id: string;
  asset_name: string;
  asset_category: string;
  recognition_criteria: boolean;
  measurement_model: 'cost' | 'revaluation';
  cost_model_value: number;
  revaluation_model_value?: number;
  depreciation_method: 'straight_line' | 'diminishing_balance' | 'units_of_production';
  useful_life: number;
  residual_value: number;
  impairment_indicators: string[];
  compliance_status: 'compliant' | 'non_compliant' | 'under_review';
}

export interface IFRS15RevenueRecognition {
  contract_id: string;
  customer_id: string;
  contract_identification: boolean;
  performance_obligations: string[];
  transaction_price: number;
  price_allocation: { obligation: string; amount: number }[];
  revenue_recognition_pattern: 'over_time' | 'point_in_time';
  revenue_recognized: number;
  remaining_revenue: number;
  contract_liability: number;
  contract_asset: number;
  compliance_status: 'compliant' | 'non_compliant' | 'under_review';
}

export interface IFRS9FinancialInstruments {
  instrument_id: string;
  instrument_type: 'financial_asset' | 'financial_liability';
  classification: 'amortized_cost' | 'fair_value_oci' | 'fair_value_pl';
  business_model: 'collect_cash_flows' | 'collect_and_sell' | 'other';
  sppi_test: boolean;
  initial_measurement: number;
  subsequent_measurement: number;
  ecl_stage: 1 | 2 | 3;
  expected_credit_loss: number;
  impairment_provision: number;
  fair_value: number;
  compliance_status: 'compliant' | 'non_compliant' | 'under_review';
}

export interface ComplianceReport {
  report_date: string;
  standards_covered: string[];
  overall_compliance_score: number;
  ias16_compliance: {
    total_assets: number;
    compliant_assets: number;
    compliance_percentage: number;
    major_issues: string[];
  };
  ifrs15_compliance: {
    total_contracts: number;
    compliant_contracts: number;
    compliance_percentage: number;
    major_issues: string[];
  };
  ifrs9_compliance: {
    total_instruments: number;
    compliant_instruments: number;
    compliance_percentage: number;
    major_issues: string[];
  };
  recommendations: string[];
  action_items: string[];
}

export interface ImpairmentTest {
  asset_id: string;
  test_date: string;
  carrying_amount: number;
  recoverable_amount: number;
  value_in_use: number;
  fair_value_less_costs: number;
  impairment_loss: number;
  indicators_present: string[];
  test_method: 'discounted_cash_flow' | 'market_approach' | 'cost_approach';
  discount_rate: number;
  cash_flow_projections: number[];
  impairment_required: boolean;
}

export interface RevenueContract {
  contract_id: string;
  customer_id: string;
  contract_start_date: string;
  contract_end_date: string;
  total_contract_value: number;
  performance_obligations: {
    obligation_id: string;
    description: string;
    standalone_selling_price: number;
    allocated_amount: number;
    satisfaction_method: 'over_time' | 'point_in_time';
    progress_percentage: number;
    revenue_recognized: number;
  }[];
  variable_consideration: number;
  contract_modifications: {
    modification_date: string;
    modification_amount: number;
    accounting_treatment: 'separate_contract' | 'modification_of_existing';
  }[];
}

class IFRSComplianceService {
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

  // ===== IAS 16 - الأصول الثابتة =====

  async performIAS16Compliance(): Promise<IAS16AssetClassification[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('tenant_id', this.tenant_id)
      .eq('status', 'active');

    if (!vehicles) return [];

    const classifications: IAS16AssetClassification[] = [];

    for (const vehicle of vehicles) {
      // معايير الاعتراف بالأصل
      const recognitionCriteria = this.assessRecognitionCriteria(vehicle);
      
      // نموذج القياس
      const measurementModel = this.determineMeasurementModel(vehicle);
      
      // طريقة الإهلاك
      const depreciationMethod = this.determineDepreciationMethod(vehicle);
      
      // العمر الإنتاجي
      const usefulLife = this.calculateUsefulLife(vehicle);
      
      // القيمة المتبقية
      const residualValue = this.calculateResidualValue(vehicle);
      
      // مؤشرات انخفاض القيمة
      const impairmentIndicators = await this.identifyImpairmentIndicators(vehicle.id);
      
      // حالة الامتثال
      const complianceStatus = this.assessIAS16Compliance(
        recognitionCriteria,
        measurementModel,
        depreciationMethod,
        usefulLife,
        residualValue
      );

      classifications.push({
        asset_id: vehicle.id,
        asset_name: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
        asset_category: vehicle.category,
        recognition_criteria: recognitionCriteria,
        measurement_model: measurementModel,
        cost_model_value: vehicle.purchase_price || 0,
        revaluation_model_value: measurementModel === 'revaluation' ? await this.getFairValue(vehicle.id) : undefined,
        depreciation_method: depreciationMethod,
        useful_life: usefulLife,
        residual_value: residualValue,
        impairment_indicators: impairmentIndicators,
        compliance_status: complianceStatus
      });
    }

    return classifications;
  }

  async performImpairmentTest(assetId: string): Promise<ImpairmentTest> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: asset } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', assetId)
      .eq('tenant_id', this.tenant_id)
      .single();

    if (!asset) throw new Error('Asset not found');

    // القيمة الدفترية
    const carryingAmount = await this.calculateCarryingAmount(assetId);
    
    // القيمة القابلة للاستخدام
    const valueInUse = await this.calculateValueInUse(assetId);
    
    // القيمة العادلة ناقصاً تكاليف البيع
    const fairValueLessCosts = await this.calculateFairValueLessCosts(assetId);
    
    // القيمة القابلة للاسترداد
    const recoverableAmount = Math.max(valueInUse, fairValueLessCosts);
    
    // خسارة انخفاض القيمة
    const impairmentLoss = Math.max(0, carryingAmount - recoverableAmount);
    
    // مؤشرات انخفاض القيمة
    const indicators = await this.identifyImpairmentIndicators(assetId);
    
    // معدل الخصم
    const discountRate = await this.calculateDiscountRate();
    
    // إسقاطات التدفق النقدي
    const cashFlowProjections = await this.projectCashFlows(assetId, 5);

    return {
      asset_id: assetId,
      test_date: format(new Date(), 'yyyy-MM-dd'),
      carrying_amount: carryingAmount,
      recoverable_amount: recoverableAmount,
      value_in_use: valueInUse,
      fair_value_less_costs: fairValueLessCosts,
      impairment_loss: impairmentLoss,
      indicators_present: indicators,
      test_method: 'discounted_cash_flow',
      discount_rate: discountRate,
      cash_flow_projections: cashFlowProjections,
      impairment_required: impairmentLoss > 0
    };
  }

  // ===== IFRS 15 - الإيراد من العقود مع العملاء =====

  async performIFRS15Compliance(): Promise<IFRS15RevenueRecognition[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        *,
        customers(id, name),
        invoices(total_amount, status)
      `)
      .eq('tenant_id', this.tenant_id)
      .eq('status', 'active');

    if (!contracts) return [];

    const revenueRecognitions: IFRS15RevenueRecognition[] = [];

    for (const contract of contracts) {
      // الخطوة 1: تحديد العقد
      const contractIdentification = this.identifyContract(contract);
      
      // الخطوة 2: تحديد التزامات الأداء
      const performanceObligations = this.identifyPerformanceObligations(contract);
      
      // الخطوة 3: تحديد سعر المعاملة
      const transactionPrice = this.determineTransactionPrice(contract);
      
      // الخطوة 4: تخصيص سعر المعاملة
      const priceAllocation = this.allocateTransactionPrice(performanceObligations, transactionPrice);
      
      // الخطوة 5: الاعتراف بالإيراد
      const revenueRecognitionPattern = this.determineRevenueRecognitionPattern(contract);
      const revenueRecognized = await this.calculateRevenueRecognized(contract.id);
      const remainingRevenue = transactionPrice - revenueRecognized;
      
      // الأصول والخصوم التعاقدية
      const contractAsset = await this.calculateContractAsset(contract.id);
      const contractLiability = await this.calculateContractLiability(contract.id);
      
      // حالة الامتثال
      const complianceStatus = this.assessIFRS15Compliance(
        contractIdentification,
        performanceObligations,
        transactionPrice,
        priceAllocation,
        revenueRecognitionPattern
      );

      revenueRecognitions.push({
        contract_id: contract.id,
        customer_id: contract.customer_id,
        contract_identification: contractIdentification,
        performance_obligations: performanceObligations,
        transaction_price: transactionPrice,
        price_allocation: priceAllocation,
        revenue_recognition_pattern: revenueRecognitionPattern,
        revenue_recognized: revenueRecognized,
        remaining_revenue: remainingRevenue,
        contract_liability: contractLiability,
        contract_asset: contractAsset,
        compliance_status: complianceStatus
      });
    }

    return revenueRecognitions;
  }

  async analyzeRevenueContract(contractId: string): Promise<RevenueContract> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('tenant_id', this.tenant_id)
      .single();

    if (!contract) throw new Error('Contract not found');

    // تحليل التزامات الأداء
    const performanceObligations = this.analyzePerformanceObligations(contract);
    
    // تحليل الاعتبارات المتغيرة
    const variableConsideration = this.calculateVariableConsideration(contract);
    
    // تحليل تعديلات العقد
    const contractModifications = await this.analyzeContractModifications(contractId);

    return {
      contract_id: contractId,
      customer_id: contract.customer_id,
      contract_start_date: contract.start_date,
      contract_end_date: contract.end_date,
      total_contract_value: contract.total_amount,
      performance_obligations: performanceObligations,
      variable_consideration: variableConsideration,
      contract_modifications: contractModifications
    };
  }

  // ===== IFRS 9 - الأدوات المالية =====

  async performIFRS9Compliance(): Promise<IFRS9FinancialInstruments[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const financialInstruments: IFRS9FinancialInstruments[] = [];

    // تحليل الأصول المالية (الذمم المدينة)
    const receivables = await this.analyzeReceivables();
    financialInstruments.push(...receivables);

    // تحليل الخصوم المالية (القروض)
    const liabilities = await this.analyzeFinancialLiabilities();
    financialInstruments.push(...liabilities);

    // تحليل الاستثمارات المالية
    const investments = await this.analyzeInvestments();
    financialInstruments.push(...investments);

    return financialInstruments;
  }

  async calculateExpectedCreditLoss(customerId: string): Promise<{
    stage: 1 | 2 | 3;
    expected_credit_loss: number;
    provision_required: number;
    probability_of_default: number;
    loss_given_default: number;
    exposure_at_default: number;
  }> {
    if (!this.tenant_id) await this.initializeTenant();

    // تحليل التعرض الائتماني
    const exposureAtDefault = await this.calculateExposureAtDefault(customerId);
    
    // احتمالية التعثر
    const probabilityOfDefault = await this.calculateProbabilityOfDefault(customerId);
    
    // الخسارة عند التعثر
    const lossGivenDefault = await this.calculateLossGivenDefault(customerId);
    
    // تحديد المرحلة
    const stage = this.determineECLStage(customerId, probabilityOfDefault);
    
    // حساب الخسارة الائتمانية المتوقعة
    const expectedCreditLoss = this.calculateECL(
      exposureAtDefault,
      probabilityOfDefault,
      lossGivenDefault,
      stage
    );
    
    // المخصص المطلوب
    const currentProvision = await this.getCurrentProvision(customerId);
    const provisionRequired = expectedCreditLoss - currentProvision;

    return {
      stage,
      expected_credit_loss: expectedCreditLoss,
      provision_required: provisionRequired,
      probability_of_default: probabilityOfDefault,
      loss_given_default: lossGivenDefault,
      exposure_at_default: exposureAtDefault
    };
  }

  // ===== تقرير الامتثال الشامل =====

  async generateComplianceReport(): Promise<ComplianceReport> {
    if (!this.tenant_id) await this.initializeTenant();

    const reportDate = format(new Date(), 'yyyy-MM-dd');
    
    // تحليل IAS 16
    const ias16Analysis = await this.performIAS16Compliance();
    const ias16Compliance = {
      total_assets: ias16Analysis.length,
      compliant_assets: ias16Analysis.filter(a => a.compliance_status === 'compliant').length,
      compliance_percentage: ias16Analysis.length > 0 ? 
        (ias16Analysis.filter(a => a.compliance_status === 'compliant').length / ias16Analysis.length) * 100 : 0,
      major_issues: ias16Analysis
        .filter(a => a.compliance_status === 'non_compliant')
        .map(a => `${a.asset_name}: مشاكل في ${a.impairment_indicators.join(', ')}`)
    };

    // تحليل IFRS 15
    const ifrs15Analysis = await this.performIFRS15Compliance();
    const ifrs15Compliance = {
      total_contracts: ifrs15Analysis.length,
      compliant_contracts: ifrs15Analysis.filter(r => r.compliance_status === 'compliant').length,
      compliance_percentage: ifrs15Analysis.length > 0 ? 
        (ifrs15Analysis.filter(r => r.compliance_status === 'compliant').length / ifrs15Analysis.length) * 100 : 0,
      major_issues: ifrs15Analysis
        .filter(r => r.compliance_status === 'non_compliant')
        .map(r => `عقد ${r.contract_id}: مشاكل في الاعتراف بالإيراد`)
    };

    // تحليل IFRS 9
    const ifrs9Analysis = await this.performIFRS9Compliance();
    const ifrs9Compliance = {
      total_instruments: ifrs9Analysis.length,
      compliant_instruments: ifrs9Analysis.filter(i => i.compliance_status === 'compliant').length,
      compliance_percentage: ifrs9Analysis.length > 0 ? 
        (ifrs9Analysis.filter(i => i.compliance_status === 'compliant').length / ifrs9Analysis.length) * 100 : 0,
      major_issues: ifrs9Analysis
        .filter(i => i.compliance_status === 'non_compliant')
        .map(i => `أداة ${i.instrument_id}: مشاكل في التصنيف والقياس`)
    };

    // النقاط الإجمالية للامتثال
    const overallComplianceScore = Math.round(
      (ias16Compliance.compliance_percentage + 
       ifrs15Compliance.compliance_percentage + 
       ifrs9Compliance.compliance_percentage) / 3
    );

    // التوصيات
    const recommendations = this.generateRecommendations(
      ias16Compliance,
      ifrs15Compliance,
      ifrs9Compliance
    );

    // خطة العمل
    const actionItems = this.generateActionItems(
      ias16Compliance,
      ifrs15Compliance,
      ifrs9Compliance
    );

    return {
      report_date: reportDate,
      standards_covered: ['IAS 16', 'IFRS 15', 'IFRS 9'],
      overall_compliance_score: overallComplianceScore,
      ias16_compliance: ias16Compliance,
      ifrs15_compliance: ifrs15Compliance,
      ifrs9_compliance: ifrs9Compliance,
      recommendations: recommendations,
      action_items: actionItems
    };
  }

  // ===== الدوال المساعدة =====

  // IAS 16 Helper Functions
  private assessRecognitionCriteria(asset: any): boolean {
    // معايير الاعتراف: الفوائد الاقتصادية المحتملة + إمكانية القياس الموثوق
    const hasEconomicBenefits = asset.status === 'active' && asset.purchase_price > 0;
    const canBeMeasuredReliably = asset.purchase_price && asset.purchase_date;
    
    return hasEconomicBenefits && canBeMeasuredReliably;
  }

  private determineMeasurementModel(asset: any): 'cost' | 'revaluation' {
    // افتراض استخدام نموذج التكلفة للبساطة
    // في التطبيق الفعلي، قد يعتمد على سياسة الشركة
    return 'cost';
  }

  private determineDepreciationMethod(asset: any): 'straight_line' | 'diminishing_balance' | 'units_of_production' {
    // اختيار طريقة الإهلاك بناءً على نوع الأصل
    if (asset.category === 'commercial') {
      return 'units_of_production'; // للمركبات التجارية
    }
    return 'straight_line'; // للمركبات العادية
  }

  private calculateUsefulLife(asset: any): number {
    // العمر الإنتاجي حسب فئة المركبة
    const usefulLifeByCategory = {
      'economy': 8,
      'midsize': 10,
      'luxury': 12,
      'commercial': 6
    };
    
    return usefulLifeByCategory[asset.category as keyof typeof usefulLifeByCategory] || 10;
  }

  private calculateResidualValue(asset: any): number {
    // القيمة المتبقية كنسبة من قيمة الشراء
    const residualPercentage = 0.15; // 15%
    return (asset.purchase_price || 0) * residualPercentage;
  }

  private async identifyImpairmentIndicators(assetId: string): Promise<string[]> {
    const indicators: string[] = [];
    
    // فحص المؤشرات الخارجية
    const externalIndicators = await this.checkExternalImpairmentIndicators(assetId);
    indicators.push(...externalIndicators);
    
    // فحص المؤشرات الداخلية
    const internalIndicators = await this.checkInternalImpairmentIndicators(assetId);
    indicators.push(...internalIndicators);
    
    return indicators;
  }

  private async checkExternalImpairmentIndicators(assetId: string): Promise<string[]> {
    const indicators: string[] = [];
    
    // انخفاض القيمة السوقية
    const marketValue = await this.getFairValue(assetId);
    const bookValue = await this.calculateCarryingAmount(assetId);
    
    if (marketValue < bookValue * 0.8) {
      indicators.push('انخفاض كبير في القيمة السوقية');
    }
    
    // تغييرات في البيئة الاقتصادية
    // يمكن ربط هذا بمؤشرات اقتصادية خارجية
    
    return indicators;
  }

  private async checkInternalImpairmentIndicators(assetId: string): Promise<string[]> {
    const indicators: string[] = [];
    
    // تلف أو تقادم الأصل
    const { data: maintenanceRecords } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('vehicle_id', assetId)
      .eq('tenant_id', this.tenant_id);
    
    if (maintenanceRecords && maintenanceRecords.length > 10) {
      indicators.push('تكرار أعمال الصيانة يشير إلى تلف الأصل');
    }
    
    // انخفاض في الأداء الاقتصادي
    const economicPerformance = await this.assessEconomicPerformance(assetId);
    if (economicPerformance < 0.5) {
      indicators.push('انخفاض في الأداء الاقتصادي المتوقع');
    }
    
    return indicators;
  }

  private assessIAS16Compliance(
    recognition: boolean,
    measurement: string,
    depreciation: string,
    usefulLife: number,
    residualValue: number
  ): 'compliant' | 'non_compliant' | 'under_review' {
    if (!recognition) return 'non_compliant';
    if (!measurement || !depreciation) return 'non_compliant';
    if (usefulLife <= 0 || residualValue < 0) return 'non_compliant';
    
    return 'compliant';
  }

  // IFRS 15 Helper Functions
  private identifyContract(contract: any): boolean {
    // معايير تحديد العقد
    const hasCommercialSubstance = contract.total_amount > 0;
    const partiesApproved = contract.status !== 'draft';
    const rightsIdentified = contract.start_date && contract.end_date;
    const paymentTermsClear = contract.payment_terms;
    const probable = contract.status === 'active';
    
    return hasCommercialSubstance && partiesApproved && rightsIdentified && paymentTermsClear && probable;
  }

  private identifyPerformanceObligations(contract: any): string[] {
    const obligations: string[] = [];
    
    // التزام توفير المركبة
    obligations.push('توفير المركبة للتأجير');
    
    // خدمات إضافية
    if (contract.insurance_included) {
      obligations.push('توفير التأمين');
    }
    
    if (contract.maintenance_included) {
      obligations.push('توفير الصيانة');
    }
    
    if (contract.fuel_included) {
      obligations.push('توفير الوقود');
    }
    
    return obligations;
  }

  private determineTransactionPrice(contract: any): number {
    let transactionPrice = contract.total_amount;
    
    // تعديل للاعتبارات المتغيرة
    const variableConsideration = this.calculateVariableConsideration(contract);
    transactionPrice += variableConsideration;
    
    // تعديل للتمويل
    const financingComponent = this.calculateFinancingComponent(contract);
    transactionPrice -= financingComponent;
    
    return transactionPrice;
  }

  private allocateTransactionPrice(obligations: string[], transactionPrice: number): { obligation: string; amount: number }[] {
    const allocation: { obligation: string; amount: number }[] = [];
    
    // تخصيص بناءً على الأسعار المستقلة
    const standalonePrices = this.getStandalonePrices(obligations);
    const totalStandalonePrice = standalonePrices.reduce((sum, price) => sum + price, 0);
    
    for (let i = 0; i < obligations.length; i++) {
      const allocatedAmount = (standalonePrices[i] / totalStandalonePrice) * transactionPrice;
      allocation.push({
        obligation: obligations[i],
        amount: allocatedAmount
      });
    }
    
    return allocation;
  }

  private determineRevenueRecognitionPattern(contract: any): 'over_time' | 'point_in_time' {
    // خدمات التأجير تُعترف بها عبر الزمن
    return 'over_time';
  }

  private assessIFRS15Compliance(
    contractId: boolean,
    obligations: string[],
    price: number,
    allocation: any[],
    pattern: string
  ): 'compliant' | 'non_compliant' | 'under_review' {
    if (!contractId || obligations.length === 0) return 'non_compliant';
    if (price <= 0 || allocation.length === 0) return 'non_compliant';
    if (!pattern) return 'non_compliant';
    
    return 'compliant';
  }

  // IFRS 9 Helper Functions
  private async analyzeReceivables(): Promise<IFRS9FinancialInstruments[]> {
    const { data: receivables } = await supabase
      .from('automated_journal_entries')
      .select('*')
      .eq('tenant_id', this.tenant_id)
      .like('debit_account', '112%'); // حسابات العملاء

    // تحليل الذمم المدينة
    const instruments: IFRS9FinancialInstruments[] = [];
    
    // تجميع الذمم حسب العميل
    const customerReceivables = this.groupReceivablesByCustomer(receivables || []);
    
    for (const [customerId, amount] of Object.entries(customerReceivables)) {
      const eclStage = await this.determineECLStage(customerId, 0.05);
      const expectedCreditLoss = await this.calculateExpectedCreditLoss(customerId);
      
      instruments.push({
        instrument_id: `receivable_${customerId}`,
        instrument_type: 'financial_asset',
        classification: 'amortized_cost',
        business_model: 'collect_cash_flows',
        sppi_test: true,
        initial_measurement: amount as number,
        subsequent_measurement: amount as number - expectedCreditLoss.expected_credit_loss,
        ecl_stage: eclStage,
        expected_credit_loss: expectedCreditLoss.expected_credit_loss,
        impairment_provision: expectedCreditLoss.provision_required,
        fair_value: amount as number,
        compliance_status: 'compliant'
      });
    }
    
    return instruments;
  }

  private async analyzeFinancialLiabilities(): Promise<IFRS9FinancialInstruments[]> {
    // تحليل الخصوم المالية (القروض، الدائنون، إلخ)
    const instruments: IFRS9FinancialInstruments[] = [];
    
    // يمكن توسيع هذا لتشمل القروض والخصوم الأخرى
    
    return instruments;
  }

  private async analyzeInvestments(): Promise<IFRS9FinancialInstruments[]> {
    // تحليل الاستثمارات المالية
    const instruments: IFRS9FinancialInstruments[] = [];
    
    // يمكن توسيع هذا لتشمل الاستثمارات
    
    return instruments;
  }

  private determineECLStage(customerId: string, probabilityOfDefault: number): 1 | 2 | 3 {
    // المرحلة 1: لا يوجد زيادة كبيرة في المخاطر الائتمانية
    if (probabilityOfDefault < 0.05) return 1;
    
    // المرحلة 2: زيادة كبيرة في المخاطر الائتمانية
    if (probabilityOfDefault < 0.20) return 2;
    
    // المرحلة 3: انخفاض ائتماني
    return 3;
  }

  private calculateECL(
    exposureAtDefault: number,
    probabilityOfDefault: number,
    lossGivenDefault: number,
    stage: 1 | 2 | 3
  ): number {
    // حساب الخسارة الائتمانية المتوقعة
    let timeHorizon = 1; // سنة واحدة للمرحلة 1
    
    if (stage === 2 || stage === 3) {
      timeHorizon = 5; // العمر الكامل للمرحلتين 2 و 3
    }
    
    return exposureAtDefault * probabilityOfDefault * lossGivenDefault * timeHorizon;
  }

  // المزيد من الدوال المساعدة...

  private async calculateCarryingAmount(assetId: string): Promise<number> {
    // حساب القيمة الدفترية للأصل
    const { data: asset } = await supabase
      .from('vehicles')
      .select('purchase_price, purchase_date')
      .eq('id', assetId)
      .single();

    if (!asset) return 0;

    const purchasePrice = asset.purchase_price || 0;
    const purchaseDate = parseISO(asset.purchase_date);
    const yearsElapsed = differenceInDays(new Date(), purchaseDate) / 365;
    
    // إهلاك خط مستقيم
    const usefulLife = 10; // سنوات
    const residualValue = purchasePrice * 0.15;
    const annualDepreciation = (purchasePrice - residualValue) / usefulLife;
    const accumulatedDepreciation = Math.min(annualDepreciation * yearsElapsed, purchasePrice - residualValue);
    
    return purchasePrice - accumulatedDepreciation;
  }

  private async calculateValueInUse(assetId: string): Promise<number> {
    // حساب القيمة القابلة للاستخدام
    const cashFlowProjections = await this.projectCashFlows(assetId, 5);
    const discountRate = await this.calculateDiscountRate();
    
    let valueInUse = 0;
    for (let i = 0; i < cashFlowProjections.length; i++) {
      const discountedCashFlow = cashFlowProjections[i] / Math.pow(1 + discountRate, i + 1);
      valueInUse += discountedCashFlow;
    }
    
    return valueInUse;
  }

  private async calculateFairValueLessCosts(assetId: string): Promise<number> {
    // حساب القيمة العادلة ناقصاً تكاليف البيع
    const fairValue = await this.getFairValue(assetId);
    const disposalCosts = fairValue * 0.05; // 5% تكاليف البيع
    
    return fairValue - disposalCosts;
  }

  private async getFairValue(assetId: string): Promise<number> {
    // حساب القيمة العادلة بناءً على السوق
    const { data: asset } = await supabase
      .from('vehicles')
      .select('make, model, year, purchase_price')
      .eq('id', assetId)
      .single();

    if (!asset) return 0;

    // تقدير القيمة العادلة بناءً على العمر والاستهلاك
    const currentYear = new Date().getFullYear();
    const age = currentYear - asset.year;
    const depreciationRate = 0.15; // 15% سنوياً
    
    return asset.purchase_price * Math.pow(1 - depreciationRate, age);
  }

  private async projectCashFlows(assetId: string, years: number): Promise<number[]> {
    // إسقاط التدفقات النقدية للأصل
    const { data: revenueData } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', assetId)
      .like('credit_account', '411%');

    const annualRevenue = revenueData?.reduce((sum, entry) => sum + entry.credit_amount, 0) || 0;
    const projections: number[] = [];
    
    for (let i = 0; i < years; i++) {
      // تقدير بسيط مع تراجع تدريجي
      const yearlyRevenue = annualRevenue * Math.pow(0.95, i);
      projections.push(yearlyRevenue);
    }
    
    return projections;
  }

  private async calculateDiscountRate(): Promise<number> {
    // حساب معدل الخصم (WACC)
    const riskFreeRate = 0.03; // 3% معدل خالي من المخاطر
    const marketRiskPremium = 0.06; // 6% علاوة مخاطر السوق
    const beta = 1.2; // بيتا الصناعة
    
    return riskFreeRate + (beta * marketRiskPremium);
  }

  private async assessEconomicPerformance(assetId: string): Promise<number> {
    // تقييم الأداء الاقتصادي للأصل
    const revenue = await this.getAssetRevenue(assetId);
    const costs = await this.getAssetCosts(assetId);
    const netCashFlow = revenue - costs;
    
    // نسبة الأداء
    return revenue > 0 ? netCashFlow / revenue : 0;
  }

  private async getAssetRevenue(assetId: string): Promise<number> {
    const { data: revenue } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', assetId)
      .like('credit_account', '411%');

    return revenue?.reduce((sum, entry) => sum + entry.credit_amount, 0) || 0;
  }

  private async getAssetCosts(assetId: string): Promise<number> {
    const { data: costs } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', assetId)
      .like('debit_account', '521%');

    return costs?.reduce((sum, entry) => sum + entry.debit_amount, 0) || 0;
  }

  private calculateVariableConsideration(contract: any): number {
    // حساب الاعتبارات المتغيرة (خصومات، مكافآت، إلخ)
    let variableAmount = 0;
    
    // خصومات للدفع المبكر
    if (contract.early_payment_discount) {
      variableAmount -= contract.total_amount * 0.02; // 2% خصم
    }
    
    // غرامات التأخير
    if (contract.late_fees) {
      variableAmount += contract.total_amount * 0.01; // 1% غرامة
    }
    
    return variableAmount;
  }

  private calculateFinancingComponent(contract: any): number {
    // حساب المكون التمويلي
    const contractDuration = differenceInDays(
      parseISO(contract.end_date),
      parseISO(contract.start_date)
    );
    
    // إذا كانت المدة أكثر من سنة، قد يكون هناك مكون تمويلي
    if (contractDuration > 365) {
      const impliedInterestRate = 0.05; // 5% سنوياً
      return contract.total_amount * impliedInterestRate * (contractDuration / 365);
    }
    
    return 0;
  }

  private getStandalonePrices(obligations: string[]): number[] {
    // أسعار مستقلة للالتزامات المختلفة
    const prices: number[] = [];
    
    for (const obligation of obligations) {
      switch (obligation) {
        case 'توفير المركبة للتأجير':
          prices.push(100); // سعر أساسي
          break;
        case 'توفير التأمين':
          prices.push(20);
          break;
        case 'توفير الصيانة':
          prices.push(15);
          break;
        case 'توفير الوقود':
          prices.push(30);
          break;
        default:
          prices.push(10);
      }
    }
    
    return prices;
  }

  private analyzePerformanceObligations(contract: any): {
    obligation_id: string;
    description: string;
    standalone_selling_price: number;
    allocated_amount: number;
    satisfaction_method: 'over_time' | 'point_in_time';
    progress_percentage: number;
    revenue_recognized: number;
  }[] {
    const obligations = this.identifyPerformanceObligations(contract);
    const transactionPrice = this.determineTransactionPrice(contract);
    const allocation = this.allocateTransactionPrice(obligations, transactionPrice);
    
    return allocation.map((alloc, index) => ({
      obligation_id: `obl_${index + 1}`,
      description: alloc.obligation,
      standalone_selling_price: alloc.amount,
      allocated_amount: alloc.amount,
      satisfaction_method: 'over_time' as const,
      progress_percentage: this.calculateProgressPercentage(contract, alloc.obligation),
      revenue_recognized: alloc.amount * (this.calculateProgressPercentage(contract, alloc.obligation) / 100)
    }));
  }

  private calculateProgressPercentage(contract: any, obligation: string): number {
    const totalDays = differenceInDays(
      parseISO(contract.end_date),
      parseISO(contract.start_date)
    );
    
    const elapsedDays = differenceInDays(
      new Date(),
      parseISO(contract.start_date)
    );
    
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  }

  private async analyzeContractModifications(contractId: string): Promise<{
    modification_date: string;
    modification_amount: number;
    accounting_treatment: 'separate_contract' | 'modification_of_existing';
  }[]> {
    // تحليل تعديلات العقد
    // في التطبيق الفعلي، قد تكون هناك جداول منفصلة لتعديلات العقود
    
    return [];
  }

  private async calculateRevenueRecognized(contractId: string): Promise<number> {
    const { data: revenue } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('source_id', contractId)
      .like('credit_account', '411%');

    return revenue?.reduce((sum, entry) => sum + entry.credit_amount, 0) || 0;
  }

  private async calculateContractAsset(contractId: string): Promise<number> {
    // حساب الأصول التعاقدية
    // الإيراد المعترف به - المبالغ المفوترة
    const revenueRecognized = await this.calculateRevenueRecognized(contractId);
    const billedAmount = await this.getBilledAmount(contractId);
    
    return Math.max(0, revenueRecognized - billedAmount);
  }

  private async calculateContractLiability(contractId: string): Promise<number> {
    // حساب الخصوم التعاقدية
    // المبالغ المحصلة - الإيراد المعترف به
    const collectedAmount = await this.getCollectedAmount(contractId);
    const revenueRecognized = await this.calculateRevenueRecognized(contractId);
    
    return Math.max(0, collectedAmount - revenueRecognized);
  }

  private async getBilledAmount(contractId: string): Promise<number> {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('contract_id', contractId);

    return invoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
  }

  private async getCollectedAmount(contractId: string): Promise<number> {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('tenant_id', this.tenant_id)
      .eq('contract_id', contractId)
      .eq('status', 'completed');

    return payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  }

  private groupReceivablesByCustomer(entries: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    entries.forEach(entry => {
      const customerId = entry.customer_id || 'unknown';
      grouped[customerId] = (grouped[customerId] || 0) + entry.debit_amount;
    });
    
    return grouped;
  }

  private async calculateExposureAtDefault(customerId: string): Promise<number> {
    const { data: receivables } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('customer_id', customerId)
      .like('debit_account', '112%');

    return receivables?.reduce((sum, entry) => sum + entry.debit_amount, 0) || 0;
  }

  private async calculateProbabilityOfDefault(customerId: string): Promise<number> {
    // حساب احتمالية التعثر بناءً على التاريخ الائتماني
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (!customer) return 0.1; // 10% افتراضي

    // تحليل تاريخ الدفع
    const paymentHistory = await this.getPaymentHistory(customerId);
    const latePayments = paymentHistory.filter(p => p.days_late > 30).length;
    const totalPayments = paymentHistory.length;
    
    if (totalPayments === 0) return 0.05; // 5% للعملاء الجدد
    
    const latePaymentRatio = latePayments / totalPayments;
    
    // نموذج بسيط لحساب احتمالية التعثر
    return Math.min(0.5, 0.02 + (latePaymentRatio * 0.3));
  }

  private async calculateLossGivenDefault(customerId: string): Promise<number> {
    // حساب الخسارة عند التعثر
    // افتراض معدل استرداد 70%، فالخسارة 30%
    return 0.30;
  }

  private async getPaymentHistory(customerId: string): Promise<{ days_late: number }[]> {
    const { data: payments } = await supabase
      .from('payments')
      .select('due_date, paid_date')
      .eq('tenant_id', this.tenant_id)
      .eq('customer_id', customerId)
      .not('paid_date', 'is', null);

    return payments?.map(payment => ({
      days_late: Math.max(0, differenceInDays(
        parseISO(payment.paid_date),
        parseISO(payment.due_date)
      ))
    })) || [];
  }

  private async getCurrentProvision(customerId: string): Promise<number> {
    const { data: provision } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('customer_id', customerId)
      .eq('credit_account', '1140101'); // مخصص ديون مشكوك فيها

    return provision?.reduce((sum, entry) => sum + entry.credit_amount, 0) || 0;
  }

  private generateRecommendations(ias16: any, ifrs15: any, ifrs9: any): string[] {
    const recommendations: string[] = [];
    
    if (ias16.compliance_percentage < 90) {
      recommendations.push('تحسين إجراءات إدارة الأصول الثابتة وتطبيق اختبارات انخفاض القيمة');
    }
    
    if (ifrs15.compliance_percentage < 90) {
      recommendations.push('مراجعة وتحديث سياسات الاعتراف بالإيراد لتتوافق مع IFRS 15');
    }
    
    if (ifrs9.compliance_percentage < 90) {
      recommendations.push('تطوير نماذج أكثر دقة لحساب الخسائر الائتمانية المتوقعة');
    }
    
    recommendations.push('تدريب الفرق المحاسبية على المعايير المحاسبية الدولية');
    recommendations.push('إجراء مراجعة دورية لسياسات المحاسبة والتقارير المالية');
    
    return recommendations;
  }

  private generateActionItems(ias16: any, ifrs15: any, ifrs9: any): string[] {
    const actionItems: string[] = [];
    
    if (ias16.major_issues.length > 0) {
      actionItems.push('تصحيح مشاكل الأصول الثابتة خلال 30 يوم');
    }
    
    if (ifrs15.major_issues.length > 0) {
      actionItems.push('مراجعة عقود الإيراد غير المتوافقة خلال 15 يوم');
    }
    
    if (ifrs9.major_issues.length > 0) {
      actionItems.push('تحديث نماذج الخسائر الائتمانية خلال 45 يوم');
    }
    
    actionItems.push('إعداد تقرير ربع سنوي لمراقبة الامتثال');
    actionItems.push('تطوير نظام إنذار مبكر للمخاطر غير المتوافقة');
    
    return actionItems;
  }
}

export const ifrsComplianceService = new IFRSComplianceService(); 