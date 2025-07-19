
import { supabase } from '@/integrations/supabase/client';
import { accountingService } from './accountingService';

export interface AdvancedAutomationRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  rule_description?: string;
  trigger_event: 'contract_created' | 'contract_completed' | 'payment_received' | 'vehicle_maintenance' | 'fuel_purchase' | 'invoice_generated' | 'scheduled' | 'manual_trigger' | 'period_end';
  conditions: Record<string, any>;
  account_mappings: Record<string, any>;
  template_description?: string;
  is_active: boolean;
  schedule_type?: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  schedule_config: Record<string, any>;
  next_execution_date?: string;
  last_execution_date?: string;
  execution_count: number;
  success_count: number;
  failure_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RuleExecutionLog {
  id: string;
  rule_id: string;
  tenant_id: string;
  execution_date: string;
  status: 'success' | 'failed' | 'warning';
  journal_entry_id?: string;
  error_message?: string;
  processing_time_ms?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  created_at: string;
}

export interface AccountingKPI {
  id: string;
  tenant_id: string;
  kpi_type: 'automation_rate' | 'error_rate' | 'processing_time' | 'cost_savings' | 'accuracy_score' | 'coverage_percentage';
  kpi_name: string;
  current_value?: number;
  target_value?: number;
  previous_value?: number;
  calculation_date: string;
  calculation_period: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ErrorCorrectionTool {
  id: string;
  tenant_id: string;
  tool_name: string;
  tool_type: 'duplicate_detector' | 'balance_validator' | 'missing_entry_finder' | 'account_reconciler' | 'pattern_analyzer' | 'anomaly_detector';
  configuration: Record<string, any>;
  is_active: boolean;
  auto_fix_enabled: boolean;
  notification_enabled: boolean;
  last_run_date?: string;
  findings_count: number;
  fixes_applied: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CorrectionLog {
  id: string;
  tenant_id: string;
  tool_id: string;
  detection_date: string;
  error_type: string;
  error_description: string;
  affected_entries: string[];
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'reviewing' | 'fixed' | 'ignored';
  auto_fix_applied: boolean;
  manual_fix_required: boolean;
  correction_details?: Record<string, any>;
  fixed_by?: string;
  fixed_at?: string;
  notes?: string;
  created_at: string;
}

export class AdvancedAutomationService {
  private async getCurrentTenantId(): Promise<string> {
    return await accountingService.getCurrentTenantId();
  }

  // قواعد الأتمتة المتقدمة
  async createAutomationRule(rule: Omit<AdvancedAutomationRule, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'execution_count' | 'success_count' | 'failure_count'>): Promise<AdvancedAutomationRule> {
    const tenantId = await this.getCurrentTenantId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('automated_entry_rules')
      .insert({
        ...rule,
        tenant_id: tenantId,
        created_by: user?.id,
        execution_count: 0,
        success_count: 0,
        failure_count: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data as AdvancedAutomationRule;
  }

  async getAutomationRules(): Promise<AdvancedAutomationRule[]> {
    const { data, error } = await supabase
      .from('automated_entry_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AdvancedAutomationRule[];
  }

  async updateAutomationRule(id: string, updates: Partial<AdvancedAutomationRule>): Promise<AdvancedAutomationRule> {
    const { data, error } = await supabase
      .from('automated_entry_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdvancedAutomationRule;
  }

  async deleteAutomationRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('automated_entry_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async executeAutomationRule(ruleId: string, inputData: Record<string, any> = {}): Promise<string> {
    const { data, error } = await supabase.rpc('execute_automation_rule', {
      rule_id_param: ruleId,
      input_data: inputData
    });

    if (error) throw error;
    return data as string;
  }

  // سجل التنفيذ
  async getRuleExecutionLog(ruleId?: string, limit: number = 50): Promise<RuleExecutionLog[]> {
    let query = supabase
      .from('rule_execution_log')
      .select('*')
      .order('execution_date', { ascending: false })
      .limit(limit);

    if (ruleId) {
      query = query.eq('rule_id', ruleId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as RuleExecutionLog[];
  }

  // مؤشرات الأداء
  async calculateAutomationRate(periodStart: string, periodEnd: string): Promise<number> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase.rpc('calculate_automation_rate', {
      tenant_id_param: tenantId,
      period_start: periodStart,
      period_end: periodEnd
    });

    if (error) throw error;
    return data as number;
  }

  async calculateErrorRate(periodStart: string, periodEnd: string): Promise<number> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase.rpc('calculate_error_rate', {
      tenant_id_param: tenantId,
      period_start: periodStart,
      period_end: periodEnd
    });

    if (error) throw error;
    return data as number;
  }

  async getAccountingKPIs(): Promise<AccountingKPI[]> {
    const { data, error } = await supabase
      .from('accounting_performance_kpis')
      .select('*')
      .order('calculation_date', { ascending: false });

    if (error) throw error;
    return (data || []) as AccountingKPI[];
  }

  async updateKPI(kpiType: string, currentValue: number, targetValue?: number): Promise<AccountingKPI> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('accounting_performance_kpis')
      .upsert({
        tenant_id: tenantId,
        kpi_type: kpiType,
        kpi_name: this.getKPIDisplayName(kpiType),
        current_value: currentValue,
        target_value: targetValue,
        calculation_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as AccountingKPI;
  }

  // أدوات التصحيح
  async getErrorCorrectionTools(): Promise<ErrorCorrectionTool[]> {
    const { data, error } = await supabase
      .from('error_correction_tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ErrorCorrectionTool[];
  }

  async createErrorCorrectionTool(tool: Omit<ErrorCorrectionTool, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'findings_count' | 'fixes_applied'>): Promise<ErrorCorrectionTool> {
    const tenantId = await this.getCurrentTenantId();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('error_correction_tools')
      .insert({
        ...tool,
        tenant_id: tenantId,
        created_by: user?.id,
        findings_count: 0,
        fixes_applied: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data as ErrorCorrectionTool;
  }

  async detectDuplicateEntries(): Promise<any[]> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase.rpc('detect_duplicate_entries', {
      tenant_id_param: tenantId
    });

    if (error) throw error;
    return data || [];
  }

  async detectUnbalancedEntries(): Promise<any[]> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase.rpc('detect_unbalanced_entries', {
      tenant_id_param: tenantId
    });

    if (error) throw error;
    return data || [];
  }

  async getCorrectionLog(toolId?: string): Promise<CorrectionLog[]> {
    let query = supabase
      .from('correction_log')
      .select('*')
      .order('detection_date', { ascending: false });

    if (toolId) {
      query = query.eq('tool_id', toolId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as CorrectionLog[];
  }

  async createCorrectionLog(log: Omit<CorrectionLog, 'id' | 'tenant_id' | 'created_at'>): Promise<CorrectionLog> {
    const tenantId = await this.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('correction_log')
      .insert({
        ...log,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (error) throw error;
    return data as CorrectionLog;
  }

  async updateCorrectionStatus(id: string, status: CorrectionLog['status'], notes?: string): Promise<CorrectionLog> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('correction_log')
      .update({
        status,
        notes,
        fixed_by: status === 'fixed' ? user?.id : undefined,
        fixed_at: status === 'fixed' ? new Date().toISOString() : undefined
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CorrectionLog;
  }

  // الدوال المساعدة
  private getKPIDisplayName(kpiType: string): string {
    const kpiNames: Record<string, string> = {
      'automation_rate': 'معدل الأتمتة',
      'error_rate': 'معدل الأخطاء',
      'processing_time': 'زمن المعالجة',
      'cost_savings': 'توفير التكاليف',
      'accuracy_score': 'درجة الدقة',
      'coverage_percentage': 'نسبة التغطية'
    };
    return kpiNames[kpiType] || kpiType;
  }

  async runScheduledRules(): Promise<void> {
    const now = new Date().toISOString();
    
    const { data: rules, error } = await supabase
      .from('automated_entry_rules')
      .select('*')
      .eq('is_active', true)
      .not('schedule_type', 'is', null)
      .lte('next_execution_date', now);

    if (error) throw error;

    for (const rule of rules || []) {
      try {
        await this.executeAutomationRule(rule.id);
        
        // تحديث موعد التنفيذ التالي
        const nextExecutionDate = this.calculateNextExecutionDate(
          rule.schedule_type as any,
          rule.schedule_config
        );
        
        await this.updateAutomationRule(rule.id, {
          next_execution_date: nextExecutionDate
        });

      } catch (error) {
        console.error(`خطأ في تنفيذ القاعدة ${rule.rule_name}:`, error);
        
        // تحديث عداد الأخطاء
        await this.updateAutomationRule(rule.id, {
          failure_count: rule.failure_count + 1
        });
      }
    }
  }

  private calculateNextExecutionDate(
    scheduleType: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    config: Record<string, any>
  ): string {
    const now = new Date();
    
    switch (scheduleType) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() + 1);
        break;
      case 'once':
      default:
        return null; // لن يتم تنفيذها مرة أخرى
    }
    
    return now.toISOString();
  }
}

export const advancedAutomationService = new AdvancedAutomationService();
