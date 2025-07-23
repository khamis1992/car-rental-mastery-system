import { useEffect, useCallback } from 'react';
import { cacheService, CachePatterns } from '@/services/cache/CacheService';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RealtimeCacheConfig {
  enableInvalidation: boolean;
  tables: string[];
}

export const useRealtimeCache = (config: RealtimeCacheConfig) => {
  const { currentTenant } = useTenant();

  const invalidateRelatedCache = useCallback((table: string, operation: string) => {
    if (!currentTenant?.id) return;

    const tenantId = currentTenant.id;
    let invalidatedCount = 0;

    // تحديد أنماط الكاش المرتبطة بالجدول
    switch (table) {
      case 'contracts':
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.contractsAll(tenantId));
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.dashboardAll(tenantId));
        // إبطال كاش السيارات المتاحة عند تغيير العقود
        invalidatedCount += cacheService.invalidatePattern(`vehicles:available:${tenantId}`);
        break;

      case 'customers':
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.customersAll(tenantId));
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.dashboardAll(tenantId));
        break;

      case 'vehicles':
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.vehiclesAll(tenantId));
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.dashboardAll(tenantId));
        break;

      case 'payments':
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.paymentsAll(tenantId));
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.invoicesAll(tenantId));
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.dashboardAll(tenantId));
        break;

      case 'invoices':
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.invoicesAll(tenantId));
        invalidatedCount += cacheService.invalidatePattern(CachePatterns.dashboardAll(tenantId));
        break;

      case 'chart_of_accounts':
        invalidatedCount += cacheService.invalidatePattern(`accounts:.*:${tenantId}`);
        break;

      case 'cost_centers':
        invalidatedCount += cacheService.invalidatePattern(`cost_centers:${tenantId}`);
        break;

      default:
        // إبطال كاش عام للجدول
        invalidatedCount += cacheService.invalidatePattern(`${table}:.*:${tenantId}`);
    }

    if (invalidatedCount > 0) {
      console.log(`Cache invalidated: ${invalidatedCount} items for table ${table} (${operation})`);
    }
  }, [currentTenant?.id]);

  useEffect(() => {
    if (!config.enableInvalidation || !currentTenant?.id) return;

    const subscriptions = config.tables.map(table => {
      return supabase
        .channel(`cache_invalidation_${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `tenant_id=eq.${currentTenant.id}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            invalidateRelatedCache(table, payload.eventType);
          }
        )
        .subscribe();
    });

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [config.enableInvalidation, config.tables, currentTenant?.id, invalidateRelatedCache]);

  const invalidateCache = useCallback((pattern: string) => {
    return cacheService.invalidatePattern(pattern);
  }, []);

  const clearTenantCache = useCallback(() => {
    if (currentTenant?.id) {
      return cacheService.invalidatePattern(CachePatterns.tenantAll(currentTenant.id));
    }
    return 0;
  }, [currentTenant?.id]);

  return {
    invalidateCache,
    clearTenantCache,
    invalidateRelatedCache,
  };
};

// Hook لإدارة الكاش مع التحديث التلقائي
export const useCachedData = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    revalidateOnFocus?: boolean;
    revalidateInterval?: number;
  } = {}
) => {
  const { enabled = true, ttl = 5 * 60 * 1000, revalidateOnFocus = false, revalidateInterval } = options;

  const fetchData = useCallback(async (): Promise<T> => {
    if (!enabled) {
      throw new Error('Data fetching is disabled');
    }

    return cacheService.getOrSet(key, fetcher, ttl);
  }, [key, fetcher, ttl, enabled]);

  // إعادة تحديث البيانات عند التركيز على النافذة
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      // إعادة جلب البيانات عند التركيز
      fetchData().catch(console.error);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetchData]);

  // إعادة تحديث البيانات بفترات منتظمة
  useEffect(() => {
    if (!revalidateInterval) return;

    const interval = setInterval(() => {
      fetchData().catch(console.error);
    }, revalidateInterval);

    return () => clearInterval(interval);
  }, [revalidateInterval, fetchData]);

  return {
    fetchData,
    invalidate: () => cacheService.invalidate(key),
  };
};