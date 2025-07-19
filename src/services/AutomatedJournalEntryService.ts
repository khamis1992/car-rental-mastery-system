import { supabase } from '@/integrations/supabase/client';
import { accountingService } from './accountingService';

export interface AutomationRule {
  id: string;
  rule_name: string;
  trigger_event: 'invoice_generated' | 'payment_received' | 'expense_recorded' | 'contract_signed' | 'rental_completed';
  conditions: {
    invoice_type?: string;
    payment_method?: string;
    expense_category?: string;
    contract_type?: string;
    amount_range?: { min: number; max: number };
  };
  account_mappings: {
    debit_account_id: string;
    credit_account_id: string;
    description_template: string;
  };
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  execution_count: number;
  last_executed: string | null;
  success_rate: number;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  triggered_by: string;
  reference_id: string;
  reference_type: string;
  journal_entry_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  executed_at: string;
  execution_time_ms: number;
}

export class AutomatedJournalEntryService {
  private async getCurrentTenantId(): Promise<string> {
    return await accountingService.getCurrentTenantId();
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('journal_automation_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []) as AutomationRule[];
  }

  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_executed' | 'success_rate'>): Promise<AutomationRule> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('journal_automation_rules')
      .insert({
        ...rule,
        tenant_id: tenantId,
        execution_count: 0,
        success_rate: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data as AutomationRule;
  }

  async updateAutomationRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('journal_automation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AutomationRule;
  }

  async deleteAutomationRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('journal_automation_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleRuleStatus(id: string, isActive: boolean): Promise<AutomationRule> {
    return await this.updateAutomationRule(id, { is_active: isActive });
  }

  async executeRule(ruleId: string, triggerData: {
    reference_id: string;
    reference_type: string;
    amount: number;
    description?: string;
    additional_data?: any;
  }): Promise<string> {
    const startTime = Date.now();
    
    try {
      // جلب قاعدة الأتمتة
      const { data: rule, error: ruleError } = await supabase
        .from('journal_automation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (ruleError || !rule) {
        throw new Error('لم يتم العثور على قاعدة الأتمتة');
      }

      if (!rule.is_active) {
        throw new Error('قاعدة الأتمتة غير نشطة');
      }

      // التحقق من الشروط
      if (!this.checkConditions(rule.conditions, triggerData)) {
        throw new Error('لا تتطابق الشروط مع البيانات المحفزة');
      }

      // إنشاء القيد المحاسبي
      const accountMappings = rule.account_mappings as any;
      const journalEntry = await accountingService.createJournalEntry({
        entry_date: new Date().toISOString().split('T')[0],
        description: this.generateDescription(accountMappings.description_template, triggerData),
        reference_type: 'manual',
        reference_id: triggerData.reference_id,
        total_debit: triggerData.amount,
        total_credit: triggerData.amount,
        status: 'posted'
      });

      // إضافة سطور القيد
      await accountingService.createJournalEntryLine({
        journal_entry_id: journalEntry.id,
        account_id: accountMappings.debit_account_id,
        description: `مدين - ${journalEntry.description}`,
        debit_amount: triggerData.amount,
        credit_amount: 0,
        line_number: 1
      });

      await accountingService.createJournalEntryLine({
        journal_entry_id: journalEntry.id,
        account_id: accountMappings.credit_account_id,
        description: `دائن - ${journalEntry.description}`,
        debit_amount: 0,
        credit_amount: triggerData.amount,
        line_number: 2
      });

      // تسجيل التنفيذ
      await this.recordExecution(ruleId, triggerData, journalEntry.id, 'completed', null, Date.now() - startTime);

      // تحديث إحصائيات القاعدة
      await this.updateRuleStats(ruleId, true);

      return journalEntry.id;
    } catch (error) {
      await this.recordExecution(ruleId, triggerData, null, 'failed', error instanceof Error ? error.message : 'Unknown error', Date.now() - startTime);
      await this.updateRuleStats(ruleId, false);
      throw error;
    }
  }

  private checkConditions(conditions: any, triggerData: any): boolean {
    // التحقق من نوع الفاتورة
    if (conditions.invoice_type && triggerData.invoice_type !== conditions.invoice_type) {
      return false;
    }

    // التحقق من طريقة الدفع
    if (conditions.payment_method && triggerData.payment_method !== conditions.payment_method) {
      return false;
    }

    // التحقق من فئة المصروف
    if (conditions.expense_category && triggerData.expense_category !== conditions.expense_category) {
      return false;
    }

    // التحقق من نطاق المبلغ
    if (conditions.amount_range) {
      const { min, max } = conditions.amount_range;
      if (triggerData.amount < min || triggerData.amount > max) {
        return false;
      }
    }

    return true;
  }

  private generateDescription(template: string, triggerData: any): string {
    return template
      .replace('{{reference_id}}', triggerData.reference_id)
      .replace('{{amount}}', triggerData.amount.toFixed(3))
      .replace('{{description}}', triggerData.description || '')
      .replace('{{date}}', new Date().toLocaleDateString('ar-SA'));
  }

  private async recordExecution(
    ruleId: string,
    triggerData: any,
    journalEntryId: string | null,
    status: 'pending' | 'completed' | 'failed',
    errorMessage: string | null,
    executionTimeMs: number
  ): Promise<void> {
    const { error } = await supabase
      .from('journal_automation_executions')
      .insert({
        rule_id: ruleId,
        triggered_by: triggerData.reference_type,
        reference_id: triggerData.reference_id,
        reference_type: triggerData.reference_type,
        journal_entry_id: journalEntryId,
        status,
        error_message: errorMessage,
        execution_time_ms: executionTimeMs
      });

    if (error) {
      console.error('خطأ في تسجيل تنفيذ الأتمتة:', error);
    }
  }

  private async updateRuleStats(ruleId: string, success: boolean): Promise<void> {
    const { data: rule, error: fetchError } = await supabase
      .from('journal_automation_rules')
      .select('execution_count, success_rate')
      .eq('id', ruleId)
      .single();

    if (fetchError || !rule) return;

    const newExecutionCount = rule.execution_count + 1;
    const currentSuccessCount = Math.round((rule.success_rate / 100) * rule.execution_count);
    const newSuccessCount = success ? currentSuccessCount + 1 : currentSuccessCount;
    const newSuccessRate = (newSuccessCount / newExecutionCount) * 100;

    await supabase
      .from('journal_automation_rules')
      .update({
        execution_count: newExecutionCount,
        success_rate: newSuccessRate,
        last_executed: new Date().toISOString()
      })
      .eq('id', ruleId);
  }

  async getExecutionHistory(ruleId?: string): Promise<AutomationExecution[]> {
    const tenantId = await this.getCurrentTenantId();
    
    let query = supabase
      .from('journal_automation_executions')
      .select(`
        *,
        rule:journal_automation_rules!inner(rule_name, tenant_id)
      `)
      .eq('rule.tenant_id', tenantId)
      .order('executed_at', { ascending: false });

    if (ruleId) {
      query = query.eq('rule_id', ruleId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as AutomationExecution[];
  }

  // إنشاء قواعد افتراضية للمؤسسة الجديدة
  async createDefaultRules(): Promise<void> {
    const tenantId = await this.getCurrentTenantId();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('المستخدم غير مصادق عليه');

    // جلب الحسابات المتاحة
    const accounts = await accountingService.getChartOfAccounts();
    
    // البحث عن الحسابات المطلوبة
    const cashAccount = accounts.find(a => a.account_code.includes('1110101'));
    const receivablesAccount = accounts.find(a => a.account_code.includes('11201'));
    const revenueAccount = accounts.find(a => a.account_code.includes('4101'));
    const fuelExpenseAccount = accounts.find(a => a.account_code.includes('5101'));
    const bankAccount = accounts.find(a => a.account_code.includes('1110201'));

    const defaultRules = [
      {
        rule_name: 'قيود إيراد التأجير التلقائية',
        trigger_event: 'invoice_generated' as const,
        conditions: { invoice_type: 'rental' },
        account_mappings: {
          debit_account_id: receivablesAccount?.id || '',
          credit_account_id: revenueAccount?.id || '',
          description_template: 'إيراد تأجير - فاتورة رقم {{reference_id}}'
        },
        is_active: true,
        tenant_id: tenantId,
        created_by: user.id
      },
      {
        rule_name: 'قيود المدفوعات النقدية',
        trigger_event: 'payment_received' as const,
        conditions: { payment_method: 'cash' },
        account_mappings: {
          debit_account_id: cashAccount?.id || '',
          credit_account_id: receivablesAccount?.id || '',
          description_template: 'دفع نقدي - رقم {{reference_id}}'
        },
        is_active: true,
        tenant_id: tenantId,
        created_by: user.id
      },
      {
        rule_name: 'قيود مصروفات الوقود',
        trigger_event: 'expense_recorded' as const,
        conditions: { expense_category: 'fuel' },
        account_mappings: {
          debit_account_id: fuelExpenseAccount?.id || '',
          credit_account_id: bankAccount?.id || '',
          description_template: 'مصروف وقود - {{reference_id}}'
        },
        is_active: true,
        tenant_id: tenantId,
        created_by: user.id
      }
    ];

    // إدراج القواعد الافتراضية
    for (const rule of defaultRules) {
      if (rule.account_mappings.debit_account_id && rule.account_mappings.credit_account_id) {
        await this.createAutomationRule(rule);
      }
    }
  }

  // تشغيل قواعد الأتمتة بناءً على الحدث
  async triggerAutomation(event: AutomationRule['trigger_event'], triggerData: any): Promise<void> {
    const rules = await this.getAutomationRules();
    const activeRules = rules.filter(rule => rule.is_active && rule.trigger_event === event);

    const promises = activeRules.map(async (rule) => {
      try {
        await this.executeRule(rule.id, triggerData);
        console.log(`✅ تم تنفيذ قاعدة الأتمتة: ${rule.rule_name}`);
      } catch (error) {
        console.error(`❌ فشل في تنفيذ قاعدة الأتمتة: ${rule.rule_name}`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}