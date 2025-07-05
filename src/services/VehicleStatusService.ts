import { supabase } from '@/integrations/supabase/client';
import { serviceContainer } from './Container/ServiceContainer';
import { orchestrationContainer } from './Orchestration/OrchestrationContainer';

export interface VehicleStatusUpdateEvent {
  vehicleId: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  contractId?: string;
  triggeredBy: 'contract' | 'maintenance' | 'manual' | 'system';
}

export class VehicleStatusService {
  private static instance: VehicleStatusService;

  private constructor() {}

  static getInstance(): VehicleStatusService {
    if (!VehicleStatusService.instance) {
      VehicleStatusService.instance = new VehicleStatusService();
    }
    return VehicleStatusService.instance;
  }

  /**
   * تحديث حالة المركبة الذكي مع إدارة الأحداث
   */
  async updateVehicleStatus(
    vehicleId: string, 
    newStatus: 'available' | 'rented' | 'maintenance' | 'out_of_service',
    reason: string,
    contractId?: string,
    triggeredBy: 'contract' | 'maintenance' | 'manual' | 'system' = 'system'
  ): Promise<void> {
    try {
      console.log(`🚗 VehicleStatusService: تحديث حالة المركبة ${vehicleId} إلى ${newStatus}`);
      
      // الحصول على الحالة الحالية
      const currentVehicle = await this.getVehicleById(vehicleId);
      if (!currentVehicle) {
        throw new Error(`المركبة بالمعرف ${vehicleId} غير موجودة`);
      }

      const oldStatus = currentVehicle.status;
      
      // التحقق من صحة الانتقال
      if (!this.isValidStatusTransition(oldStatus, newStatus)) {
        console.warn(`⚠️ انتقال غير صحيح من ${oldStatus} إلى ${newStatus} للمركبة ${vehicleId}`);
        return;
      }

      // تحديث الحالة في قاعدة البيانات
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) {
        throw error;
      }

      // إرسال حدث التحديث
      const statusEvent: VehicleStatusUpdateEvent = {
        vehicleId,
        oldStatus,
        newStatus,
        reason,
        contractId,
        triggeredBy
      };

      await this.emitStatusUpdateEvent(statusEvent);
      
      console.log(`✅ تم تحديث حالة المركبة ${vehicleId} من ${oldStatus} إلى ${newStatus}`);
      
    } catch (error) {
      console.error(`❌ خطأ في تحديث حالة المركبة ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * مزامنة حالات المركبات مع العقود النشطة
   */
  async syncVehicleStatusesWithContracts(): Promise<void> {
    try {
      console.log('🔄 بدء مزامنة حالات المركبات مع العقود');

      // الحصول على جميع العقود النشطة
      const { data: activeContracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, vehicle_id, status, start_date, end_date, actual_start_date, actual_end_date')
        .in('status', ['active', 'pending']);

      if (contractsError) {
        throw contractsError;
      }

      // الحصول على جميع المركبات
      const { data: allVehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, status, vehicle_number');

      if (vehiclesError) {
        throw vehiclesError;
      }

      const vehicleContractMap = new Map();
      const currentDate = new Date();

      // إنشاء خريطة المركبات والعقود
      activeContracts?.forEach(contract => {
        vehicleContractMap.set(contract.vehicle_id, contract);
      });

      // مراجعة كل مركبة
      for (const vehicle of allVehicles || []) {
        const contract = vehicleContractMap.get(vehicle.id);
        let expectedStatus: string;
        let reason: string;

        if (contract) {
          if (contract.status === 'active') {
            expectedStatus = 'rented';
            reason = `مؤجرة حسب العقد ${contract.id}`;
          } else if (contract.status === 'pending') {
            expectedStatus = 'available'; // في الانتظار
            reason = `متاحة - عقد في الانتظار ${contract.id}`;
          } else {
            expectedStatus = 'available';
            reason = 'لا يوجد عقد نشط';
          }
        } else {
          // فحص العقود المنتهية حديثاً
          const { data: expiredContracts } = await supabase
            .from('contracts')
            .select('id, end_date, actual_end_date')
            .eq('vehicle_id', vehicle.id)
            .eq('status', 'completed')
            .gte('actual_end_date', new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .order('actual_end_date', { ascending: false })
            .limit(1);

          if (expiredContracts && expiredContracts.length > 0) {
            expectedStatus = 'available';
            reason = `تم إرجاعها من العقد ${expiredContracts[0].id}`;
          } else {
            expectedStatus = 'available';
            reason = 'لا يوجد عقد نشط';
          }
        }

        // تحديث الحالة إذا كانت مختلفة
        if (vehicle.status !== expectedStatus) {
          await this.updateVehicleStatus(
            vehicle.id,
            expectedStatus as any,
            reason,
            contract?.id,
            'system'
          );
        }
      }

      console.log('✅ تمت مزامنة حالات المركبات مع العقود');

    } catch (error) {
      console.error('❌ خطأ في مزامنة حالات المركبات:', error);
      throw error;
    }
  }

  /**
   * معالجة أحداث العقود
   */
  async handleContractStatusChange(
    contractId: string,
    vehicleId: string,
    contractStatus: string,
    oldContractStatus?: string
  ): Promise<void> {
    try {
      console.log(`📋 معالجة تغيير حالة العقد ${contractId}: ${oldContractStatus} → ${contractStatus}`);

      let newVehicleStatus: 'available' | 'rented' | 'maintenance' | 'out_of_service';
      let reason: string;

      switch (contractStatus) {
        case 'active':
          newVehicleStatus = 'rented';
          reason = `تم تفعيل العقد ${contractId}`;
          break;
        
        case 'completed':
          newVehicleStatus = 'available';
          reason = `تم إكمال العقد ${contractId}`;
          break;
        
        case 'cancelled':
          newVehicleStatus = 'available';
          reason = `تم إلغاء العقد ${contractId}`;
          break;
        
        case 'draft':
        case 'pending':
          // لا نغير حالة المركبة للعقود المسودة أو في الانتظار
          return;
        
        default:
          console.warn(`⚠️ حالة عقد غير معروفة: ${contractStatus}`);
          return;
      }

      await this.updateVehicleStatus(
        vehicleId,
        newVehicleStatus,
        reason,
        contractId,
        'contract'
      );

    } catch (error) {
      console.error(`❌ خطأ في معالجة تغيير حالة العقد ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * فحص العقود المنتهية الصلاحية
   */
  async checkExpiredContracts(): Promise<void> {
    try {
      console.log('⏰ فحص العقود المنتهية الصلاحية');

      const currentDate = new Date();
      const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

      // البحث عن العقود النشطة المنتهية
      const { data: expiredContracts, error } = await supabase
        .from('contracts')
        .select('id, vehicle_id, end_date, customers(name), vehicles(vehicle_number, make, model)')
        .eq('status', 'active')
        .lt('end_date', currentDate.toISOString().split('T')[0]);

      if (error) {
        throw error;
      }

      if (!expiredContracts || expiredContracts.length === 0) {
        console.log('✅ لا توجد عقود منتهية الصلاحية');
        return;
      }

      console.log(`🔍 وجد ${expiredContracts.length} عقد منتهي الصلاحية`);

      // معالجة كل عقد منتهي
      for (const contract of expiredContracts) {
        try {
          // تحديث حالة العقد إلى مكتمل
          await supabase
            .from('contracts')
            .update({ 
              status: 'completed',
              actual_end_date: contract.end_date,
              updated_at: new Date().toISOString()
            })
            .eq('id', contract.id);

          // تحديث حالة المركبة
          await this.updateVehicleStatus(
            contract.vehicle_id,
            'available',
            `انتهت مدة العقد ${contract.id} تلقائياً`,
            contract.id,
            'system'
          );

          console.log(`✅ تم إكمال العقد المنتهي ${contract.id} وتحرير المركبة ${contract.vehicle_id}`);

        } catch (contractError) {
          console.error(`❌ خطأ في معالجة العقد المنتهي ${contract.id}:`, contractError);
        }
      }

    } catch (error) {
      console.error('❌ خطأ في فحص العقود المنتهية:', error);
      throw error;
    }
  }

  /**
   * التحقق من صحة انتقال الحالة
   */
  private isValidStatusTransition(
    oldStatus: string, 
    newStatus: string
  ): boolean {
    // القواعد المسموحة لانتقال الحالات
    const allowedTransitions: Record<string, string[]> = {
      'available': ['rented', 'maintenance', 'out_of_service'],
      'rented': ['available', 'maintenance'],
      'maintenance': ['available', 'out_of_service'],
      'out_of_service': ['available', 'maintenance']
    };

    return allowedTransitions[oldStatus]?.includes(newStatus) || false;
  }

  /**
   * إرسال حدث تحديث الحالة
   */
  private async emitStatusUpdateEvent(event: VehicleStatusUpdateEvent): Promise<void> {
    try {
      const eventBus = orchestrationContainer.getEventBus();
      
      await eventBus.emit({
        type: 'VEHICLE_STATUS_UPDATED',
        payload: event,
        timestamp: new Date(),
        source: 'VehicleStatusService'
      });

    } catch (error) {
      console.error('❌ خطأ في إرسال حدث تحديث حالة المركبة:', error);
    }
  }

  /**
   * الحصول على بيانات المركبة
   */
  private async getVehicleById(vehicleId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, status, vehicle_number, make, model')
      .eq('id', vehicleId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * الحصول على إحصائيات حالات المركبات
   */
  async getVehicleStatusStats() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('status')
        .neq('status', 'out_of_service');

      if (error) {
        throw error;
      }

      const stats = {
        available: 0,
        rented: 0,
        maintenance: 0,
        out_of_service: 0,
        total: data?.length || 0
      };

      data?.forEach(vehicle => {
        stats[vehicle.status as keyof typeof stats]++;
      });

      return stats;

    } catch (error) {
      console.error('❌ خطأ في الحصول على إحصائيات حالات المركبات:', error);
      throw error;
    }
  }
}

// تصدير المثيل الوحيد
export const vehicleStatusService = VehicleStatusService.getInstance();