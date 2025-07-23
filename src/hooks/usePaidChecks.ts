import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CheckFormData } from '@/types/checks';
import { ChecksRepository } from '@/repositories/ChecksRepository';

interface PaidCheck {
  id: string;
  checkbook_id: string;
  check_number: string;
  payee_name: string;
  amount: number;
  check_date: string;
  status: string;
  memo?: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
  checkbook?: {
    id: string;
    checkbook_number: string;
    bank_account?: {
      id: string;
      account_name: string;
      bank_name: string;
    };
  };
}

export function usePaidChecks() {
  const [paidChecks, setPaidChecks] = useState<PaidCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const checksRepository = new ChecksRepository();

  const fetchPaidChecks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checks')
        .select(`
          *,
          checkbook:checkbooks (
            id,
            checkbook_number,
            bank_account:bank_accounts (
              id,
              account_name,
              bank_name
            )
          )
        `)
        .eq('check_category', 'outgoing')
        .order('check_date', { ascending: false });

      if (error) throw error;
      setPaidChecks((data as PaidCheck[]) || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الشيكات المدفوعة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPaidCheck = async (data: CheckFormData) => {
    try {
      // الحصول على معلومات دفتر الشيكات للحصول على bank_account_id
      const { data: checkbookData, error: checkbookError } = await supabase
        .from('checkbooks')
        .select('bank_account_id')
        .eq('id', data.checkbook_id)
        .single();

      if (checkbookError) throw checkbookError;

      await checksRepository.createPaidCheck(data, checkbookData.bank_account_id);

      // تحديث عدد الشيكات المستخدمة في دفتر الشيكات
      if (data.checkbook_id) {
        const { data: checkbook, error: checkbookError } = await supabase
          .from('checkbooks')
          .select('used_checks, remaining_checks')
          .eq('id', data.checkbook_id)
          .single();

        if (!checkbookError && checkbook) {
          await supabase
            .from('checkbooks')
            .update({ 
              used_checks: checkbook.used_checks + 1,
              remaining_checks: checkbook.remaining_checks - 1 
            })
            .eq('id', data.checkbook_id);
        }
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم إصدار الشيك بنجاح',
      });

      await fetchPaidChecks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إصدار الشيك',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updatePaidCheck = async (id: string, data: Partial<CheckFormData>) => {
    try {
      const { error } = await supabase
        .from('checks')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الشيك بنجاح',
      });

      await fetchPaidChecks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث الشيك',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateCheckStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('checks')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث حالة الشيك بنجاح',
      });

      await fetchPaidChecks();
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

  const deletePaidCheck = async (id: string) => {
    try {
      // الحصول على معلومات الشيك أولاً
      const { data: check, error: fetchError } = await supabase
        .from('checks')
        .select('checkbook_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('checks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // تحديث عدد الشيكات المستخدمة في دفتر الشيكات
      if (check?.checkbook_id) {
        const { data: checkbook, error: checkbookError } = await supabase
          .from('checkbooks')
          .select('used_checks, remaining_checks')
          .eq('id', check.checkbook_id)
          .single();

        if (!checkbookError && checkbook) {
          await supabase
            .from('checkbooks')
            .update({ 
              used_checks: Math.max(0, checkbook.used_checks - 1),
              remaining_checks: checkbook.remaining_checks + 1 
            })
            .eq('id', check.checkbook_id);
        }
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الشيك بنجاح',
      });

      await fetchPaidChecks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف الشيك',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPaidChecks();
  }, []);

  return {
    paidChecks,
    loading,
    createPaidCheck,
    updatePaidCheck,
    updateCheckStatus,
    deletePaidCheck,
    refetch: fetchPaidChecks,
  };
}