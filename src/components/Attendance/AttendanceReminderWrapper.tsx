import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useSettings } from '@/contexts/SettingsContext';
import AttendanceReminderPopup from './AttendanceReminderPopup';

const AttendanceReminderWrapper = () => {
  const location = useLocation();
  const { user, session, isSaasAdmin } = useAuth();
  const { currentTenant, currentUserRole, loading: tenantLoading } = useTenant();
  const { systemSettings } = useSettings();
  const [showAttendanceReminder, setShowAttendanceReminder] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // إخفاء التذكير في الصفحات العامة
  if (location.pathname.startsWith('/public-quotation')) {
    return null;
  }

  // إخفاء التذكير للمستخدمين الذين ليسوا من مؤسسة
  const shouldShowAttendanceReminder = () => {
    // التحقق من أن المستخدم مسجل دخول
    if (!user || !session) {
      return false;
    }

    // إخفاء التذكير لـ Super Admin
    if (isSaasAdmin) {
      return false;
    }

    // التحقق من وجود مؤسسة حالية ودور المستخدم
    if (!currentTenant || !currentUserRole) {
      return false;
    }

    // التحقق من أن المستخدم له دور صالح في المؤسسة
    const validTenantRoles = ['tenant_admin', 'manager', 'accountant', 'technician', 'receptionist'];
    if (!validTenantRoles.includes(currentUserRole)) {
      return false;
    }

    // التحقق من تفعيل نظام الحضور
    if (!systemSettings.attendanceEnabled) {
      return false;
    }

    return true;
  };

  const checkAttendanceStatus = () => {
    // التحقق من الشروط الأساسية أولاً
    if (!shouldShowAttendanceReminder()) {
      setShowAttendanceReminder(false);
      return;
    }

    const today = new Date().toDateString();
    const lastCheckIn = localStorage.getItem('lastCheckInDate');
    const lastReminderShown = localStorage.getItem('lastAttendanceReminderShown');
    const now = Date.now();
    
    // إذا تم تسجيل الحضور اليوم، لا تظهر التذكير
    if (lastCheckIn === today) {
      setShowAttendanceReminder(false);
      return;
    }
    
    // إذا لم يتم عرض التذكير من قبل أو مر 30 دقيقة على آخر عرض
    const thirtyMinutes = 30 * 60 * 1000;
    if (!lastReminderShown || (now - parseInt(lastReminderShown)) >= thirtyMinutes) {
      setShowAttendanceReminder(true);
      localStorage.setItem('lastAttendanceReminderShown', now.toString());
    }
  };

  useEffect(() => {
    // انتظار تحميل بيانات المؤسسة أولاً
    if (tenantLoading) {
      return;
    }

    // التحقق من الشروط الأساسية
    if (!shouldShowAttendanceReminder()) {
      setShowAttendanceReminder(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // فحص فوري للحالة
    checkAttendanceStatus();
    
    // إعداد مؤقت يعمل كل 30 دقيقة
    timerRef.current = setInterval(checkAttendanceStatus, 30 * 60 * 1000);

    // تنظيف المؤقت عند تغيير التبعيات أو إلغاء تركيب المكون
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user, session, currentTenant, currentUserRole, systemSettings.attendanceEnabled, tenantLoading, isSaasAdmin]);

  // إخفاء التذكير إذا تم إيقاف نظام الحضور أو تغيرت الشروط
  useEffect(() => {
    if (!shouldShowAttendanceReminder()) {
      setShowAttendanceReminder(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [systemSettings.attendanceEnabled, currentTenant, currentUserRole, isSaasAdmin]);

  // عدم عرض أي شيء إذا لم تتحقق الشروط الأساسية
  if (!shouldShowAttendanceReminder()) {
    return null;
  }

  return (
    <AttendanceReminderPopup 
      isOpen={showAttendanceReminder}
      onClose={() => setShowAttendanceReminder(false)}
    />
  );
};

export default AttendanceReminderWrapper;