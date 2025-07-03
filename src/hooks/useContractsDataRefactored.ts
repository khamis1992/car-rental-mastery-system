import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  const contractService = serviceContainer.getContractBusinessService();
  const quotationService = serviceContainer.getQuotationBusinessService();

  const loadQuotations = async () => {
    try {
      const activeQuotations = await quotationService.getActiveQuotations();
      setQuotations(activeQuotations);
      setErrors(prev => ({ ...prev, quotations: '' }));
    } catch (error: any) {
      console.error('Error loading quotations:', error);
      setErrors(prev => ({ ...prev, quotations: error.message || 'فشل في تحميل عروض الأسعار' }));
      // Keep existing data if available
    }
  };

  const loadContracts = async () => {
    try {
      const data = await contractService.getAllContracts();
      setContracts(data);
      setErrors(prev => ({ ...prev, contracts: '' }));
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      setErrors(prev => ({ ...prev, contracts: error.message || 'فشل في تحميل العقود' }));
      // Keep existing data if available
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, customer_number')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
      setErrors(prev => ({ ...prev, customers: '' }));
    } catch (error: any) {
      console.error('Error loading customers:', error);
      setErrors(prev => ({ ...prev, customers: error.message || 'فشل في تحميل العملاء' }));
      // Keep existing data if available
    }
  };

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, vehicle_number, daily_rate, status')
        .order('vehicle_number');
      
      if (error) throw error;
      setVehicles(data || []);
      setErrors(prev => ({ ...prev, vehicles: '' }));
    } catch (error: any) {
      console.error('Error loading vehicles:', error);
      setErrors(prev => ({ ...prev, vehicles: error.message || 'فشل في تحميل المركبات' }));
      // Keep existing data if available
    }
  };

  const loadStats = async () => {
    try {
      const contractStatsData = await contractService.getContractStats();
      setContractStats(contractStatsData);
      setErrors(prev => ({ ...prev, stats: '' }));
    } catch (error: any) {
      console.error('Error loading stats:', error);
      setErrors(prev => ({ ...prev, stats: error.message || 'فشل في تحميل الإحصائيات' }));
      // Keep existing stats if available
    }
  };

  const checkAuthentication = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
        setIsAuthenticated(false);
        return false;
      }
      const authenticated = !!session?.user;
      setIsAuthenticated(authenticated);
      return authenticated;
    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const loadData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setErrors({});
      
      // Check authentication first
      const authenticated = await checkAuthentication();
      if (!authenticated) {
        console.log('المستخدم غير مصرح له، لن يتم تحميل البيانات');
        setLoading(false);
        return;
      }
      
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
    loadData();
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
    isAuthenticated,
  };
};