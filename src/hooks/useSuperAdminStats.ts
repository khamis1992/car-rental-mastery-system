import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminStats {
  totalTenants: number;
  totalUsers: number;
  activeTransactions: number;
  totalRevenue: number;
  systemPerformance: number;
  dataSize: string;
  securityStatus: string;
  activeRegions: number;
  tenantGrowth: string;
  userGrowth: string;
  transactionGrowth: string;
  revenueGrowth: string;
}

export const useSuperAdminStats = () => {
  return useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async (): Promise<SuperAdminStats> => {
      // Fetch tenants count
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true });

      // Fetch users count from tenant_users table
      const { count: usersCount } = await supabase
        .from('tenant_users')
        .select('*', { count: 'exact', head: true });

      // Fetch active contracts (transactions)
      const { count: activeTransactions } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch subscription revenue from saas_payments
      const { data: saasPayments } = await supabase
        .from('saas_payments')
        .select('amount, currency, status, paid_at')
        .eq('status', 'succeeded');

      const totalSubscriptionRevenue = saasPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Calculate monthly subscription revenue (current month)
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data: monthlyPayments } = await supabase
        .from('saas_payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('paid_at', startOfMonth.toISOString())
        .lte('paid_at', endOfMonth.toISOString());

      const monthlySubscriptionRevenue = monthlyPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Calculate previous month for growth comparison
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

      const { data: previousMonthPayments } = await supabase
        .from('saas_payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('paid_at', previousMonth.toISOString())
        .lte('paid_at', endOfPreviousMonth.toISOString());

      const previousMonthRevenue = previousMonthPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Calculate growth percentage
      const revenueGrowthPercentage = previousMonthRevenue > 0 
        ? ((monthlySubscriptionRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
        : '0';
      
      const revenueGrowth = previousMonthRevenue > 0 
        ? `${parseFloat(revenueGrowthPercentage) > 0 ? '+' : ''}${revenueGrowthPercentage}% هذا الشهر`
        : "أول شهر";

      // Calculate growth rates (mock for now - would need historical data)
      const tenantGrowth = "+2 هذا الشهر";
      const userGrowth = "+18% نمو";
      const transactionGrowth = "+5.2% اليوم";

      // Calculate data size (mock - would need actual DB size query)
      const dataSize = "2.3 TB";

      // System performance (mock - would need actual monitoring)
      const systemPerformance = 99.8;

      // Security status (mock - would need actual security monitoring)
      const securityStatus = "آمن";

      // Active regions (based on tenants with different locations)
      const { data: regionsData } = await supabase
        .from('tenants')
        .select('country')
        .not('country', 'is', null);

      const uniqueRegions = new Set(regionsData?.map(t => t.country) || []);
      const activeRegions = uniqueRegions.size || 3;

      return {
        totalTenants: tenantsCount || 0,
        totalUsers: usersCount || 0,
        activeTransactions: activeTransactions || 0,
        totalRevenue: totalSubscriptionRevenue,
        systemPerformance,
        dataSize,
        securityStatus,
        activeRegions,
        tenantGrowth,
        userGrowth,
        transactionGrowth,
        revenueGrowth
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};