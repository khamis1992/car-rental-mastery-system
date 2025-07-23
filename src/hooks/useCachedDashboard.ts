import { useState, useEffect } from 'react';
import { cacheService, CacheKeys } from '@/services/cache/CacheService';
import { useTenant } from '@/contexts/TenantContext';
import { useRealtimeCache } from './useRealtimeCache';
import { dashboardService } from '@/services/dashboard';
import { toast } from 'sonner';

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  availableVehicles: number;
  monthlyRevenue: number;
  pendingPayments: number;
  expiringContracts: number;
  lastUpdated: string;
}

const initialStats: DashboardStats = {
  totalContracts: 0,
  activeContracts: 0,
  availableVehicles: 0,
  monthlyRevenue: 0,
  pendingPayments: 0,
  expiringContracts: 0,
  lastUpdated: new Date().toISOString(),
};

export const useCachedDashboard = () => {
  const { currentTenant } = useTenant();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // إعداد cache invalidation للجداول المرتبطة
  const { invalidateCache, clearTenantCache } = useRealtimeCache({
    enableInvalidation: true,
    tables: ['contracts', 'vehicles', 'payments', 'invoices', 'customers'],
  });

  const fetchDashboardStats = async (useCache = true): Promise<DashboardStats> => {
    if (!currentTenant?.id) {
      throw new Error('No tenant selected');
    }

    const cacheKey = CacheKeys.dashboardStats(currentTenant.id);

    if (useCache) {
      const cached = cacheService.get<DashboardStats>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // جلب البيانات من الخدمة
      const data = await dashboardService.getDashboardStats(currentTenant.id);
      
      const dashboardStats: DashboardStats = {
        totalContracts: data.totalContracts || 0,
        activeContracts: data.activeContracts || 0,
        availableVehicles: data.availableVehicles || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        pendingPayments: data.pendingPayments || 0,
        expiringContracts: data.expiringContracts || 0,
        lastUpdated: new Date().toISOString(),
      };

      // حفظ في الكاش
      cacheService.set(cacheKey, dashboardStats, 3 * 60 * 1000); // 3 دقائق

      return dashboardStats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  };

  const loadStats = async (forceRefresh = false) => {
    if (!currentTenant?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchDashboardStats(!forceRefresh);
      setStats(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في تحميل البيانات';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // تحميل البيانات عند تغيير المؤسسة
  useEffect(() => {
    loadStats();
  }, [currentTenant?.id]);

  // تحديث البيانات كل 5 دقائق
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentTenant?.id]);

  const refreshStats = async () => {
    await loadStats(true);
  };

  const invalidateDashboardCache = () => {
    if (currentTenant?.id) {
      const cacheKey = CacheKeys.dashboardStats(currentTenant.id);
      cacheService.invalidate(cacheKey);
    }
  };

  return {
    stats,
    loading,
    error,
    refreshStats,
    invalidateDashboardCache,
    clearTenantCache,
  };
};