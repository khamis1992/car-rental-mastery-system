import { BaseRepository } from '../base/BaseRepository';
import { IViolationTypeRepository } from '../interfaces/IViolationTypeRepository';
import { ViolationType } from '@/types/violation';
import { supabase } from '@/integrations/supabase/client';

export class ViolationTypeRepository extends BaseRepository<ViolationType> implements IViolationTypeRepository {
  protected tableName = 'violation_types';

  async getActiveTypes(): Promise<ViolationType[]> {
    const { data, error } = await supabase
      .from('violation_types')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('violation_name_ar', { ascending: true });

    if (error) throw error;
    return (data || []) as ViolationType[];
  }

  async getByCategory(category: string): Promise<ViolationType[]> {
    const { data, error } = await supabase
      .from('violation_types')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('violation_name_ar', { ascending: true });

    if (error) throw error;
    return (data || []) as ViolationType[];
  }

  async getBySeverity(severity: string): Promise<ViolationType[]> {
    const { data, error } = await supabase
      .from('violation_types')
      .select('*')
      .eq('severity_level', severity)
      .eq('is_active', true)
      .order('violation_name_ar', { ascending: true });

    if (error) throw error;
    return (data || []) as ViolationType[];
  }
}