import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  frequency: 'once' | 'daily' | 'hourly';
}

interface SmartAlert {
  id: string;
  type: 'performance' | 'security' | 'system' | 'database';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  source: string;
  actionRequired: boolean;
  autoResolve: boolean;
}

interface SystemHealth {
  overall: number;
  performance: number;
  security: number;
  database: number;
  connectivity: number;
}

export const useSmartAlerts = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 95,
    performance: 92,
    security: 98,
    database: 94,
    connectivity: 97
  });
  const [loading, setLoading] = useState(true);

  // تحليل السجلات وإنشاء تنبيهات ذكية
  const analyzeSystemLogs = async () => {
    try {
      const analyticsQuery = `
        select 
          'postgres' as source,
          event_message,
          parsed.error_severity as severity,
          postgres_logs.timestamp
        from postgres_logs
        cross join unnest(metadata) as m
        cross join unnest(m.parsed) as parsed
        where postgres_logs.timestamp > now() - interval '1 hour'
        and parsed.error_severity in ('ERROR', 'WARNING')
        
        union all
        
        select 
          'auth' as source,
          event_message,
          metadata.level as severity,
          auth_logs.timestamp
        from auth_logs
        cross join unnest(metadata) as metadata
        where auth_logs.timestamp > now() - interval '1 hour'
        and metadata.level in ('error', 'warn')
        
        order by timestamp desc
        limit 50
      `;

      const { data: logData, error } = await supabase.functions.invoke('supabase-analytics', {
        body: { query: analyticsQuery }
      });

      if (error) {
        console.error('خطأ في تحليل السجلات:', error);
        return [];
      }

      return logData || [];
    } catch (error) {
      console.error('خطأ في تحليل السجلات:', error);
      return [];
    }
  };

  // إنشاء تنبيهات ذكية بناءً على الأنماط
  const generateSmartAlerts = (logData: any[]) => {
    const newAlerts: SmartAlert[] = [];

    // تحليل أخطاء قاعدة البيانات
    const dbErrors = logData.filter(log => 
      log.source === 'postgres' && log.severity === 'ERROR'
    );

    if (dbErrors.length > 5) {
      newAlerts.push({
        id: `db-error-${Date.now()}`,
        type: 'database',
        severity: 'high',
        title: 'أخطاء متكررة في قاعدة البيانات',
        message: `تم رصد ${dbErrors.length} خطأ في قاعدة البيانات خلال الساعة الماضية`,
        timestamp: new Date().toISOString(),
        isRead: false,
        source: 'system_analyzer',
        actionRequired: true,
        autoResolve: false
      });
    }

    // تحليل مشاكل المصادقة
    const authErrors = logData.filter(log => 
      log.source === 'auth' && log.severity === 'error'
    );

    if (authErrors.length > 3) {
      newAlerts.push({
        id: `auth-error-${Date.now()}`,
        type: 'security',
        severity: 'medium',
        title: 'محاولات دخول مشبوهة',
        message: `تم رصد ${authErrors.length} محاولة دخول فاشلة`,
        timestamp: new Date().toISOString(),
        isRead: false,
        source: 'auth_monitor',
        actionRequired: true,
        autoResolve: false
      });
    }

    // تحليل الأداء
    const performanceIssues = logData.filter(log => 
      log.event_message?.includes('slow') || 
      log.event_message?.includes('timeout') ||
      log.event_message?.includes('connection')
    );

    if (performanceIssues.length > 10) {
      newAlerts.push({
        id: `perf-issue-${Date.now()}`,
        type: 'performance',
        severity: 'medium',
        title: 'انخفاض في أداء النظام',
        message: `تم رصد ${performanceIssues.length} مشكلة أداء محتملة`,
        timestamp: new Date().toISOString(),
        isRead: false,
        source: 'performance_monitor',
        actionRequired: false,
        autoResolve: true
      });
    }

    return newAlerts;
  };

  // حساب صحة النظام
  const calculateSystemHealth = (logData: any[]) => {
    const errorCount = logData.filter(log => log.severity === 'ERROR' || log.severity === 'error').length;
    const warningCount = logData.filter(log => log.severity === 'WARNING' || log.severity === 'warn').length;
    
    // حساب النقاط بناءً على الأخطاء والتحذيرات
    let performance = Math.max(50, 100 - (errorCount * 5) - (warningCount * 2));
    let database = Math.max(60, 100 - (errorCount * 3));
    let security = Math.max(70, 100 - (errorCount * 4));
    let connectivity = Math.max(80, 100 - (errorCount * 2));
    
    const overall = Math.round((performance + database + security + connectivity) / 4);

    return {
      overall,
      performance,
      security,
      database,
      connectivity
    };
  };

  // تحديث التنبيهات والصحة العامة
  const updateAlertsAndHealth = async () => {
    try {
      setLoading(true);
      
      const logData = await analyzeSystemLogs();
      const newAlerts = generateSmartAlerts(logData);
      const healthMetrics = calculateSystemHealth(logData);

      // إضافة تنبيه إيجابي إذا لم توجد مشاكل
      if (newAlerts.length === 0) {
        newAlerts.push({
          id: `system-ok-${Date.now()}`,
          type: 'system',
          severity: 'low',
          title: 'النظام يعمل بكفاءة',
          message: 'جميع الخدمات تعمل بشكل طبيعي ولا توجد مشاكل مكتشفة',
          timestamp: new Date().toISOString(),
          isRead: false,
          source: 'system_monitor',
          actionRequired: false,
          autoResolve: true
        });
      }

      setAlerts(prev => [...newAlerts, ...prev.slice(0, 20)]); // الاحتفاظ بـ 20 تنبيه فقط
      setSystemHealth(healthMetrics);
      
    } catch (error) {
      console.error('خطأ في تحديث التنبيهات:', error);
    } finally {
      setLoading(false);
    }
  };

  // وضع علامة قراءة على التنبيه
  const markAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  // حذف التنبيه
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // الحصول على عدد التنبيهات غير المقروءة
  const getUnreadCount = () => {
    return alerts.filter(alert => !alert.isRead).length;
  };

  // الحصول على التنبيهات حسب الشدة
  const getAlertsBySeverity = (severity: 'low' | 'medium' | 'high') => {
    return alerts.filter(alert => alert.severity === severity);
  };

  useEffect(() => {
    updateAlertsAndHealth();
    
    // تحديث كل دقيقتين
    const interval = setInterval(updateAlertsAndHealth, 120000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    alertRules,
    systemHealth,
    loading,
    markAsRead,
    dismissAlert,
    getUnreadCount,
    getAlertsBySeverity,
    refresh: updateAlertsAndHealth
  };
};