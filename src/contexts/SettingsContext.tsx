import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SystemSettings {
  defaultCurrency: string;
  timeZone: string;
  dateFormat: string;
  language: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  attendanceEnabled: boolean;
}

interface SettingsContextType {
  systemSettings: SystemSettings;
  updateSystemSettings: (field: string, value: any) => void;
  settings: SystemSettings; // Add this for compatibility
}

const defaultSettings: SystemSettings = {
  defaultCurrency: 'KWD',
  timeZone: 'Asia/Kuwait',
  dateFormat: 'gregorian', // تم تغيير النظام إلى التاريخ الميلادي كافتراضي
  language: 'ar',
  emailNotifications: true,
  smsNotifications: false,
  maintenanceMode: false,
  attendanceEnabled: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSettings);

  const updateSystemSettings = (field: string, value: any) => {
    setSystemSettings(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  return (
    <SettingsContext.Provider value={{
      systemSettings,
      updateSystemSettings,
      settings: systemSettings // Add this for compatibility
    }}>
      {children}
    </SettingsContext.Provider>
  );
};