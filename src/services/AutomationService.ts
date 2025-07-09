import { supabase } from '@/integrations/supabase/client';
import { accountingService } from './accountingService';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'scheduled' | 'trigger' | 'conditional';
  isActive: boolean;
  schedule?: string; // cron format for scheduled tasks
  conditions?: Record<string, any>;
  action: string;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successCount: number;
  errorCount: number;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  status: 'success' | 'error' | 'running';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  message: string;
  details?: Record<string, any>;
}

export class AutomationService {
  private static instance: AutomationService;
  private rules: Map<string, AutomationRule> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private logs: AutomationLog[] = [];

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  private initializeDefaultRules(): void {
    const defaultRules: AutomationRule[] = [
      {
        id: 'daily-balance-update',
        name: 'تحديث الأرصدة اليومي',
        description: 'تحديث أرصدة الحسابات تلقائياً كل يوم في الساعة 2:00 صباحاً',
        type: 'scheduled',
        isActive: true,
        schedule: '0 2 * * *', // Daily at 2 AM
        action: 'update_account_balances',
        runCount: 0,
        successCount: 0,
        errorCount: 0
      },
      {
        id: 'weekly-data-cleanup',
        name: 'تنظيف البيانات الأسبوعي',
        description: 'تنظيف البيانات المؤقتة والقيود المكررة كل أسبوع',
        type: 'scheduled',
        isActive: true,
        schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
        action: 'cleanup_data',
        runCount: 0,
        successCount: 0,
        errorCount: 0
      },
      {
        id: 'monthly-reports',
        name: 'التقارير الشهرية',
        description: 'إنشاء التقارير المالية الشهرية تلقائياً',
        type: 'scheduled',
        isActive: true,
        schedule: '0 6 1 * *', // Monthly on 1st at 6 AM
        action: 'generate_monthly_reports',
        runCount: 0,
        successCount: 0,
        errorCount: 0
      },
      {
        id: 'missing-entries-backfill',
        name: 'إكمال القيود المفقودة',
        description: 'فحص وإكمال القيود المحاسبية المفقودة عند اكتشافها',
        type: 'trigger',
        isActive: true,
        conditions: { missingEntriesThreshold: 5 },
        action: 'backfill_missing_entries',
        runCount: 0,
        successCount: 0,
        errorCount: 0
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  async startAutomation(): Promise<void> {
    console.log('🤖 بدء تشغيل نظام الأتمتة المحاسبية');
    
    for (const [id, rule] of this.rules) {
      if (rule.isActive && rule.type === 'scheduled' && rule.schedule) {
        this.scheduleRule(rule);
      }
    }
  }

  async stopAutomation(): Promise<void> {
    console.log('⏹️ إيقاف نظام الأتمتة المحاسبية');
    
    this.intervals.forEach((interval, id) => {
      clearInterval(interval);
      console.log(`✅ تم إيقاف المهمة: ${id}`);
    });
    
    this.intervals.clear();
  }

  private scheduleRule(rule: AutomationRule): void {
    if (!rule.schedule) return;

    // تحويل cron إلى milliseconds للتبسيط (يمكن تحسينه لاحقاً)
    const interval = this.parseCronToInterval(rule.schedule);
    
    if (interval > 0) {
      const timeoutId = setInterval(async () => {
        await this.executeRule(rule);
      }, interval);

      this.intervals.set(rule.id, timeoutId);
      console.log(`⏰ تم جدولة المهمة: ${rule.name} (كل ${interval / 1000} ثانية)`);
    }
  }

  private parseCronToInterval(cron: string): number {
    // تبسيط: تحويل بعض أنماط cron الشائعة إلى milliseconds
    switch (cron) {
      case '0 2 * * *': // Daily at 2 AM - for demo, run every 5 minutes
        return 5 * 60 * 1000;
      case '0 3 * * 0': // Weekly - for demo, run every 10 minutes
        return 10 * 60 * 1000;
      case '0 6 1 * *': // Monthly - for demo, run every 15 minutes
        return 15 * 60 * 1000;
      default:
        return 0;
    }
  }

  private async executeRule(rule: AutomationRule): Promise<void> {
    const logEntry: AutomationLog = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      status: 'running',
      startTime: new Date(),
      message: `تشغيل المهمة: ${rule.name}`
    };

    this.logs.unshift(logEntry);
    rule.runCount++;

    try {
      await this.performAction(rule.action, rule);
      
      logEntry.status = 'success';
      logEntry.endTime = new Date();
      logEntry.duration = logEntry.endTime.getTime() - logEntry.startTime.getTime();
      logEntry.message = `تم تنفيذ المهمة بنجاح: ${rule.name}`;
      
      rule.successCount++;
      
      console.log(`✅ نجح تنفيذ المهمة: ${rule.name}`);
      
    } catch (error) {
      logEntry.status = 'error';
      logEntry.endTime = new Date();
      logEntry.duration = logEntry.endTime.getTime() - logEntry.startTime.getTime();
      logEntry.message = `فشل في تنفيذ المهمة: ${rule.name} - ${error}`;
      logEntry.details = { error: error instanceof Error ? error.message : String(error) };
      
      rule.errorCount++;
      
      console.error(`❌ فشل في تنفيذ المهمة: ${rule.name}`, error);
    }

    // الاحتفاظ بآخر 100 سجل فقط
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }
  }

  private async performAction(action: string, rule: AutomationRule): Promise<void> {
    switch (action) {
      case 'update_account_balances':
        await this.updateAccountBalances();
        break;
      
      case 'cleanup_data':
        await this.cleanupData();
        break;
      
      case 'generate_monthly_reports':
        await this.generateMonthlyReports();
        break;
      
      case 'backfill_missing_entries':
        await this.backfillMissingEntries();
        break;
      
      default:
        throw new Error(`إجراء غير معروف: ${action}`);
    }
  }

  private async updateAccountBalances(): Promise<void> {
    const { data, error } = await supabase.rpc('update_account_balances');
    if (error) throw error;
    
    // إشعار النظام بالتحديث
    window.dispatchEvent(new CustomEvent('accounting-data-updated', {
      detail: { type: 'balances', data }
    }));
  }

  private async cleanupData(): Promise<void> {
    // تنظيف القيود المكررة
    const { data: duplicatesFix } = await supabase.rpc('fix_double_revenue_entries');
    
    // تنظيف البيانات المؤقتة
    const { data: cleanup } = await supabase.rpc('cleanup_duplicate_accounts');
    
    window.dispatchEvent(new CustomEvent('accounting-data-updated', {
      detail: { type: 'cleanup', data: { duplicatesFix, cleanup } }
    }));
  }

  private async generateMonthlyReports(): Promise<void> {
    // حساب المؤشرات المالية
    const { data } = await supabase.rpc('calculate_financial_metrics');
    
    window.dispatchEvent(new CustomEvent('accounting-data-updated', {
      detail: { type: 'reports', data }
    }));
  }

  private async backfillMissingEntries(): Promise<void> {
    const { data, error } = await supabase.rpc('reprocess_missing_payment_entries');
    if (error) throw error;
    
    window.dispatchEvent(new CustomEvent('accounting-data-updated', {
      detail: { type: 'backfill', data }
    }));
  }

  // طرق للحصول على البيانات
  getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  getRule(id: string): AutomationRule | undefined {
    return this.rules.get(id);
  }

  getLogs(ruleId?: string): AutomationLog[] {
    if (ruleId) {
      return this.logs.filter(log => log.ruleId === ruleId);
    }
    return this.logs;
  }

  updateRule(id: string, updates: Partial<AutomationRule>): void {
    const rule = this.rules.get(id);
    if (rule) {
      Object.assign(rule, updates);
      
      // إعادة جدولة المهمة إذا تم تحديث الجدولة
      if (updates.isActive !== undefined || updates.schedule) {
        if (this.intervals.has(id)) {
          clearInterval(this.intervals.get(id)!);
          this.intervals.delete(id);
        }
        
        if (rule.isActive && rule.type === 'scheduled' && rule.schedule) {
          this.scheduleRule(rule);
        }
      }
    }
  }

  async triggerRule(id: string): Promise<void> {
    const rule = this.rules.get(id);
    if (rule) {
      await this.executeRule(rule);
    }
  }
}

export const automationService = AutomationService.getInstance();