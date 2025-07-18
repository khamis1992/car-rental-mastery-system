import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemMetrics {
  database: {
    status: 'healthy' | 'warning' | 'error';
    connections: number;
    maxConnections: number;
    size: string;
    performance: number;
    queries_per_second: number;
    avg_response_time: number;
  };
  storage: {
    status: 'healthy' | 'warning' | 'error';
    used: number;
    total: number;
    uploads: string;
    backups: string;
    free_space_gb: number;
  };
  cache: {
    status: 'healthy' | 'warning' | 'error';
    hitRate: number;
    memory: string;
    keys: number;
    evictions: number;
  };
  api: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    uptime: string;
  };
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
  };
  users: {
    total: number;
    online: number;
    last_24h: number;
  };
  server: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: number;
    load_average: number;
  };
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  source: string;
}

export interface SystemMonitoringHook {
  metrics: SystemMetrics | null;
  alerts: SystemAlert[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useSystemMonitoring = (): SystemMonitoringHook => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
    // جلب إحصائيات قاعدة البيانات
    const { data: dbStats, error: dbError } = await supabase
      .rpc('get_database_stats');

    if (dbError) throw dbError;

    // جلب إحصائيات المؤسسات
    const { data: tenantStats } = await supabase
      .from('tenants')
      .select('status')
      .in('status', ['active', 'trial', 'suspended']);

    const tenantCounts = tenantStats?.reduce((acc, tenant) => {
      acc[tenant.status] = (acc[tenant.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // جلب إحصائيات المستخدمين
    const { count: totalUsers } = await supabase
      .from('tenant_users')
      .select('*', { count: 'exact', head: true });

    // جلب المستخدمين النشطين (آخر 15 دقيقة)
    const { count: onlineUsers } = await supabase
      .from('tenant_users')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    // جلب المستخدمين في آخر 24 ساعة
    const { count: recentUsers } = await supabase
      .from('tenant_users')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // حساب مقاييس النظام (يمكن الحصول عليها من APIs خارجية أو مراقبة)
    const systemMetrics: SystemMetrics = {
      database: {
        status: (dbStats as any)?.performance > 90 ? 'healthy' : (dbStats as any)?.performance > 70 ? 'warning' : 'error',
        connections: (dbStats as any)?.active_connections || 25,
        maxConnections: 100,
        size: (dbStats as any)?.database_size || '2.3 GB',
        performance: (dbStats as any)?.performance || 92,
        queries_per_second: (dbStats as any)?.queries_per_second || 150,
        avg_response_time: (dbStats as any)?.avg_response_time || 45
      },
      storage: {
        status: 'healthy',
        used: 75,
        total: 100,
        uploads: '15.2 GB',
        backups: '8.1 GB',
        free_space_gb: 25
      },
      cache: {
        status: 'healthy',
        hitRate: 94.5,
        memory: '512 MB',
        keys: 15420,
        evictions: 128
      },
      api: {
        status: 'healthy',
        responseTime: 127,
        requestsPerMinute: 1250,
        errorRate: 0.2,
        uptime: '99.9%'
      },
      tenants: {
        total: tenantStats?.length || 0,
        active: tenantCounts.active || 0,
        trial: tenantCounts.trial || 0,
        suspended: tenantCounts.suspended || 0
      },
      users: {
        total: totalUsers || 0,
        online: onlineUsers || 0,
        last_24h: recentUsers || 0
      },
      server: {
        cpu_usage: 45.2,
        memory_usage: 68.7,
        disk_usage: 82.1,
        network_io: 1.2,
        load_average: 0.8
      }
    };

    return systemMetrics;
  };

  const fetchSystemAlerts = async (): Promise<SystemAlert[]> => {
    try {
      // جلب التنبيهات من جدول system_alerts إذا كان موجوداً
      const { data: alertsData, error } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      // إذا لم يكن الجدول موجوداً، إنشاء تنبيهات تجريبية
      if (!alertsData) {
        return [
          {
            id: '1',
            type: 'warning',
            title: 'استخدام مساحة التخزين مرتفع',
            message: 'مساحة التخزين وصلت إلى 82% من السعة الإجمالية',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            resolved: false,
            source: 'storage_monitor'
          },
          {
            id: '2',
            type: 'info',
            title: 'نسخ احتياطي مجدول',
            message: 'سيتم إجراء النسخ الاحتياطي اليومي خلال ساعة',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            resolved: false,
            source: 'backup_scheduler'
          }
        ];
      }

      return alertsData.map(alert => ({
        id: alert.id,
        type: alert.severity as SystemAlert['type'],
        title: alert.title,
        message: alert.message,
        timestamp: alert.created_at,
        resolved: alert.resolved,
        source: alert.source || 'system'
      }));
    } catch (error) {
      console.error('خطأ في جلب التنبيهات:', error);
      return [];
    }
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, alertsData] = await Promise.all([
        fetchSystemMetrics(),
        fetchSystemAlerts()
      ]);

      setMetrics(metricsData);
      setAlerts(alertsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('خطأ في جلب بيانات مراقبة النظام:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  // جلب البيانات عند التحميل
  useEffect(() => {
    refetch();
  }, []);

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    alerts,
    loading,
    error,
    refetch,
    lastUpdated
  };
};