import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';

interface ContractAlert {
  id: string;
  type: 'expiring_today' | 'expiring_soon' | 'overdue' | 'maintenance_due' | 'insurance_expiring';
  title: string;
  message: string;
  contractId?: string;
  vehicleId?: string;
  priority: 'urgent' | 'high' | 'medium' | 'normal';
  data?: any;
}

export const useContractMonitoring = () => {
  const [alerts, setAlerts] = useState<ContractAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const { addNotification } = useNotifications();

  const checkContractAlerts = useCallback(async (forceRefresh = false) => {
    // تجنب الاستعلامات المكررة إذا تم الفحص مؤخراً
    const now = new Date();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق
    
    if (!forceRefresh && lastCheckTime && (now.getTime() - lastCheckTime.getTime()) < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // العقود المنتهية اليوم
      const { data: expiringToday } = await supabase
        .from('contracts')
        .select(`
          id, contract_number, end_date,
          customers(name),
          vehicles(make, model, vehicle_number)
        `)
        .eq('end_date', today)
        .eq('status', 'active');

      // العقود المنتهية قريباً (خلال أسبوع)
      const { data: expiringSoon } = await supabase
        .from('contracts')
        .select(`
          id, contract_number, end_date,
          customers(name),
          vehicles(make, model, vehicle_number)
        `)
        .gt('end_date', today)
        .lte('end_date', nextWeek)
        .eq('status', 'active');

      // العقود المتأخرة
      const { data: overdue } = await supabase
        .from('contracts')
        .select(`
          id, contract_number, end_date,
          customers(name),
          vehicles(make, model, vehicle_number)
        `)
        .lt('end_date', today)
        .eq('status', 'active');

      // المركبات التي تحتاج صيانة
      const { data: maintenanceDue } = await supabase
        .from('vehicles')
        .select(`
          id, make, model, vehicle_number, next_maintenance_due
        `)
        .lte('next_maintenance_due', nextWeek)
        .eq('status', 'available');

      // التأمينات المنتهية قريباً
      const { data: insuranceExpiring } = await supabase
        .from('vehicles')
        .select(`
          id, make, model, vehicle_number, insurance_expiry
        `)
        .lte('insurance_expiry', nextWeek);

      const newAlerts: ContractAlert[] = [];

      // معالجة العقود المنتهية اليوم
      expiringToday?.forEach((contract: any) => {
        const alert: ContractAlert = {
          id: `expiring_today_${contract.id}`,
          type: 'expiring_today',
          title: 'عقد ينتهي اليوم',
          message: `عقد العميل ${contract.customers?.name} (${contract.contract_number}) ينتهي اليوم`,
          contractId: contract.id,
          priority: 'urgent',
          data: contract
        };
        newAlerts.push(alert);

        // إرسال إشعار فوري
        addNotification({
          type: 'warning',
          title: alert.title,
          message: alert.message,
          priority: 'urgent',
          category: 'contracts'
        });
      });

      // معالجة العقود المنتهية قريباً
      expiringSoon?.forEach((contract: any) => {
        const daysLeft = Math.ceil((new Date(contract.end_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
        const alert: ContractAlert = {
          id: `expiring_soon_${contract.id}`,
          type: 'expiring_soon',
          title: 'عقد ينتهي قريباً',
          message: `عقد العميل ${contract.customers?.name} (${contract.contract_number}) ينتهي خلال ${daysLeft} أيام`,
          contractId: contract.id,
          priority: daysLeft <= 3 ? 'high' : 'medium',
          data: contract
        };
        newAlerts.push(alert);
      });

      // معالجة العقود المتأخرة
      overdue?.forEach((contract: any) => {
        const daysOverdue = Math.ceil((new Date(today).getTime() - new Date(contract.end_date).getTime()) / (1000 * 60 * 60 * 24));
        const alert: ContractAlert = {
          id: `overdue_${contract.id}`,
          type: 'overdue',
          title: 'عقد متأخر',
          message: `عقد العميل ${contract.customers?.name} (${contract.contract_number}) متأخر بـ ${daysOverdue} أيام`,
          contractId: contract.id,
          priority: 'urgent',
          data: contract
        };
        newAlerts.push(alert);

        // إرسال إشعار فوري للعقود المتأخرة
        addNotification({
          type: 'error',
          title: alert.title,
          message: alert.message,
          priority: 'urgent',
          category: 'contracts'
        });
      });

      // معالجة المركبات التي تحتاج صيانة
      maintenanceDue?.forEach((vehicle: any) => {
        const alert: ContractAlert = {
          id: `maintenance_${vehicle.id}`,
          type: 'maintenance_due',
          title: 'صيانة مطلوبة',
          message: `المركبة ${vehicle.make} ${vehicle.model} (${vehicle.vehicle_number}) تحتاج صيانة`,
          vehicleId: vehicle.id,
          priority: 'high',
          data: vehicle
        };
        newAlerts.push(alert);
      });

      // معالجة التأمينات المنتهية
      insuranceExpiring?.forEach((vehicle: any) => {
        const daysLeft = Math.ceil((new Date(vehicle.insurance_expiry).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
        const alert: ContractAlert = {
          id: `insurance_${vehicle.id}`,
          type: 'insurance_expiring',
          title: 'تأمين ينتهي قريباً',
          message: `تأمين المركبة ${vehicle.make} ${vehicle.model} (${vehicle.vehicle_number}) ينتهي خلال ${daysLeft} أيام`,
          vehicleId: vehicle.id,
          priority: daysLeft <= 3 ? 'urgent' : 'high',
          data: vehicle
        };
        newAlerts.push(alert);
      });

      setAlerts(newAlerts);
      setLastCheckTime(now);
    } catch (error) {
      console.error('Error checking contract alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [lastCheckTime, addNotification]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const getAlertsByPriority = useCallback(() => {
    const urgent = alerts.filter(alert => alert.priority === 'urgent');
    const high = alerts.filter(alert => alert.priority === 'high');
    const medium = alerts.filter(alert => alert.priority === 'medium');
    const normal = alerts.filter(alert => alert.priority === 'normal');

    return { urgent, high, medium, normal };
  }, [alerts]);

  useEffect(() => {
    checkContractAlerts(true); // فحص أولي فوري

    // تحديث التنبيهات كل 5 دقائق
    const interval = setInterval(() => checkContractAlerts(true), 5 * 60 * 1000);

    // تحديث عند تغيير التاريخ
    const checkAtMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        checkContractAlerts();
        setInterval(checkContractAlerts, 24 * 60 * 60 * 1000); // كل 24 ساعة
      }, msUntilMidnight);
    };

    checkAtMidnight();

    return () => {
      clearInterval(interval);
    };
  }, [checkContractAlerts]);

  return {
    alerts,
    loading,
    checkContractAlerts,
    dismissAlert,
    getAlertsByPriority,
    totalAlerts: alerts.length,
    urgentCount: alerts.filter(a => a.priority === 'urgent').length,
    highCount: alerts.filter(a => a.priority === 'high').length,
    lastCheckTime
  };
};