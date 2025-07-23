import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReceivedCheckFormData {
  check_number: string;
  drawer_name: string;
  drawer_account?: string;
  amount: number;
  check_date: string;
  received_date: string;
  due_date?: string;
  bank_name: string;
  memo?: string;
  reference_type?: string;
  reference_id?: string;
}

interface ReceivedCheck {
  id: string;
  tenant_id: string;
  check_number: string;
  drawer_name: string;
  drawer_account?: string;
  amount: number;
  check_date: string;
  received_date: string;
  due_date?: string;
  bank_name: string;
  status: string;
  deposit_bank_account_id?: string;
  deposited_at?: string;
  cleared_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
  reference_type?: string;
  reference_id?: string;
  journal_entry_id?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  deposit_bank_account?: {
    id: string;
    account_name: string;
    bank_name: string;
  };
}

export function useReceivedChecks() {
  const [receivedChecks, setReceivedChecks] = useState<ReceivedCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReceivedChecks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('received_checks')
        .select(`
          *,
          deposit_bank_account:bank_accounts (
            id,
            account_name,
            bank_name
          )
        `)
        .order('received_date', { ascending: false });

      if (error) throw error;
      setReceivedChecks((data as ReceivedCheck[]) || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الشيكات المستلمة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createReceivedCheck = async (data: ReceivedCheckFormData) => {
    try {
      const { error } = await supabase
        .from('received_checks')
        .insert([{
          ...data,
          status: 'received',
        }]);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تسجيل الشيك المستلم بنجاح',
      });

      await fetchReceivedChecks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تسجيل الشيك المستلم',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateReceivedCheck = async (id: string, data: Partial<ReceivedCheckFormData>) => {
    try {
      const { error } = await supabase
        .from('received_checks')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الشيك المستلم بنجاح',
      });

      await fetchReceivedChecks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث الشيك المستلم',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateCheckStatus = async (id: string, status: string, data?: any) => {
    try {
      const updateData = { status, ...data };
      
      if (status === 'deposited') {
        updateData.deposited_at = new Date().toISOString();
      } else if (status === 'cleared') {
        updateData.cleared_at = new Date().toISOString();
      } else if (status === 'bounced') {
        updateData.bounced_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('received_checks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث حالة الشيك بنجاح',
      });

      await fetchReceivedChecks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث حالة الشيك',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteReceivedCheck = async (id: string) => {
    try {
      const { error } = await supabase
        .from('received_checks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الشيك المستلم بنجاح',
      });

      await fetchReceivedChecks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف الشيك المستلم',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchReceivedChecks();
  }, []);

  return {
    receivedChecks,
    loading,
    createReceivedCheck,
    updateReceivedCheck,
    updateCheckStatus,
    deleteReceivedCheck,
    refetch: fetchReceivedChecks,
  };
}