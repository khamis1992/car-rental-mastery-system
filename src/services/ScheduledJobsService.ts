import { vehicleStatusService } from './VehicleStatusService';
import { supabase } from '@/integrations/supabase/client';

export class ScheduledJobsService {
  private static instance: ScheduledJobsService;
  private jobIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): ScheduledJobsService {
    if (!ScheduledJobsService.instance) {
      ScheduledJobsService.instance = new ScheduledJobsService();
    }
    return ScheduledJobsService.instance;
  }

  /**
   * بدء جميع المهام المجدولة
   */
  startAllJobs(): void {
    console.log('🚀 بدء تشغيل المهام المجدولة');
    
    // فحص العقود المنتهية كل ساعة
    this.scheduleJob(
      'check-expired-contracts',
      () => this.checkExpiredContractsJob(),
      60 * 60 * 1000 // كل ساعة
    );

    // مزامنة حالات المركبات كل 30 دقيقة
    this.scheduleJob(
      'sync-vehicle-statuses',
      () => this.syncVehicleStatusesJob(),
      30 * 60 * 1000 // كل 30 دقيقة
    );

    // تنظيف البيانات المؤقتة كل 24 ساعة
    this.scheduleJob(
      'cleanup-temp-data',
      () => this.cleanupTempDataJob(),
      24 * 60 * 60 * 1000 // كل 24 ساعة
    );

    // فحص التذكيرات كل 15 دقيقة
    this.scheduleJob(
      'check-reminders',
      () => this.checkRemindersJob(),
      15 * 60 * 1000 // كل 15 دقيقة
    );
  }

  /**
   * إيقاف جميع المهام المجدولة
   */
  stopAllJobs(): void {
    console.log('⏹️ إيقاف جميع المهام المجدولة');
    
    this.jobIntervals.forEach((interval, jobName) => {
      clearInterval(interval);
      console.log(`✅ تم إيقاف المهمة: ${jobName}`);
    });
    
    this.jobIntervals.clear();
  }

  /**
   * جدولة مهمة محددة
   */
  private scheduleJob(
    jobName: string, 
    jobFunction: () => Promise<void>, 
    intervalMs: number
  ): void {
    // إيقاف المهمة إذا كانت تعمل بالفعل
    if (this.jobIntervals.has(jobName)) {
      clearInterval(this.jobIntervals.get(jobName)!);
    }

    // تشغيل المهمة فور البدء
    jobFunction().catch(error => {
      console.error(`❌ خطأ في المهمة الأولية ${jobName}:`, error);
    });

    // جدولة المهمة
    const interval = setInterval(async () => {
      try {
        await jobFunction();
      } catch (error) {
        console.error(`❌ خطأ في المهمة المجدولة ${jobName}:`, error);
      }
    }, intervalMs);

    this.jobIntervals.set(jobName, interval);
    console.log(`⏰ تم جدولة المهمة: ${jobName} (كل ${intervalMs / 1000} ثانية)`);
  }

  /**
   * مهمة فحص العقود المنتهية
   */
  private async checkExpiredContractsJob(): Promise<void> {
    try {
      console.log('📋 تشغيل مهمة فحص العقود المنتهية');
      await vehicleStatusService.checkExpiredContracts();
      console.log('✅ انتهت مهمة فحص العقود المنتهية');
    } catch (error) {
      console.error('❌ خطأ في مهمة فحص العقود المنتهية:', error);
    }
  }

  /**
   * مهمة مزامنة حالات المركبات
   */
  private async syncVehicleStatusesJob(): Promise<void> {
    try {
      console.log('🔄 تشغيل مهمة مزامنة حالات المركبات');
      await vehicleStatusService.syncVehicleStatusesWithContracts();
      console.log('✅ انتهت مهمة مزامنة حالات المركبات');
    } catch (error) {
      console.error('❌ خطأ في مهمة مزامنة حالات المركبات:', error);
    }
  }

  /**
   * مهمة تنظيف البيانات المؤقتة
   */
  private async cleanupTempDataJob(): Promise<void> {
    try {
      console.log('🧹 تشغيل مهمة تنظيف البيانات المؤقتة');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // حذف سجلات الأحداث القديمة (إذا كانت موجودة)
      // هذا مثال - يمكن تخصيصه حسب الحاجة

      console.log('✅ انتهت مهمة تنظيف البيانات المؤقتة');
    } catch (error) {
      console.error('❌ خطأ في مهمة تنظيف البيانات المؤقتة:', error);
    }
  }

  /**
   * مهمة فحص التذكيرات
   */
  private async checkRemindersJob(): Promise<void> {
    try {
      console.log('🔔 تشغيل مهمة فحص التذكيرات');

      const currentDate = new Date();
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // فحص العقود التي تنتهي غداً
      const { data: expiringContracts, error } = await supabase
        .from('contracts')
        .select(`
          id, 
          contract_number, 
          end_date,
          customers(name, phone),
          vehicles(make, model, vehicle_number)
        `)
        .eq('status', 'active')
        .eq('end_date', tomorrow.toISOString().split('T')[0]);

      if (error) {
        throw error;
      }

      if (expiringContracts && expiringContracts.length > 0) {
        console.log(`📅 وجد ${expiringContracts.length} عقد ينتهي غداً`);
        
        // هنا يمكن إرسال إشعارات للموظفين
        // أو إضافة تذكيرات في النظام
        for (const contract of expiringContracts) {
          console.log(`⚠️ تذكير: العقد ${contract.contract_number} ينتهي غداً`);
        }
      }

      console.log('✅ انتهت مهمة فحص التذكيرات');
    } catch (error) {
      console.error('❌ خطأ في مهمة فحص التذكيرات:', error);
    }
  }

  /**
   * الحصول على حالة المهام المجدولة
   */
  getJobsStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    this.jobIntervals.forEach((_, jobName) => {
      status[jobName] = true;
    });

    return status;
  }

  /**
   * إعادة تشغيل مهمة محددة
   */
  restartJob(jobName: string): boolean {
    const jobConfigs = {
      'check-expired-contracts': {
        function: () => this.checkExpiredContractsJob(),
        interval: 60 * 60 * 1000
      },
      'sync-vehicle-statuses': {
        function: () => this.syncVehicleStatusesJob(),
        interval: 30 * 60 * 1000
      },
      'cleanup-temp-data': {
        function: () => this.cleanupTempDataJob(),
        interval: 24 * 60 * 60 * 1000
      },
      'check-reminders': {
        function: () => this.checkRemindersJob(),
        interval: 15 * 60 * 1000
      }
    };

    const config = jobConfigs[jobName as keyof typeof jobConfigs];
    if (!config) {
      console.error(`❌ مهمة غير معروفة: ${jobName}`);
      return false;
    }

    this.scheduleJob(jobName, config.function, config.interval);
    console.log(`🔄 تم إعادة تشغيل المهمة: ${jobName}`);
    return true;
  }
}

// تصدير المثيل الوحيد
export const scheduledJobsService = ScheduledJobsService.getInstance();