import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionRevenueData {
  currentMonth: number;
  previousMonth: number;
  growth: string;
  growthPercentage: number;
}

export const useSubscriptionRevenue = () => {
  return useQuery({
    queryKey: ['subscription-revenue'],
    queryFn: async (): Promise<SubscriptionRevenueData> => {
      const currentDate = new Date();
      
      // Current month calculation
      const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: currentMonthPayments } = await supabase
        .from('saas_payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('paid_at', startOfCurrentMonth.toISOString())
        .lte('paid_at', endOfCurrentMonth.toISOString());

      const currentMonth = currentMonthPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Previous month calculation
      const startOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      const { data: previousMonthPayments } = await supabase
        .from('saas_payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('paid_at', startOfPreviousMonth.toISOString())
        .lte('paid_at', endOfPreviousMonth.toISOString());

      const previousMonth = previousMonthPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Calculate growth
      const growthPercentage = previousMonth > 0 
        ? ((currentMonth - previousMonth) / previousMonth * 100)
        : 0;

      const growth = previousMonth > 0 
        ? `${growthPercentage > 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`
        : "أول شهر";

      return {
        currentMonth,
        previousMonth,
        growth,
        growthPercentage
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};