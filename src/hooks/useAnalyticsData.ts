import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdvancedKPIService } from '@/services/BusinessServices/AdvancedKPIService';
import { supabase } from '@/integrations/supabase/client';

const kpiService = new AdvancedKPIService();

export interface KPIData {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

export interface RevenueData {
  month: string;
  revenue: number;
  contracts: number;
}

export interface FleetData {
  vehicle_type: string;
  total_count: number;
  rented_count: number;
  utilization: number;
}

export const useAnalyticsData = (dateRange: string) => {
  // KPI Metrics
  const { data: kpiMetrics, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi-metrics', dateRange],
    queryFn: () => kpiService.getKPIMetrics(),
  });

  // Advanced KPIs
  const { data: advancedKPIs, isLoading: advancedKPIsLoading } = useQuery({
    queryKey: ['advanced-kpis', dateRange],
    queryFn: () => kpiService.getAllKPIs(),
  });

  // Revenue Data
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-data', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          total_amount,
          created_at,
          status
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by month
      const monthlyRevenue = data?.reduce((acc: Record<string, { revenue: number; contracts: number }>, contract) => {
        const month = new Date(contract.created_at).toLocaleDateString('ar-KW', { 
          month: 'short', 
          year: 'numeric' 
        });
        
        if (!acc[month]) {
          acc[month] = { revenue: 0, contracts: 0 };
        }
        
        acc[month].revenue += contract.total_amount || 0;
        acc[month].contracts += 1;
        
        return acc;
      }, {});

      return Object.entries(monthlyRevenue || {}).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        contracts: data.contracts
      }));
    },
  });

  // Fleet Utilization
  const { data: fleetData, isLoading: fleetLoading } = useQuery({
    queryKey: ['fleet-data', dateRange],
    queryFn: async () => {
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('vehicle_type, status');

      if (vehicleError) throw vehicleError;

      // Group by vehicle type
      const fleetStats = vehicles?.reduce((acc: Record<string, { total: number; rented: number }>, vehicle) => {
        const type = vehicle.vehicle_type || 'غير محدد';
        
        if (!acc[type]) {
          acc[type] = { total: 0, rented: 0 };
        }
        
        acc[type].total += 1;
        if (vehicle.status === 'rented') {
          acc[type].rented += 1;
        }
        
        return acc;
      }, {});

      return Object.entries(fleetStats || {}).map(([vehicle_type, stats]) => ({
        vehicle_type,
        total_count: stats.total,
        rented_count: stats.rented,
        utilization: stats.total > 0 ? (stats.rented / stats.total) * 100 : 0
      }));
    },
  });

  // Customer Analytics
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-data', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          customer_type,
          status,
          rating,
          total_contracts,
          total_revenue
        `);

      if (error) throw error;

      const segments = data?.reduce((acc: Record<string, number>, customer) => {
        const type = customer.customer_type || 'غير محدد';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      return {
        segments: Object.entries(segments || {}).map(([type, count]) => ({
          type,
          count
        })),
        totalCustomers: data?.length || 0,
        averageRating: data?.reduce((sum, c) => sum + (c.rating || 0), 0) / (data?.length || 1)
      };
    },
  });

  // Format KPI data for display
  const formatKPIData = (): KPIData[] => {
    if (!kpiMetrics && !advancedKPIs) return [];

    const kpis: KPIData[] = [];

    // Add basic metrics
    if (kpiMetrics) {
      kpis.push(
        {
          title: 'إجمالي المؤشرات',
          value: kpiMetrics.total_kpis,
          change: `${kpiMetrics.automated_kpis} تلقائي`,
          icon: '📊',
          trend: 'neutral'
        },
        {
          title: 'التنبيهات النشطة',
          value: kpiMetrics.alerts.total_alerts,
          change: `${kpiMetrics.alerts.high_alerts} عالي`,
          icon: '⚠️',
          trend: kpiMetrics.alerts.total_alerts > 0 ? 'down' : 'up'
        }
      );
    }

    // Add revenue KPI
    if (revenueData && revenueData.length > 0) {
      const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
      const totalContracts = revenueData.reduce((sum, item) => sum + item.contracts, 0);
      
      kpis.push(
        {
          title: 'إجمالي الإيرادات',
          value: `${totalRevenue.toLocaleString()} د.ك`,
          change: `${totalContracts} عقد`,
          icon: '💰',
          trend: 'up'
        }
      );
    }

    // Add fleet utilization KPI
    if (fleetData && fleetData.length > 0) {
      const avgUtilization = fleetData.reduce((sum, item) => sum + item.utilization, 0) / fleetData.length;
      
      kpis.push({
        title: 'معدل استغلال الأسطول',
        value: `${avgUtilization.toFixed(1)}%`,
        change: `${fleetData.length} نوع مركبة`,
        icon: '🚗',
        trend: avgUtilization >= 70 ? 'up' : avgUtilization >= 50 ? 'neutral' : 'down'
      });
    }

    return kpis;
  };

  return {
    kpiData: formatKPIData(),
    revenueData: revenueData || [],
    fleetData: fleetData || [],
    customerData: customerData || { segments: [], totalCustomers: 0, averageRating: 0 },
    advancedKPIs: advancedKPIs || [],
    isLoading: kpiLoading || revenueLoading || fleetLoading || customerLoading || advancedKPIsLoading,
    error: null
  };
};