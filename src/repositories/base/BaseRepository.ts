import { supabase } from '@/integrations/supabase/client';
import { IRepository, IQueryOptions } from '../interfaces/IRepository';

export abstract class BaseRepository<T, K = string> implements IRepository<T, K> {
  protected abstract tableName: string;

  // Get current tenant ID from authenticated user
  protected async getCurrentTenantId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    return tenantUser?.tenant_id || null;
  }

  async getAll(): Promise<T[]> {
    const requiresTenantId = await this.tableHasTenantId();
    const tenantId = await this.getCurrentTenantId();
    
    // فحص أمني: التأكد من وجود tenant_id للجداول التي تتطلبه
    if (requiresTenantId && !tenantId) {
      throw new Error(`لا يمكن الوصول للبيانات - لم يتم العثور على سياق المؤسسة للجدول ${this.tableName}`);
    }
    
    let query = supabase
      .from(this.tableName as any)
      .select('*');

    // إضافة فلتر المؤسسة للجداول التي تتطلبه
    if (requiresTenantId && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    // فحص أمني إضافي: التأكد من أن جميع السجلات تنتمي للمؤسسة الصحيحة
    if (requiresTenantId && data && tenantId) {
      const invalidRecords = data.filter((record: any) => record.tenant_id !== tenantId);
      if (invalidRecords.length > 0) {
        console.error(`خطأ أمني في ${this.tableName}: عُثر على ${invalidRecords.length} سجلات من مؤسسات أخرى`);
        throw new Error(`خطأ أمني: تم العثور على بيانات من مؤسسات أخرى في ${this.tableName}`);
      }
    }
    
    return (data || []) as T[];
  }

  // فحص ما إذا كان الجدول يحتوي على عمود tenant_id - القائمة المحدثة
  private async tableHasTenantId(): Promise<boolean> {
    const tablesWithTenantId = [
      'tenants', 'tenant_users', 'customers', 'contracts', 'vehicles', 'invoices', 'invoice_items',
      'payments', 'expenses', 'employees', 'departments', 'office_locations', 'attendance',
      'leaves', 'violations', 'violation_types', 'violation_payments', 'maintenance_requests',
      'maintenance_categories', 'fuel_logs', 'vehicle_assignments', 'additional_charges',
      'customer_history', 'employee_documents', 'leave_requests', 'user_activity_logs',
      'notifications', 'contract_documents', 'payment_methods', 'expense_categories',
      'document_templates', 'asset_depreciation', 'asset_assignments', 'asset_transfers',
      'asset_maintenance', 'asset_valuations', 'chart_of_accounts', 'journal_entries',
      'journal_entry_lines', 'journal_entry_details', 'financial_periods', 'bank_accounts',
      'bank_transactions', 'bank_reconciliation', 'bank_reconciliation_imports',
      'collective_invoices', 'collective_invoice_items', 'auto_billing_settings',
      'auto_billing_log', 'advanced_kpis', 'kpi_targets', 'performance_benchmarks',
      'kpi_calculations', 'accounting_templates', 'automated_entry_rules'
    ];
    return tablesWithTenantId.includes(this.tableName);
  }

  async getById(id: K): Promise<T | null> {
    const tenantId = await this.getCurrentTenantId();
    
    let query = supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id as string);

    // Add tenant filter for tables that have tenant_id
    if (tenantId && await this.tableHasTenantId()) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data as T;
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      console.log(`BaseRepository(${this.tableName}): بدء إنشاء سجل جديد:`, data);
      
      // التحقق من الحاجة لـ tenant_id وإضافته مع فحص أمني
      let insertData = { ...data } as any;
      const requiresTenantId = await this.tableHasTenantId();
      
      if (requiresTenantId) {
        const tenantId = await this.getCurrentTenantId();
        
        // فحص أمني: رفض العملية إذا لم يتم العثور على tenant_id للجداول التي تتطلبه
        if (!tenantId) {
          throw new Error(`فشل في تحديد هوية المؤسسة - لا يمكن إنشاء سجل في جدول ${this.tableName}`);
        }
        
        insertData.tenant_id = tenantId;
        console.log(`BaseRepository(${this.tableName}): تم إضافة tenant_id:`, tenantId);
      }
      
      const { data: result, error } = await supabase
        .from(this.tableName as any)
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error(`BaseRepository(${this.tableName}): خطأ في إنشاء السجل:`, error);
        throw error;
      }
      
      // فحص أمني إضافي: التأكد من صحة البيانات المُرجعة
      if (requiresTenantId && result && (result as any).tenant_id !== insertData.tenant_id) {
        throw new Error(`خطأ أمني: تم إرجاع بيانات من مؤسسة مختلفة في جدول ${this.tableName}`);
      }
      
      console.log(`BaseRepository(${this.tableName}): تم إنشاء السجل بنجاح:`, result);
      return result as T;
    } catch (error) {
      console.error(`BaseRepository(${this.tableName}): خطأ في دالة create:`, error);
      throw error;
    }
  }

  async update(id: K, data: Partial<T>): Promise<T> {
    const tenantId = await this.getCurrentTenantId();
    
    let query = supabase
      .from(this.tableName as any)
      .update(data as any)
      .eq('id', id as string);

    // Add tenant filter for tables that have tenant_id
    if (tenantId && await this.tableHasTenantId()) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: result, error } = await query.select().single();

    if (error) throw error;
    return result as T;
  }

  async delete(id: K): Promise<void> {
    const tenantId = await this.getCurrentTenantId();
    
    let query = supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id as string);

    // Add tenant filter for tables that have tenant_id
    if (tenantId && await this.tableHasTenantId()) {
      query = query.eq('tenant_id', tenantId);
    }

    const { error } = await query;

    if (error) throw error;
  }

  async query(options: IQueryOptions): Promise<T[]> {
    const tenantId = await this.getCurrentTenantId();
    
    let query = supabase.from(this.tableName as any).select('*');

    // Add tenant filter for tables that have tenant_id
    if (tenantId && await this.tableHasTenantId()) {
      query = query.eq('tenant_id', tenantId);
    }

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.orderDirection === 'asc' 
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as T[];
  }

  async count(filters?: Record<string, any>): Promise<number> {
    const tenantId = await this.getCurrentTenantId();
    
    let query = supabase
      .from(this.tableName as any)
      .select('*', { count: 'exact', head: true });

    // Add tenant filter for tables that have tenant_id
    if (tenantId && await this.tableHasTenantId()) {
      query = query.eq('tenant_id', tenantId);
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }
}