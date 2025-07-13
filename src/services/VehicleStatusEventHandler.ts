import { orchestrationContainer } from './Orchestration/OrchestrationContainer';
import { vehicleStatusService } from './VehicleStatusService';
import { scheduledJobsService } from './ScheduledJobsService';

/**
 * معالج أحداث حالات المركبات
 */
export class VehicleStatusEventHandler {
  private static instance: VehicleStatusEventHandler;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): VehicleStatusEventHandler {
    if (!VehicleStatusEventHandler.instance) {
      VehicleStatusEventHandler.instance = new VehicleStatusEventHandler();
    }
    return VehicleStatusEventHandler.instance;
  }

  /**
   * تهيئة معالج الأحداث
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('⚠️ معالج أحداث حالات المركبات مهيأ بالفعل');
      return;
    }

    try {
      console.log('🎯 تهيئة معالج أحداث حالات المركبات');

    const eventBus = orchestrationContainer.getEventBus();

    // الاستماع لأحداث العقود
    eventBus.on('CONTRACT_ACTIVATED', async (event) => {
      try {
        console.log('📋 معالجة حدث تفعيل العقد:', event.payload);
        
        const { contractId } = event.payload;
        if (contractId) {
          // سيتم معالجة تحديث حالة المركبة من خلال ContractOrchestrationService
          console.log(`✅ تم معالجة تفعيل العقد ${contractId}`);
        }
      } catch (error) {
        console.error('❌ خطأ في معالجة حدث تفعيل العقد:', error);
      }
    });

    eventBus.on('CONTRACT_COMPLETED', async (event) => {
      try {
        console.log('📋 معالجة حدث إكمال العقد:', event.payload);
        
        const { contractId } = event.payload;
        if (contractId) {
          // سيتم معالجة تحديث حالة المركبة من خلال ContractOrchestrationService
          console.log(`✅ تم معالجة إكمال العقد ${contractId}`);
        }
      } catch (error) {
        console.error('❌ خطأ في معالجة حدث إكمال العقد:', error);
      }
    });

    eventBus.on('CONTRACT_CANCELLED', async (event) => {
      try {
        console.log('📋 معالجة حدث إلغاء العقد:', event.payload);
        
        const { contractId } = event.payload;
        if (contractId) {
          // سيتم معالجة تحديث حالة المركبة من خلال ContractOrchestrationService
          console.log(`✅ تم معالجة إلغاء العقد ${contractId}`);
        }
      } catch (error) {
        console.error('❌ خطأ في معالجة حدث إلغاء العقد:', error);
      }
    });

    // الاستماع لأحداث تحديث حالة المركبة
    eventBus.on('VEHICLE_STATUS_UPDATED', async (event) => {
      try {
        console.log('🚗 معالجة حدث تحديث حالة المركبة:', event.payload);
        
        const { vehicleId, oldStatus, newStatus, reason, contractId, triggeredBy } = event.payload;
        
        // يمكن إضافة معلجات إضافية هنا مثل:
        // - إرسال إشعارات
        // - تحديث الإحصائيات
        // - تسجيل السجلات
        
        console.log(`✅ تم تحديث حالة المركبة ${vehicleId}: ${oldStatus} → ${newStatus} (${reason})`);
      } catch (error) {
        console.error('❌ خطأ في معالجة حدث تحديث حالة المركبة:', error);
      }
    });

    // الاستماع لأحداث الصيانة (إذا كانت موجودة)
    eventBus.on('MAINTENANCE_STARTED', async (event) => {
      try {
        console.log('🔧 معالجة حدث بدء الصيانة:', event.payload);
        
        const { vehicleId } = event.payload;
        if (vehicleId) {
          await vehicleStatusService.updateVehicleStatus(
            vehicleId,
            'maintenance',
            'بدء صيانة مجدولة',
            undefined,
            'maintenance'
          );
        }
      } catch (error) {
        console.error('❌ خطأ في معالجة حدث بدء الصيانة:', error);
      }
    });

    eventBus.on('MAINTENANCE_COMPLETED', async (event) => {
      try {
        console.log('🔧 معالجة حدث إكمال الصيانة:', event.payload);
        
        const { vehicleId } = event.payload;
        if (vehicleId) {
          await vehicleStatusService.updateVehicleStatus(
            vehicleId,
            'available',
            'تم إكمال الصيانة',
            undefined,
            'maintenance'
          );
        }
      } catch (error) {
        console.error('❌ خطأ في معالجة حدث إكمال الصيانة:', error);
      }
    });

      // بدء المهام المجدولة
      scheduledJobsService.startAllJobs();

      this.isInitialized = true;
      console.log('✅ تم تهيئة معالج أحداث حالات المركبات');
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة معالج أحداث المركبات:', error);
      throw error;
    }
  }

  /**
   * إيقاف معالج الأحداث
   */
  shutdown(): void {
    if (!this.isInitialized) {
      console.log('⚠️ معالج أحداث حالات المركبات غير مهيأ');
      return;
    }

    try {
      console.log('🛑 إيقاف معالج أحداث حالات المركبات');

      // إيقاف المهام المجدولة
      scheduledJobsService.stopAllJobs();

      this.isInitialized = false;
      console.log('✅ تم إيقاف معالج أحداث حالات المركبات');
      
    } catch (error) {
      console.error('❌ خطأ في إيقاف معالج أحداث المركبات:', error);
    }
  }

  /**
   * الحصول على حالة المعالج
   */
  getStatus(): { initialized: boolean; jobsStatus: Record<string, boolean> } {
    return {
      initialized: this.isInitialized,
      jobsStatus: scheduledJobsService.getJobsStatus()
    };
  }

  /**
   * تشغيل مزامنة فورية لحالات المركبات
   */
  async triggerImmediateSync(): Promise<void> {
    try {
      console.log('⚡ تشغيل مزامنة فورية لحالات المركبات');
      await vehicleStatusService.syncVehicleStatusesWithContracts();
      console.log('✅ تمت المزامنة الفورية بنجاح');
    } catch (error) {
      console.error('❌ خطأ في المزامنة الفورية:', error);
      throw error;
    }
  }
}

// تصدير المثيل الوحيد
export const vehicleStatusEventHandler = VehicleStatusEventHandler.getInstance();