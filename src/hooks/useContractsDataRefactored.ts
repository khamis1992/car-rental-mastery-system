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
  const { toast } = useToast();

  const contractService = serviceContainer.getContractBusinessService();
  const quotationService = serviceContainer.getQuotationBusinessService();

  const loadQuotations = async () => {
    const activeQuotations = await quotationService.getActiveQuotations();
    setQuotations(activeQuotations);
  };

  const loadContracts = async () => {
    const data = await contractService.getAllContracts();
    setContracts(data);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, customer_number')
      .eq('status', 'active')
      .order('name');
    
    if (error) throw error;
    setCustomers(data || []);
  };

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, make, model, vehicle_number, daily_rate, status')
      .order('vehicle_number');
    
    if (error) throw error;
    setVehicles(data || []);
  };

  const loadStats = async () => {
    const contractStatsData = await contractService.getContractStats();
    setContractStats(contractStatsData);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadContracts(),
        loadCustomers(),
        loadVehicles(),
        loadQuotations(),
        loadStats(),
      ]);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل البيانات',
        description: error.message,
        variant: 'destructive',
      });
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
    loadData,
  };
};