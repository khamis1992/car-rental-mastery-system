import { useState, useEffect, useRef } from 'react';
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
  
  // Add ref for managing abort controllers
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const isMountedRef = useRef(true);

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
    const key = 'contracts';
    const controller = new AbortController();
    abortControllersRef.current.set(key, controller);
    
    try {
      const data = await contractService.getAllContracts();
      
      if (!isMountedRef.current || controller.signal.aborted) {
        console.log('🔄 Contracts load cancelled');
        return;
      }
      
      setContracts(data);
      setErrors(prev => ({ ...prev, contracts: '' }));
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        console.log('🔄 Contracts request was cancelled');
        return;
      }
      
      console.error('Error loading contracts:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, contracts: error.message || 'فشل في تحميل العقود' }));
      }
    } finally {
      abortControllersRef.current.delete(key);
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
  };
};