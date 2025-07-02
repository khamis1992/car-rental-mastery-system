import { supabase } from '@/integrations/supabase/client';
import { IRepository, IQueryOptions } from '../interfaces/IRepository';

export abstract class BaseRepository<T, K = string> implements IRepository<T, K> {
  protected abstract tableName: string;

  async getAll(): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as T[];
  }

  async getById(id: K): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id as string)
      .maybeSingle();

    if (error) throw error;
    return data as T;
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      console.log(`BaseRepository(${this.tableName}): بدء إنشاء سجل جديد:`, data);
      
      const { data: result, error } = await supabase
        .from(this.tableName as any)
        .insert([data as any])
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
    const { data: result, error } = await supabase
      .from(this.tableName as any)
      .update(data as any)
      .eq('id', id as string)
      .select()
      .single();

    if (error) throw error;
    return result as T;
  }

  async delete(id: K): Promise<void> {
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id as string);

    if (error) throw error;
  }

  async query(options: IQueryOptions): Promise<T[]> {
    let query = supabase.from(this.tableName as any).select('*');

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
    let query = supabase
      .from(this.tableName as any)
      .select('*', { count: 'exact', head: true });

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