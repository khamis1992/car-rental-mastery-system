import { useEffect, useState, useCallback } from 'react';
import { orchestrationContainer } from '@/services/Orchestration/OrchestrationContainer';
import { AccountingNotification } from '@/services/Orchestration/RealTimeAccountingNotificationSystem';
import { toast } from 'sonner';

export interface UseRealTimeAccountingNotificationsOptions {
  enableToasts?: boolean;
  filterEventTypes?: string[];
}

export const useRealTimeAccountingNotifications = (
  options: UseRealTimeAccountingNotificationsOptions = {}
) => {
  const [notifications, setNotifications] = useState<AccountingNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { enableToasts = true, filterEventTypes } = options;

  const addNotification = useCallback((notification: AccountingNotification) => {
    // Filter by event types if specified
    if (filterEventTypes && !filterEventTypes.includes(notification.type)) {
      return;
    }

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50

    // Show toast notification if enabled
    if (enableToasts) {
      const title = getNotificationTitle(notification.type);
      const description = notification.data.description || 
        `${notification.data.entityType} - ${notification.data.entityId.substring(0, 8)}...`;

      switch (notification.type) {
        case 'journal_entry_created':
          toast.success(title, { description });
          break;
        case 'balance_updated':
          toast.info(title, { description });
          break;
        case 'transaction_processed':
          toast.success(title, { description });
          break;
        case 'error_occurred':
          toast.error(title, { description });
          break;
        default:
          toast(title, { description });
      }
    }
  }, [enableToasts, filterEventTypes]);

  useEffect(() => {
    const realTimeSystem = orchestrationContainer.getRealTimeNotificationSystem();
    
    // Subscribe to all notification types
    const subscriptions = [
      realTimeSystem.subscribe('journal_entry_created', addNotification),
      realTimeSystem.subscribe('balance_updated', addNotification),
      realTimeSystem.subscribe('transaction_processed', addNotification),
      realTimeSystem.subscribe('error_occurred', addNotification)
    ];

    setIsConnected(true);

    return () => {
      // Cleanup subscriptions
      subscriptions.forEach(subId => {
        // Note: We'd need to implement unsubscribe by ID in the notification system
        console.log('Cleaning up subscription:', subId);
      });
      setIsConnected(false);
    };
  }, [addNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  return {
    notifications,
    isConnected,
    clearNotifications,
    getNotificationsByType,
    totalCount: notifications.length,
    unreadCount: notifications.length // Could be enhanced with read/unread status
  };
};

function getNotificationTitle(type: string): string {
  switch (type) {
    case 'journal_entry_created':
      return '🧾 تم إنشاء قيد محاسبي';
    case 'balance_updated':
      return '💰 تم تحديث الرصيد';
    case 'transaction_processed':
      return '✅ تمت معالجة المعاملة';
    case 'error_occurred':
      return '❌ حدث خطأ';
    default:
      return '📢 إشعار محاسبي';
  }
}