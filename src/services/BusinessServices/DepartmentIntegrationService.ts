import { supabase } from '@/integrations/supabase/client';

export interface DepartmentIntegration {
  id: string;
  department_id: string;
  integration_type: string;
  reference_table: string;
  reference_id: string;
  status: string;
  priority_level: number;
  assigned_employee_id?: string;
  due_date?: string;
  completion_date?: string;
  notes?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentIntegrationData {
  department_id: string;
  integration_type: string;
  reference_table: string;
  reference_id: string;
  priority_level?: number;
  assigned_employee_id?: string;
  due_date?: string;
  notes?: string;
  metadata?: any;
}

export class DepartmentIntegrationService {
  
  async getAllIntegrations(): Promise<DepartmentIntegration[]> {
    const { data, error } = await supabase
      .from('department_integrations')
      .select(`
        *,
        departments(department_name),
        employees(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching department integrations:', error);
      throw new Error(`فشل في جلب تكاملات الأقسام: ${error.message}`);
    }

    return data || [];
  }

  async getIntegrationsByDepartment(departmentId: string): Promise<DepartmentIntegration[]> {
    const { data, error } = await supabase
      .from('department_integrations')
      .select(`
        *,
        departments(department_name),
        employees(first_name, last_name)
      `)
      .eq('department_id', departmentId)
      .order('priority_level', { ascending: true });

    if (error) {
      console.error('Error fetching department integrations by department:', error);
      throw new Error(`فشل في جلب تكاملات القسم: ${error.message}`);
    }

    return data || [];
  }

  async getIntegrationsByType(integrationType: string): Promise<DepartmentIntegration[]> {
    const { data, error } = await supabase
      .from('department_integrations')
      .select(`
        *,
        departments(department_name),
        employees(first_name, last_name)
      `)
      .eq('integration_type', integrationType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching integrations by type:', error);
      throw new Error(`فشل في جلب التكاملات حسب النوع: ${error.message}`);
    }

    return data || [];
  }

  async createIntegration(integrationData: CreateDepartmentIntegrationData): Promise<DepartmentIntegration> {
    const { data, error } = await supabase
      .from('department_integrations')
      .insert([integrationData])
      .select()
      .single();

    if (error) {
      console.error('Error creating department integration:', error);
      throw new Error(`فشل في إنشاء تكامل القسم: ${error.message}`);
    }

    return data;
  }

  async updateIntegrationStatus(id: string, status: string, completionDate?: string): Promise<void> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    
    if (completionDate) {
      updateData.completion_date = completionDate;
    }

    const { error } = await supabase
      .from('department_integrations')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating integration status:', error);
      throw new Error(`فشل في تحديث حالة التكامل: ${error.message}`);
    }
  }

  async assignToEmployee(id: string, employeeId: string): Promise<void> {
    const { error } = await supabase
      .from('department_integrations')
      .update({ 
        assigned_employee_id: employeeId, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Error assigning integration to employee:', error);
      throw new Error(`فشل في تعيين التكامل للموظف: ${error.message}`);
    }
  }

  async getIntegrationMetrics() {
    const { data, error } = await supabase
      .from('department_integrations')
      .select('status, integration_type, priority_level');

    if (error) {
      console.error('Error fetching integration metrics:', error);
      throw new Error(`فشل في جلب إحصائيات التكامل: ${error.message}`);
    }

    const metrics = {
      total: data.length,
      active: data.filter(i => i.status === 'active').length,
      completed: data.filter(i => i.status === 'completed').length,
      pending: data.filter(i => i.status === 'pending').length,
      high_priority: data.filter(i => i.priority_level === 1).length,
      by_type: {} as Record<string, number>
    };

    // تجميع حسب النوع
    data.forEach(integration => {
      if (!metrics.by_type[integration.integration_type]) {
        metrics.by_type[integration.integration_type] = 0;
      }
      metrics.by_type[integration.integration_type]++;
    });

    return metrics;
  }

  async deleteIntegration(id: string): Promise<void> {
    const { error } = await supabase
      .from('department_integrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting integration:', error);
      throw new Error(`فشل في حذف التكامل: ${error.message}`);
    }
  }
}