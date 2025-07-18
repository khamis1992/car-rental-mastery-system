
import { supabase } from '@/integrations/supabase/client';

class RealtimeConnectionHandler {
  private static instance: RealtimeConnectionHandler;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 ثانية
  private isRetrying = false;

  static getInstance(): RealtimeConnectionHandler {
    if (!RealtimeConnectionHandler.instance) {
      RealtimeConnectionHandler.instance = new RealtimeConnectionHandler();
    }
    return RealtimeConnectionHandler.instance;
  }

  async initializeConnection(): Promise<void> {
    try {
      // إعداد معالج الأحداث للاتصال
      supabase.realtime.onOpen(() => {
        console.log('✅ تم الاتصال بـ Realtime بنجاح');
        this.connectionAttempts = 0;
        this.isRetrying = false;
      });

      supabase.realtime.onClose((event) => {
        console.warn('⚠️ انقطع الاتصال بـ Realtime:', event);
        this.handleDisconnection();
      });

      supabase.realtime.onError((error) => {
        console.error('❌ خطأ في الاتصال بـ Realtime:', error);
        this.handleConnectionError(error);
      });

    } catch (error) {
      console.error('❌ فشل في تهيئة اتصال Realtime:', error);
    }
  }

  private async handleDisconnection(): Promise<void> {
    if (this.isRetrying || this.connectionAttempts >= this.maxRetries) {
      return;
    }

    this.isRetrying = true;
    this.connectionAttempts++;

    console.log(`🔄 محاولة إعادة الاتصال بـ Realtime (${this.connectionAttempts}/${this.maxRetries})`);

    try {
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.connectionAttempts));
      
      // محاولة إعادة الاتصال عبر إنشاء قناة جديدة
      const testChannel = supabase.channel('connection_test');
      await testChannel.subscribe();
      
      console.log('✅ تم إعادة الاتصال بـ Realtime بنجاح');
      this.connectionAttempts = 0;
      this.isRetrying = false;
      
      // إزالة القناة التجريبية
      await testChannel.unsubscribe();
      
    } catch (error) {
      console.error('❌ فشلت محاولة إعادة الاتصال:', error);
      this.isRetrying = false;
      
      if (this.connectionAttempts < this.maxRetries) {
        // المحاولة مرة أخرى بعد تأخير أطول
        setTimeout(() => this.handleDisconnection(), this.retryDelay * 2);
      } else {
        console.error('❌ فشل في إعادة الاتصال بـ Realtime بعد عدة محاولات');
      }
    }
  }

  private handleConnectionError(error: any): void {
    // معالجة أنواع مختلفة من الأخطاء
    if (error?.message?.includes('WebSocket')) {
      console.warn('⚠️ مشكلة في WebSocket - سيتم المحاولة لاحقاً');
    } else if (error?.message?.includes('network')) {
      console.warn('⚠️ مشكلة في الشبكة - يرجى التحقق من الاتصال');
    } else {
      console.error('❌ خطأ غير معروف في Realtime:', error);
    }
  }

  // دالة لإنشاء اشتراك آمن
  createSafeSubscription(channelName: string, config: any = {}) {
    try {
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: 'user' },
          ...config
        }
      });

      // إضافة معالج للأخطاء
      channel.on('system', {}, (payload) => {
        if (payload.status === 'error') {
          console.error(`❌ خطأ في القناة ${channelName}:`, payload);
        }
      });

      return channel;
    } catch (error) {
      console.error(`❌ فشل في إنشاء اشتراك للقناة ${channelName}:`, error);
      return null;
    }
  }

  // دالة لتنظيف الاشتراكات
  async cleanupSubscriptions(): Promise<void> {
    try {
      await supabase.removeAllChannels();
      console.log('✅ تم تنظيف جميع اشتراكات Realtime');
    } catch (error) {
      console.error('❌ فشل في تنظيف اشتراكات Realtime:', error);
    }
  }
}

// تصدير instance واحد
export const realtimeHandler = RealtimeConnectionHandler.getInstance();

// تهيئة الاتصال عند استيراد الملف
realtimeHandler.initializeConnection();
