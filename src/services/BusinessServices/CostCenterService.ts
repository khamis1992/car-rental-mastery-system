import { supabase } from '@/integrations/supabase/client';
import { UserHelperService } from './UserHelperService';

export interface CostCenter {
  id: string;
  cost_center_code: string;
  cost_center_name: string;
  description?: string;
  cost_center_type: string;
  cost_center_category?: string;
  manager_id?: string;
  budget_amount: number;
  actual_spent: number;
  department_id?: string;
  parent_id?: string;
  level: number;
  hierarchy_path: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CostCenterAllocation {
  id: string;
  reference_type: string;
  reference_id: string;
  cost_center_id: string;
  allocation_percentage: number;
  allocation_amount: number;
  allocation_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  reference_details?: string; // إضافة الحقل الجديد
}

export interface CostCenterReport {
  id: string;
  cost_center_code: string;
  cost_center_name: string;
  cost_center_type: string;
  level: number;
  hierarchy_path: string;
  budget_amount: number;
  actual_spent: number;
  variance: number;
  budget_utilization_percentage: number;
  department_name?: string;
  manager_name?: string;
  employee_count: number;
  contract_count: number;
  vehicle_count: number;
}

export interface CreateCostCenterData {
  cost_center_code: string;
  cost_center_name: string;
  description?: string;
  cost_center_type: 'operational' | 'administrative' | 'revenue' | 'support';
  cost_center_category?: string;
  manager_id?: string;
  budget_amount?: number;
  department_id?: string;
  parent_id?: string;
}

export class CostCenterService {

  async getAllCostCenters(): Promise<CostCenter[]> {
    const { data, error } = await supabase
      .from('cost_centers')
      .select(`
        *,
        manager:employees!manager_id(first_name, last_name),
        department:departments(department_name),
        parent_cost_center:cost_centers!parent_id(cost_center_name)
      `)
      .eq('is_active', true)
      .order('hierarchy_path');

    if (error) {
      console.error('Error fetching cost centers:', error);
      throw new Error(`فشل في جلب مراكز التكلفة: ${error.message}`);
    }

    return data || [];
  }

  async getCostCenterById(id: string): Promise<CostCenter | null> {
    const { data, error } = await supabase
      .from('cost_centers')
      .select(`
        *,
        manager:employees!manager_id(first_name, last_name),
        department:departments(department_name),
        parent_cost_center:cost_centers!parent_id(cost_center_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching cost center:', error);
      throw new Error(`فشل في جلب مركز التكلفة: ${error.message}`);
    }

    return data;
  }

  async getCostCentersByType(type: string): Promise<CostCenter[]> {
    const { data, error } = await supabase
      .from('cost_centers')
      .select(`
        *,
        manager:employees!manager_id(first_name, last_name),
        department:departments(department_name)
      `)
      .eq('cost_center_type', type)
      .eq('is_active', true)
      .order('cost_center_name');

    if (error) {
      console.error('Error fetching cost centers by type:', error);
      throw new Error(`فشل في جلب مراكز التكلفة: ${error.message}`);
    }

    return data || [];
  }

  async getHierarchicalCostCenters(): Promise<CostCenter[]> {
    const { data, error } = await supabase
      .from('cost_centers')
      .select(`
        *,
        manager:employees!manager_id(first_name, last_name),
        department:departments(department_name)
      `)
      .eq('is_active', true)
      .order('level')
      .order('hierarchy_path');

    if (error) {
      console.error('Error fetching hierarchical cost centers:', error);
      throw new Error(`فشل في جلب التسلسل الهرمي لمراكز التكلفة: ${error.message}`);
    }

    return data || [];
  }

  async createCostCenter(costCenterData: CreateCostCenterData): Promise<CostCenter> {
    try {
      // Get current user's employee ID
      const employeeId = await UserHelperService.getCurrentUserEmployeeId();
      
      // Get tenant_id from user's tenant_users relationship
      const { data: { user } } = await supabase.auth.getUser();
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();

      const { data, error } = await supabase
        .from('cost_centers')
        .insert({
          ...costCenterData,
          budget_amount: costCenterData.budget_amount || 0,
          actual_spent: 0,
          is_active: true,
          created_by: employeeId,
          tenant_id: tenantUser?.tenant_id || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating cost center:', error);
        throw new Error(`فشل في إنشاء مركز التكلفة: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating cost center:', error);
      throw new Error(`فشل في إنشاء مركز التكلفة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  async updateCostCenter(id: string, updates: Partial<CreateCostCenterData>): Promise<void> {
    const { error } = await supabase
      .from('cost_centers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating cost center:', error);
      throw new Error(`فشل في تحديث مركز التكلفة: ${error.message}`);
    }
  }

  async deleteCostCenter(id: string): Promise<void> {
    // تحقق من عدم وجود مراكز تكلفة فرعية
    const { data: children } = await supabase
      .from('cost_centers')
      .select('id')
      .eq('parent_id', id)
      .eq('is_active', true);

    if (children && children.length > 0) {
      throw new Error('لا يمكن حذف مركز التكلفة لأنه يحتوي على مراكز فرعية');
    }

    // إلغاء تفعيل بدلاً من الحذف
    const { error } = await supabase
      .from('cost_centers')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting cost center:', error);
      throw new Error(`فشل في حذف مركز التكلفة: ${error.message}`);
    }
  }

  async updateCostCenterBudget(id: string, budgetAmount: number): Promise<void> {
    const { error } = await supabase
      .from('cost_centers')
      .update({
        budget_amount: budgetAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating cost center budget:', error);
      throw new Error(`فشل في تحديث ميزانية مركز التكلفة: ${error.message}`);
    }
  }

  async updateAllCostCenterCosts(): Promise<void> {
    const { error } = await supabase.rpc('update_all_cost_center_costs');

    if (error) {
      console.error('Error updating cost center costs:', error);
      throw new Error(`فشل في تحديث تكاليف مراكز التكلفة: ${error.message}`);
    }
  }

  async getCostCenterReport(): Promise<CostCenterReport[]> {
    const { data, error } = await supabase
      .from('cost_center_report')
      .select('*')
      .order('hierarchy_path');

    if (error) {
      console.error('Error fetching cost center report:', error);
      throw new Error(`فشل في جلب تقرير مراكز التكلفة: ${error.message}`);
    }

    return data || [];
  }

  // إدارة توزيع التكاليف
  async createAllocation(allocationData: {
    reference_type: string;
    reference_id: string;
    cost_center_id: string;
    allocation_percentage?: number;
    allocation_amount: number;
    notes?: string;
  }): Promise<CostCenterAllocation> {
    try {
      // Get current user's employee ID
      const employeeId = await UserHelperService.getCurrentUserEmployeeId();
      
      const { data, error } = await supabase
        .from('cost_center_allocations')
        .insert([{
          ...allocationData,
          allocation_percentage: allocationData.allocation_percentage || 100,
          created_by: employeeId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating cost center allocation:', error);
        throw new Error(`فشل في إنشاء توزيع التكلفة: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating cost center allocation:', error);
      throw new Error(`فشل في إنشاء توزيع التكلفة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  async getAllocationsByReference(referenceType: string, referenceId: string): Promise<CostCenterAllocation[]> {
    const { data, error } = await supabase
      .from('cost_center_allocations')
      .select(`
        *,
        cost_center:cost_centers(cost_center_code, cost_center_name)
      `)
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .order('created_at');

    if (error) {
      console.error('Error fetching allocations:', error);
      throw new Error(`فشل في جلب توزيعات التكلفة: ${error.message}`);
    }

    return data || [];
  }

  async getAllAllocations(): Promise<CostCenterAllocation[]> {
    const { data, error } = await supabase
      .from('cost_center_allocations')
      .select(`
        *,
        cost_center:cost_centers(cost_center_code, cost_center_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cost center allocations:', error);
      throw new Error(`فشل في جلب توزيعات التكلفة: ${error.message}`);
    }

    // إضافة المعلومات الوصفية للمرجع
    const allocationsWithDetails = await Promise.all((data || []).map(async (allocation) => {
      let referenceDetails = '';
      
      try {
        console.log('Processing allocation:', allocation.reference_type, allocation.reference_id);
        
        switch (allocation.reference_type) {
          case 'contract':
            const { data: contract } = await supabase
              .from('contracts')
              .select('contract_number, customer:customers(name)')
              .eq('id', allocation.reference_id)
              .maybeSingle();
            
            console.log('Contract data:', contract);
            
            if (contract) {
              referenceDetails = `عقد ${contract.contract_number} - ${contract.customer?.name || 'عميل غير معروف'}`;
            }
            break;
            
          case 'employee':
            const { data: employee } = await supabase
              .from('employees')
              .select('first_name, last_name, employee_number')
              .eq('id', allocation.reference_id)
              .maybeSingle();
            
            if (employee) {
              referenceDetails = `${employee.first_name} ${employee.last_name} (${employee.employee_number})`;
            }
            break;
            
          case 'vehicle':
            const { data: vehicle } = await supabase
              .from('vehicles')
              .select('make, model, license_plate, vehicle_number')
              .eq('id', allocation.reference_id)
              .maybeSingle();
            
            if (vehicle) {
              referenceDetails = `${vehicle.make} ${vehicle.model} - ${vehicle.license_plate} (${vehicle.vehicle_number})`;
            }
            break;
            
          case 'expense':
            referenceDetails = `مصروف - ${allocation.reference_id}`;
            break;
            
          case 'manual':
            // For manual allocations, use the notes field as description
            referenceDetails = allocation.notes || 'توزيع يدوي';
            break;
            
          default:
            referenceDetails = allocation.reference_id;
        }
      } catch (err) {
        console.warn(`Failed to fetch details for ${allocation.reference_type}:`, err);
        referenceDetails = allocation.reference_id;
      }
      
      const result = {
        ...allocation,
        reference_details: referenceDetails || allocation.reference_id
      };
      
      console.log('Final allocation with details:', result);
      return result;
    }));

    return allocationsWithDetails;
  }

  async getAllocationsByCostCenter(costCenterId: string): Promise<CostCenterAllocation[]> {
    const { data, error } = await supabase
      .from('cost_center_allocations')
      .select('*')
      .eq('cost_center_id', costCenterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cost center allocations:', error);
      throw new Error(`فشل في جلب توزيعات مركز التكلفة: ${error.message}`);
    }

    return data || [];
  }

  async updateAllocation(id: string, updates: Partial<CostCenterAllocation>): Promise<void> {
    const { error } = await supabase
      .from('cost_center_allocations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating allocation:', error);
      throw new Error(`فشل في تحديث توزيع التكلفة: ${error.message}`);
    }
  }

  async deleteAllocation(id: string): Promise<void> {
    const { error } = await supabase
      .from('cost_center_allocations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting allocation:', error);
      throw new Error(`فشل في حذف توزيع التكلفة: ${error.message}`);
    }
  }

  // ربط الكيانات بمراكز التكلفة
  async linkEmployeeToCostCenter(employeeId: string, primaryCostCenterId: string, secondaryCostCenterId?: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .update({
        primary_cost_center_id: primaryCostCenterId,
        secondary_cost_center_id: secondaryCostCenterId || null
      })
      .eq('id', employeeId);

    if (error) {
      console.error('Error linking employee to cost center:', error);
      throw new Error(`فشل في ربط الموظف بمركز التكلفة: ${error.message}`);
    }
  }

  async linkContractToCostCenter(contractId: string, costCenterId: string): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .update({ cost_center_id: costCenterId })
      .eq('id', contractId);

    if (error) {
      console.error('Error linking contract to cost center:', error);
      throw new Error(`فشل في ربط العقد بمركز التكلفة: ${error.message}`);
    }
  }

  async linkVehicleToCostCenter(vehicleId: string, costCenterId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update({ cost_center_id: costCenterId })
      .eq('id', vehicleId);

    if (error) {
      console.error('Error linking vehicle to cost center:', error);
      throw new Error(`فشل في ربط المركبة بمركز التكلفة: ${error.message}`);
    }
  }

  // إحصائيات مراكز التكلفة
  async getCostCenterMetrics() {
    const report = await this.getCostCenterReport();
    
    const metrics = {
      total_cost_centers: report.length,
      total_budget: report.reduce((sum, cc) => sum + cc.budget_amount, 0),
      total_spent: report.reduce((sum, cc) => sum + cc.actual_spent, 0),
      over_budget_count: report.filter(cc => cc.actual_spent > cc.budget_amount).length,
      under_budget_count: report.filter(cc => cc.actual_spent < cc.budget_amount).length,
      by_type: {} as Record<string, { count: number; budget: number; spent: number }>,
      top_spending: report
        .filter(cc => cc.actual_spent > 0)
        .sort((a, b) => b.actual_spent - a.actual_spent)
        .slice(0, 5),
      worst_variance: report
        .filter(cc => cc.variance < 0)
        .sort((a, b) => a.variance - b.variance)
        .slice(0, 5)
    };

    // تجميع حسب النوع
    report.forEach(cc => {
      if (!metrics.by_type[cc.cost_center_type]) {
        metrics.by_type[cc.cost_center_type] = { count: 0, budget: 0, spent: 0 };
      }
      metrics.by_type[cc.cost_center_type].count++;
      metrics.by_type[cc.cost_center_type].budget += cc.budget_amount;
      metrics.by_type[cc.cost_center_type].spent += cc.actual_spent;
    });

    return metrics;
  }
}