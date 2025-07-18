import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import AttendanceReminderPopup from './AttendanceReminderPopup';

const AttendanceReminderWrapper = () => {
  const location = useLocation();
  const { user, session } = useAuth();
  const { systemSettings } = useSettings();
  const [showAttendanceReminder, setShowAttendanceReminder] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // إخفاء التذكير في الصفحات العامة
  if (location.pathname.startsWith('/public-quotation')) {
    return null;
  }

  const checkAttendanceStatus = () => {
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
    // التحقق من تفعيل نظام الحضور أولاً
    if (!systemSettings.attendanceEnabled) {
      setShowAttendanceReminder(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // إذا كان المستخدم مسجل دخول ونظام الحضور مفعل
    if (user && session) {
      // فحص فوري للحالة
      checkAttendanceStatus();
      
      // إعداد مؤقت يعمل كل 30 دقيقة
      timerRef.current = setInterval(checkAttendanceStatus, 30 * 60 * 1000);
    }

    // تنظيف المؤقت عند تغيير التبعيات أو إلغاء تركيب المكون
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user, session, systemSettings.attendanceEnabled]);

  // إخفاء التذكير إذا تم إيقاف نظام الحضور
  useEffect(() => {
    if (!systemSettings.attendanceEnabled) {
      setShowAttendanceReminder(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [systemSettings.attendanceEnabled]);

  if (!systemSettings.attendanceEnabled) {
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