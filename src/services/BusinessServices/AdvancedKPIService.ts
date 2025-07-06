import { supabase } from '@/integrations/supabase/client';

export interface AdvancedKPI {
  id: string;
  kpi_code: string;
  kpi_name_ar: string;
  kpi_name_en?: string;
  category: string;
  department_id?: string;
  calculation_formula: string;
  target_value?: number;
  current_value: number;
  previous_value: number;
  calculation_period: string;
  last_calculated_at?: string;
  is_automated: boolean;
  alert_threshold_high?: number;
  alert_threshold_low?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateKPIData {
  kpi_code: string;
  kpi_name_ar: string;
  kpi_name_en?: string;
  category: string;
  department_id?: string;
  calculation_formula: string;
  target_value?: number;
  calculation_period?: string;
  is_automated?: boolean;
  alert_threshold_high?: number;
  alert_threshold_low?: number;
}

export interface KPIMetrics {
  total_kpis: number;
  automated_kpis: number;
  categories: Record<string, number>;
  departments: Record<string, number>;
  alerts: {
    high_alerts: number;
    low_alerts: number;
    total_alerts: number;
  };
  performance: {
    above_target: number;
    below_target: number;
    on_target: number;
  };
}

export class AdvancedKPIService {

  async getAllKPIs(): Promise<AdvancedKPI[]> {
    const { data, error } = await supabase
      .from('advanced_kpis')
      .select(`
        *,
        departments(department_name)
      `)
      .order('category')
      .order('kpi_name_ar');

    if (error) {
      console.error('Error fetching advanced KPIs:', error);
      throw new Error(`فشل في جلب المؤشرات المتقدمة: ${error.message}`);
    }

    return data || [];
  }

  async getKPIsByCategory(category: string): Promise<AdvancedKPI[]> {
    const { data, error } = await supabase
      .from('advanced_kpis')
      .select(`
        *,
        departments(department_name)
      `)
      .eq('category', category)
      .order('kpi_name_ar');

    if (error) {
      console.error('Error fetching KPIs by category:', error);
      throw new Error(`فشل في جلب المؤشرات حسب الفئة: ${error.message}`);
    }

    return data || [];
  }

  async getKPIsByDepartment(departmentId: string): Promise<AdvancedKPI[]> {
    const { data, error } = await supabase
      .from('advanced_kpis')
      .select(`
        *,
        departments(department_name)
      `)
      .eq('department_id', departmentId)
      .order('kpi_name_ar');

    if (error) {
      console.error('Error fetching KPIs by department:', error);
      throw new Error(`فشل في جلب مؤشرات القسم: ${error.message}`);
    }

    return data || [];
  }

  async getKPIById(id: string): Promise<AdvancedKPI | null> {
    const { data, error } = await supabase
      .from('advanced_kpis')
      .select(`
        *,
        departments(department_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching KPI by ID:', error);
      throw new Error(`فشل في جلب المؤشر: ${error.message}`);
    }

    return data;
  }

  async createKPI(kpiData: CreateKPIData): Promise<AdvancedKPI> {
    const { data, error } = await supabase
      .from('advanced_kpis')
      .insert([{
        ...kpiData,
        calculation_period: kpiData.calculation_period || 'monthly',
        is_automated: kpiData.is_automated ?? true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating KPI:', error);
      throw new Error(`فشل في إنشاء المؤشر: ${error.message}`);
    }

    return data;
  }

  async updateKPI(id: string, updates: Partial<CreateKPIData>): Promise<void> {
    const { error } = await supabase
      .from('advanced_kpis')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating KPI:', error);
      throw new Error(`فشل في تحديث المؤشر: ${error.message}`);
    }
  }

  async calculateKPI(kpiCode: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_advanced_kpi', {
      kpi_code_param: kpiCode
    });

    if (error) {
      console.error('Error calculating KPI:', error);
      throw new Error(`فشل في حساب المؤشر: ${error.message}`);
    }

    return data || 0;
  }

  async calculateAllKPIs(): Promise<{ kpi_code: string; calculated_value: number; status: string }[]> {
    const { data, error } = await supabase.rpc('calculate_all_kpis');

    if (error) {
      console.error('Error calculating all KPIs:', error);
      throw new Error(`فشل في حساب جميع المؤشرات: ${error.message}`);
    }

    return data || [];
  }

  async getKPIMetrics(): Promise<KPIMetrics> {
    const { data, error } = await supabase
      .from('advanced_kpis')
      .select(`
        category,
        department_id,
        current_value,
        target_value,
        alert_threshold_high,
        alert_threshold_low,
        is_automated,
        departments(department_name)
      `);

    if (error) {
      console.error('Error fetching KPI metrics:', error);
      throw new Error(`فشل في جلب إحصائيات المؤشرات: ${error.message}`);
    }

    const metrics: KPIMetrics = {
      total_kpis: data.length,
      automated_kpis: data.filter(k => k.is_automated).length,
      categories: {},
      departments: {},
      alerts: {
        high_alerts: 0,
        low_alerts: 0,
        total_alerts: 0
      },
      performance: {
        above_target: 0,
        below_target: 0,
        on_target: 0
      }
    };

    data.forEach(kpi => {
      // تجميع حسب الفئة
      if (!metrics.categories[kpi.category]) {
        metrics.categories[kpi.category] = 0;
      }
      metrics.categories[kpi.category]++;

      // تجميع حسب القسم
      const deptName = kpi.departments?.department_name || 'غير محدد';
      if (!metrics.departments[deptName]) {
        metrics.departments[deptName] = 0;
      }
      metrics.departments[deptName]++;

      // حساب التنبيهات
      if (kpi.alert_threshold_high && kpi.current_value > kpi.alert_threshold_high) {
        metrics.alerts.high_alerts++;
      }
      if (kpi.alert_threshold_low && kpi.current_value < kpi.alert_threshold_low) {
        metrics.alerts.low_alerts++;
      }

      // حساب الأداء مقارنة بالهدف
      if (kpi.target_value) {
        const variance = Math.abs(kpi.current_value - kpi.target_value) / kpi.target_value * 100;
        if (variance <= 5) { // ضمن 5% من الهدف
          metrics.performance.on_target++;
        } else if (kpi.current_value > kpi.target_value) {
          metrics.performance.above_target++;
        } else {
          metrics.performance.below_target++;
        }
      }
    });

    metrics.alerts.total_alerts = metrics.alerts.high_alerts + metrics.alerts.low_alerts;

    return metrics;
  }

  async getKPIHistory(kpiCode: string, days: number = 30): Promise<any[]> {
    // في المستقبل، يمكن إضافة جدول لتاريخ المؤشرات
    // حالياً نعيد بيانات وهمية للتوضيح
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // سيتم تطبيق هذا لاحقاً مع جدول kpi_history
    return [];
  }

  async getKPIAlerts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('advanced_kpis')
      .select('*')
      .or(`
        and(alert_threshold_high.not.is.null,current_value.gt.alert_threshold_high),
        and(alert_threshold_low.not.is.null,current_value.lt.alert_threshold_low)
      `);

    if (error) {
      console.error('Error fetching KPI alerts:', error);
      throw new Error(`فشل في جلب تنبيهات المؤشرات: ${error.message}`);
    }

    return data.map(kpi => ({
      kpi_id: kpi.id,
      kpi_code: kpi.kpi_code,
      kpi_name: kpi.kpi_name_ar,
      current_value: kpi.current_value,
      threshold_high: kpi.alert_threshold_high,
      threshold_low: kpi.alert_threshold_low,
      alert_type: kpi.current_value > (kpi.alert_threshold_high || Infinity) ? 'high' : 'low',
      severity: this.calculateAlertSeverity(kpi.current_value, kpi.alert_threshold_high, kpi.alert_threshold_low)
    }));
  }

  private calculateAlertSeverity(currentValue: number, thresholdHigh?: number, thresholdLow?: number): string {
    if (thresholdHigh && currentValue > thresholdHigh) {
      const exceedPercent = ((currentValue - thresholdHigh) / thresholdHigh) * 100;
      if (exceedPercent > 50) return 'critical';
      if (exceedPercent > 25) return 'high';
      return 'medium';
    }
    
    if (thresholdLow && currentValue < thresholdLow) {
      const deficitPercent = ((thresholdLow - currentValue) / thresholdLow) * 100;
      if (deficitPercent > 50) return 'critical';
      if (deficitPercent > 25) return 'high';
      return 'medium';
    }
    
    return 'low';
  }

  async deleteKPI(id: string): Promise<void> {
    const { error } = await supabase
      .from('advanced_kpis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting KPI:', error);
      throw new Error(`فشل في حذف المؤشر: ${error.message}`);
    }
  }

  async toggleKPIAutomation(id: string, isAutomated: boolean): Promise<void> {
    const { error } = await supabase
      .from('advanced_kpis')
      .update({ 
        is_automated: isAutomated,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error toggling KPI automation:', error);
      throw new Error(`فشل في تغيير إعدادات المؤشر: ${error.message}`);
    }
  }
}