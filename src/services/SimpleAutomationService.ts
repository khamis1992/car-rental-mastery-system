
import { supabase } from '@/integrations/supabase/client';

export interface SimpleAutomationRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  trigger_event: string;
  debit_account_id: string;
  credit_account_id: string;
  description_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SimpleAutomationService {
  async getAutomationRules(): Promise<SimpleAutomationRule[]> {
    console.log('Loading automation rules...');
    
    // نظراً لعدم وجود جداول الأتمتة في قاعدة البيانات،
    // سنقوم بإرجاع بيانات تجريبية
    return [
      {
        id: '1',
        rule_name: 'قيود الفواتير التلقائية',
        rule_description: 'إنشاء قيود تلقائية عند إصدار الفواتير',
        trigger_event: 'invoice_generated',
        debit_account_id: 'acc-001',
        credit_account_id: 'acc-002',
        description_template: 'قيد فاتورة رقم {{invoice_number}}',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        rule_name: 'قيود المدفوعات النقدية',
        rule_description: 'إنشاء قيود تلقائية عند استلام المدفوعات',
        trigger_event: 'payment_received',
        debit_account_id: 'acc-003',
        credit_account_id: 'acc-004',
        description_template: 'قيد دفعة رقم {{payment_id}}',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  async createAutomationRule(rule: Omit<SimpleAutomationRule, 'id' | 'created_at' | 'updated_at'>): Promise<SimpleAutomationRule> {
    console.log('Creating automation rule:', rule);
    
    // محاكاة إنشاء قاعدة جديدة
    const newRule: SimpleAutomationRule = {
      ...rule,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return newRule;
  }

  async updateAutomationRule(id: string, updates: Partial<SimpleAutomationRule>): Promise<SimpleAutomationRule> {
    console.log('Updating automation rule:', id, updates);
    
    // محاكاة تحديث القاعدة
    const updatedRule: SimpleAutomationRule = {
      id,
      rule_name: 'قاعدة محدثة',
      trigger_event: 'invoice_generated',
      debit_account_id: 'acc-001',
      credit_account_id: 'acc-002',
      description_template: 'قيد محدث',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...updates
    };

    return updatedRule;
  }

  async deleteAutomationRule(id: string): Promise<void> {
    console.log('Deleting automation rule:', id);
    // محاكاة حذف القاعدة
  }

  async getExecutionLog(): Promise<any[]> {
    console.log('Loading execution log...');
    
    return [
      {
        id: '1',
        rule_id: '1',
        execution_date: new Date().toISOString(),
        status: 'success',
        journal_entry_id: 'je-001',
        processing_time_ms: 150
      },
      {
        id: '2',
        rule_id: '2',
        execution_date: new Date().toISOString(),
        status: 'success',
        journal_entry_id: 'je-002',
        processing_time_ms: 89
      }
    ];
  }

  async getPerformanceMetrics(): Promise<any> {
    console.log('Loading performance metrics...');
    
    return {
      automation_rate: 85.5,
      error_rate: 2.1,
      processing_time_avg: 120,
      cost_savings: 15000,
      accuracy_score: 97.8
    };
  }
}

export const simpleAutomationService = new SimpleAutomationService();
