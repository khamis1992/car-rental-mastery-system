import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  national_id: string | null;
  customer_type: 'individual' | 'company';
  status: 'active' | 'inactive' | 'blocked';
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer_number: string;
  total_contracts: number | null;
  total_revenue: number | null;
  contracts?: { count: number }[];
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          contracts(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('خطأ في تحميل بيانات العملاء');
      toast.error('فشل في تحميل بيانات العملاء');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      toast.success('تم حذف العميل بنجاح');
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('فشل في حذف العميل');
      throw err;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    deleteCustomer
  };
};