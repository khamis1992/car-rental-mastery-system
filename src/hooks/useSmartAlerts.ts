import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SmartAlert {
  id: string;
  type: 'security' | 'performance' | 'database' | 'system' | 'billing' | 'tenant';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  description?: string;
  created_at: string;
  updated_at: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  source: string;
  tenant_id?: string;
  tenant_name?: string;
  metadata?: Record<string, any>;
  actions?: AlertAction[];
  auto_resolve?: boolean;
  expiry_date?: string;
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'resolve' | 'dismiss' | 'escalate' | 'custom';
  url?: string;
  confirmation?: boolean;
}

export interface SystemHealth {
  overall_score: number;
  database_health: number;
  storage_health: number;
  api_health: number;
  security_health: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  last_updated: string;
}

export interface AlertFilters {
  type?: string;
  severity?: string;
  resolved?: boolean;
  tenant_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface SmartAlertsHook {
  alerts: SmartAlert[];
  systemHealth: SystemHealth | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string, note?: string) => Promise<void>;
  escalateAlert: (alertId: string, to: string) => Promise<void>;
  getUnreadCount: () => number;
  getAlertsBySeverity: (severity: string) => SmartAlert[];
  getAlertsByType: (type: string) => SmartAlert[];
  applyFilters: (filters: AlertFilters) => void;
  refresh: () => Promise<void>;
  createAlert: (alert: Partial<SmartAlert>) => Promise<void>;
}

export const useSmartAlerts = (): SmartAlertsHook => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlertFilters>({});

  const fetchAlerts = async (currentFilters: AlertFilters = {}) => {
    try {
      let query = supabase
        .from('system_alerts')
        .select(`
          *,
          tenant:tenant_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // تطبيق الفلاتر
      if (currentFilters.type) {
        query = query.eq('type', currentFilters.type);
      }
      if (currentFilters.severity) {
        query = query.eq('severity', currentFilters.severity);
      }
      if (currentFilters.resolved !== undefined) {
        query = query.eq('resolved', currentFilters.resolved);
      }
      if (currentFilters.tenant_id) {
        query = query.eq('tenant_id', currentFilters.tenant_id);
      }
      if (currentFilters.from_date) {
        query = query.gte('created_at', currentFilters.from_date);
      }
      if (currentFilters.to_date) {
        query = query.lte('created_at', currentFilters.to_date);
      }

      const { data, error } = await query;

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      // إذا لم يكن الجدول موجوداً، إنشاء تنبيهات تجريبية
      if (!data) {
        return generateMockAlerts();
      }

      return data.map((alert: any) => ({
        ...alert,
        tenant_name: alert.tenant?.name,
        actions: generateAlertActions(alert)
      }));
    } catch (err) {
      console.error('خطأ في جلب التنبيهات:', err);
      return generateMockAlerts();
    }
  };

  const generateMockAlerts = (): SmartAlert[] => {
    return [
      {
        id: '1',
        type: 'performance',
        severity: 'high',
        title: 'استخدام مرتفع لوحدة المعالجة المركزية',
        message: 'استخدام CPU وصل إلى 85% لأكثر من 10 دقائق',
        description: 'يُنصح بمراقبة العمليات التي تستهلك موارد عالية',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        resolved: false,
        source: 'system_monitor',
        metadata: { cpu_usage: 85, threshold: 80 },
        auto_resolve: true,
        expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        actions: [
          { id: '1', label: 'عرض العمليات', type: 'custom', url: '/system/processes' },
          { id: '2', label: 'حل التنبيه', type: 'resolve', confirmation: true }
        ]
      },
      {
        id: '2',
        type: 'security',
        severity: 'medium',
        title: 'محاولات دخول مشبوهة',
        message: '5 محاولات دخول فاشلة من نفس عنوان IP خلال 5 دقائق',
        description: 'تم حظر العنوان مؤقتاً. يُنصح بمراجعة سجلات الأمان',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        resolved: false,
        source: 'auth_monitor',
        metadata: { ip: '192.168.1.100', attempts: 5 },
        actions: [
          { id: '1', label: 'عرض السجلات', type: 'custom', url: '/security/logs' },
          { id: '2', label: 'حظر IP نهائياً', type: 'custom', confirmation: true },
          { id: '3', label: 'تجاهل', type: 'dismiss' }
        ]
      },
      {
        id: '3',
        type: 'database',
        severity: 'low',
        title: 'نسخ احتياطي مجدول',
        message: 'سيتم إجراء النسخ الاحتياطي اليومي خلال ساعة واحدة',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        source: 'backup_scheduler',
        auto_resolve: true,
        expiry_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        actions: [
          { id: '1', label: 'تأجيل النسخة', type: 'custom' },
          { id: '2', label: 'بدء النسخ الآن', type: 'custom' }
        ]
      },
      {
        id: '4',
        type: 'billing',
        severity: 'medium',
        title: 'اشتراك ينتهي قريباً',
        message: 'اشتراك "شركة الخليج للنقل" ينتهي خلال 3 أيام',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        source: 'billing_monitor',
        tenant_id: 'tenant-1',
        tenant_name: 'شركة الخليج للنقل',
        metadata: { days_remaining: 3, plan: 'premium' },
        actions: [
          { id: '1', label: 'تجديد الاشتراك', type: 'custom', url: '/billing/renew/tenant-1' },
          { id: '2', label: 'إرسال تذكير', type: 'custom' },
          { id: '3', label: 'تجاهل', type: 'dismiss' }
        ]
      }
    ];
  };

  const generateAlertActions = (alert: any): AlertAction[] => {
    const actions: AlertAction[] = [];

    // الإجراءات الأساسية لجميع التنبيهات
    if (!alert.resolved) {
      actions.push({
        id: 'resolve',
        label: 'حل التنبيه',
        type: 'resolve',
        confirmation: alert.severity === 'high' || alert.severity === 'critical'
      });

      actions.push({
        id: 'dismiss',
        label: 'تجاهل',
        type: 'dismiss'
      });
    }

    // إجراءات خاصة حسب نوع التنبيه
    switch (alert.type) {
      case 'security':
        actions.push({
          id: 'escalate',
          label: 'تصعيد للأمان',
          type: 'escalate',
          confirmation: true
        });
        break;
      case 'performance':
        actions.push({
          id: 'monitor',
          label: 'مراقبة مستمرة',
          type: 'custom'
        });
        break;
      case 'billing':
        actions.push({
          id: 'contact_tenant',
          label: 'التواصل مع العميل',
          type: 'custom'
        });
        break;
    }

    return actions;
  };

  const calculateSystemHealth = (alertsList: SmartAlert[]): SystemHealth => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentAlerts = alertsList.filter(alert => 
      new Date(alert.created_at).getTime() > oneHourAgo && !alert.resolved
    );

    // حساب الدرجات بناءً على عدد وشدة التنبيهات
    let healthScore = 100;
    
    recentAlerts.forEach(alert => {
      switch (alert.severity) {
        case 'critical':
          healthScore -= 25;
          break;
        case 'high':
          healthScore -= 15;
          break;
        case 'medium':
          healthScore -= 8;
          break;
        case 'low':
          healthScore -= 3;
          break;
      }
    });

    healthScore = Math.max(0, healthScore);

    // حساب صحة النظم الفرعية
    const databaseAlerts = recentAlerts.filter(a => a.type === 'database');
    const securityAlerts = recentAlerts.filter(a => a.type === 'security');
    const performanceAlerts = recentAlerts.filter(a => a.type === 'performance');

    const database_health = Math.max(0, 100 - (databaseAlerts.length * 10));
    const security_health = Math.max(0, 100 - (securityAlerts.length * 15));
    const api_health = Math.max(0, 100 - (performanceAlerts.length * 12));
    const storage_health = 85; // قيمة ثابتة حالياً

    let status: SystemHealth['status'] = 'excellent';
    if (healthScore < 50) status = 'critical';
    else if (healthScore < 70) status = 'warning';
    else if (healthScore < 90) status = 'good';

    return {
      overall_score: healthScore,
      database_health,
      storage_health,
      api_health,
      security_health,
      status,
      last_updated: new Date().toISOString()
    };
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read_at: new Date().toISOString() } : alert
      ));
    } catch (err) {
      console.error('خطأ في تحديد التنبيه كمقروء:', err);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ 
          dismissed: true,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('خطأ في تجاهل التنبيه:', err);
    }
  };

  const resolveAlert = async (alertId: string, note?: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ 
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_note: note
        })
        .eq('id', alertId);

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolved_at: new Date().toISOString() }
          : alert
      ));
    } catch (err) {
      console.error('خطأ في حل التنبيه:', err);
    }
  };

  const escalateAlert = async (alertId: string, to: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ 
          escalated: true,
          escalated_to: to,
          escalated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      // يمكن إضافة منطق إضافي لإرسال إشعارات
    } catch (err) {
      console.error('خطأ في تصعيد التنبيه:', err);
    }
  };

  const createAlert = async (alertData: Partial<SmartAlert>) => {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .insert([{
          ...alertData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resolved: false,
          message: alertData.message || '',
          severity: alertData.severity || 'medium',
          source: alertData.source || 'system',
          title: alertData.title || '',
          type: alertData.type || 'system'
        }])
        .select()
        .single();

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      if (data) {
        setAlerts(prev => [data as unknown as SmartAlert, ...prev]);
      }
    } catch (err) {
      console.error('خطأ في إنشاء التنبيه:', err);
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const alertsData = await fetchAlerts(filters);
      setAlerts(alertsData);
      
      const health = calculateSystemHealth(alertsData);
      setSystemHealth(health);

    } catch (err) {
      console.error('خطأ في تحديث التنبيهات:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = () => {
    return alerts.filter(alert => !alert.resolved && !(alert as any).read_at).length;
  };

  const getAlertsBySeverity = (severity: string) => {
    return alerts.filter(alert => alert.severity === severity);
  };

  const getAlertsByType = (type: string) => {
    return alerts.filter(alert => alert.type === type);
  };

  const applyFilters = (newFilters: AlertFilters) => {
    setFilters(newFilters);
    setLoading(true);
    fetchAlerts(newFilters).then(alertsData => {
      setAlerts(alertsData);
      const health = calculateSystemHealth(alertsData);
      setSystemHealth(health);
      setLoading(false);
    });
  };

  // جلب البيانات عند التحميل
  useEffect(() => {
    refresh();
  }, []);

  // تحديث البيانات كل دقيقة
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [filters]);

  return {
    alerts,
    systemHealth,
    unreadCount: getUnreadCount(),
    loading,
    error,
    markAsRead,
    dismissAlert,
    resolveAlert,
    escalateAlert,
    getUnreadCount,
    getAlertsBySeverity,
    getAlertsByType,
    applyFilters,
    refresh,
    createAlert
  };
};