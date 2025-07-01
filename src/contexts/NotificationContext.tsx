import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'urgent' | 'high' | 'medium' | 'normal';
  category: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  showToast: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'warning',
      title: 'عقد ينتهي اليوم',
      message: 'عقد العميل أحمد محمد (CON000001) ينتهي اليوم في تمام الساعة 5:00 مساءً',
      time: '5 دقائق مضت',
      read: false,
      priority: 'high',
      category: 'contracts'
    },
    {
      id: '2',
      type: 'error',
      title: 'صيانة مطلوبة بشكل عاجل',
      message: 'السيارة كامري 2023 (VEH0001) تحتاج صيانة عاجلة',
      time: '15 دقيقة مضت',
      read: false,
      priority: 'urgent',
      category: 'maintenance'
    },
    {
      id: '3',
      type: 'info',
      title: 'عميل جديد',
      message: 'تم تسجيل عميل جديد: فاطمة علي',
      time: '30 دقيقة مضت',
      read: true,
      priority: 'normal',
      category: 'customers'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: 'الآن',
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast for high priority notifications
    if (notification.priority === 'urgent' || notification.priority === 'high') {
      showToast(notification);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showToast = (notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
  };

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be replaced with real WebSocket or Supabase real-time in production
      const randomNotifications = [
        {
          type: 'info' as const,
          title: 'تذكير',
          message: 'لديك 3 عقود تنتهي غداً',
          priority: 'normal' as const,
          category: 'contracts'
        },
        {
          type: 'warning' as const,
          title: 'صيانة مجدولة',
          message: 'السيارة سونتا 2022 لها موعد صيانة غداً',
          priority: 'medium' as const,
          category: 'maintenance'
        }
      ];

      // Randomly add a notification every 2 minutes (for demo purposes)
      if (Math.random() < 0.3) {
        const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
        addNotification(randomNotification);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      showToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};