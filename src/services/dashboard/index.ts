import { supabase } from '@/integrations/supabase/client';

interface DashboardStatsResponse {
  totalContracts: number;
  activeContracts: number;
  availableVehicles: number;
  monthlyRevenue: number;
  pendingPayments: number;
  expiringContracts: number;
}

export const dashboardService = {
  async getDashboardStats(tenantId: string): Promise<DashboardStatsResponse> {
    try {
      // استخدام RPC function محسنة للحصول على جميع الإحصائيات دفعة واحدة
      const { data, error } = await supabase.rpc('get_optimized_dashboard_stats', {
        tenant_id_param: tenantId
      }) as { data: any, error: any };

      if (error) {
        console.error('Dashboard stats RPC error:', error);
        // Fallback إلى الاستعلامات المنفصلة
        return await this.getDashboardStatsFallback(tenantId);
      }

      // تحويل البيانات من JSONB إلى DashboardStatsResponse
      if (data && typeof data === 'object') {
        return {
          totalContracts: data.totalContracts || 0,
          activeContracts: data.activeContracts || 0,
          availableVehicles: data.availableVehicles || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          pendingPayments: data.pendingPayments || 0,
          expiringContracts: data.expiringContracts || 0,
        };
      }

      // Fallback إذا لم تكن البيانات بالشكل المتوقع
      return await this.getDashboardStatsFallback(tenantId);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return await this.getDashboardStatsFallback(tenantId);
    }
  },

  async getDashboardStatsFallback(tenantId: string): Promise<DashboardStatsResponse> {
    try {
      // استعلامات منفصلة مع optimization
      const [
        contractsCount,
        activeContractsCount, 
        availableVehiclesCount,
        monthlyRevenueData,
        pendingPaymentsCount,
        expiringContractsCount
      ] = await Promise.all([
        // إجمالي العقود
        supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),

        // العقود النشطة
        supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'active'),

        // السيارات المتاحة
        supabase
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'available'),

        // الإيرادات الشهرية
        supabase
          .from('payments')
          .select('amount')
          .eq('tenant_id', tenantId)
          .eq('status', 'completed')
          .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),

        // المدفوعات المعلقة
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .in('status', ['pending', 'overdue']),

        // العقود المنتهية الصلاحية
        supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);

      const monthlyRevenue = monthlyRevenueData.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      return {
        totalContracts: contractsCount.count || 0,
        activeContracts: activeContractsCount.count || 0,
        availableVehicles: availableVehiclesCount.count || 0,
        monthlyRevenue,
        pendingPayments: pendingPaymentsCount.count || 0,
        expiringContracts: expiringContractsCount.count || 0,
      };
    } catch (error) {
      console.error('Fallback dashboard stats error:', error);
      throw error;
    }
  },
};