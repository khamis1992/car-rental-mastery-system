import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetItem = Database['public']['Tables']['budget_items']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetItemInsert = Database['public']['Tables']['budget_items']['Insert'];

export interface BudgetWithItems extends Budget {
  budget_items?: BudgetItem[];
}

export interface BudgetVarianceReport {
  budget_id: string;
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  variance_percentage: number;
  items_with_variance: Array<{
    account_id: string;
    account_name: string;
    budgeted_amount: number;
    actual_amount: number;
    variance_amount: number;
    variance_percentage: number;
  }>;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  utilization_percentage: number;
  items_count: number;
  overbudget_items: number;
}

// Helper function to get current tenant ID
const getCurrentTenantId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('المستخدم غير مسجل دخول');
  
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
    
  if (!tenantUser) throw new Error('لا توجد مؤسسة نشطة للمستخدم');
  return tenantUser.tenant_id;
};

export class BudgetService {
  // إنشاء ميزانية جديدة
  async createBudget(budgetData: Omit<BudgetInsert, 'tenant_id'>): Promise<Budget> {
    const tenantId = await getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        ...budgetData,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      throw new Error(`فشل في إنشاء الميزانية: ${error.message}`);
    }

    return data;
  }

  // تحديث ميزانية
  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', budgetId)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      throw new Error(`فشل في تحديث الميزانية: ${error.message}`);
    }

    return data;
  }

  // الحصول على جميع الميزانيات
  async getAllBudgets(): Promise<BudgetWithItems[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        budget_items (
          *,
          account:chart_of_accounts(account_code, account_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
      throw new Error(`فشل في جلب الميزانيات: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على ميزانية بالتفاصيل
  async getBudgetById(budgetId: string): Promise<BudgetWithItems | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        budget_items (
          *,
          account:chart_of_accounts(account_code, account_name)
        )
      `)
      .eq('id', budgetId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching budget:', error);
      throw new Error(`فشل في جلب الميزانية: ${error.message}`);
    }

    return data;
  }

  // إضافة بند للميزانية
  async addBudgetItem(budgetItem: Omit<BudgetItemInsert, 'tenant_id' | 'item_type'>): Promise<BudgetItem> {
    const tenantId = await getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        ...budgetItem,
        tenant_id: tenantId,
        item_type: 'regular'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding budget item:', error);
      throw new Error(`فشل في إضافة بند الميزانية: ${error.message}`);
    }

    return data;
  }

  // تحديث بند الميزانية
  async updateBudgetItem(itemId: string, updates: Partial<BudgetItem>): Promise<BudgetItem> {
    const { data, error } = await supabase
      .from('budget_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating budget item:', error);
      throw new Error(`فشل في تحديث بند الميزانية: ${error.message}`);
    }

    return data;
  }

  // حذف بند الميزانية
  async deleteBudgetItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting budget item:', error);
      throw new Error(`فشل في حذف بند الميزانية: ${error.message}`);
    }
  }

  // حساب تباين الميزانية
  async calculateBudgetVariance(budgetId: string): Promise<BudgetVarianceReport> {
    try {
      // استدعاء دالة حساب التباين
      const { error: calcError } = await supabase.rpc('calculate_budget_variance', {
        budget_id_param: budgetId
      });

      if (calcError) {
        console.error('Error calculating variance:', calcError);
        throw new Error(`فشل في حساب التباين: ${calcError.message}`);
      }

      // جلب البيانات المحدثة
      const { data, error } = await supabase
        .from('budget_items')
        .select(`
          *,
          account:chart_of_accounts(account_code, account_name)
        `)
        .eq('budget_id', budgetId);

      if (error) {
        throw new Error(`فشل في جلب بيانات التباين: ${error.message}`);
      }

      // حساب الإجماليات
      const totalBudgeted = data.reduce((sum, item) => sum + (item.budgeted_amount || 0), 0);
      const totalActual = data.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
      const totalVariance = totalActual - totalBudgeted;
      const variancePercentage = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

      const itemsWithVariance = data.map(item => ({
        account_id: item.account_id,
        account_name: (item.account as any)?.account_name || 'غير محدد',
        budgeted_amount: item.budgeted_amount || 0,
        actual_amount: item.actual_amount || 0,
        variance_amount: item.variance_amount || 0,
        variance_percentage: item.variance_percentage || 0
      }));

      return {
        budget_id: budgetId,
        total_budgeted: totalBudgeted,
        total_actual: totalActual,
        total_variance: totalVariance,
        variance_percentage: variancePercentage,
        items_with_variance: itemsWithVariance
      };
    } catch (error) {
      console.error('Error in calculateBudgetVariance:', error);
      throw error;
    }
  }

  // إنشاء ملخص الميزانية
  async getBudgetSummary(budgetId: string): Promise<BudgetSummary> {
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .eq('budget_id', budgetId);

    if (error) {
      console.error('Error fetching budget summary:', error);
      throw new Error(`فشل في جلب ملخص الميزانية: ${error.message}`);
    }

    const totalBudget = data.reduce((sum, item) => sum + (item.budgeted_amount || 0), 0);
    const totalSpent = data.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
    const remainingBudget = totalBudget - totalSpent;
    const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const overbudgetItems = data.filter(item => 
      (item.actual_amount || 0) > (item.budgeted_amount || 0)
    ).length;

    return {
      total_budget: totalBudget,
      total_spent: totalSpent,
      remaining_budget: remainingBudget,
      utilization_percentage: utilizationPercentage,
      items_count: data.length,
      overbudget_items: overbudgetItems
    };
  }

  // حذف الميزانية
  async deleteBudget(budgetId: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId);

    if (error) {
      console.error('Error deleting budget:', error);
      throw new Error(`فشل في حذف الميزانية: ${error.message}`);
    }
  }

  // نسخ الميزانية
  async copyBudget(budgetId: string, newBudgetData: Partial<Omit<BudgetInsert, 'tenant_id'>>): Promise<Budget> {
    const tenantId = await getCurrentTenantId();
    
    // جلب الميزانية الأصلية مع البنود
    const originalBudget = await this.getBudgetById(budgetId);
    if (!originalBudget) {
      throw new Error('الميزانية الأصلية غير موجودة');
    }

    // إنشاء الميزانية الجديدة
    const newBudget = await this.createBudget({
      budget_name: newBudgetData.budget_name || `نسخة من ${originalBudget.budget_name}`,
      budget_year: newBudgetData.budget_year || originalBudget.budget_year,
      start_date: newBudgetData.start_date || originalBudget.start_date,
      end_date: newBudgetData.end_date || originalBudget.end_date,
      notes: newBudgetData.notes || originalBudget.notes,
      status: 'draft'
    });

    // نسخ البنود
    if (originalBudget.budget_items) {
      for (const item of originalBudget.budget_items) {
        await this.addBudgetItem({
          budget_id: newBudget.id,
          account_id: item.account_id,
          budgeted_amount: item.budgeted_amount,
          notes: item.notes
        });
      }
    }

    return newBudget;
  }
}
