import { EventHandler, OrchestrationEvent } from '../types';
import { EventTypes } from '../EventTypes';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BusinessKPI {
  id: string;
  name: string;
  currentValue: number;
  targetValue?: number;
  trend: 'up' | 'down' | 'stable';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  timestamp: Date;
}

export class AnalyticsEventHandler {
  private metrics: AnalyticsMetric[] = [];
  private kpis: BusinessKPI[] = [];
  private maxMetricsHistory = 10000;

  getHandlers(): Record<string, EventHandler> {
    return {
      [EventTypes.CONTRACT_ACTIVATED]: this.handleContractActivated.bind(this),
      [EventTypes.CONTRACT_COMPLETED]: this.handleContractCompleted.bind(this),
      [EventTypes.CONTRACT_CANCELLED]: this.handleContractCancelled.bind(this),
      [EventTypes.INVOICE_PAYMENT_PROCESSED]: this.handlePaymentProcessed.bind(this),
      [EventTypes.VEHICLE_STATUS_CHANGED]: this.handleVehicleStatusChanged.bind(this),
      [EventTypes.CUSTOMER_CREATED]: this.handleCustomerCreated.bind(this),
      [EventTypes.CUSTOMER_RATING_UPDATED]: this.handleCustomerRatingUpdated.bind(this),
      [EventTypes.VEHICLE_MAINTENANCE_COMPLETED]: this.handleMaintenanceCompleted.bind(this),
      [EventTypes.EMPLOYEE_CHECKED_IN]: this.handleEmployeeCheckedIn.bind(this),
      [EventTypes.ADDITIONAL_CHARGE_CREATED]: this.handleAdditionalChargeCreated.bind(this),
    };
  }

  private async handleContractActivated(event: OrchestrationEvent): Promise<void> {
    const { contractId, customerId, vehicleId, amount } = event.payload;
    
    // Track contract activation metrics
    this.addMetric({
      name: 'contracts_activated',
      value: 1,
      unit: 'count',
      category: 'contracts',
      metadata: { contractId, customerId, vehicleId, amount }
    });

    if (amount) {
      this.addMetric({
        name: 'active_contract_value',
        value: amount,
        unit: 'KWD',
        category: 'revenue',
        metadata: { contractId }
      });
    }

    // Update KPIs
    await this.updateKPI('active_contracts_count', 1, 'up');
    await this.updateKPI('monthly_contract_activations', 1, 'up');
  }

  private async handleContractCompleted(event: OrchestrationEvent): Promise<void> {
    const { contractId, amount, invoiceId } = event.payload;
    
    this.addMetric({
      name: 'contracts_completed',
      value: 1,
      unit: 'count',
      category: 'contracts',
      metadata: { contractId, invoiceId }
    });

    if (amount) {
      this.addMetric({
        name: 'completed_contract_revenue',
        value: amount,
        unit: 'KWD',
        category: 'revenue',
        metadata: { contractId }
      });
    }

    // Update KPIs
    await this.updateKPI('active_contracts_count', -1, 'down');
    await this.updateKPI('monthly_revenue', amount || 0, 'up');
    await this.updateKPI('contract_completion_rate', 1, 'up');
  }

  private async handleContractCancelled(event: OrchestrationEvent): Promise<void> {
    const { contractId, reason } = event.payload;
    
    this.addMetric({
      name: 'contracts_cancelled',
      value: 1,
      unit: 'count',
      category: 'contracts',
      metadata: { contractId, reason }
    });

    // Update KPIs
    await this.updateKPI('active_contracts_count', -1, 'down');
    await this.updateKPI('contract_cancellation_rate', 1, 'up');
  }

  private async handlePaymentProcessed(event: OrchestrationEvent): Promise<void> {
    const { invoiceId, paymentAmount, paymentMethod } = event.payload;
    
    this.addMetric({
      name: 'payments_received',
      value: paymentAmount,
      unit: 'KWD',
      category: 'revenue',
      metadata: { invoiceId, paymentMethod }
    });

    this.addMetric({
      name: 'payment_transactions',
      value: 1,
      unit: 'count',
      category: 'payments',
      metadata: { paymentMethod }
    });

    // Update KPIs
    await this.updateKPI('daily_revenue', paymentAmount, 'up');
    await this.updateKPI('cash_flow', paymentAmount, 'up');
  }

  private async handleVehicleStatusChanged(event: OrchestrationEvent): Promise<void> {
    const { vehicleId, previousStatus, newStatus } = event.payload;
    
    this.addMetric({
      name: 'vehicle_status_changes',
      value: 1,
      unit: 'count',
      category: 'fleet',
      metadata: { vehicleId, previousStatus, newStatus }
    });

    // Update fleet utilization metrics
    if (newStatus === 'rented') {
      await this.updateKPI('fleet_utilization_rate', 1, 'up');
    } else if (previousStatus === 'rented') {
      await this.updateKPI('fleet_utilization_rate', -1, 'down');
    }
  }

  private async handleCustomerCreated(event: OrchestrationEvent): Promise<void> {
    const { customerId, customerType } = event.payload;
    
    this.addMetric({
      name: 'customers_acquired',
      value: 1,
      unit: 'count',
      category: 'customers',
      metadata: { customerId, customerType }
    });

    // Update KPIs
    await this.updateKPI('total_customers', 1, 'up');
    await this.updateKPI('monthly_customer_acquisition', 1, 'up');
  }

  private async handleCustomerRatingUpdated(event: OrchestrationEvent): Promise<void> {
    const { customerId, oldRating, newRating } = event.payload;
    
    this.addMetric({
      name: 'customer_rating_updated',
      value: newRating,
      unit: 'rating',
      category: 'customers',
      metadata: { customerId, oldRating, newRating }
    });

    // Calculate average customer satisfaction
    await this.updateCustomerSatisfactionKPI();
  }

  private async handleMaintenanceCompleted(event: OrchestrationEvent): Promise<void> {
    const { vehicleId, maintenanceType, cost } = event.payload;
    
    this.addMetric({
      name: 'maintenance_completed',
      value: 1,
      unit: 'count',
      category: 'fleet',
      metadata: { vehicleId, maintenanceType }
    });

    if (cost) {
      this.addMetric({
        name: 'maintenance_costs',
        value: cost,
        unit: 'KWD',
        category: 'expenses',
        metadata: { vehicleId, maintenanceType }
      });

      // Update KPIs
      await this.updateKPI('monthly_maintenance_costs', cost, 'up');
    }
  }

  private async handleEmployeeCheckedIn(event: OrchestrationEvent): Promise<void> {
    const { employeeId, checkInTime } = event.payload;
    
    this.addMetric({
      name: 'employee_check_ins',
      value: 1,
      unit: 'count',
      category: 'hr',
      metadata: { employeeId, checkInTime }
    });

    // Update attendance rate
    await this.updateKPI('daily_attendance_rate', 1, 'up');
  }

  private async handleAdditionalChargeCreated(event: OrchestrationEvent): Promise<void> {
    const { amount, chargeType } = event.payload;
    
    this.addMetric({
      name: 'additional_charges_created',
      value: amount,
      unit: 'KWD',
      category: 'revenue',
      metadata: { chargeType }
    });

    // Update KPIs
    await this.updateKPI('additional_revenue', amount, 'up');
  }

  private addMetric(metric: Omit<AnalyticsMetric, 'id' | 'timestamp'>): void {
    const fullMetric: AnalyticsMetric = {
      id: this.generateMetricId(),
      ...metric,
      timestamp: new Date()
    };

    this.metrics.push(fullMetric);

    // Maintain max history size
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  private async updateKPI(
    name: string, 
    value: number, 
    trend: 'up' | 'down' | 'stable',
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Promise<void> {
    const existingKPI = this.kpis.find(kpi => kpi.name === name && kpi.period === period);
    
    if (existingKPI) {
      existingKPI.currentValue += value;
      existingKPI.trend = trend;
      existingKPI.timestamp = new Date();
    } else {
      this.kpis.push({
        id: this.generateKPIId(),
        name,
        currentValue: value,
        trend,
        period,
        category: this.getCategoryFromKPIName(name),
        timestamp: new Date()
      });
    }
  }

  private async updateCustomerSatisfactionKPI(): Promise<void> {
    // Calculate average customer rating from recent metrics
    const ratingMetrics = this.metrics
      .filter(m => m.name === 'customer_rating_updated')
      .slice(-100); // Last 100 ratings

    if (ratingMetrics.length > 0) {
      const averageRating = ratingMetrics.reduce((sum, m) => sum + m.value, 0) / ratingMetrics.length;
      
      const kpi = this.kpis.find(k => k.name === 'customer_satisfaction');
      if (kpi) {
        kpi.currentValue = averageRating;
        kpi.timestamp = new Date();
      } else {
        this.kpis.push({
          id: this.generateKPIId(),
          name: 'customer_satisfaction',
          currentValue: averageRating,
          targetValue: 4.5,
          trend: 'stable',
          period: 'monthly',
          category: 'customers',
          timestamp: new Date()
        });
      }
    }
  }

  private getCategoryFromKPIName(name: string): string {
    if (name.includes('contract')) return 'contracts';
    if (name.includes('revenue') || name.includes('payment')) return 'revenue';
    if (name.includes('customer')) return 'customers';
    if (name.includes('vehicle') || name.includes('fleet')) return 'fleet';
    if (name.includes('employee') || name.includes('attendance')) return 'hr';
    if (name.includes('maintenance')) return 'maintenance';
    return 'general';
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateKPIId(): string {
    return `kpi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for accessing analytics data
  getMetrics(category?: string, limit = 100): AnalyticsMetric[] {
    let filteredMetrics = [...this.metrics];
    
    if (category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === category);
    }
    
    return filteredMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getKPIs(category?: string): BusinessKPI[] {
    let filteredKPIs = [...this.kpis];
    
    if (category) {
      filteredKPIs = filteredKPIs.filter(k => k.category === category);
    }
    
    return filteredKPIs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getRealtimeStats(): Record<string, any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayMetrics = this.metrics.filter(m => m.timestamp >= today);
    
    return {
      todayRevenue: todayMetrics
        .filter(m => m.category === 'revenue')
        .reduce((sum, m) => sum + m.value, 0),
      
      todayContracts: todayMetrics
        .filter(m => m.name === 'contracts_activated')
        .reduce((sum, m) => sum + m.value, 0),
      
      activeContracts: this.kpis.find(k => k.name === 'active_contracts_count')?.currentValue || 0,
      
      fleetUtilization: this.kpis.find(k => k.name === 'fleet_utilization_rate')?.currentValue || 0,
      
      customerSatisfaction: this.kpis.find(k => k.name === 'customer_satisfaction')?.currentValue || 0,
      
      lastUpdated: now
    };
  }
}