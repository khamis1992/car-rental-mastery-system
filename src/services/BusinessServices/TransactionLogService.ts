import { supabase } from '@/integrations/supabase/client';

export interface TransactionLogEntry {
  id: string;
  transaction_type: string;
  source_table: string;
  source_id: string;
  target_table?: string;
  target_id?: string;
  department_id?: string;
  employee_id?: string;
  customer_id?: string;
  vehicle_id?: string;
  amount: number;
  status: string;
  priority: string;
  description: string;
  details: any;
  error_message?: string;
  processed_at?: string;
  created_at: string;
}

export interface TransactionLogFilters {
  transaction_type?: string;
  status?: string;
  department_id?: string;
  employee_id?: string;
  customer_id?: string;
  vehicle_id?: string;
  date_from?: string;
  date_to?: string;
  priority?: string;
}

export class TransactionLogService {

  async getAllTransactions(filters?: TransactionLogFilters, limit = 100): Promise<TransactionLogEntry[]> {
    let query = supabase
      .from('transaction_log')
      .select(`
        *,
        departments(department_name),
        employees(first_name, last_name),
        customers(name),
        vehicles(make, model, license_plate)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // تطبيق المرشحات
    if (filters) {
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.vehicle_id) {
        query = query.eq('vehicle_id', filters.vehicle_id);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transaction log:', error);
      throw new Error(`فشل في جلب سجل المعاملات: ${error.message}`);
    }

    return data || [];
  }

  async getTransactionById(id: string): Promise<TransactionLogEntry | null> {
    const { data, error } = await supabase
      .from('transaction_log')
      .select(`
        *,
        departments(department_name),
        employees(first_name, last_name),
        customers(name),
        vehicles(make, model, license_plate)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching transaction by ID:', error);
      throw new Error(`فشل في جلب المعاملة: ${error.message}`);
    }

    return data;
  }

  async logTransaction(
    transactionType: string,
    sourceTable: string,
    sourceId: string,
    description: string,
    options: {
      targetTable?: string;
      targetId?: string;
      departmentId?: string;
      employeeId?: string;
      customerId?: string;
      vehicleId?: string;
      amount?: number;
      priority?: string;
      details?: any;
    } = {}
  ): Promise<string> {
    const { data, error } = await supabase.rpc('log_transaction', {
      p_transaction_type: transactionType,
      p_source_table: sourceTable,
      p_source_id: sourceId,
      p_department_id: options.departmentId || null,
      p_employee_id: options.employeeId || null,
      p_customer_id: options.customerId || null,
      p_vehicle_id: options.vehicleId || null,
      p_amount: options.amount || 0,
      p_description: description,
      p_details: options.details || {}
    });

    if (error) {
      console.error('Error logging transaction:', error);
      throw new Error(`فشل في تسجيل المعاملة: ${error.message}`);
    }

    return data;
  }

  async updateTransactionStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const updateData: any = { 
      status, 
      processed_at: status === 'completed' ? new Date().toISOString() : null 
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('transaction_log')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating transaction status:', error);
      throw new Error(`فشل في تحديث حالة المعاملة: ${error.message}`);
    }
  }

  async getTransactionMetrics(dateFrom?: string, dateTo?: string) {
    let query = supabase
      .from('transaction_log')
      .select('transaction_type, status, priority, amount');

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transaction metrics:', error);
      throw new Error(`فشل في جلب إحصائيات المعاملات: ${error.message}`);
    }

    const metrics = {
      total: data.length,
      completed: data.filter(t => t.status === 'completed').length,
      pending: data.filter(t => t.status === 'pending').length,
      failed: data.filter(t => t.status === 'failed').length,
      high_priority: data.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
      total_amount: data.reduce((sum, t) => sum + (t.amount || 0), 0),
      by_type: {} as Record<string, number>,
      by_status: {} as Record<string, number>
    };

    // تجميع حسب النوع
    data.forEach(transaction => {
      if (!metrics.by_type[transaction.transaction_type]) {
        metrics.by_type[transaction.transaction_type] = 0;
      }
      metrics.by_type[transaction.transaction_type]++;

      if (!metrics.by_status[transaction.status]) {
        metrics.by_status[transaction.status] = 0;
      }
      metrics.by_status[transaction.status]++;
    });

    return metrics;
  }

  async getTransactionsByEntity(entityType: string, entityId: string): Promise<TransactionLogEntry[]> {
    let query = supabase
      .from('transaction_log')
      .select(`
        *,
        departments(department_name),
        employees(first_name, last_name),
        customers(name),
        vehicles(make, model, license_plate)
      `)
      .order('created_at', { ascending: false });

    // تحديد نوع الكيان والبحث المناسب
    switch (entityType) {
      case 'customer':
        query = query.eq('customer_id', entityId);
        break;
      case 'vehicle':
        query = query.eq('vehicle_id', entityId);
        break;
      case 'employee':
        query = query.eq('employee_id', entityId);
        break;
      case 'department':
        query = query.eq('department_id', entityId);
        break;
      case 'contract':
        query = query.or(`source_id.eq.${entityId},target_id.eq.${entityId}`);
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions by entity:', error);
      throw new Error(`فشل في جلب معاملات الكيان: ${error.message}`);
    }

    return data || [];
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transaction_log')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw new Error(`فشل في حذف المعاملة: ${error.message}`);
    }
  }

  async retryFailedTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transaction_log')
      .update({ 
        status: 'pending', 
        error_message: null,
        processed_at: null 
      })
      .eq('id', id);

    if (error) {
      console.error('Error retrying transaction:', error);
      throw new Error(`فشل في إعادة محاولة المعاملة: ${error.message}`);
    }
  }
}