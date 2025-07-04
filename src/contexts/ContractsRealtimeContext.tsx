import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ContractWithDetails } from '@/services/contractService';
import { handleError } from '@/utils/errorHandling';

interface ContractsRealtimeContextType {
  contracts: ContractWithDetails[];
  loading: boolean;
  errors: Record<string, string>;
  // العمليات الأساسية
  refreshContracts: () => Promise<void>;
  updateContract: (contractId: string, updates: Partial<ContractWithDetails>) => void;
  addContract: (contract: ContractWithDetails) => void;
  removeContract: (contractId: string) => void;
  // عمليات متقدمة
  updateContractOptimistic: (contractId: string, updates: Partial<ContractWithDetails>) => Promise<void>;
  syncContract: (contractId: string) => Promise<void>;
  // حالة الاتصال
  isConnected: boolean;
  lastSync: Date | null;
}

const ContractsRealtimeContext = createContext<ContractsRealtimeContextType | undefined>(undefined);

export const useContractsRealtime = () => {
  const context = useContext(ContractsRealtimeContext);
  if (context === undefined) {
    throw new Error('useContractsRealtime must be used within a ContractsRealtimeProvider');
  }
  return context;
};

interface ContractsRealtimeProviderProps {
  children: React.ReactNode;
}

export const ContractsRealtimeProvider: React.FC<ContractsRealtimeProviderProps> = ({ children }) => {
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const optimisticUpdatesRef = useRef<Map<string, Partial<ContractWithDetails>>>(new Map());

  // تحميل العقود الأولي
  const loadContracts = useCallback(async () => {
    if (!user || !session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          customer_id,
          vehicle_id,
          quotation_id,
          start_date,
          end_date,
          actual_start_date,
          actual_end_date,
          rental_days,
          contract_type,
          daily_rate,
          total_amount,
          discount_amount,
          tax_amount,
          security_deposit,
          insurance_amount,
          final_amount,
          status,
          pickup_location,
          return_location,
          special_conditions,
          terms_and_conditions,
          notes,
          created_at,
          delivery_completed_at,
          payment_registered_at,
          customers(name, phone),
          vehicles(make, model, vehicle_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contractsWithDetails = data.map((contract: any) => ({
        id: contract.id,
        contract_number: contract.contract_number,
        customer_name: contract.customers?.name || 'غير محدد',
        customer_phone: contract.customers?.phone || '',
        vehicle_info: contract.vehicles 
          ? `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.vehicle_number}`
          : 'غير محدد',
        start_date: contract.start_date,
        end_date: contract.end_date,
        actual_start_date: contract.actual_start_date,
        actual_end_date: contract.actual_end_date,
        rental_days: contract.rental_days,
        contract_type: contract.contract_type,
        daily_rate: contract.daily_rate,
        total_amount: contract.total_amount,
        discount_amount: contract.discount_amount || 0,
        tax_amount: contract.tax_amount || 0,
        security_deposit: contract.security_deposit || 0,
        insurance_amount: contract.insurance_amount || 0,
        final_amount: contract.final_amount,
        status: contract.status,
        pickup_location: contract.pickup_location,
        return_location: contract.return_location,
        special_conditions: contract.special_conditions,
        terms_and_conditions: contract.terms_and_conditions,
        notes: contract.notes,
        created_at: contract.created_at,
        customer_id: contract.customer_id,
        vehicle_id: contract.vehicle_id,
        quotation_id: contract.quotation_id,
        // Add missing fields for stage determination
        delivery_completed_at: contract.delivery_completed_at,
        payment_registered_at: contract.payment_registered_at,
      })) as ContractWithDetails[];

      if (isMountedRef.current) {
        setContracts(contractsWithDetails);
        setLastSync(new Date());
      }
    } catch (error: any) {
      const errorResult = handleError(error, 'contracts-realtime-load');
      if (isMountedRef.current && errorResult.shouldLog) {
        setErrors({ general: errorResult.message || 'فشل في تحميل العقود' });
        toast({
          title: "خطأ في تحميل البيانات",
          description: errorResult.message || 'فشل في تحميل العقود',
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, session, toast]);

  // تحديث فوري للعقد
  const updateContract = useCallback((contractId: string, updates: Partial<ContractWithDetails>) => {
    setContracts(prevContracts => 
      prevContracts.map(contract => 
        contract.id === contractId 
          ? { ...contract, ...updates }
          : contract
      )
    );
  }, []);

  // إضافة عقد جديد
  const addContract = useCallback((contract: ContractWithDetails) => {
    setContracts(prevContracts => [contract, ...prevContracts]);
  }, []);

  // حذف عقد
  const removeContract = useCallback((contractId: string) => {
    setContracts(prevContracts => prevContracts.filter(c => c.id !== contractId));
  }, []);

  // تحديث تفاؤلي مع إمكانية الاستعادة
  const updateContractOptimistic = useCallback(async (
    contractId: string, 
    updates: Partial<ContractWithDetails>
  ) => {
    // حفظ النسخة الأصلية للاستعادة
    const originalContract = contracts.find(c => c.id === contractId);
    if (!originalContract) return;

    // تطبيق التحديث فوراً
    updateContract(contractId, updates);

    try {
      // محاولة تحديث الخادم
      const { error } = await supabase
        .from('contracts')
        .update(updates as any)
        .eq('id', contractId);

      if (error) throw error;

      // نجح التحديث - إزالة من قائمة التحديثات التفاؤلية
      optimisticUpdatesRef.current.delete(contractId);

    } catch (error: any) {
      // فشل التحديث - استعادة النسخة الأصلية
      updateContract(contractId, originalContract);
      optimisticUpdatesRef.current.delete(contractId);

      const errorResult = handleError(error, 'contracts-optimistic-update');
      if (errorResult.shouldLog) {
        toast({
          title: "فشل في التحديث",
          description: "تم استعادة البيانات الأصلية",
          variant: "destructive",
        });
      }
    }
  }, [contracts, updateContract, toast]);

  // مزامنة عقد محدد من الخادم
  const syncContract = useCallback(async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          customer_id,
          vehicle_id,
          quotation_id,
          start_date,
          end_date,
          actual_start_date,
          actual_end_date,
          rental_days,
          contract_type,
          daily_rate,
          total_amount,
          discount_amount,
          tax_amount,
          security_deposit,
          insurance_amount,
          final_amount,
          status,
          pickup_location,
          return_location,
          special_conditions,
          terms_and_conditions,
          notes,
          created_at,
          delivery_completed_at,
          payment_registered_at,
          customers(name, phone),
          vehicles(make, model, vehicle_number)
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;

      if (data) {
        const updates = {
          id: data.id,
          contract_number: data.contract_number,
          customer_name: data.customers?.name || 'غير محدد',
          customer_phone: data.customers?.phone || '',
          vehicle_info: data.vehicles 
            ? `${data.vehicles.make} ${data.vehicles.model} - ${data.vehicles.vehicle_number}`
            : 'غير محدد',
          start_date: data.start_date,
          end_date: data.end_date,
          actual_start_date: data.actual_start_date,
          actual_end_date: data.actual_end_date,
          rental_days: data.rental_days,
          contract_type: data.contract_type,
          daily_rate: data.daily_rate,
          total_amount: data.total_amount,
          discount_amount: data.discount_amount || 0,
          tax_amount: data.tax_amount || 0,
          security_deposit: data.security_deposit || 0,
          insurance_amount: data.insurance_amount || 0,
          final_amount: data.final_amount,
          status: data.status,
          pickup_location: data.pickup_location,
          return_location: data.return_location,
          special_conditions: data.special_conditions,
          terms_and_conditions: data.terms_and_conditions,
          notes: data.notes,
          created_at: data.created_at,
          customer_id: data.customer_id,
          vehicle_id: data.vehicle_id,
          quotation_id: data.quotation_id,
          delivery_completed_at: data.delivery_completed_at,
          payment_registered_at: data.payment_registered_at,
        };

        updateContract(contractId, updates);
      }
    } catch (error: any) {
      const errorResult = handleError(error, 'contracts-sync-single');
      if (errorResult.shouldLog) {
        console.error('فشل في مزامنة العقد:', error);
      }
    }
  }, [updateContract]);

  // إعداد Realtime
  useEffect(() => {
    if (!user || !session) return;

    const channel = supabase
      .channel('contracts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contracts'
        },
        (payload) => {
          console.log('🔔 عقد جديد:', payload.new);
          // سيتم التعامل معه عبر إعادة التحميل أو إضافة محددة
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts'
        },
        (payload) => {
          console.log('🔄 تحديث عقد:', payload.new);
          if (payload.new) {
            // تحديث العقد مباشرة
            updateContract(payload.new.id, payload.new as Partial<ContractWithDetails>);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'contracts'
        },
        (payload) => {
          console.log('🗑️ حذف عقد:', payload.old);
          if (payload.old) {
            removeContract(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('✅ متصل بـ Realtime للعقود');
        } else if (status === 'CLOSED') {
          console.log('❌ انقطع الاتصال بـ Realtime');
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, session, updateContract, removeContract]);

  // تحميل البيانات الأولي
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // تنظيف عند الخروج
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      optimisticUpdatesRef.current.clear();
    };
  }, []);

  const value: ContractsRealtimeContextType = {
    contracts,
    loading,
    errors,
    refreshContracts: loadContracts,
    updateContract,
    addContract,
    removeContract,
    updateContractOptimistic,
    syncContract,
    isConnected,
    lastSync,
  };

  return (
    <ContractsRealtimeContext.Provider value={value}>
      {children}
    </ContractsRealtimeContext.Provider>
  );
};