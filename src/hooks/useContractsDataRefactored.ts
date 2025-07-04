import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { ContractWithDetails } from '@/services/contractService';

export const useContractsDataRefactored = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [contractStats, setContractStats] = useState({
    total: 0,
    active: 0,
    endingToday: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user, session, loading: authLoading } = useAuth();
  
  // Add ref for managing abort controllers and debouncing
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const isMountedRef = useRef(true);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const lastUpdateTimeRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const contractService = serviceContainer.getContractBusinessService();
  const quotationService = serviceContainer.getQuotationBusinessService();

  const loadQuotations = async () => {
    const key = 'quotations';
    const controller = new AbortController();
    abortControllersRef.current.set(key, controller);
    
    try {
      const activeQuotations = await quotationService.getActiveQuotations();
      
      if (!isMountedRef.current || controller.signal.aborted) {
        console.log('🔄 Quotations load cancelled');
        return;
      }
      
      setQuotations(activeQuotations);
      setErrors(prev => ({ ...prev, quotations: '' }));
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        console.log('🔄 Quotations request was cancelled');
        return;
      }
      
      console.error('Error loading quotations:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, quotations: error.message || 'فشل في تحميل عروض الأسعار' }));
      }
    } finally {
      abortControllersRef.current.delete(key);
    }
  };

  const loadContracts = async () => {
    try {
      const data = await contractService.getAllContracts();
      
      if (!isMountedRef.current) {
        console.log('🔄 Contracts load cancelled - component unmounted');
        return;
      }
      
      setContracts(data);
      setErrors(prev => ({ ...prev, contracts: '' }));
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, contracts: error.message || 'فشل في تحميل العقود' }));
      }
    }
  };

  const loadCustomers = async () => {
    const key = 'customers';
    const controller = new AbortController();
    abortControllersRef.current.set(key, controller);
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, customer_number')
        .eq('status', 'active')
        .order('name')
        .abortSignal(controller.signal);
      
      if (error) throw error;
      
      if (!isMountedRef.current || controller.signal.aborted) {
        console.log('🔄 Customers load cancelled');
        return;
      }
      
      setCustomers(data || []);
      setErrors(prev => ({ ...prev, customers: '' }));
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        console.log('🔄 Customers request was cancelled');
        return;
      }
      
      console.error('Error loading customers:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, customers: error.message || 'فشل في تحميل العملاء' }));
      }
    } finally {
      abortControllersRef.current.delete(key);
    }
  };

  const loadVehicles = async () => {
    const key = 'vehicles';
    const controller = new AbortController();
    abortControllersRef.current.set(key, controller);
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, vehicle_number, daily_rate, status')
        .order('vehicle_number')
        .abortSignal(controller.signal);
      
      if (error) throw error;
      
      if (!isMountedRef.current || controller.signal.aborted) {
        console.log('🔄 Vehicles load cancelled');
        return;
      }
      
      setVehicles(data || []);
      setErrors(prev => ({ ...prev, vehicles: '' }));
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        console.log('🔄 Vehicles request was cancelled');
        return;
      }
      
      console.error('Error loading vehicles:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, vehicles: error.message || 'فشل في تحميل المركبات' }));
      }
    } finally {
      abortControllersRef.current.delete(key);
    }
  };

  const loadStats = async () => {
    const key = 'stats';
    const controller = new AbortController();
    abortControllersRef.current.set(key, controller);
    
    try {
      const contractStatsData = await contractService.getContractStats();
      
      if (!isMountedRef.current || controller.signal.aborted) {
        console.log('🔄 Stats load cancelled');
        return;
      }
      
      setContractStats(contractStatsData);
      setErrors(prev => ({ ...prev, stats: '' }));
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        console.log('🔄 Stats request was cancelled');
        return;
      }
      
      console.error('Error loading stats:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, stats: error.message || 'فشل في تحميل الإحصائيات' }));
      }
    } finally {
      abortControllersRef.current.delete(key);
    }
  };

  // Optimistic update function for single contract changes
  const updateContractOptimistically = (contractId: string, updates: Partial<ContractWithDetails>) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, ...updates }
          : contract
      )
    );
  };

  // Partial refresh function that doesn't clear existing data
  const refreshContracts = async (silent = false) => {
    try {
      const data = await contractService.getAllContracts();
      
      if (!isMountedRef.current) {
        console.log('🔄 Contracts refresh cancelled - component unmounted');
        return;
      }
      
      setContracts(data);
      setErrors(prev => ({ ...prev, contracts: '' }));
      
      // Also refresh stats silently
      const contractStatsData = await contractService.getContractStats();
      if (isMountedRef.current) {
        setContractStats(contractStatsData);
      }
    } catch (error: any) {
      console.error('Error refreshing contracts:', error);
      if (isMountedRef.current && !silent) {
        setErrors(prev => ({ ...prev, contracts: error.message || 'فشل في تحديث العقود' }));
      }
    }
  };

  // Immediate contract refresh without debouncing to prevent UI flickering
  const immediateContractRefresh = useCallback((contractId?: string) => {
    if (contractId) {
      // For single contract updates, update immediately without aborting
      refreshSingleContract(contractId).catch(error => {
        console.error('Error in immediate single contract refresh:', error);
      });
    } else {
      // For full refresh, use debouncing only for bulk operations
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        refreshContracts(true).catch(error => {
          console.error('Error in immediate full refresh:', error);
        });
      }, 100); // Very short delay for bulk operations only
    }
  }, []);

  // Legacy alias for compatibility
  const debouncedContractRefresh = immediateContractRefresh;

  // Refresh single contract by ID without affecting the list
  const refreshSingleContract = async (contractId: string) => {
    // Don't use abort controllers for single contract updates to prevent cancellation
    try {
      const updatedContract = await contractService.getContractById(contractId);
      const contractWithDetails = {
        id: updatedContract.id,
        contract_number: updatedContract.contract_number,
        customer_name: updatedContract.customers.name,
        customer_phone: updatedContract.customers.phone,
        vehicle_info: `${updatedContract.vehicles.make} ${updatedContract.vehicles.model} - ${updatedContract.vehicles.vehicle_number}`,
        start_date: updatedContract.start_date,
        end_date: updatedContract.end_date,
        actual_start_date: updatedContract.actual_start_date,
        actual_end_date: updatedContract.actual_end_date,
        rental_days: updatedContract.rental_days,
        contract_type: updatedContract.contract_type,
        daily_rate: updatedContract.daily_rate,
        total_amount: updatedContract.total_amount,
        discount_amount: updatedContract.discount_amount || 0,
        tax_amount: updatedContract.tax_amount || 0,
        security_deposit: updatedContract.security_deposit || 0,
        insurance_amount: updatedContract.insurance_amount || 0,
        final_amount: updatedContract.final_amount,
        status: updatedContract.status,
        pickup_location: updatedContract.pickup_location,
        return_location: updatedContract.return_location,
        special_conditions: updatedContract.special_conditions,
        terms_and_conditions: updatedContract.terms_and_conditions,
        notes: updatedContract.notes,
        created_at: updatedContract.created_at,
        customer_id: updatedContract.customer_id,
        vehicle_id: updatedContract.vehicle_id,
        quotation_id: updatedContract.quotation_id,
      } as ContractWithDetails;

      // Update only the specific contract in the list without affecting others
      setContracts(prev => {
        const exists = prev.some(contract => contract.id === contractId);
        if (exists) {
          return prev.map(contract => 
            contract.id === contractId ? contractWithDetails : contract
          );
        } else {
          // If contract doesn't exist, add it (for new contracts)
          return [...prev, contractWithDetails];
        }
      });
    } catch (error) {
      console.error('Error refreshing single contract:', error);
      // Silently fail to prevent UI disruption
    }
  };

  const loadData = async (retryCount = 0) => {
    // Don't load data if authentication is still loading or user is not authenticated
    if (authLoading) {
      console.log('Authentication still loading, skipping data load');
      return;
    }

    if (!user || !session) {
      console.log('User not authenticated, skipping data load');
      setLoading(false);
      setErrors({
        general: 'يجب تسجيل الدخول أولاً للوصول إلى البيانات'
      });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      
      // Load data separately instead of Promise.all to prevent single failure from affecting everything
      await loadContracts();
      await loadCustomers();
      await loadVehicles();
      await loadQuotations();
      await loadStats();
      
      // Check if we have any critical errors and show toast only for complete failures
      const hasErrors = Object.values(errors).some(error => error !== '');
      if (hasErrors && retryCount === 0) {
        const errorCount = Object.values(errors).filter(error => error !== '').length;
        toast({
          title: 'تحذير',
          description: `فشل في تحميل ${errorCount} من أقسام البيانات. يمكنك المحاولة مرة أخرى.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Critical error in loadData:', error);
      // Only show this for completely unexpected errors
      if (retryCount < 2) {
        // Retry once more
        setTimeout(() => loadData(retryCount + 1), 1000);
      } else {
        toast({
          title: 'خطأ في تحميل البيانات',
          description: 'حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load data when authentication is complete
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, user, session]);
  
  // Cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clear pending updates
      pendingUpdatesRef.current.clear();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      // Cancel all pending requests
      abortControllersRef.current.forEach((controller, key) => {
        controller.abort();
        console.log(`🧹 Cleanup: Aborted ${key} request`);
      });
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    quotations,
    contracts,
    customers,
    vehicles,
    contractStats,
    loading,
    errors,
    loadData,
    refreshContracts,
    refreshSingleContract,
    updateContractOptimistically,
    debouncedContractRefresh,
    immediateContractRefresh,
  };
};