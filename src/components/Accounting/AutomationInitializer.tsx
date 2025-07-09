import { useEffect } from 'react';
import { automationService } from '@/services/AutomationService';

export const AutomationInitializer = () => {
  useEffect(() => {
    // تهيئة نظام الأتمتة عند تحميل التطبيق
    const initializeAutomation = async () => {
      try {
        console.log('🤖 تهيئة نظام الأتمتة المحاسبية...');
        
        // تحقق من إعدادات الأتمتة المحفوظة
        const savedSettings = localStorage.getItem('automation-settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.enabled) {
            await automationService.startAutomation();
            console.log('✅ تم تشغيل نظام الأتمتة تلقائياً');
          }
        }
      } catch (error) {
        console.error('❌ خطأ في تهيئة نظام الأتمتة:', error);
      }
    };

    initializeAutomation();

    // تنظيف عند إلغاء تحميل التطبيق
    return () => {
      automationService.stopAutomation();
    };
  }, []);

  return null; // هذا المكون لا يعرض شيئاً
};