import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CostCenterSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  description?: string;
  is_active: boolean;
  requires_restart: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingGroup {
  type: string;
  title: string;
  description: string;
  settings: CostCenterSetting[];
}

export class CostCenterSettingsService {
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

  async getAllSettings(): Promise<CostCenterSetting[]> {
    try {
      const { data, error } = await supabase
        .from('cost_center_settings')
        .select('*')
        .eq('is_active', true)
        .order('setting_type', { ascending: true })
        .order('setting_key', { ascending: true });

      if (error) {
        console.error('Error fetching cost center settings:', error);
        throw new Error('فشل في جلب إعدادات مراكز التكلفة');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllSettings:', error);
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

  async getMetrics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_cost_center_metrics' as any);

      if (error) {
        console.error('Error getting cost center metrics:', error);
        throw new Error('فشل في جلب مؤشرات الأداء');
      }

      return data;
    } catch (error) {
      console.error('Error in getMetrics:', error);
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
