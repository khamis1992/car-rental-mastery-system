import { supabase } from "@/integrations/supabase/client";
import { accountingService } from "./accountingService";

export interface AutomatedEntryRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  trigger_event: 'contract_created' | 'contract_completed' | 'payment_received' | 'vehicle_maintenance' | 'fuel_purchase';
  conditions: Record<string, any>;
  account_mappings: Record<string, any>;
  template_description?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleData {
  rule_name: string;
  trigger_event: AutomatedEntryRule['trigger_event'];
  conditions?: Record<string, any>;
  account_mappings: Record<string, any>;
  template_description?: string;
  is_active?: boolean;
}

export const automatedEntryRulesService = {
  async createRule(data: CreateRuleData): Promise<AutomatedEntryRule> {
    const tenantId = await accountingService.getCurrentTenantId();
    
    const { data: rule, error } = await supabase
      .from('automated_entry_rules')
      .insert({
        tenant_id: tenantId,
        rule_name: data.rule_name,
        trigger_event: data.trigger_event,
        conditions: data.conditions || {},
        account_mappings: data.account_mappings,
        template_description: data.template_description,
        is_active: data.is_active !== false
      })
      .select()
      .single();

    if (error) throw error;
    return rule as AutomatedEntryRule;
  },

  async getRules(): Promise<AutomatedEntryRule[]> {
    const { data, error } = await supabase
      .from('automated_entry_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AutomatedEntryRule[];
  },

  async getActiveRules(triggerEvent?: string): Promise<AutomatedEntryRule[]> {
    let query = supabase
      .from('automated_entry_rules')
      .select('*')
      .eq('is_active', true);

    if (triggerEvent) {
      query = query.eq('trigger_event', triggerEvent);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as AutomatedEntryRule[];
  },

  async updateRule(id: string, data: Partial<CreateRuleData>): Promise<AutomatedEntryRule> {
    const { data: rule, error } = await supabase
      .from('automated_entry_rules')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return rule as AutomatedEntryRule;
  },

  async toggleRuleStatus(id: string): Promise<AutomatedEntryRule> {
    // جلب الحالة الحالية
    const { data: currentRule, error: fetchError } = await supabase
      .from('automated_entry_rules')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // تغيير الحالة
    const { data: rule, error } = await supabase
      .from('automated_entry_rules')
      .update({
        is_active: !currentRule.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return rule as AutomatedEntryRule;
  },

  async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('automated_entry_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createAutomatedEntry(ruleId: string, referenceType: string, referenceId: string, transactionData: Record<string, any>): Promise<string> {
    const { data, error } = await supabase.rpc('create_automated_journal_entry', {
      rule_id: ruleId,
      reference_type: referenceType,
      reference_id: referenceId,
      transaction_data: transactionData
    });

    if (error) throw error;
    return data as string;
  },

  async processEvent(eventType: string, eventData: Record<string, any>): Promise<void> {
    // جلب القواعد النشطة للحدث المحدد
    const rules = await this.getActiveRules(eventType);

    for (const rule of rules) {
      try {
        // تحقق من الشروط
        const conditionsMet = this.evaluateConditions(rule.conditions, eventData);
        
        if (conditionsMet) {
          await this.createAutomatedEntry(
            rule.id,
            eventType,
            eventData.reference_id,
            eventData
          );
        }
      } catch (error) {
        console.error(`خطأ في تطبيق القاعدة ${rule.rule_name}:`, error);
      }
    }
  },

  evaluateConditions(conditions: Record<string, any>, eventData: Record<string, any>): boolean {
    // تنفيذ منطق تقييم الشروط
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // لا توجد شروط = تطبيق القاعدة
    }

    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (eventData[key] !== expectedValue) {
        return false;
      }
    }

    return true;
  }
};