import { useState, useEffect, useCallback } from 'react';
import { automationService, AutomationRule, AutomationLog } from '@/services/AutomationService';
import { useToast } from '@/hooks/use-toast';

export const useAutomation = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    setRules(automationService.getRules());
    setLogs(automationService.getLogs());
  }, []);

  useEffect(() => {
    loadData();

    // الاستماع لأحداث تحديث البيانات المحاسبية
    const handleAccountingUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      toast({
        title: 'تم التحديث التلقائي',
        description: `تم تنفيذ ${getUpdateTypeLabel(type)} بنجاح`,
      });
      
      // تحديث البيانات بعد العملية التلقائية
      loadData();
    };

    window.addEventListener('accounting-data-updated', handleAccountingUpdate as EventListener);
    
    // تحديث دوري للبيانات
    const interval = setInterval(loadData, 30000); // كل 30 ثانية

    return () => {
      window.removeEventListener('accounting-data-updated', handleAccountingUpdate as EventListener);
      clearInterval(interval);
    };
  }, [loadData, toast]);

  const startAutomation = useCallback(async () => {
    setLoading(true);
    try {
      await automationService.startAutomation();
      setIsRunning(true);
      loadData();
      
      toast({
        title: 'تم بنجاح',
        description: 'تم بدء تشغيل نظام الأتمتة المحاسبية',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في بدء تشغيل نظام الأتمتة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [loadData, toast]);

  const stopAutomation = useCallback(async () => {
    setLoading(true);
    try {
      await automationService.stopAutomation();
      setIsRunning(false);
      loadData();
      
      toast({
        title: 'تم بنجاح',
        description: 'تم إيقاف نظام الأتمتة المحاسبية',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إيقاف نظام الأتمتة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [loadData, toast]);

  const toggleRule = useCallback(async (ruleId: string, isActive: boolean) => {
    try {
      automationService.updateRule(ruleId, { isActive });
      loadData();
      
      toast({
        title: 'تم التحديث',
        description: `تم ${isActive ? 'تفعيل' : 'إيقاف'} القاعدة بنجاح`,
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث القاعدة',
        variant: 'destructive',
      });
    }
  }, [loadData, toast]);

  const triggerRule = useCallback(async (ruleId: string) => {
    try {
      await automationService.triggerRule(ruleId);
      loadData();
      
      toast({
        title: 'تم بنجاح',
        description: 'تم تشغيل المهمة يدوياً',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تشغيل المهمة',
        variant: 'destructive',
      });
    }
  }, [loadData, toast]);

  const getActiveRulesCount = useCallback(() => {
    return rules.filter(rule => rule.isActive).length;
  }, [rules]);

  const getTotalRunsCount = useCallback(() => {
    return rules.reduce((total, rule) => total + rule.runCount, 0);
  }, [rules]);

  const getSuccessRate = useCallback(() => {
    const totalRuns = getTotalRunsCount();
    if (totalRuns === 0) return 0;
    
    const totalSuccess = rules.reduce((total, rule) => total + rule.successCount, 0);
    return Math.round((totalSuccess / totalRuns) * 100);
  }, [rules, getTotalRunsCount]);

  const getRunningTasksCount = useCallback(() => {
    return logs.filter(log => log.status === 'running').length;
  }, [logs]);

  const getRecentLogs = useCallback((count: number = 10) => {
    return logs.slice(0, count);
  }, [logs]);

  const getRuleById = useCallback((ruleId: string) => {
    return rules.find(rule => rule.id === ruleId);
  }, [rules]);

  return {
    // البيانات
    rules,
    logs,
    isRunning,
    loading,
    
    // الإحصائيات
    activeRulesCount: getActiveRulesCount(),
    totalRunsCount: getTotalRunsCount(),
    successRate: getSuccessRate(),
    runningTasksCount: getRunningTasksCount(),
    
    // الإجراءات
    startAutomation,
    stopAutomation,
    toggleRule,
    triggerRule,
    loadData,
    
    // المساعدات
    getRecentLogs,
    getRuleById,
  };
};

// دالة مساعدة لتحويل نوع التحديث إلى تسمية
function getUpdateTypeLabel(type: string): string {
  switch (type) {
    case 'balances':
      return 'تحديث الأرصدة';
    case 'cleanup':
      return 'تنظيف البيانات';
    case 'reports':
      return 'إنشاء التقارير';
    case 'backfill':
      return 'إكمال القيود المفقودة';
    default:
      return 'عملية تلقائية';
  }
}