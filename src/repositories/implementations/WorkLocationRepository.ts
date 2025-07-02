import { BaseRepository } from '../base/BaseRepository';
import { IWorkLocationRepository } from '../interfaces/IWorkLocationRepository';
import { WorkLocation } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';

export class WorkLocationRepository extends BaseRepository<WorkLocation> implements IWorkLocationRepository {
  protected tableName = 'office_locations';

  async getActiveLocations(): Promise<WorkLocation[]> {
    const { data, error } = await supabase
      .from('office_locations')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as any[];
  }

  async getByName(name: string): Promise<WorkLocation | null> {
    const { data, error } = await supabase
      .from('office_locations')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (error) throw error;
    return data as any;
  }
}