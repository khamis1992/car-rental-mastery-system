import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { ContractWithDetails } from '@/services/contractService';
import { handleError, createSafeAbortController } from '@/utils/errorHandling';

interface ContractsCache {
  contracts: Map<string, ContractWithDetails>;
  lastUpdated: Map<string, number>;
}

export const useContractsOptimized = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
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

  // محسن: استخدام cache متقدم للعقود
  const cacheRef = useRef<ContractsCache>({
    contracts: new Map(),
    lastUpdated: new Map(),
  });
  
  const isMountedRef = useRef(true);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  const contractService = serviceContainer.getContractBusinessService();
  const quotationService = serviceContainer.getQuotationBusinessService();

  // تحويل العقود إلى state عادي لمنع الاختفاء
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);

  // تحديث فوري وآمن للعقد
  const updateSingleContract = useCallback((contractId: string, updates: Partial<ContractWithDetails>) => {
    setContracts(prevContracts => {
      return prevContracts.map(contract => 
        contract.id === contractId 
          ? { ...contract, ...updates }
          : contract
      );
    });
    
    // تحديث الـ cache أيضاً
    const cache = cacheRef.current;
    const existing = cache.contracts.get(contractId);
    if (existing) {
      const updated = { ...existing, ...updates };
      cache.contracts.set(contractId, updated);
      cache.lastUpdated.set(contractId, Date.now());
    }
  }, []);

  // إضافة عقد جديد للقائمة والـ cache
  const addContract = useCallback((contract: ContractWithDetails) => {
    setContracts(prevContracts => [...prevContracts, contract]);
    
    const cache = cacheRef.current;
    cache.contracts.set(contract.id, contract);
    cache.lastUpdated.set(contract.id, Date.now());
  }, []);

  // حذف عقد من القائمة والـ cache
  const removeContract = useCallback((contractId: string) => {
    setContracts(prevContracts => prevContracts.filter(c => c.id !== contractId));
    
    const cache = cacheRef.current;
    cache.contracts.delete(contractId);
    cache.lastUpdated.delete(contractId);
  }, []);

  // محسن: تحميل عقد واحد من الخادم
  const refreshSingleContractFromServer = useCallback(async (contractId: string, silent = true) => {
    if (pendingUpdatesRef.current.has(contractId)) {
      return; // تجنب الطلبات المتكررة
    }

    pendingUpdatesRef.current.add(contractId);
    
    try {
      const updatedContract = await contractService.getContractById(contractId);
      
      if (!isMountedRef.current) return;
      
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

      // تحديث فوري بدون إعادة تحديد القائمة
      setContracts(prevContracts => {
        return prevContracts.map(contract => 
          contract.id === contractId 
            ? { ...contract, ...contractWithDetails }
            : contract
        );
      });
      
      // تحديث الـ cache
      const cache = cacheRef.current;
      cache.contracts.set(contractId, contractWithDetails);
      cache.lastUpdated.set(contractId, Date.now());
      
      if (!silent) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات العقد بنجاح",
        });
      }
    } catch (error) {
      if (!silent) {
        console.error('Error refreshing single contract:', error);
        toast({
          title: "خطأ في التحديث",
          description: "فشل في تحديث بيانات العقد",
          variant: "destructive",
        });
      }
    } finally {
      pendingUpdatesRef.current.delete(contractId);
    }
  }, [contractService, toast]);

  // تحميل العقود الأولي مع معالجة أفضل للأخطاء
  const loadContractsInitial = useCallback(async () => {
    try {
      const data = await contractService.getAllContracts();
      
      if (!isMountedRef.current) return;
      
      const sortedContracts = data.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // تحديث واحد للحالة لتجنب إعادة الرندر المتعددة
      setContracts(sortedContracts);
      
      // تحديث الـ cache
      const cache = cacheRef.current;
      const now = Date.now();
      cache.contracts.clear(); // مسح القديم
      
      sortedContracts.forEach(contract => {
        cache.contracts.set(contract.id, contract);
        cache.lastUpdated.set(contract.id, now);
      });
      
      setErrors(prev => ({ ...prev, contracts: '' }));
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, contracts: error.message || 'فشل في تحميل العقود' }));
      }
    }
  }, [contractService]);

  const loadQuotations = useCallback(async () => {
    const key = 'quotations';
    const controller = createSafeAbortController(15000); // 15 ثانية timeout
    abortControllersRef.current.set(key, controller);
    
    try {
      const activeQuotations = await quotationService.getActiveQuotations();
      
      if (!isMountedRef.current || controller.signal.aborted) return;
      
      setQuotations(activeQuotations);
      setErrors(prev => ({ ...prev, quotations: '' }));
    } catch (error: any) {
      const errorResult = handleError(error, 'contracts-loadQuotations');
      
      if (errorResult.handled && !errorResult.shouldLog) return;
      
      console.error('Error loading quotations:', error);
      if (isMountedRef.current && errorResult.shouldLog) {
        setErrors(prev => ({ 
          ...prev, 
          quotations: errorResult.message || error.message || 'فشل في تحميل عروض الأسعار' 
        }));
      }
    } finally {
      abortControllersRef.current.delete(key);
    }
  }, [quotationService]);

  const loadCustomers = useCallback(async () => {
    const key = 'customers';
    const controller = createSafeAbortController(10000); // 10 ثواني timeout
    abortControllersRef.current.set(key, controller);
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, customer_number')
        .eq('status', 'active')
        .order('name')
        .abortSignal(controller.signal);
      
      if (error) throw error;
      
      if (!isMountedRef.current || controller.signal.aborted) return;
      
      setCustomers(data || []);
      setErrors(prev => ({ ...prev, customers: '' }));
    } catch (error: any) {
      const errorResult = handleError(error, 'contracts-loadCustomers');
      
      if (errorResult.handled && !errorResult.shouldLog) return;
      
      console.error('Error loading customers:', error);
      if (isMountedRef.current && errorResult.shouldLog) {
        setErrors(prev => ({ 
          ...prev, 
          customers: errorResult.message || error.message || 'فشل في تحميل العملاء' 
        }));
      }
    } finally {
      abortControllersRef.current.delete(key);
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    const key = 'vehicles';
    const controller = createSafeAbortController(10000); // 10 ثواني timeout
    abortControllersRef.current.set(key, controller);
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, vehicle_number, daily_rate, status')
        .order('vehicle_number')
        .abortSignal(controller.signal);
      
      if (error) throw error;
      
      if (!isMountedRef.current || controller.signal.aborted) return;
      
      setVehicles(data || []);
      setErrors(prev => ({ ...prev, vehicles: '' }));
    } catch (error: any) {
      const errorResult = handleError(error, 'contracts-loadVehicles');
      
      if (errorResult.handled && !errorResult.shouldLog) return;
      
      console.error('Error loading vehicles:', error);
      if (isMountedRef.current && errorResult.shouldLog) {
        setErrors(prev => ({ 
          ...prev, 
          vehicles: errorResult.message || error.message || 'فشل في تحميل المركبات' 
        }));
      }
    } finally {
      abortControllersRef.current.delete(key);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const contractStatsData = await contractService.getContractStats();
      
      if (!isMountedRef.current) return;
      
      setContractStats(contractStatsData);
      setErrors(prev => ({ ...prev, stats: '' }));
    } catch (error: any) {
      console.error('Error loading stats:', error);
      if (isMountedRef.current) {
        setErrors(prev => ({ ...prev, stats: error.message || 'فشل في تحميل الإحصائيات' }));
      }
    }
  }, [contractService]);

  // محسن: تحميل البيانات مرة واحدة فقط
  const loadData = useCallback(async () => {
    if (authLoading) return;

    if (!user || !session) {
      setLoading(false);
      setErrors({
        general: 'يجب تسجيل الدخول أولاً للوصول إلى البيانات'
      });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      
      // تحميل البيانات بشكل متوازي
      await Promise.all([
        loadContractsInitial(),
        loadCustomers(),
        loadVehicles(),
        loadQuotations(),
        loadStats(),
      ]);
    } catch (error: any) {
      console.error('Critical error in loadData:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, session, loadContractsInitial, loadCustomers, loadVehicles, loadQuotations, loadStats, toast]);

  // تحميل البيانات مرة واحدة عند التحميل
  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);
  
  // تنظيف الموارد
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      pendingUpdatesRef.current.clear();
      
      abortControllersRef.current.forEach((controller) => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    quotations,
    contracts, // محسن: من الـ cache
    customers,
    vehicles,
    contractStats,
    loading,
    errors,
    
    // دوال محسنة للتحديث
    updateSingleContract,
    addContract,
    removeContract,
    refreshSingleContractFromServer,
    
    // دوال قديمة للتوافق
    loadData,
  };
};