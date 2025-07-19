import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CostCenter {
  id: string;
  cost_center_code: string;
  cost_center_name: string;
  cost_center_type: string;
  parent_cost_center_id?: string;
  description?: string;
  is_active: boolean;
  budget_amount?: number;
  actual_spent?: number;
  budget_utilization_percentage?: number;
  manager_id?: string;
  department_id?: string;
  location?: string;
  approval_required: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id: string;
}

export interface CostCenterReport {
  id: string;
  cost_center_name: string;
  cost_center_type: string;
  budget_amount: number;
  actual_spent: number;
  variance: number;
  budget_utilization_percentage: number;
}

export interface CostCenterMetrics {
  total_cost_centers: number;
  total_budget: number;
  total_spent: number;
  over_budget_count: number;
  top_spending: any[];
  worst_variance: any[];
  by_type: Record<string, any>;
}

export class CostCenterService {
  private async getCurrentTenantId(): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_current_tenant_id');
      if (error) {
        console.error('Error getting current tenant ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error calling get_current_tenant_id:', error);
      return null;
    }
  }

  private validateUuid(value: string | undefined | null): string | null {
    if (!value || value.trim() === '') {
      return null;
    }
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return null;
    }
    return value;
  }

  async getAllCostCenters(): Promise<CostCenter[]> {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('is_active', true)
        .order('cost_center_code', { ascending: true });

      if (error) {
        console.error('Error fetching cost centers:', error);
        throw new Error('فشل في جلب مراكز التكلفة');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllCostCenters:', error);
      throw error;
    }
  }

  async createCostCenter(costCenterData: Partial<CostCenter>): Promise<CostCenter> {
    try {
      // Validate required fields
      if (!costCenterData.cost_center_name?.trim()) {
        throw new Error('اسم مركز التكلفة مطلوب');
      }

      if (!costCenterData.cost_center_code?.trim()) {
        throw new Error('رمز مركز التكلفة مطلوب');
      }

      if (!costCenterData.cost_center_type?.trim()) {
        throw new Error('نوع مركز التكلفة مطلوب');
      }

      // Get current tenant ID
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        throw new Error('فشل في تحديد المؤسسة الحالية');
      }

      // Prepare data with proper null handling for UUIDs
      const insertData = {
        cost_center_code: costCenterData.cost_center_code.trim(),
        cost_center_name: costCenterData.cost_center_name.trim(),
        cost_center_type: costCenterData.cost_center_type,
        parent_cost_center_id: this.validateUuid(costCenterData.parent_cost_center_id),
        description: costCenterData.description?.trim() || null,
        is_active: costCenterData.is_active ?? true,
        budget_amount: costCenterData.budget_amount || 0,
        actual_spent: 0,
        budget_utilization_percentage: 0,
        manager_id: this.validateUuid(costCenterData.manager_id),
        department_id: this.validateUuid(costCenterData.department_id),
        location: costCenterData.location?.trim() || null,
        approval_required: costCenterData.approval_required ?? false,
        tenant_id: tenantId,
        created_by: (await supabase.auth.getUser()).data?.user?.id || null
      };

      console.log('Creating cost center with data:', insertData);

      const { data, error } = await supabase
        .from('cost_centers')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating cost center:', error);
        
        // Handle specific database errors
        if (error.code === '23505') {
          throw new Error('رمز مركز التكلفة موجود مسبقاً');
        } else if (error.code === '23503') {
          throw new Error('بيانات مرجعية غير صحيحة (المدير أو القسم)');
        } else if (error.message.includes('invalid input syntax for type uuid')) {
          throw new Error('خطأ في البيانات المرجعية - تأكد من صحة البيانات المدخلة');
        } else {
          throw new Error(`فشل في إنشاء مركز التكلفة: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('لم يتم إرجاع بيانات مركز التكلفة المُنشأ');
      }

      return data;
    } catch (error) {
      console.error('Error in createCostCenter:', error);
      throw error;
    }
  }

  async updateCostCenter(id: string, costCenterData: Partial<CostCenter>): Promise<CostCenter> {
    try {
      // Prepare update data with proper null handling
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (costCenterData.cost_center_name?.trim()) {
        updateData.cost_center_name = costCenterData.cost_center_name.trim();
      }

      if (costCenterData.cost_center_code?.trim()) {
        updateData.cost_center_code = costCenterData.cost_center_code.trim();
      }

      if (costCenterData.cost_center_type) {
        updateData.cost_center_type = costCenterData.cost_center_type;
      }

      if (costCenterData.parent_cost_center_id !== undefined) {
        updateData.parent_cost_center_id = this.validateUuid(costCenterData.parent_cost_center_id);
      }

      if (costCenterData.description !== undefined) {
        updateData.description = costCenterData.description?.trim() || null;
      }

      if (costCenterData.is_active !== undefined) {
        updateData.is_active = costCenterData.is_active;
      }

      if (costCenterData.budget_amount !== undefined) {
        updateData.budget_amount = costCenterData.budget_amount;
      }

      if (costCenterData.manager_id !== undefined) {
        updateData.manager_id = this.validateUuid(costCenterData.manager_id);
      }

      if (costCenterData.department_id !== undefined) {
        updateData.department_id = this.validateUuid(costCenterData.department_id);
      }

      if (costCenterData.location !== undefined) {
        updateData.location = costCenterData.location?.trim() || null;
      }

      if (costCenterData.approval_required !== undefined) {
        updateData.approval_required = costCenterData.approval_required;
      }

      const { data, error } = await supabase
        .from('cost_centers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating cost center:', error);
        throw new Error('فشل في تحديث مركز التكلفة');
      }

      return data;
    } catch (error) {
      console.error('Error in updateCostCenter:', error);
      throw error;
    }
  }

  async deleteCostCenter(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cost_centers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting cost center:', error);
        throw new Error('فشل في حذف مركز التكلفة');
      }

      return true;
    } catch (error) {
      console.error('Error in deleteCostCenter:', error);
      throw error;
    }
  }

  async getCostCenterReport(): Promise<CostCenterReport[]> {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select(`
          id,
          cost_center_name,
          cost_center_type,
          budget_amount,
          actual_spent
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching cost center report:', error);
        throw new Error('فشل في جلب تقرير مراكز التكلفة');
      }

      return (data || []).map(center => ({
        ...center,
        variance: (center.actual_spent || 0) - (center.budget_amount || 0),
        budget_utilization_percentage: center.budget_amount > 0 
          ? ((center.actual_spent || 0) / center.budget_amount) * 100 
          : 0
      }));
    } catch (error) {
      console.error('Error in getCostCenterReport:', error);
      throw error;
    }
  }

  async getCostCenterMetrics(): Promise<CostCenterMetrics> {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching cost center metrics:', error);
        throw new Error('فشل في جلب مؤشرات مراكز التكلفة');
      }

      const centers = data || [];
      const totalBudget = centers.reduce((sum, c) => sum + (c.budget_amount || 0), 0);
      const totalSpent = centers.reduce((sum, c) => sum + (c.actual_spent || 0), 0);
      const overBudgetCount = centers.filter(c => (c.actual_spent || 0) > (c.budget_amount || 0)).length;

      // Top spending centers
      const topSpending = centers
        .sort((a, b) => (b.actual_spent || 0) - (a.actual_spent || 0))
        .slice(0, 5)
        .map(c => ({
          ...c,
          budget_utilization_percentage: c.budget_amount > 0 ? ((c.actual_spent || 0) / c.budget_amount) * 100 : 0
        }));

      // Worst variance centers
      const worstVariance = centers
        .map(c => ({
          ...c,
          variance: (c.actual_spent || 0) - (c.budget_amount || 0)
        }))
        .filter(c => c.variance > 0)
        .sort((a, b) => b.variance - a.variance)
        .slice(0, 5);

      // Group by type
      const byType: Record<string, any> = {};
      centers.forEach(center => {
        const type = center.cost_center_type || 'غير محدد';
        if (!byType[type]) {
          byType[type] = { count: 0, budget: 0, spent: 0 };
        }
        byType[type].count++;
        byType[type].budget += center.budget_amount || 0;
        byType[type].spent += center.actual_spent || 0;
      });

      return {
        total_cost_centers: centers.length,
        total_budget: totalBudget,
        total_spent: totalSpent,
        over_budget_count: overBudgetCount,
        top_spending: topSpending,
        worst_variance: worstVariance,
        by_type: byType
      };
    } catch (error) {
      console.error('Error in getCostCenterMetrics:', error);
      throw error;
    }
  }

  async updateAllCostCenterCosts(): Promise<boolean> {
    try {
      // This would typically involve complex calculations based on actual transactions
      // For now, we'll return true to indicate the operation completed
      return true;
    } catch (error) {
      console.error('Error in updateAllCostCenterCosts:', error);
      throw error;
    }
  }

  async getSettingsByType(settingType: string): Promise<CostCenterSetting[]> {
    try {
      const { data, error } = await supabase
        .from('cost_center_settings')
        .select('*')
        .eq('setting_type', settingType)
        .eq('is_active', true)
        .order('setting_key', { ascending: true });

      if (error) {
        console.error('Error fetching settings by type:', error);
        throw new Error('فشل في جلب الإعدادات');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSettingsByType:', error);
      throw error;
    }
  }

  async updateSetting(settingKey: string, value: any): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_cost_center_setting', {
        setting_key_param: settingKey,
        new_value: value
      });

      if (error) {
        console.error('Error updating setting:', error);
        throw new Error('فشل في تحديث الإعداد');
      }

      return true;
    } catch (error) {
      console.error('Error in updateSetting:', error);
      throw error;
    }
  }

  async getSetting(settingKey: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cost_center_setting', {
        setting_key_param: settingKey
      });

      if (error) {
        console.error('Error getting setting:', error);
        throw new Error('فشل في جلب الإعداد');
      }

      return data;
    } catch (error) {
      console.error('Error in getSetting:', error);
      throw error;
    }
  }

  async getGroupedSettings(): Promise<SettingGroup[]> {
    try {
      const settings = await this.getAllSettings();
      
      const groups: { [key: string]: SettingGroup } = {
        automation: {
          type: 'automation',
          title: 'الأتمتة',
          description: 'إعدادات العمليات التلقائية',
          settings: []
        },
        defaults: {
          type: 'defaults',
          title: 'القيم الافتراضية',
          description: 'القيم الافتراضية للنظام',
          settings: []
        },
        alerts: {
          type: 'alerts',
          title: 'التنبيهات',
          description: 'إعدادات التنبيهات والإشعارات',
          settings: []
        },
        approvals: {
          type: 'approvals',
          title: 'الموافقات',
          description: 'إعدادات سير عمل الموافقات',
          settings: []
        },
        structure: {
          type: 'structure',
          title: 'الهيكل',
          description: 'إعدادات هيكل مراكز التكلفة',
          settings: []
        },
        reporting: {
          type: 'reporting',
          title: 'التقارير',
          description: 'إعدادات التقارير والإحصائيات',
          settings: []
        }
      };

      settings.forEach(setting => {
        if (groups[setting.setting_type]) {
          groups[setting.setting_type].settings.push(setting);
        }
      });

      return Object.values(groups).filter(group => group.settings.length > 0);
    } catch (error) {
      console.error('Error in getGroupedSettings:', error);
      throw error;
    }
  }

  async resetToDefaults(): Promise<boolean> {
    try {
      const defaultSettings = [
        { key: 'auto_allocation_enabled', value: true },
        { key: 'default_cost_center_type', value: 'operational' },
        { key: 'budget_alert_threshold', value: 80 },
        { key: 'auto_budget_calculation', value: false },
        { key: 'cost_update_frequency', value: 'daily' },
        { key: 'require_approval_for_budget_changes', value: true },
        { key: 'default_currency', value: 'KWD' },
        { key: 'enable_hierarchy', value: true },
        { key: 'max_hierarchy_levels', value: 5 },
        { key: 'enable_cost_center_reports', value: true }
      ];

      for (const setting of defaultSettings) {
        await this.updateSetting(setting.key, setting.value);
      }

      return true;
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      throw error;
    }
  }
}
