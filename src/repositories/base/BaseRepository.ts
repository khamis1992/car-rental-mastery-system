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
    const tenantId = await this.getCurrentTenantId();
    
    let query = supabase
      .from(this.tableName as any)
      .select('*');

    // Add tenant filter for tables that have tenant_id
    if (tenantId && await this.tableHasTenantId()) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as T[];
  }

  // Check if table has tenant_id column
  private async tableHasTenantId(): Promise<boolean> {
    const tablesWithTenantId = [
      'contracts', 'additional_charges', 'chart_of_accounts', 
      'branches', 'cost_centers', 'attendance', 'quotations',
      'employees', 'vehicles', 'customers', 'invoices', 'payments'
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
      
      // Add tenant_id automatically for tables that require it
      let insertData = { ...data } as any;
      if (await this.tableHasTenantId()) {
        const tenantId = await this.getCurrentTenantId();
        if (tenantId) {
          insertData.tenant_id = tenantId;
        }
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