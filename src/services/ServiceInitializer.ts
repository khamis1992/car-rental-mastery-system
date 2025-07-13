/**
 * خدمة تهيئة الخدمات مع معالجة الأخطاء
 */
export class ServiceInitializer {
  private static instance: ServiceInitializer;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): ServiceInitializer {
    if (!ServiceInitializer.instance) {
      ServiceInitializer.instance = new ServiceInitializer();
    }
    return ServiceInitializer.instance;
  }

  /**
   * تهيئة الخدمات بطريقة آمنة
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ الخدمات مهيأة بالفعل');
      return;
    }

    if (this.initializationPromise) {
      console.log('⏳ انتظار تهيئة الخدمات...');
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 بدء تهيئة الخدمات...');

      // تهيئة معالج أحداث حالات المركبات
      try {
        const { vehicleStatusEventHandler } = await import('./VehicleStatusEventHandler');
        vehicleStatusEventHandler.initialize();
        console.log('✅ تم تهيئة معالج أحداث المركبات');
      } catch (error) {
        console.warn('⚠️ تعذر تهيئة معالج أحداث المركبات:', error);
      }

      this.isInitialized = true;
      console.log('✅ تمت تهيئة جميع الخدمات بنجاح');

    } catch (error) {
      console.error('❌ خطأ في تهيئة الخدمات:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * إيقاف الخدمات
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      console.log('🛑 إيقاف الخدمات...');

      // إيقاف معالج أحداث المركبات
      try {
        const { vehicleStatusEventHandler } = await import('./VehicleStatusEventHandler');
        vehicleStatusEventHandler.shutdown();
      } catch (error) {
        console.warn('⚠️ تعذر إيقاف معالج أحداث المركبات:', error);
      }

      this.isInitialized = false;
      this.initializationPromise = null;
      console.log('✅ تم إيقاف جميع الخدمات');

    } catch (error) {
      console.error('❌ خطأ في إيقاف الخدمات:', error);
    }
  }

  /**
   * فحص حالة التهيئة
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// تصدير المثيل الوحيد
export const serviceInitializer = ServiceInitializer.getInstance();