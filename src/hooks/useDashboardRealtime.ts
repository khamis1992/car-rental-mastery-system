import { useState, useEffect, useCallback } from 'react';
import { useEnhancedRealtime } from '@/contexts/EnhancedRealtimeContext';
import { useTenant } from '@/contexts/TenantContext';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { toast } from 'sonner';

export interface DashboardStats {
  contracts: {
    total: number;
    active: number;
    endingToday: number;
    monthlyRevenue: number;
    isUpdating: boolean;
    lastUpdated: Date | null;
  };
  customers: {
    total: number;
    active: number;
    isUpdating: boolean;
    lastUpdated: Date | null;
  };
  vehicles: {
    total: number;
    available: number;
    isUpdating: boolean;
    lastUpdated: Date | null;
  };
  financials: {
    totalRevenue: number;
    pendingPayments: number;
    isUpdating: boolean;
    lastUpdated: Date | null;
  };
}

const initialStats: DashboardStats = {
  contracts: {
    total: 0,
    active: 0,
    endingToday: 0,
    monthlyRevenue: 0,
    isUpdating: false,
    lastUpdated: null,
  },
  customers: {
    total: 0,
    active: 0,
    isUpdating: false,
    lastUpdated: null,
  },
  vehicles: {
    total: 0,
    available: 0,
    isUpdating: false,
    lastUpdated: null,
  },
  financials: {
    totalRevenue: 0,
    pendingPayments: 0,
    isUpdating: false,
    lastUpdated: null,
  },
};

export function useDashboardRealtime() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, subscribeToTable, unsubscribeFromTable } = useEnhancedRealtime();
  const { currentTenant } = useTenant();
  
  const contractService = serviceContainer.getContractBusinessService();
  const customerService = serviceContainer.getCustomerBusinessService();
  const vehicleService = serviceContainer.getVehicleBusinessService();
  const financialService = serviceContainer.getFinancialBusinessService();

  // Load all dashboard stats
  const loadAllStats = useCallback(async () => {
    if (!currentTenant) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load contract stats
      const contractStats = await contractService.getContractStats();
      
      // Load customer stats
      const customers = await customerService.getCustomers();
      const activeCustomers = customers.filter(c => c.status === 'active');
      
      // Load vehicle stats
      const vehicles = await vehicleService.getVehicles();
      const availableVehicles = vehicles.filter(v => v.status === 'available');
      
      // Load financial stats
      const financialStats = await financialService.getFinancialSummary();
      
      setStats({
        contracts: {
          total: contractStats.total,
          active: contractStats.active,
          endingToday: contractStats.endingToday,
          monthlyRevenue: contractStats.monthlyRevenue,
          isUpdating: false,
          lastUpdated: new Date(),
        },
        customers: {
          total: customers.length,
          active: activeCustomers.length,
          isUpdating: false,
          lastUpdated: new Date(),
        },
        vehicles: {
          total: vehicles.length,
          available: availableVehicles.length,
          isUpdating: false,
          lastUpdated: new Date(),
        },
        financials: {
          totalRevenue: financialStats?.totalRevenue || 0,
          pendingPayments: financialStats?.pendingPayments || 0,
          isUpdating: false,
          lastUpdated: new Date(),
        },
      });
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'فشل في تحميل إحصائيات لوحة المعلومات');
      toast.error('فشل في تحميل البيانات', {
        description: 'يرجى المحاولة مرة أخرى لاحقاً',
      });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, contractService, customerService, vehicleService, financialService]);

  // Update specific section stats
  const updateSectionStats = useCallback(async (section: keyof DashboardStats) => {
    if (!currentTenant) return;
    
    // Mark section as updating
    setStats(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        isUpdating: true,
      },
    }));
    
    try {
      switch (section) {
        case 'contracts':
          const contractStats = await contractService.getContractStats();
          setStats(prev => ({
            ...prev,
            contracts: {
              total: contractStats.total,
              active: contractStats.active,
              endingToday: contractStats.endingToday,
              monthlyRevenue: contractStats.monthlyRevenue,
              isUpdating: false,
              lastUpdated: new Date(),
            },
          }));
          break;
          
        case 'customers':
          const customers = await customerService.getCustomers();
          const activeCustomers = customers.filter(c => c.status === 'active');
          setStats(prev => ({
            ...prev,
            customers: {
              total: customers.length,
              active: activeCustomers.length,
              isUpdating: false,
              lastUpdated: new Date(),
            },
          }));
          break;
          
        case 'vehicles':
          const vehicles = await vehicleService.getVehicles();
          const availableVehicles = vehicles.filter(v => v.status === 'available');
          setStats(prev => ({
            ...prev,
            vehicles: {
              total: vehicles.length,
              available: availableVehicles.length,
              isUpdating: false,
              lastUpdated: new Date(),
            },
          }));
          break;
          
        case 'financials':
          const financialStats = await financialService.getFinancialSummary();
          setStats(prev => ({
            ...prev,
            financials: {
              totalRevenue: financialStats?.totalRevenue || 0,
              pendingPayments: financialStats?.pendingPayments || 0,
              isUpdating: false,
              lastUpdated: new Date(),
            },
          }));
          break;
      }
    } catch (err) {
      console.error(`Error updating ${section} stats:`, err);
      // Reset updating state but keep old data
      setStats(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          isUpdating: false,
        },
      }));
    }
  }, [currentTenant, contractService, customerService, vehicleService, financialService]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isConnected || !currentTenant) return;
    
    // Initial load
    loadAllStats();
    
    // Subscribe to relevant tables
    const contractsSubscriptionId = subscribeToTable('contracts', (event) => {
      console.log('Dashboard detected contract change:', event);
      updateSectionStats('contracts');
      
      // If a contract with a payment was updated, also update financials
      if (event.event === 'UPDATE' && 
         (event.new?.payment_registered_at || event.new?.status === 'completed')) {
        updateSectionStats('financials');
      }
    });
    
    const customersSubscriptionId = subscribeToTable('customers', () => {
      updateSectionStats('customers');
    });
    
    const vehiclesSubscriptionId = subscribeToTable('vehicles', () => {
      updateSectionStats('vehicles');
    });
    
    const paymentsSubscriptionId = subscribeToTable('payments', () => {
      updateSectionStats('financials');
    });
    
    const invoicesSubscriptionId = subscribeToTable('invoices', () => {
      updateSectionStats('financials');
    });
    
    // Cleanup subscriptions
    return () => {
      if (contractsSubscriptionId) unsubscribeFromTable(contractsSubscriptionId);
      if (customersSubscriptionId) unsubscribeFromTable(customersSubscriptionId);
      if (vehiclesSubscriptionId) unsubscribeFromTable(vehiclesSubscriptionId);
      if (paymentsSubscriptionId) unsubscribeFromTable(paymentsSubscriptionId);
      if (invoicesSubscriptionId) unsubscribeFromTable(invoicesSubscriptionId);
    };
  }, [isConnected, currentTenant, loadAllStats, updateSectionStats, subscribeToTable, unsubscribeFromTable]);

  return {
    stats,
    loading,
    error,
    isConnected,
    refreshStats: loadAllStats,
    refreshSection: updateSectionStats,
  };
}
