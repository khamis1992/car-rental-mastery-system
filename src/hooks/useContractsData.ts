import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { contractService } from '@/services/contractService';
import { quotationService } from '@/services/quotationService';

export const useContractsData = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
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

  const loadQuotations = async () => {
    const activeQuotations = await quotationService.getActiveQuotations();
    setQuotations(activeQuotations);
  };

  const loadContracts = async () => {
    const data = await contractService.getContractsWithDetails();
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