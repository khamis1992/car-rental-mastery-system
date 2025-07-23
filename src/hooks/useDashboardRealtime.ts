
import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
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
  const { currentTenant } = useTenant();
  const { isConnected } = useUnifiedRealtime();
  
  const contractService = serviceContainer.getContractBusinessService();
  const vehicleService = serviceContainer.getVehicleBusinessService();
  const paymentService = serviceContainer.getPaymentBusinessService();
  const invoiceService = serviceContainer.getInvoiceBusinessService();

  // Load all dashboard stats
  const loadAllStats = useCallback(async () => {
    if (!currentTenant) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load contract stats
      const contractStats = await contractService.getContractStats();
      
      // Load customer stats (from contracts for now)
      const contracts = await contractService.getAllContracts();
      const uniqueCustomers = new Set(contracts.map(c => c.customer_id));
      const activeContracts = contracts.filter(c => c.status === 'active');
      
      // Load vehicle stats
      const vehicles = await vehicleService.getAllVehicles();
      const availableVehicles = vehicles.filter(v => v.status === 'available');
      
      // Load financial stats
      const payments = await paymentService.getRecentPayments(1000);
      const invoices = await invoiceService.getAllInvoices();
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
      const pendingPayments = overdueInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      
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
          total: uniqueCustomers.size,
          active: new Set(activeContracts.map(c => c.customer_id)).size,
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
          totalRevenue,
          pendingPayments,
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
  }, [currentTenant, contractService, vehicleService, paymentService, invoiceService]);

  // Update specific section stats
  const updateSectionStats = useCallback(async (section: keyof DashboardStats) => {
    if (!currentTenant) return;
    
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
          const contracts = await contractService.getAllContracts();
          const uniqueCustomers = new Set(contracts.map(c => c.customer_id));
          const activeContracts = contracts.filter(c => c.status === 'active');
          setStats(prev => ({
            ...prev,
            customers: {
              total: uniqueCustomers.size,
              active: new Set(activeContracts.map(c => c.customer_id)).size,
              isUpdating: false,
              lastUpdated: new Date(),
            },
          }));
          break;
          
        case 'vehicles':
          const vehicles = await vehicleService.getAllVehicles();
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
          const payments = await paymentService.getRecentPayments(1000);
          const invoices = await invoiceService.getAllInvoices();
          const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
          const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
          const pendingPayments = overdueInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
          setStats(prev => ({
            ...prev,
            financials: {
              totalRevenue,
              pendingPayments,
              isUpdating: false,
              lastUpdated: new Date(),
            },
          }));
          break;
      }
    } catch (err) {
      console.error(`Error updating ${section} stats:`, err);
      setStats(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          isUpdating: false,
        },
      }));
    }
  }, [currentTenant, contractService, vehicleService, paymentService, invoiceService]);

  // Set up realtime subscriptions using the unified system
  useRealtimeSubscription({
    table: 'contracts',
    onEvent: () => {
      console.log('📊 Contract change detected, updating stats');
      updateSectionStats('contracts');
      updateSectionStats('customers'); // Customers are derived from contracts
    }
  });

  useRealtimeSubscription({
    table: 'vehicles',
    onEvent: () => {
      console.log('📊 Vehicle change detected, updating stats');
      updateSectionStats('vehicles');
    }
  });

  useRealtimeSubscription({
    table: 'payments',
    onEvent: () => {
      console.log('📊 Payment change detected, updating stats');
      updateSectionStats('financials');
    }
  });

  useRealtimeSubscription({
    table: 'invoices',
    onEvent: () => {
      console.log('📊 Invoice change detected, updating stats');
      updateSectionStats('financials');
    }
  });

  // Initialize data
  useEffect(() => {
    if (currentTenant) {
      loadAllStats();
    }
  }, [currentTenant, loadAllStats]);

  return {
    stats,
    loading,
    error,
    isConnected,
    refreshStats: loadAllStats,
    refreshSection: updateSectionStats,
  };
}
