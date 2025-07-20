
import { supabase } from "@/integrations/supabase/client";
import { tenantIsolationMiddleware } from "@/middleware/TenantIsolationMiddleware";

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
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
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

      if (error) {
        console.error('خطأ في إنشاء قاعدة التشغيل التلقائي:', error);
        throw error;
      }
      
      return rule as AutomatedEntryRule;
    } catch (error) {
      console.error('خطأ في createRule:', error);
      throw error;
    }
  },

  async getRules(): Promise<AutomatedEntryRule[]> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('automated_entry_rules')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب قواعد التشغيل التلقائي:', error);
        throw error;
      }
      
      return data as AutomatedEntryRule[];
    } catch (error) {
      console.error('خطأ في getRules:', error);
      return [];
    }
  },

  async getActiveRules(triggerEvent?: string): Promise<AutomatedEntryRule[]> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      let query = supabase
        .from('automated_entry_rules')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (triggerEvent) {
        query = query.eq('trigger_event', triggerEvent);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب القواعد النشطة:', error);
        throw error;
      }
      
      return data as AutomatedEntryRule[];
    } catch (error) {
      console.error('خطأ في getActiveRules:', error);
      return [];
    }
  },

  async updateRule(id: string, data: Partial<CreateRuleData>): Promise<AutomatedEntryRule> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { data: rule, error } = await supabase
        .from('automated_entry_rules')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث قاعدة التشغيل التلقائي:', error);
        throw error;
      }
      
      return rule as AutomatedEntryRule;
    } catch (error) {
      console.error('خطأ في updateRule:', error);
      throw error;
    }
  },

  async toggleRuleStatus(id: string): Promise<AutomatedEntryRule> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      // جلب الحالة الحالية
      const { data: currentRule, error: fetchError } = await supabase
        .from('automated_entry_rules')
        .select('is_active')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError) {
        console.error('خطأ في جلب القاعدة الحالية:', fetchError);
        throw fetchError;
      }

      // تغيير الحالة
      const { data: rule, error } = await supabase
        .from('automated_entry_rules')
        .update({
          is_active: !currentRule.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تغيير حالة القاعدة:', error);
        throw error;
      }
      
      return rule as AutomatedEntryRule;
    } catch (error) {
      console.error('خطأ في toggleRuleStatus:', error);
      throw error;
    }
  },

  async deleteRule(id: string): Promise<void> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { error } = await supabase
        .from('automated_entry_rules')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('خطأ في حذف قاعدة التشغيل التلقائي:', error);
        throw error;
      }
    } catch (error) {
      console.error('خطأ في deleteRule:', error);
      throw error;
    }
  },

  async createAutomatedEntry(ruleId: string, referenceType: string, referenceId: string, transactionData: Record<string, any>): Promise<string> {
    try {
      const tenantId = await tenantIsolationMiddleware.getCurrentTenantId();
      
      const { data, error } = await supabase.rpc('create_automated_journal_entry', {
        rule_id: ruleId,
        reference_type: referenceType,
        reference_id: referenceId,
        transaction_data: transactionData
      });

      if (error) {
        console.error('خطأ في إنشاء القيد التلقائي:', error);
        throw error;
      }
      
      return data as string;
    } catch (error) {
      console.error('خطأ في createAutomatedEntry:', error);
      throw error;
    }
  },

  async processEvent(eventType: string, eventData: Record<string, any>): Promise<void> {
    try {
      console.log('🔄 معالجة حدث:', eventType, eventData);
      
      // جلب القواعد النشطة للحدث المحدد
      const rules = await this.getActiveRules(eventType);
      console.log(`📋 تم العثور على ${rules.length} قاعدة نشطة للحدث ${eventType}`);

      for (const rule of rules) {
        try {
          // تحقق من الشروط
          const conditionsMet = this.evaluateConditions(rule.conditions, eventData);
          
          if (conditionsMet) {
            console.log(`✅ تطبيق القاعدة: ${rule.rule_name}`);
            await this.createAutomatedEntry(
              rule.id,
              eventType,
              eventData.reference_id,
              eventData
            );
          } else {
            console.log(`⚠️ الشروط غير متطابقة للقاعدة: ${rule.rule_name}`);
          }
        } catch (error) {
          console.error(`❌ خطأ في تطبيق القاعدة ${rule.rule_name}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ خطأ عام في processEvent:', error);
    }
  },

  evaluateConditions(conditions: Record<string, any>, eventData: Record<string, any>): boolean {
    // تنفيذ منطق تقييم الشروط
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // لا توجد شروط = تطبيق القاعدة
    }

    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (eventData[key] !== expectedValue) {
        console.log(`❌ شرط غير متطابق: ${key} = ${eventData[key]} (متوقع: ${expectedValue})`);
        return false;
      }
    }

    return true;
  }
};
