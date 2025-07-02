import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import AttendanceReminderPopup from './AttendanceReminderPopup';

const AttendanceReminderWrapper = () => {
  const { user, session } = useAuth();
  const { systemSettings } = useSettings();
  const [showAttendanceReminder, setShowAttendanceReminder] = useState(false);

  useEffect(() => {
    // التحقق من تفعيل نظام الحضور أولاً
    if (!systemSettings.attendanceEnabled) {
      setShowAttendanceReminder(false);
      return;
    }

    // إظهار التذكير فقط إذا كان المستخدم مسجل دخول ونظام الحضور مفعل
    if (user && session) {
      const today = new Date().toDateString();
      const lastCheckIn = localStorage.getItem('lastCheckInDate');
      
      if (lastCheckIn !== today) {
        setShowAttendanceReminder(true);
      }
    }
  }, [user, session, systemSettings.attendanceEnabled]);

  // إخفاء التذكير إذا تم إيقاف نظام الحضور
  useEffect(() => {
    if (!systemSettings.attendanceEnabled) {
      setShowAttendanceReminder(false);
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