import { supabase } from '@/integrations/supabase/client';
import { UserHelperService } from './UserHelperService';
import { AccountingIntegrationService } from './AccountingIntegrationService';

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  cost?: number;
  mileage_at_service?: number;
  scheduled_date?: string;
  completed_date?: string;
  next_service_date?: string;
  service_provider?: string;
  invoice_number?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MaintenanceFormData {
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  cost?: number;
  mileage_at_service?: number;
  scheduled_date?: string;
  service_provider?: string;
  notes?: string;
}

export class MaintenanceBusinessService {
  private accountingService: AccountingIntegrationService;

  constructor() {
    this.accountingService = new AccountingIntegrationService();
  }

  async getAllMaintenance(): Promise<MaintenanceRecord[]> {
    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMaintenanceById(id: string): Promise<MaintenanceRecord | null> {
    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createMaintenance(maintenanceData: MaintenanceFormData): Promise<MaintenanceRecord> {
    try {
      this.validateMaintenanceData(maintenanceData);
      
      // Get current user's employee ID
      const employeeId = await UserHelperService.getCurrentUserEmployeeId();
      
      const { data: maintenance, error } = await supabase
        .from('vehicle_maintenance')
        .insert({
          ...maintenanceData,
          status: 'pending',
          created_by: employeeId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating maintenance record:', error);
        throw new Error(`فشل في إنشاء سجل الصيانة: ${error.message}`);
      }

      // إنشاء القيد المحاسبي للصيانة عند اكتمالها
      if (maintenance.status === 'completed' && maintenance.cost) {
        try {
          const vehicleInfo = await this.getVehicleInfo(maintenance.vehicle_id);
          await this.accountingService.createMaintenanceAccountingEntry(maintenance.id, {
            vehicle_info: vehicleInfo,
            maintenance_type: maintenance.maintenance_type,
            cost: maintenance.cost,
            maintenance_date: maintenance.completed_date || maintenance.scheduled_date || maintenance.created_at,
            vendor_name: maintenance.service_provider || 'غير محدد'
          });
        } catch (error) {
          console.warn('Failed to create accounting entry for maintenance:', error);
        }
      }

      return maintenance;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw new Error(`فشل في إنشاء سجل الصيانة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  async updateMaintenance(id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const existingMaintenance = await this.getMaintenanceById(id);
    if (!existingMaintenance) {
      throw new Error('Maintenance record not found');
    }

    const { data: maintenance, error } = await supabase
      .from('vehicle_maintenance')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // إنشاء القيد المحاسبي عند تحديث الحالة إلى مكتملة
    if (updates.status === 'completed' && existingMaintenance.status !== 'completed' && maintenance.cost) {
      try {
        const vehicleInfo = await this.getVehicleInfo(maintenance.vehicle_id);
        await this.accountingService.createMaintenanceAccountingEntry(maintenance.id, {
          vehicle_info: vehicleInfo,
          maintenance_type: maintenance.maintenance_type,
          cost: maintenance.cost,
          maintenance_date: maintenance.completed_date || maintenance.scheduled_date || maintenance.created_at,
          vendor_name: maintenance.service_provider || 'غير محدد'
        });
      } catch (error) {
        console.warn('Failed to create accounting entry for maintenance:', error);
      }
    }

    return maintenance;
  }

  async deleteMaintenance(id: string): Promise<void> {
    const maintenance = await this.getMaintenanceById(id);
    if (!maintenance) {
      throw new Error('Maintenance record not found');
    }

    if (maintenance.status === 'completed') {
      throw new Error('Cannot delete completed maintenance record');
    }

    const { error } = await supabase
      .from('vehicle_maintenance')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getMaintenanceByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMaintenanceByDateRange(startDate: string, endDate: string): Promise<MaintenanceRecord[]> {
    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMaintenanceStats() {
    const { data: totalCount, error: totalError } = await supabase
      .from('vehicle_maintenance')
      .select('*', { count: 'exact', head: true });

    const { data: completedCount, error: completedError } = await supabase
      .from('vehicle_maintenance')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { data: totalCost, error: costError } = await supabase
      .from('vehicle_maintenance')
      .select('cost')
      .eq('status', 'completed');

    if (totalError || completedError || costError) {
      throw totalError || completedError || costError;
    }

    const totalAmount = totalCost?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;

    return {
      totalRecords: totalCount?.length || 0,
      completedRecords: completedCount?.length || 0,
      totalCost: totalAmount,
      averageCost: completedCount?.length ? totalAmount / completedCount.length : 0
    };
  }

  private validateMaintenanceData(maintenanceData: MaintenanceFormData): void {
    if (!maintenanceData.vehicle_id) {
      throw new Error('Vehicle ID is required');
    }

    if (!maintenanceData.maintenance_type || !maintenanceData.description) {
      throw new Error('Maintenance type and description are required');
    }

    if (maintenanceData.cost && maintenanceData.cost < 0) {
      throw new Error('Maintenance cost cannot be negative');
    }
  }

  private async getVehicleInfo(vehicleId: string): Promise<string> {
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('make, model, license_plate, vehicle_number')
        .eq('id', vehicleId)
        .single();

      if (error || !vehicle) {
        return `مركبة ${vehicleId}`;
      }

      return `${vehicle.make} ${vehicle.model} - ${vehicle.license_plate || vehicle.vehicle_number}`;
    } catch (error) {
      return `مركبة ${vehicleId}`;
    }
  }
}