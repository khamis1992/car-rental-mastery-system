import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Checkbook, CheckbookFormData } from '@/types/checks';

export function useCheckbooks() {
  const [checkbooks, setCheckbooks] = useState<Checkbook[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCheckbooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checkbooks')
        .select(`
          *,
          bank_account:bank_accounts (
            id,
            account_name,
            bank_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCheckbooks((data as Checkbook[]) || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل دفاتر الشيكات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckbook = async (data: CheckbookFormData) => {
    try {
      const totalChecks = data.end_check_number - data.start_check_number + 1;
      
      const { error } = await supabase
        .from('checkbooks')
        .insert({
          ...data,
          total_checks: totalChecks,
          remaining_checks: totalChecks,
          tenant_id: '', // Will be set by RLS
        });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء دفتر الشيكات بنجاح',
      });

      await fetchCheckbooks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إنشاء دفتر الشيكات',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateCheckbook = async (id: string, data: Partial<CheckbookFormData>) => {
    try {
      const { error } = await supabase
        .from('checkbooks')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث دفتر الشيكات بنجاح',
      });

      await fetchCheckbooks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث دفتر الشيكات',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCheckbook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('checkbooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف دفتر الشيكات بنجاح',
      });

      await fetchCheckbooks();
      return true;
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف دفتر الشيكات',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCheckbooks();
  }, []);

  return {
    checkbooks,
    loading,
    createCheckbook,
    updateCheckbook,
    deleteCheckbook,
    refetch: fetchCheckbooks,
  };
}