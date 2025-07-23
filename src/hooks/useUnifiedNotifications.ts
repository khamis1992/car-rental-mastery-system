
import { useMemo } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useContractMonitoring } from '@/hooks/useContractMonitoring';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';

export interface UnifiedNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'urgent' | 'high' | 'medium' | 'normal';
  category: string;
  source: 'notification' | 'alert' | 'realtime';
}

export const useUnifiedNotifications = () => {
  const { notifications, deleteNotification, markAsRead } = useNotifications();
  const { alerts, dismissAlert } = useContractMonitoring();
  const { eventHistory, health } = useUnifiedRealtime();

  // دمج جميع الإشعارات والتنبيهات
  const unifiedNotifications = useMemo(() => {
    const notificationItems: UnifiedNotification[] = notifications.map(notification => ({
      ...notification,
      source: 'notification' as const
    }));

    const alertItems: UnifiedNotification[] = alerts.map(alert => ({
      id: alert.id,
      type: alert.priority === 'urgent' ? 'error' : 'warning' as const,
      title: alert.title,
      message: alert.message,
      time: 'الآن',
      read: false,
      priority: alert.priority,
      category: 'contracts',
      source: 'alert' as const
    }));

    // إضافة تنبيهات حالة الاتصال
    const realtimeNotifications: UnifiedNotification[] = [];
    
    if (!health.isHealthy) {
      realtimeNotifications.push({
        id: 'realtime-unhealthy',
        type: 'warning',
        title: 'مشكلة في الاتصال المباشر',
        message: health.lastError || 'يوجد مشكلة في نظام التحديث المباشر',
        time: health.lastPing ? new Date(health.lastPing).toLocaleTimeString('ar-KW') : 'الآن',
        read: false,
        priority: 'high',
        category: 'system',
        source: 'realtime' as const
      });
    }

    if (health.reconnectAttempts > 0) {
      realtimeNotifications.push({
        id: 'realtime-reconnecting',
        type: 'info',
        title: 'إعادة محاولة الاتصال',
        message: `جاري إعادة محاولة الاتصال بنظام التحديث المباشر (${health.reconnectAttempts}/5)`,
        time: 'الآن',
        read: false,
        priority: 'medium',
        category: 'system',
        source: 'realtime' as const
      });
    }

    // دمج وترتيب حسب الأولوية
    const allItems = [...notificationItems, ...alertItems, ...realtimeNotifications];
    
    return allItems.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, normal: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [notifications, alerts, health]);

  // فلترة حسب الأولوية
  const getByPriority = (priority: string) => {
    return unifiedNotifications.filter(item => item.priority === priority);
  };

  // معالجة الحذف أو الإخفاء
  const handleDismiss = (notification: UnifiedNotification) => {
    if (notification.source === 'alert') {
      dismissAlert(notification.id);
    } else if (notification.source === 'notification') {
      deleteNotification(notification.id);
    }
    // realtime notifications are handled automatically
  };

  // معالجة القراءة
  const handleMarkAsRead = (notification: UnifiedNotification) => {
    if (notification.source === 'notification') {
      markAsRead(notification.id);
    }
  };

  // إحصائيات محسنة
  const stats = useMemo(() => {
    const urgent = unifiedNotifications.filter(n => n.priority === 'urgent');
    const high = unifiedNotifications.filter(n => n.priority === 'high');
    const unread = unifiedNotifications.filter(n => !n.read);
    const systemIssues = unifiedNotifications.filter(n => n.category === 'system');
    
    return {
      total: unifiedNotifications.length,
      urgent: urgent.length,
      high: high.length,
      unread: unread.length,
      criticalCount: urgent.length + high.length,
      systemIssues: systemIssues.length,
      connectionHealthy: health.isHealthy,
      recentEvents: eventHistory.length
    };
  }, [unifiedNotifications, health.isHealthy, eventHistory.length]);

  return {
    notifications: unifiedNotifications,
    getByPriority,
    handleDismiss,
    handleMarkAsRead,
    stats
  };
};
