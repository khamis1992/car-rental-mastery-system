import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load initial notifications
    loadInitialNotifications();

    // Set up real-time listeners
    const channel = supabase
      .channel('notifications-listener')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts'
        },
        (payload) => {
          handleContractChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload) => {
          handleInvoiceChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'traffic_violations'
        },
        (payload) => {
          handleViolationChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadInitialNotifications = async () => {
    try {
      const currentNotifications: Notification[] = [];
      
      // Check for contracts ending soon
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);

      const { data: endingContracts } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          end_date,
          customers(name)
        `)
        .eq('status', 'active')
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', threeDaysFromNow.toISOString().split('T')[0]);

      if (endingContracts) {
        endingContracts.forEach(contract => {
          const daysUntilEnd = Math.ceil(
            (new Date(contract.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          currentNotifications.push({
            id: `contract-ending-${contract.id}`,
            type: daysUntilEnd <= 1 ? 'error' : 'warning',
            title: 'عقد ينتهي قريباً',
            message: `عقد ${contract.contract_number} للعميل ${contract.customers?.name} ينتهي خلال ${daysUntilEnd} ${daysUntilEnd === 1 ? 'يوم' : 'أيام'}`,
            time: 'الآن',
            read: false,
            priority: daysUntilEnd <= 1 ? 'urgent' : 'high',
            category: 'contracts'
          });
        });
      }

      // Check for overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          due_date,
          outstanding_amount,
          customers(name)
        `)
        .eq('status', 'overdue')
        .gt('outstanding_amount', 0);

      if (overdueInvoices) {
        overdueInvoices.forEach(invoice => {
          currentNotifications.push({
            id: `invoice-overdue-${invoice.id}`,
            type: 'error',
            title: 'فاتورة متأخرة السداد',
            message: `الفاتورة ${invoice.invoice_number} للعميل ${invoice.customers?.name} متأخرة السداد بمبلغ ${invoice.outstanding_amount} د.ك`,
            time: 'الآن',
            read: false,
            priority: 'urgent',
            category: 'invoicing'
          });
        });
      }

      // Check for unpaid violations
      const { data: unpaidViolations } = await supabase
        .from('traffic_violations')
        .select(`
          id,
          violation_number,
          total_amount,
          customers(name)
        `)
        .eq('payment_status', 'unpaid')
        .lt('violation_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (unpaidViolations) {
        unpaidViolations.forEach(violation => {
          currentNotifications.push({
            id: `violation-unpaid-${violation.id}`,
            type: 'warning',
            title: 'مخالفة غير مسددة',
            message: `المخالفة ${violation.violation_number} للعميل ${violation.customers?.name} غير مسددة بمبلغ ${violation.total_amount} د.ك`,
            time: 'الآن',
            read: false,
            priority: 'medium',
            category: 'violations'
          });
        });
      }

      setNotifications(currentNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleContractChange = (payload: any) => {
    if (payload.eventType === 'UPDATE' && payload.new.status === 'active') {
      const endDate = new Date(payload.new.end_date);
      const today = new Date();
      const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilEnd <= 3 && daysUntilEnd >= 0) {
        const notification: Notification = {
          id: `contract-ending-${payload.new.id}`,
          type: daysUntilEnd <= 1 ? 'error' : 'warning',
          title: 'عقد ينتهي قريباً',
          message: `عقد ${payload.new.contract_number} ينتهي خلال ${daysUntilEnd} ${daysUntilEnd === 1 ? 'يوم' : 'أيام'}`,
          time: 'الآن',
          read: false,
          priority: daysUntilEnd <= 1 ? 'urgent' : 'high',
          category: 'contracts'
        };

        addFullNotification(notification);
      }
    }
  };

  const handleInvoiceChange = (payload: any) => {
    if (payload.eventType === 'UPDATE' && payload.new.status === 'overdue') {
      const notification: Notification = {
        id: `invoice-overdue-${payload.new.id}`,
        type: 'error',
        title: 'فاتورة متأخرة السداد',
        message: `الفاتورة ${payload.new.invoice_number} متأخرة السداد`,
        time: 'الآن',
        read: false,
        priority: 'urgent',
        category: 'invoicing'
      };

      addFullNotification(notification);
    }
  };

  const handleViolationChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      const notification: Notification = {
        id: `violation-new-${payload.new.id}`,
        type: 'info',
        title: 'مخالفة مرورية جديدة',
        message: `تم تسجيل مخالفة جديدة رقم ${payload.new.violation_number}`,
        time: 'الآن',
        read: false,
        priority: 'medium',
        category: 'violations'
      };

      addFullNotification(notification);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: 'الآن',
      read: false
    };
    
    addFullNotification(newNotification);
  };

  const addFullNotification = (notification: Notification) => {
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;

      const newNotifications = [notification, ...prev];
      
      // Show toast for high priority notifications
      if (notification.priority === 'urgent' || notification.priority === 'high') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
        });
      }

      return newNotifications;
    });
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadInitialNotifications
  };
};