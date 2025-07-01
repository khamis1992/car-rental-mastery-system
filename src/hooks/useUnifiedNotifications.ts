import { useMemo } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useContractMonitoring } from '@/hooks/useContractMonitoring';

export interface UnifiedNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'urgent' | 'high' | 'medium' | 'normal';
  category: string;
  source: 'notification' | 'alert';
}

export const useUnifiedNotifications = () => {
  const { notifications, deleteNotification, markAsRead } = useNotifications();
  const { alerts, dismissAlert } = useContractMonitoring();

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

    // دمج وترتيب حسب الأولوية
    const allItems = [...notificationItems, ...alertItems];
    
    return allItems.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, normal: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [notifications, alerts]);

  // فلترة حسب الأولوية
  const getByPriority = (priority: string) => {
    return unifiedNotifications.filter(item => item.priority === priority);
  };

  // معالجة الحذف أو الإخفاء
  const handleDismiss = (notification: UnifiedNotification) => {
    if (notification.source === 'alert') {
      dismissAlert(notification.id);
    } else {
      deleteNotification(notification.id);
    }
  };

  // معالجة القراءة
  const handleMarkAsRead = (notification: UnifiedNotification) => {
    if (notification.source === 'notification') {
      markAsRead(notification.id);
    }
  };

  // إحصائيات
  const stats = useMemo(() => {
    const urgent = unifiedNotifications.filter(n => n.priority === 'urgent');
    const high = unifiedNotifications.filter(n => n.priority === 'high');
    const unread = unifiedNotifications.filter(n => !n.read);
    
    return {
      total: unifiedNotifications.length,
      urgent: urgent.length,
      high: high.length,
      unread: unread.length,
      criticalCount: urgent.length + high.length
    };
  }, [unifiedNotifications]);

  return {
    notifications: unifiedNotifications,
    getByPriority,
    handleDismiss,
    handleMarkAsRead,
    stats
  };
};