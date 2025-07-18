import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CheckSummary } from '@/types/checks';

export function useCheckSummary() {
  const [summary, setSummary] = useState<CheckSummary>({
    total_paid_checks: 0,
    total_paid_amount: 0,
    total_received_checks: 0,
    total_received_amount: 0,
    pending_received_checks: 0,
    pending_received_amount: 0,
    bounced_checks: 0,
    bounced_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSummary = async () => {
    try {
      setLoading(true);

      // احصائيات الشيكات المدفوعة
      const { data: paidChecks, error: paidError } = await supabase
        .from('checks')
        .select('amount')
        .eq('check_category', 'outgoing')
        .eq('status', 'cleared');

      if (paidError) throw paidError;

      // احصائيات الشيكات المستلمة
      const { data: receivedChecks, error: receivedError } = await supabase
        .from('received_checks')
        .select('amount, status');

      if (receivedError) throw receivedError;

      const paidAmount = paidChecks?.reduce((sum, check) => sum + Number(check.amount), 0) || 0;
      const receivedAmount = receivedChecks?.reduce((sum, check) => sum + Number(check.amount), 0) || 0;
      
      const pendingReceived = receivedChecks?.filter(check => 
        check.status === 'received' || check.status === 'deposited'
      ) || [];
      const bouncedReceived = receivedChecks?.filter(check => check.status === 'bounced') || [];

      const pendingAmount = pendingReceived.reduce((sum, check) => sum + Number(check.amount), 0);
      const bouncedAmount = bouncedReceived.reduce((sum, check) => sum + Number(check.amount), 0);

      setSummary({
        total_paid_checks: paidChecks?.length || 0,
        total_paid_amount: paidAmount,
        total_received_checks: receivedChecks?.length || 0,
        total_received_amount: receivedAmount,
        pending_received_checks: pendingReceived.length,
        pending_received_amount: pendingAmount,
        bounced_checks: bouncedReceived.length,
        bounced_amount: bouncedAmount,
      });

    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل ملخص الشيكات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return {
    summary,
    loading,
    refetch: fetchSummary,
  };
}