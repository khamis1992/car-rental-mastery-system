import { useState, useEffect, useCallback } from 'react';
import { useContractsRealtime } from '@/contexts/ContractsRealtimeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { handleError } from '@/utils/errorHandling';

// Hook محسن للعقود مع دعم العمليات المتقدمة
export const useContractsEnhanced = () => {
  const {
    contracts,
    loading,
    errors,
    refreshContracts,
    updateContract,
    addContract,
    removeContract,
    updateContractOptimistic,
    syncContract,
    isConnected,
    lastSync,
  } = useContractsRealtime();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [contractStats, setContractStats] = useState({
    total: 0,
    active: 0,
    endingToday: 0,
    monthlyRevenue: 0,
  });
  const [additionalLoading, setAdditionalLoading] = useState(false);

  const { toast } = useToast();

  // تحميل البيانات المساعدة
  const loadSupportingData = useCallback(async () => {
    try {
      setAdditionalLoading(true);

      const [quotationsRes, customersRes, vehiclesRes] = await Promise.all([
        supabase
          .from('quotations')
          .select('*')
          .in('status', ['draft', 'sent', 'accepted'])
          .order('created_at', { ascending: false }),
        
        supabase
          .from('customers')
          .select('id, name, customer_number')
          .eq('status', 'active')
          .order('name'),
        
        supabase
          .from('vehicles')
          .select('id, make, model, vehicle_number, daily_rate, status')
          .order('vehicle_number')
      ]);

      if (quotationsRes.error) throw quotationsRes.error;
      if (customersRes.error) throw customersRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;

      setQuotations(quotationsRes.data || []);
      setCustomers(customersRes.data || []);
      setVehicles(vehiclesRes.data || []);

    } catch (error: any) {
      const errorResult = handleError(error, 'contracts-supporting-data');
      if (errorResult.shouldLog) {
        console.error('خطأ في تحميل البيانات المساعدة:', error);
      }
    } finally {
      setAdditionalLoading(false);
    }
  }, []);

  // حساب الإحصائيات من العقود المحلية
  const calculateStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = {
      total: contracts.length,
      active: contracts.filter(c => c.status === 'active').length,
      endingToday: contracts.filter(c => 
        c.status === 'active' && c.end_date === today
      ).length,
      monthlyRevenue: contracts
        .filter(c => 
          (c.status === 'active' || c.status === 'completed') &&
          new Date(c.created_at) >= startOfMonth
        )
        .reduce((sum, c) => sum + (c.final_amount || 0), 0)
    };

    setContractStats(stats);
  }, [contracts]);

  // تحديث الإحصائيات عند تغيير العقود
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // تحميل البيانات المساعدة عند التحميل
  useEffect(() => {
    loadSupportingData();
  }, [loadSupportingData]);

  // عمليات محسنة للعقود
  const enhancedOperations = {
    // تفعيل عقد مع تحديث تفاؤلي
    activateContract: async (contractId: string, actualStartDate: string) => {
      await updateContractOptimistic(contractId, {
        status: 'active',
        actual_start_date: actualStartDate,
      });

      toast({
        title: "تم تفعيل العقد",
        description: "تم تفعيل العقد بنجاح",
      });
    },

    // إكمال عقد مع تحديث تفاؤلي
    completeContract: async (contractId: string, actualEndDate: string) => {
      await updateContractOptimistic(contractId, {
        status: 'completed',
        actual_end_date: actualEndDate,
      });

      toast({
        title: "تم إكمال العقد",
        description: "تم إكمال العقد بنجاح",
      });
    },

    // تحديث حالة العقد
    updateStatus: async (contractId: string, status: string) => {
      await updateContractOptimistic(contractId, { status });
    },

    // مزامنة جميع العقود
    syncAllContracts: async () => {
      toast({
        title: "جاري المزامنة",
        description: "جاري مزامنة جميع العقود...",
      });

      await refreshContracts();
      
      toast({
        title: "تمت المزامنة",
        description: "تم تحديث جميع العقود بنجاح",
      });
    },

    // إعادة تحميل البيانات المساعدة
    refreshSupportingData: loadSupportingData,
  };

  return {
    // البيانات الأساسية
    contracts,
    quotations,
    customers,
    vehicles,
    contractStats,
    
    // حالة التحميل والأخطاء
    loading: loading || additionalLoading,
    errors,
    
    // معلومات الاتصال
    isConnected,
    lastSync,
    
    // العمليات الأساسية
    refreshContracts,
    updateContract,
    addContract,
    removeContract,
    syncContract,
    
    // العمليات المحسنة
    ...enhancedOperations,
    
    // للتوافق مع الكود القديم
    loadData: refreshContracts,
    updateSingleContract: updateContract,
    refreshSingleContractFromServer: syncContract,
  };
};