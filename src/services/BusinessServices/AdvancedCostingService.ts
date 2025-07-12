import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: 'vehicle' | 'branch' | 'department' | 'project';
  parent_cost_center_id?: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
  manager_id: string;
  is_active: boolean;
}

export interface CostDriverAnalysis {
  cost_driver: string;
  total_cost: number;
  cost_per_unit: number;
  volume: number;
  efficiency_ratio: number;
  benchmark_cost: number;
  variance_from_benchmark: number;
}

export interface ActivityBasedCosting {
  activity_id: string;
  activity_name: string;
  activity_cost: number;
  cost_driver: string;
  cost_driver_volume: number;
  cost_per_driver: number;
  products_services: string[];
  resource_consumption: number;
}

export interface MarginalCostAnalysis {
  variable_cost_per_day: number;
  fixed_cost_per_day: number;
  total_cost_per_day: number;
  break_even_rate: number;
  contribution_margin: number;
  contribution_margin_ratio: number;
}

export interface CostAllocation {
  cost_center_id: string;
  allocated_amount: number;
  allocation_basis: string;
  allocation_percentage: number;
}

class AdvancedCostingService {
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

  // 1. Activity-Based Costing (ABC) Implementation
  async calculateActivityBasedCosts(period: string): Promise<ActivityBasedCosting[]> {
    if (!this.tenant_id) await this.initializeTenant();

    // تحليل الأنشطة والتكاليف
    const activities = [
      {
        activity_id: 'vehicle_maintenance',
        activity_name: 'صيانة المركبات',
        cost_driver: 'hours_of_usage',
        account_codes: ['5210201', '5210202', '5210203', '5210204', '5210205', '5210206']
      },
      {
        activity_id: 'fuel_consumption',
        activity_name: 'استهلاك الوقود',
        cost_driver: 'kilometers_driven',
        account_codes: ['5210207', '5210208']
      },
      {
        activity_id: 'customer_service',
        activity_name: 'خدمة العملاء',
        cost_driver: 'number_of_contracts',
        account_codes: ['5120101', '5120102', '5120103']
      },
      {
        activity_id: 'administration',
        activity_name: 'الإدارة العامة',
        cost_driver: 'revenue_generated',
        account_codes: ['5110201', '5110202', '5140101', '5150101']
      },
      {
        activity_id: 'vehicle_depreciation',
        activity_name: 'إهلاك المركبات',
        cost_driver: 'vehicle_count',
        account_codes: ['5130101', '5130102', '5130103']
      },
      {
        activity_id: 'insurance_licensing',
        activity_name: 'التأمين والتراخيص',
        cost_driver: 'vehicle_count',
        account_codes: ['5140103', '5140104', '5140101']
      }
    ];

    const results: ActivityBasedCosting[] = [];

    for (const activity of activities) {
      // حساب تكلفة النشاط
      const { data: costs } = await supabase
        .from('automated_journal_entries')
        .select('debit_amount')
        .eq('tenant_id', this.tenant_id)
        .in('debit_account', activity.account_codes)
        .gte('entry_date', `${period}-01`)
        .lte('entry_date', `${period}-31`);

      const totalCost = costs?.reduce((sum, cost) => sum + cost.debit_amount, 0) || 0;

      // حساب حجم محرك التكلفة
      let driverVolume = 0;
      switch (activity.cost_driver) {
        case 'hours_of_usage':
          driverVolume = await this.calculateVehicleUsageHours(period);
          break;
        case 'kilometers_driven':
          driverVolume = await this.calculateKilometersDriven(period);
          break;
        case 'number_of_contracts':
          driverVolume = await this.calculateContractsCount(period);
          break;
        case 'revenue_generated':
          driverVolume = await this.calculateRevenueGenerated(period);
          break;
        case 'vehicle_count':
          driverVolume = await this.getActiveVehicleCount();
          break;
      }

      results.push({
        activity_id: activity.activity_id,
        activity_name: activity.activity_name,
        activity_cost: totalCost,
        cost_driver: activity.cost_driver,
        cost_driver_volume: driverVolume,
        cost_per_driver: driverVolume > 0 ? totalCost / driverVolume : 0,
        products_services: ['rental_services'],
        resource_consumption: this.calculateResourceConsumption(activity.activity_id)
      });
    }

    return results;
  }

  // 2. Cost Center Performance Analysis
  async analyzeCostCenterPerformance(period: string): Promise<CostCenter[]> {
    if (!this.tenant_id) await this.initializeTenant();

    const { data: costCenters } = await supabase
      .from('cost_centers')
      .select(`
        id, code, name, type, parent_cost_center_id, manager_id, is_active,
        budget_amount, actual_spent
      `)
      .eq('tenant_id', this.tenant_id)
      .eq('is_active', true);

    if (!costCenters) return [];

    return costCenters.map(cc => {
      const budgetAmount = cc.budget_amount || 0;
      const actualAmount = cc.actual_spent || 0;
      const variance = actualAmount - budgetAmount;
      const variancePercentage = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;

      return {
        id: cc.id,
        code: cc.code,
        name: cc.name,
        type: cc.type,
        parent_cost_center_id: cc.parent_cost_center_id,
        budget_amount: budgetAmount,
        actual_amount: actualAmount,
        variance: variance,
        variance_percentage: variancePercentage,
        manager_id: cc.manager_id,
        is_active: cc.is_active
      };
    });
  }

  // 3. Cost Driver Analysis
  async performCostDriverAnalysis(period: string): Promise<CostDriverAnalysis[]> {
    const costDrivers = [
      { driver: 'vehicle_count', account_codes: ['5130101', '5110101'], unit: 'مركبة' },
      { driver: 'employee_count', account_codes: ['5120101', '5120102'], unit: 'موظف' },
      { driver: 'contract_count', account_codes: ['5140101', '5150101'], unit: 'عقد' },
      { driver: 'office_space', account_codes: ['5110201', '5110202'], unit: 'متر مربع' },
      { driver: 'fuel_consumption', account_codes: ['5210207', '5210208'], unit: 'لتر' },
      { driver: 'maintenance_hours', account_codes: ['5210201', '5210202'], unit: 'ساعة' }
    ];

    const results: CostDriverAnalysis[] = [];

    for (const driver of costDrivers) {
      const totalCost = await this.calculateCostForAccounts(driver.account_codes, period);
      const volume = await this.getCostDriverVolume(driver.driver, period);
      const costPerUnit = volume > 0 ? totalCost / volume : 0;
      
      // معايير الصناعة (benchmarks)
      const benchmarkCost = await this.getIndustryBenchmark(driver.driver);
      const varianceFromBenchmark = costPerUnit - benchmarkCost;
      const efficiencyRatio = benchmarkCost > 0 ? costPerUnit / benchmarkCost : 1;

      results.push({
        cost_driver: driver.driver,
        total_cost: totalCost,
        cost_per_unit: costPerUnit,
        volume: volume,
        efficiency_ratio: efficiencyRatio,
        benchmark_cost: benchmarkCost,
        variance_from_benchmark: varianceFromBenchmark
      });
    }

    return results;
  }

  // 4. Marginal Cost Analysis
  async calculateMarginalCosts(vehicleId: string, period: string): Promise<MarginalCostAnalysis> {
    // التكاليف المتغيرة (وقود، صيانة، تنظيف)
    const variableCosts = await this.calculateVariableCosts(vehicleId, period);
    
    // التكاليف الثابتة (إهلاك، تأمين، رخص)
    const fixedCosts = await this.calculateFixedCosts(vehicleId, period);
    
    const daysInPeriod = 30; // شهر
    const variableCostPerDay = variableCosts / daysInPeriod;
    const fixedCostPerDay = fixedCosts / daysInPeriod;
    const totalCostPerDay = variableCostPerDay + fixedCostPerDay;

    // سعر التأجير اليومي المتوسط
    const averageDailyRate = await this.getAverageDailyRate(vehicleId, period);
    
    const contributionMargin = averageDailyRate - variableCostPerDay;
    const contributionMarginRatio = averageDailyRate > 0 ? (contributionMargin / averageDailyRate) * 100 : 0;
    const breakEvenRate = totalCostPerDay;

    return {
      variable_cost_per_day: Math.round(variableCostPerDay * 100) / 100,
      fixed_cost_per_day: Math.round(fixedCostPerDay * 100) / 100,
      total_cost_per_day: Math.round(totalCostPerDay * 100) / 100,
      break_even_rate: Math.round(breakEvenRate * 100) / 100,
      contribution_margin: Math.round(contributionMargin * 100) / 100,
      contribution_margin_ratio: Math.round(contributionMarginRatio * 100) / 100
    };
  }

  // 5. Cost Allocation Methods
  async allocateOverheadCosts(period: string): Promise<CostAllocation[]> {
    // تحديد التكاليف العامة
    const overheadAccounts = ['5110201', '5110202', '5140101', '5150101', '5120101'];
    const totalOverhead = await this.calculateCostForAccounts(overheadAccounts, period);

    // أسس التوزيع
    const allocationBases = await this.calculateAllocationBases(period);
    const totalBasisValue = allocationBases.reduce((sum, b) => sum + b.value, 0);
    
    const allocations: CostAllocation[] = [];
    
    for (const basis of allocationBases) {
      const allocationPercentage = totalBasisValue > 0 ? (basis.value / totalBasisValue) * 100 : 0;
      const allocatedAmount = (totalOverhead * allocationPercentage) / 100;

      allocations.push({
        cost_center_id: basis.cost_center_id,
        allocated_amount: Math.round(allocatedAmount * 100) / 100,
        allocation_basis: basis.basis_type,
        allocation_percentage: Math.round(allocationPercentage * 100) / 100
      });
    }

    return allocations;
  }

  // 6. Vehicle Profitability Analysis
  async analyzeVehicleProfitability(vehicleId: string, period: string): Promise<{
    vehicle_id: string;
    revenue: number;
    direct_costs: number;
    allocated_costs: number;
    total_costs: number;
    gross_profit: number;
    net_profit: number;
    profit_margin: number;
    utilization_rate: number;
  }> {
    // الإيرادات
    const revenue = await this.calculateVehicleRevenue(vehicleId, period);
    
    // التكاليف المباشرة
    const directCosts = await this.calculateDirectCosts(vehicleId, period);
    
    // التكاليف المحملة
    const allocatedCosts = await this.calculateAllocatedCosts(vehicleId, period);
    
    const totalCosts = directCosts + allocatedCosts;
    const grossProfit = revenue - directCosts;
    const netProfit = revenue - totalCosts;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const utilizationRate = await this.calculateVehicleUtilization(vehicleId, period);

    return {
      vehicle_id: vehicleId,
      revenue: Math.round(revenue * 100) / 100,
      direct_costs: Math.round(directCosts * 100) / 100,
      allocated_costs: Math.round(allocatedCosts * 100) / 100,
      total_costs: Math.round(totalCosts * 100) / 100,
      gross_profit: Math.round(grossProfit * 100) / 100,
      net_profit: Math.round(netProfit * 100) / 100,
      profit_margin: Math.round(profitMargin * 100) / 100,
      utilization_rate: Math.round(utilizationRate * 100) / 100
    };
  }

  // Helper Methods
  private async calculateVehicleUsageHours(period: string): Promise<number> {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('start_date, end_date')
      .eq('tenant_id', this.tenant_id)
      .gte('start_date', `${period}-01`)
      .lte('end_date', `${period}-31`);

    return contracts?.reduce((total, contract) => {
      const days = differenceInDays(new Date(contract.end_date), new Date(contract.start_date));
      return total + (days * 8); // افتراض 8 ساعات يومياً
    }, 0) || 0;
  }

  private async calculateKilometersDriven(period: string): Promise<number> {
    // في التطبيق الفعلي، يمكن ربط هذا بنظام تتبع GPS
    const contractsCount = await this.calculateContractsCount(period);
    return contractsCount * 500; // متوسط 500 كم لكل عقد
  }

  private async calculateContractsCount(period: string): Promise<number> {
    const { count } = await supabase
      .from('contracts')
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenant_id)
      .gte('start_date', `${period}-01`)
      .lte('end_date', `${period}-31`);

    return count || 0;
  }

  private async calculateRevenueGenerated(period: string): Promise<number> {
    const { data: revenue } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .like('credit_account', '411%')
      .gte('entry_date', `${period}-01`)
      .lte('entry_date', `${period}-31`);

    return revenue?.reduce((sum, r) => sum + r.credit_amount, 0) || 0;
  }

  private async getActiveVehicleCount(): Promise<number> {
    const { count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenant_id)
      .eq('status', 'active');

    return count || 0;
  }

  private calculateResourceConsumption(activityId: string): number {
    // حساب استهلاك الموارد لكل نشاط
    const resourceMap = {
      'vehicle_maintenance': 0.25,    // 25% من الموارد
      'fuel_consumption': 0.30,       // 30% من الموارد
      'customer_service': 0.15,       // 15% من الموارد
      'administration': 0.15,         // 15% من الموارد
      'vehicle_depreciation': 0.10,   // 10% من الموارد
      'insurance_licensing': 0.05     // 5% من الموارد
    };

    return resourceMap[activityId as keyof typeof resourceMap] || 0;
  }

  private async calculateCostForAccounts(accounts: string[], period: string): Promise<number> {
    const { data: costs } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .in('debit_account', accounts)
      .gte('entry_date', `${period}-01`)
      .lte('entry_date', `${period}-31`);

    return costs?.reduce((sum, cost) => sum + cost.debit_amount, 0) || 0;
  }

  private async getCostDriverVolume(driver: string, period: string): Promise<number> {
    switch (driver) {
      case 'vehicle_count':
        return await this.getActiveVehicleCount();

      case 'employee_count':
        const { count: employeeCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact' })
          .eq('tenant_id', this.tenant_id)
          .eq('status', 'active');
        return employeeCount || 0;

      case 'contract_count':
        return await this.calculateContractsCount(period);

      case 'office_space':
        return 1000; // افتراض 1000 متر مربع

      case 'fuel_consumption':
        return await this.calculateKilometersDriven(period) * 0.08; // افتراض 8 لتر/100كم

      case 'maintenance_hours':
        return await this.calculateVehicleUsageHours(period) * 0.1; // افتراض 10% صيانة

      default:
        return 1;
    }
  }

  private async getIndustryBenchmark(driver: string): Promise<number> {
    // معايير الصناعة (يمكن ربطها بقواعد بيانات خارجية)
    const benchmarks = {
      'vehicle_count': 2500,      // 2500 د.ك لكل مركبة شهرياً
      'employee_count': 800,      // 800 د.ك لكل موظف شهرياً  
      'contract_count': 150,      // 150 د.ك لكل عقد
      'office_space': 25,         // 25 د.ك لكل متر مربع شهرياً
      'fuel_consumption': 1.2,    // 1.2 د.ك لكل لتر
      'maintenance_hours': 45     // 45 د.ك لكل ساعة صيانة
    };

    return benchmarks[driver as keyof typeof benchmarks] || 0;
  }

  private async calculateVariableCosts(vehicleId: string, period: string): Promise<number> {
    // التكاليف المتغيرة: وقود، صيانة، تنظيف
    const variableAccounts = ['5210207', '5210208', '5210201', '5210202'];
    
    const { data: costs } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', vehicleId)
      .in('debit_account', variableAccounts)
      .gte('entry_date', `${period}-01`)
      .lte('entry_date', `${period}-31`);

    return costs?.reduce((sum, cost) => sum + cost.debit_amount, 0) || 0;
  }

  private async calculateFixedCosts(vehicleId: string, period: string): Promise<number> {
    // التكاليف الثابتة: إهلاك، تأمين، رخص
    const fixedAccounts = ['5130101', '5140103', '5140104'];
    
    const { data: costs } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', vehicleId)
      .in('debit_account', fixedAccounts)
      .gte('entry_date', `${period}-01`)
      .lte('entry_date', `${period}-31`);

    return costs?.reduce((sum, cost) => sum + cost.debit_amount, 0) || 0;
  }

  private async getAverageDailyRate(vehicleId: string, period: string): Promise<number> {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('daily_rate, total_amount, start_date, end_date')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', vehicleId)
      .gte('start_date', `${period}-01`)
      .lte('end_date', `${period}-31`);

    if (!contracts || contracts.length === 0) return 0;

    const totalRevenue = contracts.reduce((sum, contract) => sum + contract.total_amount, 0);
    const totalDays = contracts.reduce((sum, contract) => {
      return sum + differenceInDays(new Date(contract.end_date), new Date(contract.start_date));
    }, 0);

    return totalDays > 0 ? totalRevenue / totalDays : 0;
  }

  private async calculateAllocationBases(period: string): Promise<{
    cost_center_id: string;
    basis_type: string;
    value: number;
  }[]> {
    const { data: costCenters } = await supabase
      .from('cost_centers')
      .select('id, type')
      .eq('tenant_id', this.tenant_id);

    const bases = [];
    for (const cc of costCenters || []) {
      let value = 0;
      let basisType = '';

      switch (cc.type) {
        case 'vehicle':
          value = await this.calculateRevenueForCostCenter(cc.id, period);
          basisType = 'revenue';
          break;
        case 'branch':
          value = await this.calculateEmployeeCountForCostCenter(cc.id);
          basisType = 'employee_count';
          break;
        default:
          value = 1;
          basisType = 'equal_share';
      }

      bases.push({
        cost_center_id: cc.id,
        basis_type: basisType,
        value: value
      });
    }

    return bases;
  }

  private async calculateRevenueForCostCenter(costCenterId: string, period: string): Promise<number> {
    const { data: revenue } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('source_id', costCenterId)
      .like('credit_account', '411%')
      .gte('entry_date', `${period}-01`)
      .lte('entry_date', `${period}-31`);

    return revenue?.reduce((sum, r) => sum + r.credit_amount, 0) || 0;
  }

  private async calculateEmployeeCountForCostCenter(costCenterId: string): Promise<number> {
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('tenant_id', this.tenant_id)
      .eq('cost_center_id', costCenterId)
      .eq('status', 'active');

    return count || 0;
  }

  private async calculateVehicleRevenue(vehicleId: string, period: string): Promise<number> {
    const { data: revenue } = await supabase
      .from('automated_journal_entries')
      .select('credit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', vehicleId)
      .like('credit_account', '411%')
      .gte('entry_date', `${period}-01`)
      .lte('entry_date', `${period}-31`);

    return revenue?.reduce((sum, r) => sum + r.credit_amount, 0) || 0;
  }

  private async calculateDirectCosts(vehicleId: string, period: string): Promise<number> {
    // التكاليف المباشرة للمركبة
    const directAccounts = ['5210201', '5210202', '5210207', '5210208', '5130101'];
    
    const { data: costs } = await supabase
      .from('automated_journal_entries')
      .select('debit_amount')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', vehicleId)
      .in('debit_account', directAccounts)
      .gte('entry_date', `${period}-01`)
      .lte('entry_date', `${period}-31`);

    return costs?.reduce((sum, cost) => sum + cost.debit_amount, 0) || 0;
  }

  private async calculateAllocatedCosts(vehicleId: string, period: string): Promise<number> {
    // التكاليف المحملة (نسبة من التكاليف العامة)
    const overheadAccounts = ['5110201', '5120101', '5140101'];
    const totalOverhead = await this.calculateCostForAccounts(overheadAccounts, period);
    const vehicleRevenue = await this.calculateVehicleRevenue(vehicleId, period);
    const totalRevenue = await this.calculateRevenueGenerated(period);

    // تحميل التكاليف بناءً على نسبة الإيراد
    const allocationRatio = totalRevenue > 0 ? vehicleRevenue / totalRevenue : 0;
    return totalOverhead * allocationRatio;
  }

  private async calculateVehicleUtilization(vehicleId: string, period: string): Promise<number> {
    // حساب معدل استخدام المركبة
    const { data: contracts } = await supabase
      .from('contracts')
      .select('start_date, end_date')
      .eq('tenant_id', this.tenant_id)
      .eq('vehicle_id', vehicleId)
      .gte('start_date', `${period}-01`)
      .lte('end_date', `${period}-31`);

    if (!contracts || contracts.length === 0) return 0;

    const totalRentalDays = contracts.reduce((sum, contract) => {
      return sum + differenceInDays(new Date(contract.end_date), new Date(contract.start_date));
    }, 0);

    const daysInMonth = 30;
    return (totalRentalDays / daysInMonth) * 100;
  }
}

export const advancedCostingService = new AdvancedCostingService(); 