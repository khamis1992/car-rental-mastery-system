import { useState, useEffect } from 'react';
import { MaintenanceBusinessService, MaintenanceRecord } from '@/services/BusinessServices/MaintenanceBusinessService';

export const useMaintenanceData = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const maintenanceService = new MaintenanceBusinessService();

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await maintenanceService.getAllMaintenance();
      setMaintenanceRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب بيانات الصيانة');
      console.error('Error fetching maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createMaintenance = async (maintenanceData: any) => {
    try {
      const newRecord = await maintenanceService.createMaintenance(maintenanceData);
      setMaintenanceRecords(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في إنشاء سجل الصيانة';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateMaintenance = async (id: string, updates: Partial<MaintenanceRecord>) => {
    try {
      const updatedRecord = await maintenanceService.updateMaintenance(id, updates);
      setMaintenanceRecords(prev => 
        prev.map(record => record.id === id ? updatedRecord : record)
      );
      return updatedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في تحديث سجل الصيانة';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteMaintenance = async (id: string) => {
    try {
      await maintenanceService.deleteMaintenance(id);
      setMaintenanceRecords(prev => prev.filter(record => record.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في حذف سجل الصيانة';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getMaintenanceStats = async () => {
    try {
      return await maintenanceService.getMaintenanceStats();
    } catch (err) {
      console.error('Error fetching maintenance stats:', err);
      return {
        totalRecords: 0,
        completedRecords: 0,
        totalCost: 0,
        averageCost: 0
      };
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  return {
    maintenanceRecords,
    loading,
    error,
    refetch: fetchMaintenanceData,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
    getMaintenanceStats
  };
};