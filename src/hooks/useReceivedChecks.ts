import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ReceivedCheck, ReceivedCheckFormData } from '@/types/checks';

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
        .insert({
          ...data,
          tenant_id: '', // Will be set by RLS
        });

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

  const updateReceivedCheckStatus = async (id: string, status: ReceivedCheck['status'], additionalData?: any) => {
    try {
      const updateData: any = { status };
      
      if (status === 'deposited' && additionalData?.deposit_bank_account_id) {
        updateData.deposit_bank_account_id = additionalData.deposit_bank_account_id;
        updateData.deposited_at = new Date().toISOString();
      } else if (status === 'cleared') {
        updateData.cleared_at = new Date().toISOString();
      } else if (status === 'bounced' && additionalData?.bounce_reason) {
        updateData.bounced_at = new Date().toISOString();
        updateData.bounce_reason = additionalData.bounce_reason;
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
    updateReceivedCheckStatus,
    deleteReceivedCheck,
    refetch: fetchReceivedChecks,
  };
}